import { db } from '../config/db.js';
import { generateWeeklyDietPlan } from '../services/ai/nutritionAI.js';

// @desc    Get or auto-generate user diet plan
// @route   GET /api/diet
export const getDietPlan = async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if diet plan already exists for user
    const dietDoc = await db.collection('DietPlans').doc(userId).get();
    
    if (dietDoc.exists) {
      return res.status(200).json({ success: true, dietPlan: dietDoc.data() });
    }

    // Auto-generate if missing
    // Get user profile
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(400).json({ success: false, message: 'Please complete user profile to generate diet plan' });
    }
    const profile = profileDoc.data();

    // Get latest sugar reading
    const sugarSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    let readings = [];
    sugarSnap.forEach(doc => readings.push(doc.data()));
    readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestReading = readings.length > 0 ? readings[0] : null;

    // Generate plan using Gemini AI
    const generatedPlan = await generateWeeklyDietPlan(profile, latestReading);
    
    // Save to database
    const planRecord = {
      userId,
      ...generatedPlan,
      groceryChecked: [], // items crossed off by user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('DietPlans').doc(userId).set(planRecord);

    res.status(200).json({
      success: true,
      message: 'Diet plan generated successfully!',
      dietPlan: planRecord
    });
  } catch (error) {
    console.error('Get diet plan error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading diet plan' });
  }
};

// @desc    Force regenerate diet plan
// @route   POST /api/diet/generate
export const forceGenerateDietPlan = async (req, res) => {
  const userId = req.user.id;

  try {
    const profileDoc = await db.collection('Profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return res.status(400).json({ success: false, message: 'Please complete user profile to generate diet plan' });
    }
    const profile = profileDoc.data();

    const sugarSnap = await db.collection('SugarReadings').where('userId', '==', userId).get();
    let readings = [];
    sugarSnap.forEach(doc => readings.push(doc.data()));
    readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestReading = readings.length > 0 ? readings[0] : null;

    const generatedPlan = await generateWeeklyDietPlan(profile, latestReading);
    
    const planRecord = {
      userId,
      ...generatedPlan,
      groceryChecked: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('DietPlans').doc(userId).set(planRecord);

    res.status(200).json({
      success: true,
      message: 'New diet plan successfully generated!',
      dietPlan: planRecord
    });
  } catch (error) {
    console.error('Force generate diet plan error:', error.message);
    res.status(500).json({ success: false, message: 'Server error regenerating diet plan' });
  }
};

// @desc    Toggle item on grocery checked list
// @route   PUT /api/diet/grocery
export const toggleGroceryItem = async (req, res) => {
  const userId = req.user.id;
  const { item } = req.body;

  if (!item) {
    return res.status(400).json({ success: false, message: 'Grocery item name is required' });
  }

  try {
    const dietRef = db.collection('DietPlans').doc(userId);
    const dietDoc = await dietRef.get();

    if (!dietDoc.exists) {
      return res.status(404).json({ success: false, message: 'Diet plan not found. Please create diet plan first.' });
    }

    const data = dietDoc.data();
    let checkedList = data.groceryChecked || [];

    if (checkedList.includes(item)) {
      checkedList = checkedList.filter(i => i !== item);
    } else {
      checkedList.push(item);
    }

    await dietRef.update({
      groceryChecked: checkedList,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Grocery list updated successfully!',
      groceryChecked: checkedList
    });
  } catch (error) {
    console.error('Toggle grocery item error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating grocery checklist' });
  }
};
