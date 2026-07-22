const { expect } = require('chai');
const baseSetup = require('./baseSetup');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const credentials = require('../data/userCredentials.json');
const logger = require('../utilities/logger');

describe('Web Navigation & Routing Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;

  before(async function() {
    driver = baseSetup.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    
    // Log in first
    await loginPage.navigateTo('/login');
    await loginPage.login(credentials.validUser.email, credentials.validUser.password);
  });

  it('[TC_WEB_NAV_01] Verify Sidebar Route Redirection', async function() {
    logger.info('Running TC_WEB_NAV_01: Verify navigation to Diet and Chat pages');
    
    await dashboardPage.navigateToDiet();
    let url = await dashboardPage.getCurrentUrl();
    expect(url).to.contain('/diet-plan');
    
    await dashboardPage.navigateToChat();
    url = await dashboardPage.getCurrentUrl();
    expect(url).to.contain('/chatbot');
  });

  it('[TC_WEB_NAV_02] Verify Browser Navigation Buttons (Back & Forward)', async function() {
    logger.info('Running TC_WEB_NAV_02: Browser Back and Forward flow');
    
    // Go to Diet Page
    await dashboardPage.navigateToDiet();
    let url = await dashboardPage.getCurrentUrl();
    expect(url).to.contain('/diet-plan');

    // Tap Back
    await driver.navigate().back();
    url = await dashboardPage.getCurrentUrl();
    expect(url).to.not.contain('/diet-plan');

    // Tap Forward
    await driver.navigate().forward();
    url = await dashboardPage.getCurrentUrl();
    expect(url).to.contain('/diet-plan');
  });

  it('[TC_WEB_NAV_03] Verify Page Refresh Behaviour & Session Retention', async function() {
    logger.info('Running TC_WEB_NAV_03: Refresh retention');
    
    await driver.navigate().refresh();
    const isAtDiet = await dashboardPage.isDisplayed('id:diet-plan-container');
    expect(isAtDiet).to.be.true;
  });
});
