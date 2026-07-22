import { db } from '../config/db.js';
import { classifySugarLevel, calculateBMI, getBMICategory, calculateCaloriesTarget } from '../services/aiService.js';
import { emitToUser } from '../config/socket.js';
import { generateHealthInsights } from '../services/ai/healthAI.js';

// @desc    Add blood sugar reading
// @route   POST /api/sugar
export const addSugarReading = async (req, res) => {
  const userId = req.user.id;
  const { type, value, notes } = req.body;

  try {
    const numericValue = parseFloat(value);
    
    // Classify reading
    const classificationDetails = classifySugarLevel(type, numericValue);

    const readingRef = db.collection('SugarReadings').doc();
    const newReading = {
      id: readingRef.id,
      userId,
      type, // 'fasting' | 'afterMeal' | 'random'
      value: numericValue,
      classification: classificationDetails.classification, // 'NORMAL' | 'PREDIABETIC' | 'HIGH DIABETES RISK'
      riskLevel: classificationDetails.riskLevel, // 'Low' | 'Medium' | 'High'
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await readingRef.set(newReading);

    // Gamification & Socket.IO Triggers
    import('../utils/gamification.js').then(async ({ awardXp, trackStreak }) => {
      await awardXp(userId, 50, 'Blood glucose logged');
      await trackStreak(userId, 'sugar');
    }).catch(err => console.error('Gamification error:', err));
    
    emitToUser(userId, 'sugarReadingAdded', newReading);

    // Create system notification for high sugar levels
    if (classificationDetails.riskLevel === 'High') {
      const notifRef = db.collection('Notifications').doc();
      await notifRef.set({
        id: notifRef.id,
        userId,
        title: 'High Glucose Warning',
        message: `Your logged sugar level of ${value} mg/dL (${type}) shows High Diabetes Risk. Please check your diet advice and tips.`,
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Sugar reading logged successfully!',
      reading: newReading
    });
  } catch (error) {
    console.error('Add sugar reading error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving sugar reading' });
  }
};

// @desc    Get user sugar history
// @route   GET /api/sugar
export const getSugarHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const readingsSnap = await db.collection('SugarReadings')
      .where('userId', '==', userId)
      .get();
      
    const readings = [];
    readingsSnap.forEach(doc => {
      readings.push(doc.data());
    });

    // Sort by createdAt descending
    readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: readings.length,
      readings
    });
  } catch (error) {
    console.error('Get sugar history error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving sugar history' });
  }
};

// @desc    Delete a sugar reading
// @route   DELETE /api/sugar/:id
export const deleteSugarReading = async (req, res) => {
  const userId = req.user.id;
  const readingId = req.params.id;

  try {
    const docRef = db.collection('SugarReadings').doc(readingId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Reading not found' });
    }
    
    if (doc.data().userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
    }

    await docRef.delete();
    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete sugar reading error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting sugar reading' });
  }
};

// @desc    Get Smart AI Health Report & Suggestions
// @route   GET /api/sugar/report
export const getAiReport = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch user profile
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(400).json({ success: false, message: 'Profile incomplete. Complete profile to generate AI suggestions.' });
    }
    const profile = profileDoc.data();

    // 2. Fetch tracking logs
    const readingsSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    const readings = [];
    readingsSnap.forEach(doc => {
      readings.push(doc.data());
    });
    readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const exerciseSnap = await db.collection('ExerciseLogs').where('userId', '==', userId).get();
    const exerciseLogs = [];
    exerciseSnap.forEach(doc => exerciseLogs.push(doc.data()));

    const waterSnap = await db.collection('WaterLogs').where('userId', '==', userId).get();
    const waterLogs = [];
    waterSnap.forEach(doc => waterLogs.push(doc.data()));

    // 3. Generate calculations
    const bmi = calculateBMI(profile.weight, profile.height);
    const bmiCategory = getBMICategory(bmi);
    const calorieTarget = calculateCaloriesTarget(profile);
    const waterTargetLiters = parseFloat(((profile.weight * 35) / 1000).toFixed(1));
    const waterTargetMl = Math.round(profile.weight * 35);
    
    const latestReading = readings.length > 0 ? readings[0] : null;
    const latestClassification = latestReading 
      ? classifySugarLevel(latestReading.type, latestReading.value)
      : { classification: 'NO READINGS YET', riskLevel: 'Unknown', scoreDeduction: 0 };

    // 4. Generate suggestions via Gemini AI Engine
    const aiInsights = await generateHealthInsights(profile, readings, waterLogs, exerciseLogs);

    let recommendedFoods = [];
    let recommendedExercises = [];
    try {
      const foodSnap = await db.collection('Foods').where('isDiabeticFriendly', '==', true).get();
      foodSnap.forEach(doc => {
        const data = doc.data();
        recommendedFoods.push({
          name: data.name,
          category: data.category,
          calories: data.calories,
          glycemicIndex: data.glycemicIndex
        });
      });
      recommendedFoods = recommendedFoods.slice(0, 4);

      const exerciseSnapDb = await db.collection('Exercises').get();
      exerciseSnapDb.forEach(doc => {
        const data = doc.data();
        recommendedExercises.push({
          name: data.name,
          category: data.category,
          benefits: data.benefits,
          duration: data.durationMinutes
        });
      });
    } catch (dbErr) {
      console.error('Error loading static foods/exercises for report:', dbErr.message);
    }
    
    if (recommendedFoods.length === 0) {
      recommendedFoods = [
        { name: 'Oatmeal (Cooked)', category: 'Breakfast', calories: 150, glycemicIndex: 55 },
        { name: 'Quinoa (Cooked)', category: 'Lunch', calories: 220, glycemicIndex: 53 },
        { name: 'Paneer Tikka', category: 'Dinner', calories: 280, glycemicIndex: 27 },
        { name: 'Almonds', category: 'Snacks', calories: 160, glycemicIndex: 15 }
      ];
    }
    if (recommendedExercises.length === 0) {
      recommendedExercises = [
        { name: 'Brisk Walking', category: 'Walking', benefits: 'Lowers blood sugar levels', duration: 30 },
        { name: 'Surya Namaskar', category: 'Yoga', benefits: 'Improves core strength and flexibility', duration: 15 }
      ];
    }

    const report = {
      bmi,
      bmiCategory,
      healthScore: aiInsights.healthScore || 80,
      calorieTarget,
      waterTargetLiters,
      waterTargetMl,
      riskLevel: latestClassification.riskLevel,
      classification: latestClassification.classification,
      trendMessage: aiInsights.trendMessage,
      tips: aiInsights.tips || [],
      dietSuggestions: aiInsights.dietSuggestions || [],
      exerciseSuggestions: aiInsights.exerciseSuggestions || [],
      recommendedFoods,
      recommendedExercises,
      generatedAt: new Date().toISOString()
    };

    // Save Health Report to history log
    const reportRef = db.collection('HealthReports').doc();
    await reportRef.set({
      id: reportRef.id,
      userId,
      healthScore: report.healthScore,
      riskLevel: report.riskLevel,
      bmi: report.bmi,
      trendMessage: report.trendMessage,
      createdAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get AI report error:', error.message);
    res.status(500).json({ success: false, message: 'Server error generating recommendations via Gemini' });
  }
};
