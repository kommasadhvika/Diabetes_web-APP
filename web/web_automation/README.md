# Enterprise Selenium Web E2E Automation Framework

This directory contains a modular, production-ready Page Object Model (POM) E2E web automation framework built with **Selenium WebDriver**, **Node.js**, **Mocha**, **Chai**, and **ExcelJS**. It is integrated with a **Smart Dynamic Test Generator** that scans active React routes to build and validate E2E scenarios.

---

## 📂 Framework Directory Structure

```
web_automation/
├── .github/
│   └── workflows/
│       └── selenium-e2e.yml   # CI/CD action triggers
├── config/
│   └── selenium.config.js     # Browser configurations (viewport, headless, timeouts)
├── drivers/
│   └── driverFactory.js       # Instantiates Chrome, Firefox, or Edge sessions
├── pages/
│   ├── basePage.js            # Core Selenium wrappers (clicks, inputs, alerts, console logs)
│   ├── loginPage.js           # POM mapping for Login screen forms
│   ├── dashboardPage.js       # POM mapping for Dashboard indicators and layout navigation
│   └── profilePage.js         # POM mapping for User profile forms
├── tests/
│   ├── baseSetup.js           # Global hooks for screenshotting, logs parsing, & teardown
│   ├── auth.test.js           # Authentication validation checks
│   ├── form.test.js           # Form inputs & boundary checks
│   └── navigation.test.js     # Sidebar navigation, redirects, and refreshes
├── utilities/
│   ├── logger.js              # Winston logger configurator
│   ├── excelReporter.js       # Custom ExcelJS reporter producing a 4-sheet workbook
│   └── dynamicTestGen.js      # Dynamic router scanner to map routes dynamically
├── data/
│   └── userCredentials.json   # Test data payloads
├── logs/                      # Winston logs folder
├── screenshots/               # Failure screenshot saves
├── reports/                   # HTML Mochawesome dashboards
└── package.json               # Scripts and dependency packages
```

---

## 🛠️ System Prerequisites

Make sure you have:
1.  **Node.js (v18+)**
2.  **Browsers**: Google Chrome, Mozilla Firefox, or Microsoft Edge installed.
3.  **Drivers**: Relevant drivers (ChromeDriver, Geckodriver, or Edgedriver) matching your browser versions should be installed or managed via WebDriver manager.

---

## 🚀 Getting Started & Local Runs

### 1. Install Dependencies
Install modules from the `web_automation` folder:
```bash
npm install
```

### 2. Manage Properties
Create a `.env` file or configure system environments:
```properties
BASE_URL=http://localhost:5173
BROWSER=chrome  # 'chrome', 'firefox', or 'edge'
HEADLESS=false  # 'true' for headless CLI run, 'false' for headed UI browser
```

### 3. Run E2E Test Suite
Execute the tests locally:
```bash
npm test
```
Or execute specific blocks:
```bash
# Run Authentication tests
npm run test:auth

# Run Form validation checks
npm run test:form

# Run Navigation tests
npm run test:navigation
```

---

## 📊 Outputs & E2E Excel Report

*   **Excel Sheet (`excel/E2E_Report.xlsx`)**: Auto-generates a detailed 4-sheet E2E workbook:
    1.  *Summary*: Date, Environment, Success rates, Duration.
    2.  *Test Cases*: Specific metrics for all 350+ dynamically discovered test scenarios.
    3.  *Failed Tests*: Detailed stack trace, failure URL, and screenshot reference path.
    4.  *Execution Logs*: Step auditing logs.
*   **HTML Dashboard (`reports/index.html`)**: Rich visual pie-charts and step-by-step results.
*   **Winston Logger Logs (`logs/web-automation.log`)**: Detailed runtime diagnostics log.
