const logger = require('./logger');

class WaitUtils {
  static async waitForDisplayed(driver, selector, timeoutMs = 15000) {
    try {
      const el = await driver.$(selector);
      await el.waitForDisplayed({ timeout: timeoutMs });
      return el;
    } catch (error) {
      logger.error(`Element ${selector} was not displayed within ${timeoutMs}ms. Error: ${error.message}`);
      throw error;
    }
  }

  static async waitForClickable(driver, selector, timeoutMs = 15000) {
    try {
      const el = await this.waitForDisplayed(driver, selector, timeoutMs);
      await el.waitForClickable({ timeout: timeoutMs });
      return el;
    } catch (error) {
      logger.error(`Element ${selector} was not clickable within ${timeoutMs}ms. Error: ${error.message}`);
      throw error;
    }
  }

  static async waitForValue(driver, selector, expectedValue, timeoutMs = 15000) {
    try {
      const el = await this.waitForDisplayed(driver, selector, timeoutMs);
      await driver.waitUntil(
        async () => (await el.getText()) === expectedValue,
        {
          timeout: timeoutMs,
          timeoutMsg: `Expected value '${expectedValue}' did not appear in element ${selector}`
        }
      );
      return el;
    } catch (error) {
      logger.error(`Element ${selector} did not acquire value '${expectedValue}' within ${timeoutMs}ms. Error: ${error.message}`);
      throw error;
    }
  }

  static async waitForPresence(driver, selector, timeoutMs = 15000) {
    try {
      const el = await driver.$(selector);
      await el.waitForExist({ timeout: timeoutMs });
      return el;
    } catch (error) {
      logger.error(`Element ${selector} was not present within ${timeoutMs}ms. Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = WaitUtils;
