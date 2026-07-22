const DriverFactory = require('../drivers/driverFactory');
const excelReporter = require('../utilities/excelReporter');
const logger = require('../utilities/logger');
const path = require('path');
const fs = require('fs');

const failureDir = path.join(__dirname, '../reports/failures');
if (!fs.existsSync(failureDir)) {
  fs.mkdirSync(failureDir, { recursive: true });
}

let driverInstance;
let suiteStartTime;
let testStartTime;

// Setup global hook configuration
before(async function() {
  suiteStartTime = Date.now();
  logger.info('=== STARTING TEST SUITE EXECUTION ===');
  
  try {
    const { driver, deviceName, platformVersion } = await DriverFactory.createDriver();
    driverInstance = driver;
    this.driver = driver;
    
    excelReporter.setDeviceDetails(deviceName, platformVersion);
    logger.info(`Session setup complete for device: ${deviceName}`);
  } catch (error) {
    logger.error(`Suite setup failed to initialize driver: ${error.message}`);
    throw error;
  }
});

beforeEach(function() {
  testStartTime = Date.now();
  const testTitle = this.currentTest.fullTitle();
  logger.info(`Starting Test: "${testTitle}"`);
  excelReporter.addLog(testTitle, 'Test Init', 'PASSED', 'Initializing environment');
});

afterEach(async function() {
  const test = this.currentTest;
  const testTitle = test.title;
  const fullTitle = test.fullTitle();
  const parentName = test.parent ? test.parent.title : 'Root';
  const durationMs = Date.now() - testStartTime;
  
  let status = 'Passed';
  let failureReason = '';
  let screenshotPath = '';
  let activityName = 'N/A';
  
  if (test.state === 'failed') {
    status = 'Failed';
    failureReason = test.err ? test.err.message : 'Unknown failure reason';
    logger.error(`Test FAILED: "${fullTitle}"`);
    logger.error(`Stack trace: ${test.err ? test.err.stack : ''}`);
    
    if (driverInstance) {
      try {
        // Retrieve android activity name
        activityName = await driverInstance.getCurrentActivity();
        
        // Take screenshot
        const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const scName = `${sanitizedTitle}_failure.png`;
        const scPath = path.join(failureDir, scName);
        await driverInstance.saveScreenshot(scPath);
        screenshotPath = path.relative(path.join(__dirname, '..'), scPath);
        logger.info(`Screenshot captured at: ${scPath}`);
        
        // Capture logcat logs
        const logTypes = await driverInstance.getLogTypes();
        if (logTypes.includes('logcat')) {
          const logs = await driverInstance.getLogs('logcat');
          const logName = `${sanitizedTitle}_logcat.log`;
          const logPath = path.join(failureDir, logName);
          const logLines = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
          fs.writeFileSync(logPath, logLines);
          logger.info(`Logcat logs captured at: ${logPath}`);
        }
      } catch (err) {
        logger.warn(`Failure handling hooks failed: ${err.message}`);
      }
    }
    
    excelReporter.addFailure(fullTitle, failureReason, screenshotPath, activityName);
    excelReporter.addLog(fullTitle, 'Failure Hook', 'FAILED', `Error: ${failureReason}. Screen: ${activityName}`);
  } else if (test.pending) {
    status = 'Skipped';
    excelReporter.addLog(fullTitle, 'Skip Hook', 'SKIPPED', 'Test was skipped');
  } else {
    logger.info(`Test PASSED: "${fullTitle}"`);
    excelReporter.addLog(fullTitle, 'Execution Complete', 'PASSED', `Completed in ${(durationMs / 1000).toFixed(2)}s`);
  }
  
  const testId = test.title.match(/\[(.*?)\]/) ? test.title.match(/\[(.*?)\]/)[1] : 'TC_GEN';
  excelReporter.addTestCase(testId, parentName, testTitle, status, new Date(testStartTime), new Date(), durationMs);
});

after(async function() {
  logger.info('=== WRAPPING UP TEST SUITE EXECUTION ===');
  
  if (driverInstance) {
    try {
      await driverInstance.deleteSession();
      logger.info('Appium session deleted successfully.');
    } catch (error) {
      logger.warn(`Failed to close Appium session cleanly: ${error.message}`);
    }
  }
  
  const totalSuiteDuration = Date.now() - suiteStartTime;
  await excelReporter.generateReport(totalSuiteDuration);
  logger.info('=== SUITE EXECUTION COMPLETED ===');
});

// Helper to expose active driver
module.exports = {
  getDriver: () => driverInstance
};
