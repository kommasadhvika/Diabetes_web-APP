import { db } from '../config/db.js';
import { emitToUser } from '../config/socket.js';

// Helper: Get date string format YYYY-MM-DD
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// @desc    Get user water log and settings
// @route   GET /api/water
export const getWaterStatus = async (req, res) => {
  const userId = req.user.id;
  const today = getTodayString();

  try {
    // 1. Fetch settings
    const settingsDoc = await db.collection('WaterSettings').doc(userId).get();
    let settings = {
      reminderIntervalMinutes: 60,
      reminderEnabled: true,
      snoozedUntil: null
    };

    if (settingsDoc.exists) {
      settings = settingsDoc.data();
    } else {
      await db.collection('WaterSettings').doc(userId).set(settings);
    }

    // 2. Fetch today's log
    const logSnap = await db.collection('WaterLogs')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .get();

    let todayLog = {
      userId,
      date: today,
      intakeMl: 0,
      goalMl: 2500, // standard default
      logs: []
    };

    let logDocId = null;
    logSnap.forEach(doc => {
      todayLog = doc.data();
      logDocId = doc.id;
    });

    if (!logDocId) {
      // Create empty log record for today
      // Check user profile for custom recommended goal
      const profileDoc = await db.collection('Profiles').doc(userId).get();
      if (profileDoc.exists) {
        const profile = profileDoc.data();
        todayLog.goalMl = Math.round(profile.weight * 35);
      }
      
      const newLogRef = db.collection('WaterLogs').doc();
      todayLog.id = newLogRef.id;
      await newLogRef.set(todayLog);
    }

    res.status(200).json({
      success: true,
      settings,
      todayLog
    });
  } catch (error) {
    console.error('Get water status error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving water stats' });
  }
};

// @desc    Add water intake
// @route   POST /api/water
export const addWaterIntake = async (req, res) => {
  const userId = req.user.id;
  const { amountMl } = req.body;
  const today = getTodayString();

  if (!amountMl || isNaN(amountMl) || amountMl <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid water amount in mL' });
  }

  try {
    const logSnap = await db.collection('WaterLogs')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .get();

    let todayLog;
    let logDocId;

    logSnap.forEach(doc => {
      todayLog = doc.data();
      logDocId = doc.id;
    });

    const addTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logEntry = { amountMl: parseInt(amountMl), loggedAt: addTime, timestamp: new Date().toISOString() };

    if (!logDocId) {
      // Set target goal from profile
      let goal = 2500;
      const profileDoc = await db.collection('Profiles').doc(userId).get();
      if (profileDoc.exists) {
        goal = Math.round(profileDoc.data().weight * 35);
      }

      const newLogRef = db.collection('WaterLogs').doc();
      todayLog = {
        id: newLogRef.id,
        userId,
        date: today,
        intakeMl: parseInt(amountMl),
        goalMl: goal,
        logs: [logEntry]
      };
      await newLogRef.set(todayLog);
    } else {
      todayLog.intakeMl += parseInt(amountMl);
      todayLog.logs.push(logEntry);
      await db.collection('WaterLogs').doc(logDocId).set(todayLog);
    }

    // Gamification & Socket.IO Triggers
    import('../utils/gamification.js').then(async ({ awardXp, trackStreak }) => {
      await awardXp(userId, 30, 'Water logged');
      await trackStreak(userId, 'water');
    }).catch(err => console.error('Gamification error:', err));

    emitToUser(userId, 'waterIntakeUpdated', todayLog);

    res.status(200).json({
      success: true,
      message: 'Water intake recorded!',
      todayLog
    });
  } catch (error) {
    console.error('Add water intake error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving water intake' });
  }
};

// @desc    Update water settings (intervals, snooze)
// @route   PUT /api/water/settings
export const updateWaterSettings = async (req, res) => {
  const userId = req.user.id;
  const { reminderIntervalMinutes, reminderEnabled, snoozeMinutes } = req.body;

  try {
    const settingsRef = db.collection('WaterSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    let currentSettings = {
      reminderIntervalMinutes: 60,
      reminderEnabled: true,
      snoozedUntil: null
    };

    if (settingsDoc.exists) {
      currentSettings = settingsDoc.data();
    }

    if (reminderIntervalMinutes !== undefined) {
      currentSettings.reminderIntervalMinutes = parseInt(reminderIntervalMinutes);
    }
    if (reminderEnabled !== undefined) {
      currentSettings.reminderEnabled = !!reminderEnabled;
    }
    if (snoozeMinutes !== undefined && snoozeMinutes > 0) {
      const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
      currentSettings.snoozedUntil = snoozeUntil;
    } else if (snoozeMinutes === 0) {
      currentSettings.snoozedUntil = null;
    }

    await settingsRef.set(currentSettings, { merge: true });

    res.status(200).json({
      success: true,
      message: 'Water settings updated successfully!',
      settings: currentSettings
    });
  } catch (error) {
    console.error('Update water settings error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating settings' });
  }
};
