const { until } = require('selenium-webdriver');
const config = require('../config/selenium.config');
const logger = require('./logger');

class WaitUtils {
  static async waitForElementLocated(driver, locator, timeoutMs = config.timeouts.explicit) {
    try {
      return await driver.wait(until.elementLocated(locator), timeoutMs);
    } catch (error) {
      logger.error(`Element not located: ${JSON.stringify(locator)}. Error: ${error.message}`);
      throw error;
    }
  }

  static async waitForElementVisible(driver, locator, timeoutMs = config.timeouts.explicit) {
    try {
      const element = await this.waitForElementLocated(driver, locator, timeoutMs);
      return await driver.wait(until.elementIsVisible(element), timeoutMs);
    } catch (error) {
      logger.error(`Element not visible: ${JSON.stringify(locator)}. Error: ${error.message}`);
      throw error;
    }
  }

  static async waitForElementClickable(driver, element, timeoutMs = config.timeouts.explicit) {
    try {
      return await driver.wait(until.elementIsEnabled(element), timeoutMs);
    } catch (error) {
      logger.error(`Element not enabled/clickable. Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = WaitUtils;
