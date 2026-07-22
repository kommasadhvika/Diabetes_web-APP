const BasePage = require('./basePage');

class DietPlanPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.calorieTargetText = 'id:com.aidiabetes.app:id/tv_diet_cal_target';
    this.waterTargetText = 'id:com.aidiabetes.app:id/tv_diet_water_target';
    this.aiExplanationText = 'id:com.aidiabetes.app:id/tv_diet_ai_explanation';
    this.regenerateButton = 'id:com.aidiabetes.app:id/btn_regenerate_diet';
    
    // Day tab selector helper (dynamic locator)
    this.getDayTabLocator = (day) => `//android.widget.Button[@text="${day}"]`;
    
    this.groceryCheckBoxes = 'id:com.aidiabetes.app:id/cb_grocery_item';
  }

  async getCalorieTarget() {
    return await this.getText(this.calorieTargetText);
  }

  async getWaterTarget() {
    return await this.getText(this.waterTargetText);
  }

  async getAiExplanation() {
    return await this.getText(this.aiExplanationText);
  }

  async clickRegenerate() {
    await this.click(this.regenerateButton);
  }

  async selectDayTab(dayName) {
    const locator = this.getDayTabLocator(dayName);
    await this.click(locator);
  }

  async getGroceryListItems() {
    const elements = await this.driver.$$(this.groceryCheckBoxes);
    const names = [];
    for (const el of elements) {
      names.push(await el.getText());
    }
    return names;
  }

  async toggleGroceryItem(index) {
    const elements = await this.driver.$$(this.groceryCheckBoxes);
    if (elements[index]) {
      await elements[index].click();
      return true;
    }
    return false;
  }
}

module.exports = DietPlanPage;
