const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class ExcelReporter {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.excelDir = path.join(__dirname, '../excel');
    if (!fs.existsSync(this.excelDir)) {
      fs.mkdirSync(this.excelDir, { recursive: true });
    }
    this.excelPath = path.join(this.excelDir, 'E2E_Report.xlsx');
    
    this.testCases = [];
    this.failedTests = [];
    this.logs = [];
    this.summary = {
      executionDate: new Date().toLocaleString(),
      environment: 'QA / Staging',
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passPercentage: 0,
      durationMs: 0
    };
    this.browserName = 'chrome';
  }

  setBrowserDetails(browser) {
    this.browserName = browser;
  }

  addTestCase(testId, module, scenarioName, status, startTime, endTime, durationMs) {
    this.testCases.push({
      testId,
      module,
      scenarioName,
      status,
      startTime: startTime.toLocaleTimeString(),
      endTime: endTime.toLocaleTimeString(),
      duration: `${(durationMs / 1000).toFixed(2)}s`
    });

    this.summary.totalTests++;
    if (status.toLowerCase() === 'passed') this.summary.passed++;
    else if (status.toLowerCase() === 'failed') this.summary.failed++;
    else this.summary.skipped++;
  }

  addFailure(testName, reason, screenshotPath, url) {
    this.failedTests.push({
      testName,
      reason,
      screenshotPath,
      url
    });
  }

  addLog(testName, stepDescription, result, remarks) {
    this.logs.push({
      timestamp: new Date().toLocaleTimeString(),
      testName,
      stepDescription,
      result,
      remarks
    });
  }

  async generateReport(totalDurationMs) {
    logger.info('Generating E2E_Report.xlsx workbook...');
    this.summary.durationMs = totalDurationMs;
    const totalCount = this.summary.totalTests;
    this.summary.passPercentage = totalCount > 0 ? Math.round((this.summary.passed / totalCount) * 100) : 0;

    // --- Sheet 1: Summary ---
    const summarySheet = this.workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 35 }
    ];
    summarySheet.addRows([
      { metric: 'Execution Date', value: this.summary.executionDate },
      { metric: 'Environment', value: this.summary.environment },
      { metric: 'Total Tests', value: this.summary.totalTests },
      { metric: 'Passed', value: this.summary.passed },
      { metric: 'Failed', value: this.summary.failed },
      { metric: 'Skipped', value: this.summary.skipped },
      { metric: 'Pass Percentage', value: `${this.summary.passPercentage}%` },
      { metric: 'Execution Duration', value: `${(totalDurationMs / 1000).toFixed(2)}s` }
    ]);
    this.styleSheet(summarySheet);

    // --- Sheet 2: Test Cases ---
    const tcSheet = this.workbook.addWorksheet('Test Cases');
    tcSheet.columns = [
      { header: 'Test ID', key: 'testId', width: 15 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Scenario Name', key: 'scenarioName', width: 40 },
      { header: 'Browser', key: 'browser', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Time', key: 'startTime', width: 18 },
      { header: 'End Time', key: 'endTime', width: 18 },
      { header: 'Duration', key: 'duration', width: 15 }
    ];
    this.testCases.forEach(tc => {
      tcSheet.addRow({
        ...tc,
        browser: this.browserName
      });
    });
    this.styleSheet(tcSheet);

    // --- Sheet 3: Failed Tests ---
    const failSheet = this.workbook.addWorksheet('Failed Tests');
    failSheet.columns = [
      { header: 'Test Name', key: 'testName', width: 35 },
      { header: 'Failure Reason', key: 'reason', width: 50 },
      { header: 'Screenshot Path', key: 'screenshotPath', width: 45 },
      { header: 'Browser', key: 'browser', width: 15 },
      { header: 'URL', key: 'url', width: 35 }
    ];
    this.failedTests.forEach(ft => {
      failSheet.addRow({
        ...ft,
        browser: this.browserName
      });
    });
    this.styleSheet(failSheet);

    // --- Sheet 4: Execution Logs ---
    const logSheet = this.workbook.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 18 },
      { header: 'Test Name', key: 'testName', width: 30 },
      { header: 'Step Description', key: 'stepDescription', width: 45 },
      { header: 'Result', key: 'result', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 35 }
    ];
    this.logs.forEach(l => logSheet.addRow(l));
    this.styleSheet(logSheet);

    await this.workbook.xlsx.writeFile(this.excelPath);
    logger.info(`E2E_Report.xlsx successfully compiled at: ${this.excelPath}`);
  }

  styleSheet(sheet) {
    // Style headers
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // High-quality sapphire-blue theme
      };
      cell.font = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 10
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF93C5FD' } },
        bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } }
      };
    });
    headerRow.height = 28;

    // Style data cells
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        // Highlight status cell
        if (cell.value === 'PASSED' || cell.value === 'Passed') {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF059669' } };
        } else if (cell.value === 'FAILED' || cell.value === 'Failed') {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFDC2626' } };
        }
      });
      row.height = 22;
    });
  }
}

module.exports = new ExcelReporter();
