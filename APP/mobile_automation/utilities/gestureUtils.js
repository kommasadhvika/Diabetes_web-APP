const logger = require('./logger');

class GestureUtils {
  static async tap(driver, x, y) {
    logger.info(`Performing tap at coordinates: [${x}, ${y}]`);
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }

  static async doubleTap(driver, x, y) {
    logger.info(`Performing double tap at coordinates: [${x}, ${y}]`);
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }

  static async longPress(driver, x, y, durationMs = 1500) {
    logger.info(`Performing long press at coordinates: [${x}, ${y}] for ${durationMs}ms`);
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: durationMs },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }

  static async swipe(driver, startX, startY, endX, endY, durationMs = 800) {
    logger.info(`Performing swipe from [${startX}, ${startY}] to [${endX}, ${endY}] over ${durationMs}ms`);
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: startX, y: startY },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: durationMs, origin: 'pointer', x: endX - startX, y: endY - startY },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }

  static async dragAndDrop(driver, startX, startY, endX, endY) {
    logger.info(`Performing drag & drop from [${startX}, ${startY}] to [${endX}, ${endY}]`);
    await this.swipe(driver, startX, startY, endX, endY, 1500);
  }

  static async scrollUntilVisible(driver, targetSelector, direction = 'down', maxSwipes = 8) {
    logger.info(`Scrolling ${direction} until element ${targetSelector} is visible`);
    const { width, height } = await driver.getWindowSize();
    
    // Swipe coordinates based on directions
    let startX = Math.round(width / 2);
    let startY = Math.round(height * 0.8);
    let endX = Math.round(width / 2);
    let endY = Math.round(height * 0.2);

    if (direction === 'up') {
      startY = Math.round(height * 0.2);
      endY = Math.round(height * 0.8);
    } else if (direction === 'right') {
      startX = Math.round(width * 0.2);
      endX = Math.round(width * 0.8);
      startY = Math.round(height / 2);
      endY = Math.round(height / 2);
    } else if (direction === 'left') {
      startX = Math.round(width * 0.8);
      endX = Math.round(width * 0.2);
      startY = Math.round(height / 2);
      endY = Math.round(height / 2);
    }

    for (let i = 0; i < maxSwipes; i++) {
      try {
        const el = await driver.$(targetSelector);
        if (await el.isDisplayed()) {
          logger.info(`Element ${targetSelector} is visible after ${i} scrolls.`);
          return el;
        }
      } catch (e) {
        // Continue scrolling
      }
      await this.swipe(driver, startX, startY, endX, endY, 1000);
      await driver.pause(500);
    }
    throw new Error(`Element ${targetSelector} did not become visible after ${maxSwipes} scrolls`);
  }

  static async pinch(driver, element) {
    logger.info('Performing pinch gesture...');
    const rect = await element.getRect();
    const centerX = rect.x + (rect.width / 2);
    const centerY = rect.y + (rect.height / 2);

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: centerX - 100, y: centerY },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 800, origin: 'pointer', x: 80, y: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      },
      {
        type: 'pointer',
        id: 'finger2',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: centerX + 100, y: centerY },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 800, origin: 'pointer', x: -80, y: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }

  static async zoom(driver, element) {
    logger.info('Performing zoom gesture...');
    const rect = await element.getRect();
    const centerX = rect.x + (rect.width / 2);
    const centerY = rect.y + (rect.height / 2);

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: centerX - 20, y: centerY },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 800, origin: 'pointer', x: -100, y: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      },
      {
        type: 'pointer',
        id: 'finger2',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: centerX + 20, y: centerY },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 800, origin: 'pointer', x: 100, y: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }
}

module.exports = GestureUtils;
