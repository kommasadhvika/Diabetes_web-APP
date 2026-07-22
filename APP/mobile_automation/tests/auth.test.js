const { expect } = require('chai');
const baseSetup = require('./baseSetup');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const credentials = require('../testdata/userCredentials.json');
const logger = require('../utilities/logger');

describe('Authentication Test Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;

  before(function() {
    driver = baseSetup.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  it('[TC_AUTH_01] Validate Login with Empty Fields', async function() {
    logger.info('Running TC_AUTH_01: Login with Empty Fields');
    
    await loginPage.login('', '');
    
    const emailError = await loginPage.getEmailValidationError();
    const passwordError = await loginPage.getPasswordValidationError();
    
    // In actual app, we expect "Email is required" and "Password is required"
    expect(emailError).to.contain('required');
    expect(passwordError).to.contain('required');
  });

  it('[TC_AUTH_02] Validate Login with Malformed Email Format', async function() {
    logger.info('Running TC_AUTH_02: Login with Malformed Email');
    const input = credentials.malformedInputs[0];
    
    await loginPage.login(input.email, input.password);
    
    const emailError = await loginPage.getEmailValidationError();
    expect(emailError).to.contain('valid email');
  });

  it('[TC_AUTH_03] Validate Login with Invalid Credentials', async function() {
    logger.info('Running TC_AUTH_03: Login with Invalid Credentials');
    const input = credentials.invalidUsers[0];
    
    await loginPage.login(input.email, input.password);
    
    // Wait for Toast error or General error text
    const toast = await loginPage.getToastMessage();
    const generalError = await loginPage.getGeneralError();
    
    expect(toast || generalError).to.not.be.empty;
  });

  it('[TC_AUTH_04] Validate Login with Valid Credentials & Session Persistence', async function() {
    logger.info('Running TC_AUTH_04: Login with Valid Credentials');
    const user = credentials.validUser;
    
    await loginPage.login(user.email, user.password);
    
    // Validate transition to dashboard
    const isAtDashboard = await dashboardPage.isAtDashboard();
    expect(isAtDashboard).to.be.true;
    
    const healthScore = await dashboardPage.getHealthScore();
    expect(healthScore).to.not.be.empty;
    logger.info(`Dashboard health score retrieved: ${healthScore}`);
  });

  it('[TC_AUTH_05] Validate Logout & Navigation Redirection', async function() {
    logger.info('Running TC_AUTH_05: Logout validation');
    
    await dashboardPage.performLogout();
    
    // Validate redirected back to login screen
    const isAtLogin = await loginPage.isDisplayed(loginPage.loginButton);
    expect(isAtLogin).to.be.true;
  });
});
