# Enterprise Appium E2E Automation Framework for Android

This directory contains a production-ready, highly modular Page Object Model (POM) mobile automation framework built using **Appium 2.x**, **WebdriverIO**, **Mocha**, **Chai**, and **ExcelJS**. It dynamically targets connected real devices or emulators, collects screenshots and logcat dumps on failures, and exports results into custom multi-sheet Excel reports and HTML dashboards.

---

## 📂 Framework Directory Structure

```
mobile_automation/
├── .github/
│   └── workflows/
│       └── appium-e2e.yml     # CI/CD test run action definition
├── config/
│   └── appium.config.js       # Capability management & server configs
├── drivers/
│   └── driverFactory.js       # Handles dynamic adb detection and Remote WebdriverIO sessions
├── pages/
│   ├── basePage.js            # Common interaction methods with explicit wait wrappers
│   ├── loginPage.js           # POM mapping for Login screen elements and validation checks
│   ├── dashboardPage.js       # POM mapping for dashboard widgets, tabs, and drawer options
│   └── dietPlanPage.js        # POM mapping for diet planner schedules and grocery lists
├── tests/
│   ├── baseSetup.js           # Global Mocha setup hooks for logging, session lifecycle, and reports
│   ├── auth.test.js           # E2E authentication validation scenarios
│   ├── form.test.js           # Field boundary validations and profile updates
│   └── gestures.test.js       # Touch, swipes, scroll-to-view, zooms, and pinch gestures
├── utilities/
│   ├── logger.js              # Winston logger configurator
│   ├── excelReporter.js       # ExcelJS custom 4-sheet E2E workbook generator
│   ├── gestureUtils.js        # Low-level W3C TouchAction wrappers
│   └── waitUtils.js           # Explicit wait helper utility
├── testdata/
│   └── userCredentials.json   # Test data lists
├── logs/                      # Winston logger files output
├── screenshots/               # Failure snapshot location
├── reports/                   # Mochawesome HTML and JSON reports
└── package.json               # Scripts and dependency versions
```

---

## 🛠️ Local System Prerequisites

Ensure you have the following installed on your machine:
1.  **Node.js (v18+)**
2.  **Java JDK 11+ / 17** (with `JAVA_HOME` environment variable configured)
3.  **Android SDK / Android Studio** (with `ANDROID_HOME` configured and `adb` added to system `PATH`)
4.  **Appium 2.x Command Line Tool**:
    ```bash
    npm install -g appium@latest
    ```
5.  **UiAutomator2 Driver for Appium**:
    ```bash
    appium driver install uiautomator2
    ```

---

## 🚀 Setting Up & Executing Tests

### 1. Install Dependencies
Navigate to the `mobile_automation` folder and install packages:
```bash
npm install
```

### 2. Configure Environment Properties
Create a `.env` file in the `mobile_automation` root, or set system env variables:
```properties
RUN_MODE=installed  # 'apk' (installs new package) or 'installed' (uses pre-installed app)
APK_PATH=./app/app-release.apk
APP_PACKAGE=com.aidiabetes.app
APP_ACTIVITY=com.aidiabetes.app.MainActivity
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723
```

### 3. Launch Appium Server
Start Appium on standard port:
```bash
appium
```

### 4. Connect Device / Start Emulator
Verify your device is active and detected by ADB:
```bash
adb devices
```
The framework's `DriverFactory` will automatically extract the UDID and OS versions of your active device.

### 5. Execute Test Suites
Run the entire automation collection:
```bash
npm test
```
Or execute specific modules:
```bash
# Run Authentication tests
npm run test:auth

# Run Form validation tests
npm run test:form

# Run Gestures tests
npm run test:gestures
```

---

## 📊 Reports & Outputs

Upon test completion, the following artifacts are generated:

### 1. Multi-Sheet Excel Workbook (`excel/Mobile_E2E_Report.xlsx`)
*   **Sheet 1 - Summary**: High-level execution data (Date, Device UDID, OS Version, Success/Failure counters, Pass %, Duration).
*   **Sheet 2 - Test Cases**: Flat grid outlining each unique test ID, scenario description, test status, and individual duration.
*   **Sheet 3 - Failed Tests**: Deep-dive failure details (Test Name, Stack Trace error reason, screenshot reference path, active Android activity name).
*   **Sheet 4 - Execution Logs**: Step-by-step audit logs showing timestamped actions and checkpoints.

### 2. HTML Dashboards (`reports/index.html`)
Mochawesome test reports with visual status pie charts, execution details, and step flows.

### 3. Winston Logger Log File (`logs/appium-tests.log`)
System-level execution traces with clean log formats containing timestamps, log categories, and debug statements.

### 4. Screenshots & Logcat Logs (`reports/failures/`)
When a test scenario fails, a screenshot (`*_failure.png`) and device console log dump (`*_logcat.log`) are automatically recorded here.
