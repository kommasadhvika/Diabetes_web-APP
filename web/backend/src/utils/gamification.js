import { db } from '../config/db.js';
import { emitToUser } from '../config/socket.js';

// Helper: Get today string YYYY-MM-DD
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper: Get yesterday string YYYY-MM-DD
const getYesterdayString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// @desc    Award XP points to user and check level boundaries
export const awardXp = async (userId, amount, reason) => {
  try {
    const profileRef = db.collection('Profiles').doc(userId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) return null;
    
    const profile = profileDoc.data();
    const currentXp = profile.xp || 0;
    const currentLevel = profile.level || 1;
    
    const newXp = currentXp + amount;
    // Level boundary calculation: 500 XP per level
    const newLevel = Math.floor(newXp / 500) + 1;
    const leveledUp = newLevel > currentLevel;

    const updates = {
      xp: newXp,
      level: newLevel,
      updatedAt: new Date().toISOString()
    };

    await profileRef.update(updates);

    // Emit real-time XP update to client
    emitToUser(userId, 'xpUpdated', { xp: newXp, level: newLevel, amountAwarded: amount, reason });

    // Handle level-up triggers
    if (leveledUp) {
      console.log(`[LEVEL UP] User ${userId} leveled up to Level ${newLevel}!`);
      
      // Save notification log
      const notifRef = db.collection('Notifications').doc();
      await notifRef.set({
        id: notifRef.id,
        userId,
        title: '🎉 Level Up!',
        message: `Congratulations! You reached Level ${newLevel} on your health journey. Keep logging to earn more XP!`,
        type: 'gamification',
        read: false,
        createdAt: new Date().toISOString()
      });

      // Broadcast level up socket event
      emitToUser(userId, 'levelUp', { level: newLevel });
    }

    return { xp: newXp, level: newLevel, leveledUp };
  } catch (error) {
    console.error('Error awarding XP in gamification utility:', error.message);
    return null;
  }
};

// @desc    Track logging streaks for different actions (sugar, water, etc.)
export const trackStreak = async (userId, type) => {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  const streakId = `${userId}_${type}`;

  try {
    const streakRef = db.collection('streaks').doc(streakId);
    const streakDoc = await streakRef.get();

    let streakCount = 1;

    if (streakDoc.exists) {
      const streakData = streakDoc.data();
      const lastLogged = streakData.lastLoggedDate;

      if (lastLogged === today) {
        // Already logged today, ignore increment
        return streakData.count;
      } else if (lastLogged === yesterday) {
        // Logged yesterday, increment streak
        streakCount = (streakData.count || 0) + 1;
      } else {
        // Broke streak, reset to 1
        streakCount = 1;
      }
    }

    const newStreakData = {
      userId,
      type,
      count: streakCount,
      lastLoggedDate: today,
      updatedAt: new Date().toISOString()
    };

    await streakRef.set(newStreakData);

    // Emit real-time streak updates
    emitToUser(userId, 'streakUpdated', { type, count: streakCount });

    // Check achievement unlock milestones (e.g. 3-day water tracking streak)
    if (type === 'water' && streakCount === 3) {
      await unlockAchievement(userId, 'hydration-hero');
    } else if (type === 'sugar' && streakCount === 5) {
      await unlockAchievement(userId, 'sugar-guardian');
    }

    return streakCount;
  } catch (error) {
    console.error('Error tracking streak in gamification utility:', error.message);
    return 1;
  }
};

// Helper: Unlock Achievements
export const unlockAchievement = async (userId, badgeId) => {
  try {
    const achievementsRef = db.collection('achievements').doc(`${userId}_${badgeId}`);
    const checkDoc = await achievementsRef.get();

    if (checkDoc.exists) return; // already unlocked

    const newUnlock = {
      userId,
      badgeId,
      unlockedAt: new Date().toISOString()
    };

    await achievementsRef.set(newUnlock);

    // Trigger alert log
    const notifRef = db.collection('Notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      userId,
      title: '🏆 Achievement Unlocked!',
      message: `You earned the '${badgeId === 'hydration-hero' ? 'Hydration Hero' : 'Glucose Guardian'}' achievement badge. Check your analytics dashboard!`,
      type: 'gamification',
      read: false,
      createdAt: new Date().toISOString()
    });

    emitToUser(userId, 'achievementUnlocked', { badgeId });
  } catch (err) {
    console.error('Error unlocking achievement:', err.message);
  }
};
