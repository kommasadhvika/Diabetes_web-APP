const BasePage = require('./basePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailField = 'id:com.aidiabetes.app:id/et_login_email';
    this.passwordField = 'id:com.aidiabetes.app:id/et_login_password';
    this.loginButton = 'id:com.aidiabetes.app:id/btn_login';
    
    // Error / validation views
    this.emailErrorText = 'id:com.aidiabetes.app:id/tv_email_error';
    this.passwordErrorText = 'id:com.aidiabetes.app:id/tv_password_error';
    this.generalErrorText = 'id:com.aidiabetes.app:id/tv_general_error';
  }

  async login(email, password) {
    if (email !== null) {
      await this.clearAndSendKeys(this.emailField, email);
    }
    if (password !== null) {
      await this.clearAndSendKeys(this.passwordField, password);
    }
    await this.hideKeyboard();
    await this.click(this.loginButton);
  }

  async getEmailValidationError() {
    if (await this.isDisplayed(this.emailErrorText)) {
      return await this.getText(this.emailErrorText);
    }
    return '';
  }

  async getPasswordValidationError() {
    if (await this.isDisplayed(this.passwordErrorText)) {
      return await this.getText(this.passwordErrorText);
    }
    return '';
  }

  async getGeneralError() {
    if (await this.isDisplayed(this.generalErrorText)) {
      return await this.getText(this.generalErrorText);
    }
    return '';
  }
}

module.exports = LoginPage;
