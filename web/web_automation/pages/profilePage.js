const { By } = require('selenium-webdriver');
const BasePage = require('./basePage');

class ProfilePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = By.name('fullName');
    this.ageInput = By.name('age');
    this.genderSelect = By.name('gender');
    this.heightInput = By.name('height');
    this.weightInput = By.name('weight');
    this.activitySelect = By.name('activityLevel');
    this.diabetesSelect = By.name('diabetesType');
    this.notesInput = By.name('medicalNotes');
    this.saveButton = By.css('button[type="submit"]');

    // Validation alerts
    this.nameError = By.id('name-error');
    this.ageError = By.id('age-error');
    this.heightError = By.id('height-error');
    this.weightError = By.id('weight-error');
  }

  async updateProfile(profile) {
    if (profile.fullName !== undefined) await this.clearAndSendKeys(this.nameInput, profile.fullName);
    if (profile.age !== undefined) await this.clearAndSendKeys(this.ageInput, String(profile.age));
    if (profile.height !== undefined) await this.clearAndSendKeys(this.heightInput, String(profile.height));
    if (profile.weight !== undefined) await this.clearAndSendKeys(this.weightInput, String(profile.weight));
    
    if (profile.gender) {
      await this.sendKeys(this.genderSelect, profile.gender);
    }
    if (profile.activityLevel) {
      await this.sendKeys(this.activitySelect, profile.activityLevel);
    }
    if (profile.diabetesType) {
      await this.sendKeys(this.diabetesSelect, profile.diabetesType);
    }
    if (profile.medicalNotes !== undefined) {
      await this.clearAndSendKeys(this.notesInput, profile.medicalNotes);
    }
    
    await this.click(this.saveButton);
  }

  async getNameValidationError() {
    if (await this.isDisplayed(this.nameError)) {
      return await this.getText(this.nameError);
    }
    return '';
  }

  async getAgeValidationError() {
    if (await this.isDisplayed(this.ageError)) {
      return await this.getText(this.ageError);
    }
    return '';
  }

  async getHeightValidationError() {
    if (await this.isDisplayed(this.heightError)) {
      return await this.getText(this.heightError);
    }
    return '';
  }
}

module.exports = ProfilePage;
