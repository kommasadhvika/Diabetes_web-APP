require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  browser: process.env.BROWSER || 'chrome', // 'chrome', 'firefox', 'edge'
  headless: (process.env.HEADLESS || 'false').toLowerCase() === 'true',
  timeouts: {
    implicit: parseInt(process.env.IMPLICIT_TIMEOUT || '5000', 10),
    explicit: parseInt(process.env.EXPLICIT_TIMEOUT || '15000', 10)
  },
  chromeOptions: [
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--ignore-certificate-errors',
    '--window-size=1920,1080'
  ],
  firefoxOptions: [
    '--width=1920',
    '--height=1080'
  ],
  edgeOptions: [
    '--disable-gpu',
    '--no-sandbox',
    '--ignore-certificate-errors',
    '--window-size=1920,1080'
  ]
};
