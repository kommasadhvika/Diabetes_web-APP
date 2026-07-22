const waitUtils = require('../utilities/waitUtils');
const logger = require('../utilities/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(selector) {
    return await this.driver.$(selector);
  }

  async click(selector) {
    logger.info(`Clicking element: ${selector}`);
    const el = await waitUtils.waitForClickable(this.driver, selector);
    await el.click();
  }

  async sendKeys(selector, value) {
    logger.info(`Sending text to element: ${selector}`);
    const el = await waitUtils.waitForDisplayed(this.driver, selector);
    await el.setValue(value);
  }

  async clearAndSendKeys(selector, value) {
    logger.info(`Clearing and sending text to element: ${selector}`);
    const el = await waitUtils.waitForDisplayed(this.driver, selector);
    await el.clearValue();
    await el.addValue(value);
  }

  async getText(selector) {
    const el = await waitUtils.waitForDisplayed(this.driver, selector);
    const text = await el.getText();
    logger.info(`Retrieved text '${text}' from element: ${selector}`);
    return text;
  }

  async isDisplayed(selector) {
    try {
      const el = await this.driver.$(selector);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async getToastMessage(timeoutMs = 5000) {
    logger.info('Waiting for Toast message...');
    const toastSelector = 'xpath://android.widget.Toast';
    try {
      const el = await waitUtils.waitForDisplayed(this.driver, toastSelector, timeoutMs);
      const text = await el.getText();
      logger.info(`Toast captured: "${text}"`);
      return text;
    } catch (error) {
      logger.warn('Toast message was not detected.');
      return null;
    }
  }

  async hideKeyboard() {
    logger.info('Hiding soft keyboard...');
    try {
      if (await this.driver.isKeyboardShown()) {
        await this.driver.hideKeyboard();
      }
    } catch (e) {
      // Ignore if keyboard is already hidden or not dismissible
    }
  }

  async acceptAlert() {
    logger.info('Accepting alert...');
    try {
      await this.driver.acceptAlert();
    } catch (e) {
      logger.warn(`Failed to accept alert: ${e.message}`);
    }
  }

  async dismissAlert() {
    logger.info('Dismissing alert...');
    try {
      await this.driver.dismissAlert();
    } catch (e) {
      logger.warn(`Failed to dismiss alert: ${e.message}`);
    }
  }
}

module.exports = BasePage;
