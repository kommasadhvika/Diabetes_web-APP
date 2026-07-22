import path from 'path';
import fs from 'fs';
import { db } from '../config/db.js';
import { generateWeeklyPdfReport } from '../services/reportService.js';

// @desc    Get user's generated reports list
// @route   GET /api/reports
export const getUserReports = async (req, res) => {
  const userId = req.user.id;

  try {
    const reportsSnap = await db.collection('Reports')
      .where('userId', '==', userId)
      .get();

    const reports = [];
    reportsSnap.forEach(doc => {
      reports.push(doc.data());
    });

    reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get user reports error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving reports' });
  }
};

// @desc    Generate a new weekly progress report PDF manually
// @route   POST /api/reports/generate
export const generateReport = async (req, res) => {
  const userId = req.user.id;

  try {
    const reportRecord = await generateWeeklyPdfReport(userId);
    res.status(201).json({
      success: true,
      message: 'Weekly report generated and emailed successfully!',
      report: reportRecord
    });
  } catch (error) {
    console.error('Manual report generation error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error generating report' });
  }
};

// @desc    Download a specific report PDF
// @route   GET /api/reports/download/:filename
export const downloadReport = async (req, res) => {
  const userId = req.user.id;
  const { filename } = req.params;

  try {
    // Basic path traversal prevention
    const sanitizedFilename = path.basename(filename);
    const reportsDir = path.resolve('public/reports');
    const filePath = path.join(reportsDir, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found' });
    }

    // Verify report ownership in Firestore
    const reportsSnap = await db.collection('Reports')
      .where('userId', '==', userId)
      .where('fileName', '==', sanitizedFilename)
      .get();

    if (reportsSnap.empty) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this report' });
    }

    res.download(filePath, sanitizedFilename);
  } catch (error) {
    console.error('Download report error:', error.message);
    res.status(500).json({ success: false, message: 'Server error downloading report file' });
  }
};
