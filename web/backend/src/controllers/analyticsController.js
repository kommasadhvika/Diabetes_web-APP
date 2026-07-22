import { db } from '../config/db.js';
import { calculateBMI } from '../services/aiService.js';

// @desc    Get aggregate analytics dashboard reports
// @route   GET /api/analytics
export const getAnalyticsDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get Sugar readings
    const sugarSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    const sugarLogs = [];
    sugarSnap.forEach(doc => sugarLogs.push(doc.data()));
    sugarLogs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort chronological for charts

    // 2. Get Exercise logs
    const exerciseSnap = await db.collection('ExerciseLogs').where('userId', '==', userId).get();
    const exerciseLogs = [];
    exerciseSnap.forEach(doc => exerciseLogs.push(doc.data()));

    // 3. Get Water logs
    const waterSnap = await db.collection('WaterLogs').where('userId', '==', userId).get();
    const waterLogs = [];
    waterSnap.forEach(doc => waterLogs.push(doc.data()));
    waterLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 4. Get Profile (to check BMI/Health score targets)
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    const profile = profileDoc.exists ? profileDoc.data() : null;

    // 5. Get Appointments
    const appointSnap = await db.collection('Appointments').where('userId', '==', userId).get();
    const appointments = [];
    appointSnap.forEach(doc => appointments.push(doc.data()));

    // Calculate aggregated metrics
    // Blood Sugar Averages
    const fastingReadings = sugarLogs.filter(log => log.type === 'fasting');
    const postMealReadings = sugarLogs.filter(log => log.type === 'afterMeal');
    
    const avgFasting = fastingReadings.length > 0
      ? Math.round(fastingReadings.reduce((sum, r) => sum + r.value, 0) / fastingReadings.length)
      : 0;

    const avgPostMeal = postMealReadings.length > 0
      ? Math.round(postMealReadings.reduce((sum, r) => sum + r.value, 0) / postMealReadings.length)
      : 0;

    // Classification Distribution (for Pie charts)
    const sugarDist = { NORMAL: 0, PREDIABETIC: 0, 'HIGH DIABETES RISK': 0 };
    sugarLogs.forEach(log => {
      if (sugarDist[log.classification] !== undefined) {
        sugarDist[log.classification]++;
      }
    });

    // Exercise summaries
    const totalExerciseMin = exerciseLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const totalCalBurned = exerciseLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);

    // Water averages
    const avgWaterIntake = waterLogs.length > 0
      ? Math.round(waterLogs.reduce((sum, l) => sum + l.intakeMl, 0) / waterLogs.length)
      : 0;

    // Achievement Badges evaluation
    const badges = [];
    
    // Badge 1: Profile Complete
    if (profile) {
      badges.push({
        id: 'profile-star',
        title: 'Elite Starter',
        description: 'Completed your clinical details profile setup.',
        icon: 'FaUserShield',
        color: 'from-emerald-400 to-teal-500',
        unlocked: true
      });
    } else {
      badges.push({
        id: 'profile-star',
        title: 'Elite Starter',
        description: 'Complete your clinical profile setup.',
        icon: 'FaUserShield',
        color: 'from-gray-400 to-gray-500',
        unlocked: false
      });
    }

    // Badge 2: Sugar logs frequency
    if (sugarLogs.length >= 5) {
      badges.push({
        id: 'sugar-guardian',
        title: 'Glucose Guardian',
        description: 'Logged 5 or more blood sugar metrics.',
        icon: 'FaHeartbeat',
        color: 'from-pink-400 to-rose-500',
        unlocked: true
      });
    } else {
      badges.push({
        id: 'sugar-guardian',
        title: 'Glucose Guardian',
        description: `Logged ${sugarLogs.length}/5 sugar metrics to unlock.`,
        icon: 'FaHeartbeat',
        color: 'from-gray-400 to-gray-500',
        unlocked: false
      });
    }

    // Badge 3: Hydration goal
    const highWaterDays = waterLogs.filter(log => log.intakeMl >= log.goalMl).length;
    if (highWaterDays >= 3) {
      badges.push({
        id: 'hydration-hero',
        title: 'Hydration Hero',
        description: 'Hit your hydration intake targets on 3 days.',
        icon: 'FaTint',
        color: 'from-blue-400 to-indigo-500',
        unlocked: true
      });
    } else {
      badges.push({
        id: 'hydration-hero',
        title: 'Hydration Hero',
        description: `Met daily target on ${highWaterDays}/3 days.`,
        icon: 'FaTint',
        color: 'from-gray-400 to-gray-500',
        unlocked: false
      });
    }

    // Badge 4: Fitness Minutes
    if (totalExerciseMin >= 90) {
      badges.push({
        id: 'fitness-fanatic',
        title: 'Active Gladiator',
        description: 'Completed 90+ minutes of tracked workouts.',
        icon: 'FaRunning',
        color: 'from-amber-400 to-orange-500',
        unlocked: true
      });
    } else {
      badges.push({
        id: 'fitness-fanatic',
        title: 'Active Gladiator',
        description: `Complete ${totalExerciseMin}/90 mins of physical activity.`,
        icon: 'FaRunning',
        color: 'from-gray-400 to-gray-500',
        unlocked: false
      });
    }

    // Format weekly sugar chart data
    const last7Sugar = sugarLogs.slice(-7).map(log => ({
      date: new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: log.value,
      type: log.type
    }));

    // Format water weekly chart data
    const last7Water = waterLogs.slice(-7).map(log => ({
      date: new Date(log.date + 'T00:00:00').toLocaleDateString([], { weekday: 'short' }),
      intake: log.intakeMl,
      goal: log.goalMl
    }));

    // Generate average health score
    let healthScore = 75; // Baseline default
    if (profile) {
      const bmi = calculateBMI(profile.weight, profile.height);
      if (bmi >= 18.5 && bmi < 25) healthScore += 10;
      if (profile.activityLevel !== 'Sedentary') healthScore += 10;
      
      const latestReading = sugarLogs.length > 0 ? sugarLogs[sugarLogs.length - 1] : null;
      if (latestReading) {
        if (latestReading.classification === 'NORMAL') healthScore += 10;
        else if (latestReading.classification === 'PREDIABETIC') healthScore += 5;
        else healthScore -= 10;
      }
    }
    healthScore = Math.min(100, Math.max(30, healthScore));

    res.status(200).json({
      success: true,
      healthScore,
      summary: {
        avgFasting,
        avgPostMeal,
        totalExerciseMin,
        totalCalBurned,
        avgWaterIntake,
        logsCount: sugarLogs.length,
        appointmentsCount: appointments.length
      },
      charts: {
        sugarLogs: last7Sugar,
        sugarDist,
        waterLogs: last7Water
      },
      badges
    });
  } catch (error) {
    console.error('Get analytics error:', error.message);
    res.status(500).json({ success: false, message: 'Server error generating analytics' });
  }
};
