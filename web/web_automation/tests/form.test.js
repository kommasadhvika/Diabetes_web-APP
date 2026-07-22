const { expect } = require('chai');
const baseSetup = require('./baseSetup');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const ProfilePage = require('../pages/profilePage');
const credentials = require('../data/userCredentials.json');
const logger = require('../utilities/logger');

describe('Web Profile Form Validation Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;
  let profilePage;

  before(async function() {
    driver = baseSetup.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    profilePage = new ProfilePage(driver);
    
    // Log in first
    await loginPage.navigateTo('/login');
    await loginPage.login(credentials.validUser.email, credentials.validUser.password);
  });

  it('[TC_WEB_FORM_01] Verify Profile Form Mandatory Fields Validation', async function() {
    logger.info('Running TC_WEB_FORM_01: Verify required fields errors');
    
    await dashboardPage.navigateToProfile();
    
    // Clear name and age and submit
    await profilePage.updateProfile({ fullName: '', age: '', height: '170', weight: '70' });
    
    const nameErr = await profilePage.getNameValidationError();
    const ageErr = await profilePage.getAgeValidationError();
    
    expect(nameErr).to.contain('required');
    expect(ageErr).to.contain('required');
  });

  it('[TC_WEB_FORM_02] Verify Inputs Limits Validations (Age/Height limits)', async function() {
    logger.info('Running TC_WEB_FORM_02: Check input boundary checks');
    
    // Enter out-of-bounds age (e.g. 130) and height (e.g. 280)
    await profilePage.updateProfile({ fullName: 'Audrey Hepburn', age: 130, height: 280, weight: 60 });
    
    const ageErr = await profilePage.getAgeValidationError();
    const heightErr = await profilePage.getHeightValidationError();
    
    expect(ageErr).to.contain('valid age');
    expect(heightErr).to.contain('valid height');
  });

  it('[TC_WEB_FORM_03] Verify Successful Profile Form Submission', async function() {
    logger.info('Running TC_WEB_FORM_03: Valid profile updates submission');
    const data = credentials.profileData;
    
    await profilePage.updateProfile(data);
    
    // Check for success alert toast or save completion indicator
    const text = await profilePage.getText('id:success-toast');
    expect(text).to.contain('successfully');
  });
});
