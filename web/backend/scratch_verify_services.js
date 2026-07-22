import { getChatbotResponse } from './src/services/ai/chatbotAI.js';
import { generateWeeklyDietPlan } from './src/services/ai/nutritionAI.js';
import { generateHealthInsights } from './src/services/ai/healthAI.js';
import { predictHealthRisks } from './src/services/ai/riskPredictionAI.js';
import { generateWeeklySummaryText } from './src/services/ai/reportGeneratorAI.js';
import { generateVision } from './src/services/ai/geminiService.js';
import fs from 'fs';
import path from 'path';

const mockProfile = {
  fullName: "Alice Smith",
  age: 45,
  gender: "Female",
  height: 165,
  weight: 78, // overweight, BMI ~28.6
  activityLevel: "Sedentary",
  diabetesType: "Type 2",
  medicalNotes: "Family history of cardiovascular issues. Enjoys Indian food."
};

const mockSugarLogs = [
  { value: 165, type: "afterMeal", createdAt: new Date().toISOString() },
  { value: 112, type: "fasting", createdAt: new Date().toISOString() },
  { value: 145, type: "random", createdAt: new Date().toISOString() }
];

const mockWaterLogs = [
  { intakeMl: 1200, date: new Date().toISOString().split('T')[0] },
  { intakeMl: 1500, date: new Date().toISOString().split('T')[0] }
];

const mockExerciseLogs = [
  { name: "Gentle Walking", durationMinutes: 20, caloriesBurned: 100, createdAt: new Date().toISOString() }
];

async function runTests() {
  console.log('=== STARTING BACKEND SERVICE AUDIT ===\n');

  // 1. Chatbot
  try {
    console.log('Testing Chatbot AI...');
    const chatReply = await getChatbotResponse("Can I eat grapes with my Type 2 diabetes?", [], mockProfile, mockSugarLogs);
    console.log('✅ Chatbot AI Success! Reply length:', chatReply.length);
  } catch (err) {
    console.error('❌ Chatbot AI Failed! Error:', err.message);
  }

  // 2. Diet Generator
  try {
    console.log('\nTesting Diet Generator AI...');
    const dietPlan = await generateWeeklyDietPlan(mockProfile, mockSugarLogs[0]);
    console.log('✅ Diet Generator AI Success! Calorie target:', dietPlan.calorieTarget);
    console.log('Grocery count:', dietPlan.groceryList?.length);
    console.log('Schedule count:', dietPlan.schedule?.length);
    console.log('Sample meal:', JSON.stringify(dietPlan.schedule?.[0]?.breakfast, null, 2));
  } catch (err) {
    console.error('❌ Diet Generator AI Failed! Error:', err.message);
  }

  // 3. Health Analysis (Dashboard Insights)
  try {
    console.log('\nTesting Health Analysis AI...');
    const insights = await generateHealthInsights(mockProfile, mockSugarLogs, mockWaterLogs, mockExerciseLogs);
    console.log('✅ Health Analysis AI Success! Score:', insights.healthScore);
    console.log('Trend Message:', insights.trendMessage);
    console.log('Tips count:', insights.tips?.length);
  } catch (err) {
    console.error('❌ Health Analysis AI Failed! Error:', err.message);
  }

  // 4. Risk Prediction
  try {
    console.log('\nTesting Risk Prediction AI...');
    const risks = await predictHealthRisks(mockProfile, mockSugarLogs);
    console.log('✅ Risk Prediction AI Success! Diabetes risk:', risks.diabetesRisk?.level);
    console.log('Hyperglycemia risk:', risks.hyperglycemiaRisk?.level);
  } catch (err) {
    console.error('❌ Risk Prediction AI Failed! Error:', err.message);
  }

  // 5. Report Compliance Summary (PDF generation summary)
  try {
    console.log('\nTesting Report Summary AI...');
    const summaryStats = {
      avgFasting: 110,
      avgPostMeal: 150,
      totalExerciseMin: 45,
      totalCalBurned: 300,
      avgWaterIntake: 1400,
      appointmentsCount: 1
    };
    const reportSummary = await generateWeeklySummaryText(mockProfile, summaryStats);
    console.log('✅ Report Summary AI Success! Length:', reportSummary.length);
  } catch (err) {
    console.error('❌ Report Summary AI Failed! Error:', err.message);
  }

  // 6. Food Scanner Gemini Vision (Using a fake empty image buffer to test vision api endpoint)
  try {
    console.log('\nTesting Gemini Vision Scanner...');
    // Create a dummy transparent 1x1 png buffer for testing API connection
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const visionPrompt = `Analyze this food image and return a JSON matching: { "foodName": "string", "calories": 100 }`;
    const visionResult = await generateVision(dummyPngBuffer, 'image/png', visionPrompt);
    console.log('✅ Gemini Vision Success! Result:', visionResult);
  } catch (err) {
    console.error('❌ Gemini Vision Failed! Error:', err.message);
  }

  console.log('\n=== END OF BACKEND SERVICE AUDIT ===');
  process.exit(0);
}

runTests();
