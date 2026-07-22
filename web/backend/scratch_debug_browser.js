import puppeteer from 'puppeteer';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Log console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[BROWSER CONSOLE ${type.toUpperCase()}]: ${text}`);
    });

    // Log unhandled page errors (crashes, exceptions)
    page.on('pageerror', err => {
      console.error('\n=== BROWSER PAGE ERROR DETECTED ===');
      console.error(err.toString());
      console.error(err.stack);
      console.error('===================================\n');
    });

    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    console.log('Entering login credentials...');
    await page.type('input[type="email"]', 'kondasivaramajeswanth@gmail.com');
    await page.type('input[type="password"]', 'Password123!');

    console.log('Submitting login...');
    await page.click('button[type="submit"]');

    console.log('Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log(`Current page URL: ${page.url()}`);

    console.log('Navigating directly to gamification page...');
    await page.goto('http://localhost:5173/gamification', { waitUntil: 'networkidle2' });

    console.log('Waiting for 3 seconds to capture page renders/crashes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Done.');
  } catch (err) {
    console.error('Script run failed:', err);
  } finally {
    await browser.close();
  }
}

run();
