const BasePage = require('./basePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.healthScoreText = 'id:com.aidiabetes.app:id/tv_health_score';
    this.avgGlucoseText = 'id:com.aidiabetes.app:id/tv_dashboard_avg_glucose';
    
    // Navigation items
    this.navDrawerButton = 'xpath://android.widget.ImageButton[@content-desc="Open navigation drawer"]';
    this.logoutMenuItem = 'id:com.aidiabetes.app:id/nav_logout';
    
    // Tabs (Bottom navigation)
    this.homeTab = 'id:com.aidiabetes.app:id/navigation_dashboard';
    this.dietTab = 'id:com.aidiabetes.app:id/navigation_diet';
    this.chatbotTab = 'id:com.aidiabetes.app:id/navigation_chat';
    this.historyTab = 'id:com.aidiabetes.app:id/navigation_history';
    
    this.profileCompletedMarker = 'id:com.aidiabetes.app:id/layout_dashboard_root';
  }

  async isAtDashboard() {
    return await this.isDisplayed(this.profileCompletedMarker);
  }

  async getHealthScore() {
    return await this.getText(this.healthScoreText);
  }

  async getAverageGlucose() {
    return await this.getText(this.avgGlucoseText);
  }

  async openDrawer() {
    await this.click(this.navDrawerButton);
  }

  async performLogout() {
    await this.openDrawer();
    await this.click(this.logoutMenuItem);
  }

  async clickDietTab() {
    await this.click(this.dietTab);
  }

  async clickChatTab() {
    await this.click(this.chatbotTab);
  }

  async clickHistoryTab() {
    await this.click(this.historyTab);
  }
}

module.exports = DashboardPage;
