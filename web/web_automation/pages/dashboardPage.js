const { By } = require('selenium-webdriver');
const BasePage = require('./basePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.sidebarProfileLink = By.css('a[href="/profile"]');
    this.sidebarDietLink = By.css('a[href="/diet-plan"]');
    this.sidebarChatLink = By.css('a[href="/chatbot"]');
    this.sidebarHistoryLink = By.css('a[href="/sugar-tracking"]');
    
    this.healthScoreWidget = By.id('health-score-value');
    this.dashboardContainer = By.id('dashboard-container');
    
    this.userMenuButton = By.id('user-menu-button');
    this.logoutButton = By.id('logout-button');
  }

  async isAtDashboard() {
    return await this.isDisplayed(this.dashboardContainer);
  }

  async getHealthScore() {
    return await this.getText(this.healthScoreWidget);
  }

  async navigateToProfile() {
    await this.click(this.sidebarProfileLink);
  }

  async navigateToDiet() {
    await this.click(this.sidebarDietLink);
  }

  async navigateToChat() {
    await this.click(this.sidebarChatLink);
  }

  async navigateToHistory() {
    await this.click(this.sidebarHistoryLink);
  }

  async logout() {
    await this.click(this.userMenuButton);
    await this.click(this.logoutButton);
  }
}

module.exports = DashboardPage;
