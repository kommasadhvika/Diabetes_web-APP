import { db } from '../config/db.js';
import { emitToUser } from '../config/socket.js';
import { generateWeeklyExercisePlan } from '../services/ai/exerciseAI.js';

// @desc    Get exercises catalog
// @route   GET /api/exercises
export const getExercisesCatalog = async (req, res) => {
  try {
    const exercisesSnap = await db.collection('Exercises').get();
    const exercises = [];
    exercisesSnap.forEach(doc => {
      exercises.push(doc.data());
    });

    res.status(200).json({
      success: true,
      count: exercises.length,
      exercises
    });
  } catch (error) {
    console.error('Get exercises catalog error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving exercises catalog' });
  }
};

// @desc    Log physical exercise completed
// @route   POST /api/exercises/log
export const logExerciseActivity = async (req, res) => {
  const userId = req.user.id;
  const { exerciseId, name, category, durationMinutes, repsCompleted, caloriesBurned } = req.body;

  if (!name || !durationMinutes) {
    return res.status(400).json({ success: false, message: 'Exercise name and duration are required' });
  }

  try {
    // Estimate calories burned if not provided (approx 6-8 kcal per min based on moderate intensity)
    const calBurned = caloriesBurned || Math.round(parseFloat(durationMinutes) * 6.5);

    const logRef = db.collection('ExerciseLogs').doc();
    const newLog = {
      id: logRef.id,
      userId,
      exerciseId: exerciseId || 'custom',
      name,
      category: category || 'General',
      durationMinutes: parseFloat(durationMinutes),
      repsCompleted: repsCompleted ? parseInt(repsCompleted) : 0,
      caloriesBurned: calBurned,
      createdAt: new Date().toISOString()
    };

    await logRef.set(newLog);

    // Gamification & Socket.IO Triggers
    import('../utils/gamification.js').then(async ({ awardXp, trackStreak }) => {
      await awardXp(userId, 100, 'Exercise logged');
      await trackStreak(userId, 'exercise');
    }).catch(err => console.error('Gamification error:', err));

    emitToUser(userId, 'exerciseLogged', newLog);

    res.status(201).json({
      success: true,
      message: 'Exercise activity logged successfully!',
      log: newLog
    });
  } catch (error) {
    console.error('Log exercise error:', error.message);
    res.status(500).json({ success: false, message: 'Server error logging exercise activity' });
  }
};

// @desc    Get exercise activity logs
// @route   GET /api/exercises/log
export const getExerciseLogs = async (req, res) => {
  const userId = req.user.id;

  try {
    const logsSnap = await db.collection('ExerciseLogs')
      .where('userId', '==', userId)
      .get();

    const logs = [];
    logsSnap.forEach(doc => {
      logs.push(doc.data());
    });

    // Sort descending by date
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Get exercise logs error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving logs' });
  }
};

// @desc    Get or auto-generate user exercise schedule
// @route   GET /api/exercises/schedule
export const getExerciseSchedule = async (req, res) => {
  const userId = req.user.id;

  try {
    const scheduleDoc = await db.collection('ExerciseSchedules').doc(userId).get();
    
    if (scheduleDoc.exists) {
      return res.status(200).json({ success: true, schedule: scheduleDoc.data() });
    }

    // Auto-generate if missing
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(400).json({ success: false, message: 'Please complete user profile to generate exercise plan' });
    }
    const profile = profileDoc.data();

    // Latest sugar reading
    const sugarSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    let readings = [];
    sugarSnap.forEach(doc => readings.push(doc.data()));
    readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestReading = readings.length > 0 ? readings[0] : null;

    const generatedSchedule = await generateWeeklyExercisePlan(profile, latestReading);

    const scheduleRecord = {
      userId,
      ...generatedSchedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('ExerciseSchedules').doc(userId).set(scheduleRecord);

    res.status(200).json({
      success: true,
      message: 'Exercise schedule generated successfully!',
      schedule: scheduleRecord
    });
  } catch (error) {
    console.error('Get exercise schedule error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading exercise schedule' });
  }
};

// @desc    Force regenerate exercise schedule
// @route   POST /api/exercises/schedule/generate
export const forceGenerateExerciseSchedule = async (req, res) => {
  const userId = req.user.id;

  try {
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(400).json({ success: false, message: 'Please complete user profile to generate exercise plan' });
    }
    const profile = profileDoc.data();

    const sugarSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    let readings = [];
    sugarSnap.forEach(doc => readings.push(doc.data()));
    readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestReading = readings.length > 0 ? readings[0] : null;

    const generatedSchedule = await generateWeeklyExercisePlan(profile, latestReading);

    const scheduleRecord = {
      userId,
      ...generatedSchedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('ExerciseSchedules').doc(userId).set(scheduleRecord);

    res.status(200).json({
      success: true,
      message: 'New exercise schedule successfully generated!',
      schedule: scheduleRecord
    });
  } catch (error) {
    console.error('Force generate schedule error:', error.message);
    res.status(500).json({ success: false, message: 'Server error regenerating exercise schedule' });
  }
};
