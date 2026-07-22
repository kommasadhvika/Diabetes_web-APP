const { expect } = require('chai');
const baseSetup = require('./baseSetup');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const credentials = require('../data/userCredentials.json');
const logger = require('../utilities/logger');

describe('Web Authentication Test Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;

  before(function() {
    driver = baseSetup.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  it('[TC_WEB_AUTH_01] Verify Login Validation on Empty Input Fields', async function() {
    logger.info('Running TC_WEB_AUTH_01: Empty Login Fields');
    
    await loginPage.navigateTo('/login');
    await loginPage.login('', '');
    
    const emailErr = await loginPage.getEmailError();
    const passwordErr = await loginPage.getPasswordError();
    
    expect(emailErr).to.contain('required');
    expect(passwordErr).to.contain('required');
  });

  it('[TC_WEB_AUTH_02] Verify Login Form with Invalid Credentials', async function() {
    logger.info('Running TC_WEB_AUTH_02: Invalid Credentials');
    const input = credentials.invalidUsers[0];
    
    await loginPage.login(input.email, input.password);
    
    const formErr = await loginPage.getGeneralFormError();
    expect(formErr).to.not.be.empty;
  });

  it('[TC_WEB_AUTH_03] Verify Successful Login with Valid Credentials', async function() {
    logger.info('Running TC_WEB_AUTH_03: Valid Credentials Login');
    const user = credentials.validUser;
    
    await loginPage.login(user.email, user.password);
    
    const isAtDashboard = await dashboardPage.isAtDashboard();
    expect(isAtDashboard).to.be.true;
  });

  it('[TC_WEB_AUTH_04] Verify Account Sign Out & Session Deletion', async function() {
    logger.info('Running TC_WEB_AUTH_04: Logout');
    
    await dashboardPage.logout();
    
    const isAtLogin = await loginPage.isDisplayed(loginPage.submitButton);
    expect(isAtLogin).to.be.true;
  });
});
