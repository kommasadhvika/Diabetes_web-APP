const { expect } = require('chai');
const baseSetup = require('./baseSetup');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const DietPlanPage = require('../pages/dietPlanPage');
const credentials = require('../testdata/userCredentials.json');
const logger = require('../utilities/logger');

describe('Form Validation & Profile Update Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;
  let dietPlanPage;

  before(async function() {
    driver = baseSetup.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    dietPlanPage = new DietPlanPage(driver);
    
    // Perform standard login to access form/profile page
    await loginPage.login(credentials.validUser.email, credentials.validUser.password);
  });

  it('[TC_FORM_01] Validate Mandatory Form Profile Fields', async function() {
    logger.info('Running TC_FORM_01: Verify required fields validation');
    
    // Go to profile fragment (we click the menu navigation)
    await dashboardPage.openDrawer();
    await dashboardPage.click('id:com.aidiabetes.app:id/nav_profile');
    
    // Clear all fields and submit
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_name', '');
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_age', '');
    await dashboardPage.click('id:com.aidiabetes.app:id/btn_save_profile');
    
    const nameError = await dashboardPage.getText('id:com.aidiabetes.app:id/tv_profile_name_error');
    const ageError = await dashboardPage.getText('id:com.aidiabetes.app:id/tv_profile_age_error');
    
    expect(nameError).to.contain('required');
    expect(ageError).to.contain('required');
  });

  it('[TC_FORM_02] Validate Input Bound Rules (Min/Max values)', async function() {
    logger.info('Running TC_FORM_02: Check input boundary checks');
    
    // Enter invalid age (e.g. 150) and height (e.g. 300)
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_name', 'Alice Smith');
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_age', '150');
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_height', '300');
    await dashboardPage.click('id:com.aidiabetes.app:id/btn_save_profile');
    
    const ageError = await dashboardPage.getText('id:com.aidiabetes.app:id/tv_profile_age_error');
    const heightError = await dashboardPage.getText('id:com.aidiabetes.app:id/tv_profile_height_error');
    
    expect(ageError).to.contain('valid age');
    expect(heightError).to.contain('valid height');
  });

  it('[TC_FORM_03] Validate Dropdown selection & Checkbox options', async function() {
    logger.info('Running TC_FORM_03: Check dropdown and check boxes');
    
    // Select Gender Spinner
    await dashboardPage.click('id:com.aidiabetes.app:id/spinner_gender');
    // Select "Female" from popup options
    await dashboardPage.click('xpath://android.widget.TextView[@text="Female"]');
    
    // Check "Family history of cardiovascular issues" checkbox
    const cardOption = await dashboardPage.findElement('id:com.aidiabetes.app:id/cb_cardiovascular');
    if (!(await cardOption.isSelected())) {
      await cardOption.click();
    }
    
    expect(await cardOption.isSelected()).to.be.true;
  });

  it('[TC_FORM_04] Successful Form Submission & Verification', async function() {
    logger.info('Running TC_FORM_04: Valid profile update');
    
    // Enter valid details
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_age', '45');
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_height', '165');
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_weight', '78');
    await dashboardPage.clearAndSendKeys('id:com.aidiabetes.app:id/et_profile_notes', 'Family history of cardiovascular issues. Enjoys Indian food.');
    
    await dashboardPage.click('id:com.aidiabetes.app:id/btn_save_profile');
    
    const toast = await dashboardPage.getToastMessage();
    expect(toast).to.contain('successfully');
  });
});
