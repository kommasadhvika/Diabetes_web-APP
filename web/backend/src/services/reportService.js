import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import { generateWeeklySummaryText } from './ai/reportGeneratorAI.js';
import { sendEmail } from './emailService.js';
import { calculateBMI, getBMICategory } from '../services/aiService.js';

const REPORTS_DIR = path.resolve('public/reports');

// Helper to make sure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const generateWeeklyPdfReport = async (userId) => {
  ensureDirectoryExists(REPORTS_DIR);

  try {
    // 1. Fetch user data
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) throw new Error('User not found');
    const user = userDoc.data();

    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) throw new Error('Profile details incomplete');
    const profile = profileDoc.data();

    // 2. Fetch tracking logs
    // In a real application, we would filter for the last 7 days.
    // For local fallback testing, we fetch all active logs to ensure data compiles.
    const sugarSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    const sugarLogs = [];
    sugarSnap.forEach(doc => sugarLogs.push(doc.data()));

    const exerciseSnap = await db.collection('ExerciseLogs').where('userId', '==', userId).get();
    const exerciseLogs = [];
    exerciseSnap.forEach(doc => exerciseLogs.push(doc.data()));

    const waterSnap = await db.collection('WaterLogs').where('userId', '==', userId).get();
    const waterLogs = [];
    waterSnap.forEach(doc => waterLogs.push(doc.data()));

    const appointSnap = await db.collection('Appointments').where('userId', '==', userId).get();
    const appointments = [];
    appointSnap.forEach(doc => appointments.push(doc.data()));

    // 3. Compile statistics
    const fasting = sugarLogs.filter(log => log.type === 'fasting');
    const postMeal = sugarLogs.filter(log => log.type === 'afterMeal');
    
    const avgFasting = fasting.length > 0
      ? Math.round(fasting.reduce((sum, r) => sum + r.value, 0) / fasting.length)
      : 0;

    const avgPostMeal = postMeal.length > 0
      ? Math.round(postMeal.reduce((sum, r) => sum + r.value, 0) / postMeal.length)
      : 0;

    const totalExerciseMin = exerciseLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const totalCalBurned = exerciseLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);

    const avgWaterIntake = waterLogs.length > 0
      ? Math.round(waterLogs.reduce((sum, l) => sum + l.intakeMl, 0) / waterLogs.length)
      : 0;

    const stats = {
      avgFasting,
      avgPostMeal,
      totalExerciseMin,
      totalCalBurned,
      avgWaterIntake,
      appointmentsCount: appointments.length
    };

    // 4. Generate AI Summary Text
    const aiSummary = await generateWeeklySummaryText(profile, stats);

    // 5. Generate PDF Document
    const pdfPath = path.join(REPORTS_DIR, `WeeklyReport_${userId}_${Date.now()}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // PDF RENDER
    // Logo / Header
    doc.fillColor('#0d9488').fontSize(24).font('Helvetica-Bold').text('DiaPredict AI', { align: 'center' });
    doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('Smart Diabetes Management Platform', { align: 'center' });
    doc.moveDown(2);

    // Patient info banner
    doc.rect(50, doc.y, 512, 60).fill('#f1f5f9');
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('PATIENT REPORT PROFILE', 60, doc.y + 8);
    doc.fontSize(10).font('Helvetica')
      .text(`Name: ${profile.fullName}  |  Age: ${profile.age}  |  Gender: ${profile.gender}  |  Height: ${profile.height}cm  |  Weight: ${profile.weight}kg`, 60, doc.y + 6)
      .text(`Diabetes Type: ${profile.diabetesType}  |  Activity Level: ${profile.activityLevel}`, 60, doc.y + 6);
    doc.moveDown(3);

    // Statistics grid
    doc.fillColor('#0d9488').fontSize(12).font('Helvetica-Bold').text('WEEKLY LOGGED METRICS SUMMARY');
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke();
    doc.moveDown(1.5);

    const startY = doc.y;
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold')
      .text('Average Fasting Sugar:', 60, startY)
      .text('Average Post-Meal Sugar:', 60, startY + 20)
      .text('Tracked Exercise Duration:', 60, startY + 40)
      .text('Calories Burned:', 60, startY + 60)
      .text('Average Water Intake:', 60, startY + 80);

    doc.font('Helvetica')
      .text(`${avgFasting > 0 ? `${avgFasting} mg/dL` : 'No logs'}`, 240, startY)
      .text(`${avgPostMeal > 0 ? `${avgPostMeal} mg/dL` : 'No logs'}`, 240, startY + 20)
      .text(`${totalExerciseMin} minutes`, 240, startY + 40)
      .text(`-${totalCalBurned} kcal`, 240, startY + 60)
      .text(`${avgWaterIntake} mL/day`, 240, startY + 80);

    doc.moveDown(7);

    // AI summary card
    doc.fillColor('#0d9488').fontSize(12).font('Helvetica-Bold').text('AI CLINICAL ADVISOR REVIEW');
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke();
    doc.moveDown(1.5);

    doc.fillColor('#334155').fontSize(10).font('Helvetica-Oblique').text(aiSummary, {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown(4);

    // Disclaimer
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text('Clinical Disclaimer: This report is dynamically formulated based on statistical tracker parameters. It does not constitute medical prescriptions or formal diagnoses. Always consult your endocrinologist for clinical support.', {
      align: 'center'
    });

    doc.end();

    // Wait for the stream to close before resolving/emailing
    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Save report metadata record in reports collection
    const reportRef = db.collection('Reports').doc();
    const newReport = {
      id: reportRef.id,
      userId,
      fileName: path.basename(pdfPath),
      filePath: pdfPath,
      generatedAt: new Date().toISOString(),
      emailSent: false
    };
    await reportRef.set(newReport);

    // Email report attachment to user
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">Weekly Health Progress Report</h2>
        <p>Dear ${profile.fullName},</p>
        <p>Your weekly health tracker summary report is ready. Please find the attached PDF report outlining your glucose averages, exercise durations, and customized AI suggestions.</p>
        <p>We advise maintaining consistent daily logging next week to track your metrics progress.</p>
        <p>Best regards,<br/>The DiaPredict AI Healthcare Team</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'DiaPredict AI - Your Weekly Health Report',
        html: emailHtml,
        text: 'Your weekly diabetes management summary report is attached.',
        attachments: [
          {
            filename: `WeeklyReport_${profile.fullName.replace(/\s+/g, '_')}.pdf`,
            path: pdfPath
          }
        ]
      });
      await db.collection('Reports').doc(reportRef.id).update({ emailSent: true });
      console.log(`Weekly report PDF successfully emailed to: ${user.email}`);
    } catch (emailErr) {
      console.error('Failed to email PDF attachment:', emailErr.message);
    }

    return newReport;
  } catch (error) {
    console.error('Error generating PDF report:', error.message);
    throw error;
  }
};
