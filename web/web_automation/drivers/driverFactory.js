const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const config = require('../config/selenium.config');
const logger = require('../utilities/logger');

class DriverFactory {
  static async createDriver() {
    const browserName = config.browser.toLowerCase();
    logger.info(`Instantiating WebDriver for browser: "${browserName}" (Headless: ${config.headless})`);
    
    const builder = new Builder();
    
    switch (browserName) {
      case 'chrome': {
        const options = new chrome.Options();
        config.chromeOptions.forEach(opt => options.addArguments(opt));
        if (config.headless) {
          options.addArguments('--headless=new');
        }
        builder.forBrowser('chrome').setChromeOptions(options);
        break;
      }
      
      case 'firefox': {
        const options = new firefox.Options();
        config.firefoxOptions.forEach(opt => options.addArguments(opt));
        if (config.headless) {
          options.addArguments('--headless');
        }
        builder.forBrowser('firefox').setFirefoxOptions(options);
        break;
      }
      
      case 'edge': {
        const options = new edge.Options();
        config.edgeOptions.forEach(opt => options.addArguments(opt));
        if (config.headless) {
          options.addArguments('--headless');
        }
        builder.forBrowser('MicrosoftEdge').setEdgeOptions(options);
        break;
      }
      
      default:
        throw new Error(`Unsupported browser specified in config: "${config.browser}"`);
    }

    try {
      const driver = await builder.build();
      logger.info(`WebDriver session initiated successfully. browserName: ${browserName}`);
      
      // Configure implicit timeout
      await driver.manage().setTimeouts({ implicit: config.timeouts.implicit });
      
      return driver;
    } catch (error) {
      logger.error(`Failed to instantiate browser driver: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DriverFactory;
