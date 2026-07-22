const { By } = require('selenium-webdriver');
const BasePage = require('./basePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.css('button[type="submit"]');
    
    this.emailError = By.id('email-error');
    this.passwordError = By.id('password-error');
    this.formError = By.id('form-error');
  }

  async login(email, password) {
    if (email !== null) {
      await this.clearAndSendKeys(this.emailInput, email);
    }
    if (password !== null) {
      await this.clearAndSendKeys(this.passwordInput, password);
    }
    await this.click(this.submitButton);
  }

  async getEmailError() {
    if (await this.isDisplayed(this.emailError)) {
      return await this.getText(this.emailError);
    }
    return '';
  }

  async getPasswordError() {
    if (await this.isDisplayed(this.passwordError)) {
      return await this.getText(this.passwordError);
    }
    return '';
  }

  async getGeneralFormError() {
    if (await this.isDisplayed(this.formError)) {
      return await this.getText(this.formError);
    }
    return '';
  }
}

module.exports = LoginPage;
