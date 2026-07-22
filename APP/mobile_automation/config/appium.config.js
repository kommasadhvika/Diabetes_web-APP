require('dotenv').config();
const path = require('path');

const baseCapabilities = {
  platformName: 'Android',
  automationName: 'UiAutomator2',
  noReset: false,
  fullReset: false,
  newCommandTimeout: 300,
  autoGrantPermissions: true
};

const apkCapabilities = {
  ...baseCapabilities,
  app: process.env.APK_PATH || path.join(__dirname, '../app/app-release.apk'),
  gpsEnabled: true
};

const installedAppCapabilities = {
  ...baseCapabilities,
  appPackage: process.env.APP_PACKAGE || 'com.aidiabetes.app',
  appActivity: process.env.APP_ACTIVITY || 'com.aidiabetes.app.MainActivity'
};

module.exports = {
  server: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    path: '/'
  },
  capabilities: {
    apk: apkCapabilities,
    installed: installedAppCapabilities
  }
};
