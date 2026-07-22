const { remote } = require('webdriverio');
const { execSync } = require('child_process');
const config = require('../config/appium.config');
const logger = require('../utilities/logger');

class DriverFactory {
  static async createDriver() {
    logger.info('Initializing Appium Driver Factory...');
    
    // Detect connected devices
    const devices = this.getConnectedDevices();
    let selectedUdid = 'emulator-5554'; // Fallback
    let selectedOsVersion = '12';        // Fallback
    
    if (devices.length > 0) {
      logger.info(`Detected ${devices.length} connected device(s): ${JSON.stringify(devices)}`);
      // Select the first available device
      selectedUdid = devices[0].udid;
      selectedOsVersion = devices[0].osVersion;
      logger.info(`Selected device UDID: ${selectedUdid}, OS Version: ${selectedOsVersion}`);
    } else {
      logger.warn('No active devices detected via adb. Utilizing default emulator targets.');
    }

    // Determine target execution (APK vs Installed App)
    const runMode = process.env.RUN_MODE || 'installed'; // 'apk' or 'installed'
    let selectedCaps = runMode === 'apk' ? config.capabilities.apk : config.capabilities.installed;
    
    // Merge dynamic device details into capabilities
    const finalCapabilities = {
      ...selectedCaps,
      'appium:udid': selectedUdid,
      'appium:platformVersion': selectedOsVersion,
      'appium:deviceName': selectedUdid
    };

    const options = {
      hostname: config.server.host,
      port: config.server.port,
      path: config.server.path,
      capabilities: finalCapabilities,
      logLevel: 'error'
    };

    logger.info(`Starting Appium session on ${options.hostname}:${options.port} with capabilities: ${JSON.stringify(finalCapabilities)}`);
    
    try {
      const driver = await remote(options);
      logger.info(`Appium session successfully created. Session ID: ${driver.sessionId}`);
      return { driver, deviceName: selectedUdid, platformVersion: selectedOsVersion };
    } catch (error) {
      logger.error(`Failed to initiate Appium session: ${error.message}`);
      throw error;
    }
  }

  static getConnectedDevices() {
    try {
      const stdout = execSync('adb devices').toString();
      const lines = stdout.trim().split('\n').slice(1);
      const devices = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(/\s+/);
        if (parts[1] && parts[1].trim() === 'device') {
          const udid = parts[0].trim();
          let osVersion = '12'; // Fallback
          try {
            osVersion = execSync(`adb -s ${udid} shell getprop ro.build.version.release`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
          } catch (e) {
            // Silence adb permission or offline exceptions
          }
          devices.push({ udid, osVersion });
        }
      }
      return devices;
    } catch (error) {
      // ADB command not found or not running
      return [];
    }
  }
}

module.exports = DriverFactory;
