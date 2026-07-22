const { expect } = require('chai');
const baseSetup = require('./baseSetup');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const DietPlanPage = require('../pages/dietPlanPage');
const GestureUtils = require('../utilities/gestureUtils');
const credentials = require('../testdata/userCredentials.json');
const logger = require('../utilities/logger');

describe('Mobile Gestures Automation Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;
  let dietPlanPage;

  before(async function() {
    driver = baseSetup.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    dietPlanPage = new DietPlanPage(driver);
    
    // Login to access system functions
    await loginPage.login(credentials.validUser.email, credentials.validUser.password);
  });

  it('[TC_GEST_01] Validate Horizontal Swiping (Days Navigation)', async function() {
    logger.info('Running TC_GEST_01: Horizontal Swipe Day Navigation');
    
    // Navigate to Diet Plan screen
    await dashboardPage.clickDietTab();
    
    // Find the horizontal days container
    const daysContainer = await dietPlanPage.findElement('id:com.aidiabetes.app:id/layout_days_tabs');
    const rect = await daysContainer.getRect();
    
    // Swipe left (from right to left) inside the tab bar container to reveal Friday, Saturday, Sunday
    const startX = Math.round(rect.x + rect.width * 0.9);
    const endX = Math.round(rect.x + rect.width * 0.1);
    const centerY = Math.round(rect.y + rect.height / 2);
    
    await GestureUtils.swipe(driver, startX, centerY, endX, centerY, 800);
    
    // Select "Sunday" tab and check it works
    await dietPlanPage.selectDayTab('Sunday');
    
    const calorieTarget = await dietPlanPage.getCalorieTarget();
    expect(calorieTarget).to.not.be.empty;
  });

  it('[TC_GEST_02] Validate Vertical Scrolling Until Element Visible', async function() {
    logger.info('Running TC_GEST_02: Scroll until grocery list checkbox is visible');
    
    // Scroll down to expose grocery list checkbox elements
    const checkboxSelector = 'id:com.aidiabetes.app:id/cb_grocery_item';
    const checkboxElement = await GestureUtils.scrollUntilVisible(driver, checkboxSelector, 'down', 5);
    
    expect(await checkboxElement.isDisplayed()).to.be.true;
  });

  it('[TC_GEST_03] Validate Double Tap on Graph View', async function() {
    logger.info('Running TC_GEST_03: Double tap on glucose trend chart');
    
    // Switch to history tab (which has the chart)
    await dashboardPage.clickHistoryTab();
    
    const chart = await driver.$('id:com.aidiabetes.app:id/line_chart');
    const rect = await chart.getRect();
    
    const centerX = Math.round(rect.x + rect.width / 2);
    const centerY = Math.round(rect.y + rect.height / 2);
    
    // Perform double tap on the graph to reset zoom or inspect values
    await GestureUtils.doubleTap(driver, centerX, centerY);
    logger.info('Double tap completed on chart view.');
  });

  it('[TC_GEST_04] Validate Zoom & Pinch Gestures on Graph View', async function() {
    logger.info('Running TC_GEST_04: Zoom & Pinch gestures');
    
    const chart = await driver.$('id:com.aidiabetes.app:id/line_chart');
    
    // Zoom in on the trend graph
    await GestureUtils.zoom(driver, chart);
    await driver.pause(1000);
    
    // Pinch out / zoom out
    await GestureUtils.pinch(driver, chart);
    await driver.pause(1000);
    
    logger.info('Zoom and Pinch gestures verification completed.');
  });
});
// Load global test runner configuration hook
require('./baseSetup');
