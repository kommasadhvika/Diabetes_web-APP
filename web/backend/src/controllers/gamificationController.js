import { db } from '../config/db.js';

// @desc    Get user gamification status
// @route   GET /api/gamification/status
export const getGamificationStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get XP & Level from user profile
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    const profile = profileDoc.data();
    const xp = profile.xp || 0;
    const level = profile.level || 1;

    // 2. Get active streaks
    const streaksSnap = await db.collection('streaks')
      .where('userId', '==', userId)
      .get();
    
    const streaks = [];
    streaksSnap.forEach(doc => {
      streaks.push(doc.data());
    });

    // 3. Get unlocked achievements/badges
    const achievementsSnap = await db.collection('achievements')
      .where('userId', '==', userId)
      .get();
    
    const achievements = [];
    achievementsSnap.forEach(doc => {
      achievements.push(doc.data());
    });

    // Define standard challenges list
    const challenges = [
      {
        id: 'log-sugar',
        title: 'Glucose Tracker',
        description: 'Log a blood sugar level reading',
        xpReward: 50,
        type: 'sugar',
        completed: streaks.some(s => s.type === 'sugar' && s.lastLoggedDate === new Date().toISOString().split('T')[0])
      },
      {
        id: 'log-water',
        title: 'Hydration Intake',
        description: 'Log your water consumption',
        xpReward: 30,
        type: 'water',
        completed: streaks.some(s => s.type === 'water' && s.lastLoggedDate === new Date().toISOString().split('T')[0])
      },
      {
        id: 'log-exercise',
        title: 'Daily Workout',
        description: 'Complete and record any exercise activity',
        xpReward: 100,
        type: 'exercise',
        completed: streaks.some(s => s.type === 'exercise' && s.lastLoggedDate === new Date().toISOString().split('T')[0])
      },
      {
        id: 'scan-food',
        title: 'Smart Meal Scanner',
        description: 'Scan an image of your food with AI Vision',
        xpReward: 25,
        type: 'food_scan',
        completed: streaks.some(s => s.type === 'food_scan' && s.lastLoggedDate === new Date().toISOString().split('T')[0])
      },
      {
        id: 'chat-ai',
        title: 'AI Consultation',
        description: 'Send a prompt or consult DiaPredict chatbot',
        xpReward: 10,
        type: 'chatbot',
        completed: false // simple interactive flag or track via local states
      }
    ];

    // Badge catalog
    const badgeCatalog = [
      {
        id: 'hydration-hero',
        name: 'Hydration Hero',
        description: 'Unlocked by tracking water intake for 3 consecutive days',
        icon: '💧',
        unlocked: achievements.some(a => a.badgeId === 'hydration-hero')
      },
      {
        id: 'sugar-guardian',
        name: 'Glucose Guardian',
        description: 'Unlocked by logging blood sugar readings for 5 consecutive days',
        icon: '🛡️',
        unlocked: achievements.some(a => a.badgeId === 'sugar-guardian')
      }
    ];

    res.status(200).json({
      success: true,
      xp,
      level,
      nextLevelXp: 500, // level increments every 500 XP
      streaks,
      achievements,
      challenges,
      badges: badgeCatalog
    });
  } catch (error) {
    console.error('Get gamification status error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving gamification details' });
  }
};
