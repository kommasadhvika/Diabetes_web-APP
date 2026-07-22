const { By } = require('selenium-webdriver');
const waitUtils = require('../utilities/waitUtils');
const logger = require('../utilities/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(locator) {
    return await this.driver.findElement(locator);
  }

  async click(locator) {
    logger.info(`Clicking element: ${JSON.stringify(locator)}`);
    const element = await waitUtils.waitForElementVisible(this.driver, locator);
    await waitUtils.waitForElementClickable(this.driver, element);
    await element.click();
  }

  async sendKeys(locator, text) {
    logger.info(`Entering keys into: ${JSON.stringify(locator)}`);
    const element = await waitUtils.waitForElementVisible(this.driver, locator);
    await element.sendKeys(text);
  }

  async clearAndSendKeys(locator, text) {
    logger.info(`Clearing and entering keys into: ${JSON.stringify(locator)}`);
    const element = await waitUtils.waitForElementVisible(this.driver, locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator) {
    const element = await waitUtils.waitForElementVisible(this.driver, locator);
    const val = await element.getText();
    logger.info(`Retrieved element text: "${val}"`);
    return val;
  }

  async isDisplayed(locator) {
    try {
      const element = await this.driver.findElement(locator);
      return await element.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  async getConsoleLogs() {
    logger.info('Retrieving browser console logs...');
    try {
      const logs = await this.driver.manage().logs().get('browser');
      return logs.map(log => `[${log.timestamp}] [${log.level.name}] ${log.message}`).join('\n');
    } catch (e) {
      logger.warn(`Could not retrieve browser logs: ${e.message}`);
      return 'N/A';
    }
  }

  async getCurrentUrl() {
    const url = await this.driver.getCurrentUrl();
    logger.info(`Current browser URL: ${url}`);
    return url;
  }

  async navigateTo(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }
}

module.exports = BasePage;
