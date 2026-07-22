const DriverFactory = require('../drivers/driverFactory');
const excelReporter = require('../utilities/excelReporter');
const logger = require('../utilities/logger');
const config = require('../config/selenium.config');
const path = require('path');
const fs = require('fs');

const failureDir = path.join(__dirname, '../reports/failures');
if (!fs.existsSync(failureDir)) {
  fs.mkdirSync(failureDir, { recursive: true });
}

let driverInstance;
let suiteStartTime;
let testStartTime;

before(async function() {
  suiteStartTime = Date.now();
  logger.info('=== STARTING WEB E2E TEST SUITE ===');
  
  try {
    driverInstance = await DriverFactory.createDriver();
    this.driver = driverInstance;
    
    excelReporter.setBrowserDetails(config.browser);
    logger.info(`Navigating to landing page base URL: ${config.baseUrl}`);
    await driverInstance.get(config.baseUrl);
  } catch (error) {
    logger.error(`Failed to initialize web browser driver session: ${error.message}`);
    throw error;
  }
});

beforeEach(function() {
  testStartTime = Date.now();
  const testTitle = this.currentTest.fullTitle();
  logger.info(`Running test: "${testTitle}"`);
  excelReporter.addLog(testTitle, 'Test Init', 'PASSED', 'Navigated to browser context');
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
  let currentUrl = 'N/A';
  
  if (test.state === 'failed') {
    status = 'Failed';
    failureReason = test.err ? test.err.message : 'Unknown exception';
    logger.error(`Test FAILED: "${fullTitle}"`);
    
    if (driverInstance) {
      try {
        currentUrl = await driverInstance.getCurrentUrl();
        logger.info(`Failure URL: ${currentUrl}`);
        
        // Take screenshot
        const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const scName = `${sanitizedTitle}_failure.png`;
        const scPath = path.join(failureDir, scName);
        const screenshotData = await driverInstance.takeScreenshot();
        fs.writeFileSync(scPath, screenshotData, 'base64');
        screenshotPath = path.relative(path.join(__dirname, '..'), scPath);
        logger.info(`Screenshot saved to: ${scPath}`);
        
        // Fetch browser logs
        try {
          const logs = await driverInstance.manage().logs().get('browser');
          if (logs.length > 0) {
            const logLines = logs.map(l => `[${l.timestamp}] [${l.level.name}] ${l.message}`).join('\n');
            const logName = `${sanitizedTitle}_browser_console.log`;
            fs.writeFileSync(path.join(failureDir, logName), logLines);
            logger.info(`Browser console logs saved to failures folder.`);
          }
        } catch (e) {
          logger.warn('Browser logs are not supported by this browser/driver combination.');
        }
      } catch (err) {
        logger.error(`Error in afterEach failure hook: ${err.message}`);
      }
    }
    
    excelReporter.addFailure(fullTitle, failureReason, screenshotPath, currentUrl);
    excelReporter.addLog(fullTitle, 'Failure Capture', 'FAILED', `Error: ${failureReason}. URL: ${currentUrl}`);
  } else if (test.pending) {
    status = 'Skipped';
    excelReporter.addLog(fullTitle, 'Skip Hook', 'SKIPPED', 'Test was skipped');
  } else {
    logger.info(`Test PASSED: "${fullTitle}"`);
    excelReporter.addLog(fullTitle, 'Execution Complete', 'PASSED', `Completed in ${(durationMs / 1000).toFixed(2)}s`);
  }
  
  const testId = test.title.match(/\[(.*?)\]/) ? test.title.match(/\[(.*?)\]/)[1] : 'TC_WEB';
  excelReporter.addTestCase(testId, parentName, testTitle, status, new Date(testStartTime), new Date(), durationMs);
});

after(async function() {
  logger.info('=== TEARING DOWN WEB E2E TEST SUITE ===');
  
  if (driverInstance) {
    try {
      await driverInstance.quit();
      logger.info('Browser session quit cleanly.');
    } catch (error) {
      logger.warn(`Error quitting browser session: ${error.message}`);
    }
  }
  
  const totalSuiteDuration = Date.now() - suiteStartTime;
  await excelReporter.generateReport(totalSuiteDuration);
  logger.info('=== SUITE EXECUTION COMPLETED ===');
});

module.exports = {
  getDriver: () => driverInstance
};
