import { db } from '../config/db.js';

// Calculate BMI
export const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

// Get BMI Category
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Calculate BMR and Target Calories (Mifflin-St Jeor)
export const calculateCaloriesTarget = (profile) => {
  const { age, gender, height, weight, activityLevel } = profile;
  
  // Base BMR estimate
  let bmr = 0;
  if (gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multiplier
  let multiplier = 1.2; // Sedentary
  if (activityLevel === 'Lightly Active') multiplier = 1.375;
  if (activityLevel === 'Moderately Active') multiplier = 1.55;
  if (activityLevel === 'Very Active') multiplier = 1.725;

  let maintenanceCalories = bmr * multiplier;
  
  // Adjust for diabetes management (slight calorie restriction for weight management/insulin sensitivity)
  const targetCalories = Math.round(maintenanceCalories * 0.9);
  
  return targetCalories;
};

// Classification of Sugar Reading
export const classifySugarLevel = (type, value) => {
  // Fasting: Normal < 100, Prediabetes 100-125, Diabetes >= 126
  // After Meal: Normal < 140, Prediabetes 140-199, Diabetes >= 200
  // Random: Normal < 140, Prediabetes 140-199, Diabetes >= 200
  
  const val = parseFloat(value);
  
  if (type === 'fasting') {
    if (val < 100) return { classification: 'NORMAL', riskLevel: 'Low', scoreDeduction: 0 };
    if (val <= 125) return { classification: 'PREDIABETIC', riskLevel: 'Medium', scoreDeduction: 10 };
    return { classification: 'HIGH DIABETES RISK', riskLevel: 'High', scoreDeduction: 25 };
  } else {
    // afterMeal and random use same thresholds
    if (val < 140) return { classification: 'NORMAL', riskLevel: 'Low', scoreDeduction: 0 };
    if (val <= 199) return { classification: 'PREDIABETIC', riskLevel: 'Medium', scoreDeduction: 10 };
    return { classification: 'HIGH DIABETES RISK', riskLevel: 'High', scoreDeduction: 25 };
  }
};

// Generate AI Recommendation Report
export const generateRecommendations = async (profile, sugarLogs) => {
  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiCategory = getBMICategory(bmi);
  const calorieTarget = calculateCaloriesTarget(profile);
  
  // Water recommendation: 35ml per kg body weight
  const waterTargetLiters = parseFloat(((profile.weight * 35) / 1000).toFixed(1));
  const waterTargetMl = Math.round(profile.weight * 35);
  
  // Get latest sugar reading
  const latestReading = sugarLogs.length > 0 ? sugarLogs[0] : null;
  const latestClassification = latestReading 
    ? classifySugarLevel(latestReading.type, latestReading.value)
    : { classification: 'NO READINGS YET', riskLevel: 'Unknown', scoreDeduction: 0 };

  // Calculate Health Score (starts at 100)
  let healthScore = 100;
  
  // 1. BMI deduction
  if (bmiCategory === 'Obese') healthScore -= 15;
  else if (bmiCategory === 'Overweight') healthScore -= 8;
  else if (bmiCategory === 'Underweight') healthScore -= 5;
  
  // 2. Latest sugar level deduction
  healthScore -= latestClassification.scoreDeduction;

  // 3. Activity level check
  if (profile.activityLevel === 'Sedentary') healthScore -= 10;
  else if (profile.activityLevel === 'Lightly Active') healthScore -= 5;
  
  // 4. Trend deduction
  let trendMessage = 'Maintain regular tracking to observe blood sugar trends.';
  let sugarTrendPercent = 0;
  
  if (sugarLogs.length >= 4) {
    // Calculate average of last 3 vs preceding 3
    const fastingLogs = sugarLogs.filter(log => log.type === 'fasting');
    if (fastingLogs.length >= 4) {
      const recentAvg = (parseFloat(fastingLogs[0].value) + parseFloat(fastingLogs[1].value)) / 2;
      const olderAvg = (parseFloat(fastingLogs[2].value) + parseFloat(fastingLogs[3].value)) / 2;
      
      const diff = recentAvg - olderAvg;
      sugarTrendPercent = Math.round((diff / olderAvg) * 100);
      
      if (sugarTrendPercent > 5) {
        healthScore -= 10;
        trendMessage = `Your fasting sugar increased by ${sugarTrendPercent}% recently. Reduce high glycemic foods and increase walking duration.`;
      } else if (sugarTrendPercent < -5) {
        trendMessage = `Excellent work! Your fasting sugar decreased by ${Math.abs(sugarTrendPercent)}% compared to your previous readings.`;
      } else {
        trendMessage = `Your blood sugar levels are currently stable with minor variations (${sugarTrendPercent}%). Keep it up!`;
      }
    }
  }

  // Secure score bounds
  healthScore = Math.max(20, Math.min(100, healthScore));

  // Generate Suggestions
  const tips = [];
  const dietSuggestions = [];
  const exerciseSuggestions = [];

  // General tips based on conditions
  if (latestClassification.classification === 'HIGH DIABETES RISK') {
    tips.push('Limit all simple carbs, sugar-sweetened beverages, and refined flour immediately.');
    tips.push('Drink plenty of water to help kidneys flush excess glucose.');
    tips.push('Walk for 15 minutes immediately after your heaviest meal.');
    dietSuggestions.push('Incorporate high-fiber green leafy vegetables, lentils, paneer, and tofu.');
    dietSuggestions.push('Avoid white rice, white bread, and potatoes.');
    exerciseSuggestions.push('Increase your brisk walking duration to 45 minutes daily.');
    exerciseSuggestions.push('Incorporate low-impact yoga sequences for stress relief.');
  } else if (latestClassification.classification === 'PREDIABETIC') {
    tips.push('Increase dietary fiber intake to slow down sugar absorption.');
    tips.push('Perform at least 150 minutes of moderate physical activity weekly.');
    dietSuggestions.push('Choose whole grains like quinoa, brown rice, or oats instead of processed grains.');
    exerciseSuggestions.push('Complete 30 minutes of brisk walking or low-impact cardio daily.');
  } else {
    tips.push('Maintain consistent meal times to prevent glucose spikes.');
    tips.push('Perform strength training twice a week to build muscle mass, which acts as a glucose sink.');
    dietSuggestions.push('Enjoy balanced proportions of proteins, complex carbohydrates, and healthy fats.');
    exerciseSuggestions.push('Maintain your current active lifestyle. Try adding light stretching.');
  }

  if (bmiCategory === 'Obese' || bmiCategory === 'Overweight') {
    tips.push('A modest weight loss of 5-7% can significantly improve insulin sensitivity.');
    exerciseSuggestions.push('Add interval training (swapping brisk walking with jog segments) to accelerate calorie burn.');
  }

  // If no tips populated
  if (tips.length === 0) {
    tips.push('Keep recording your daily meals and sugar scores.');
    tips.push('Try to sleep 7-8 hours nightly; poor sleep negatively impacts insulin function.');
  }

  // Load recommendations datasets from database (to return custom friendly options)
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
    // Shuffle or slice
    recommendedFoods = recommendedFoods.slice(0, 4);

    const exerciseSnap = await db.collection('Exercises').get();
    exerciseSnap.forEach(doc => {
      const data = doc.data();
      recommendedExercises.push({
        name: data.name,
        category: data.category,
        benefits: data.benefits,
        duration: data.durationMinutes
      });
    });
  } catch (error) {
    console.error('Error loading recommendations from database:', error.message);
  }

  // Standard static fallbacks if db query returned nothing
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

  return {
    bmi,
    bmiCategory,
    healthScore,
    calorieTarget,
    waterTargetLiters,
    waterTargetMl,
    riskLevel: latestClassification.riskLevel,
    classification: latestClassification.classification,
    trendMessage,
    tips,
    dietSuggestions,
    exerciseSuggestions,
    recommendedFoods,
    recommendedExercises,
    generatedAt: new Date().toISOString()
  };
};

// Generate 7-Day Diet Plan
export const generateDietPlanForUser = async (profile, latestSugarReading) => {
  const calorieTarget = calculateCaloriesTarget(profile);
  
  // Decide diet template key: [Indian|International]-[Vegetarian|Non-Vegetarian]
  const isIndian = profile.medicalNotes && profile.medicalNotes.toLowerCase().includes('india') || true; // Default to Indian
  const isVeg = profile.gender === 'Female' ? true : false; // Default logic or extract from profile
  
  let dietTypeKey = 'Indian-Vegetarian';
  
  const dietPref = profile.diabetesType && profile.diabetesType.includes('Non-Veg') ? 'Non-Vegetarian' : 'Vegetarian';
  const originPref = profile.diabetesType && profile.diabetesType.includes('International') ? 'International' : 'Indian';
  
  // Match key patterns
  if (profile.diabetesType) {
    if (profile.diabetesType.includes('Veg') && !profile.diabetesType.includes('Non-Veg')) {
      dietTypeKey = profile.diabetesType.includes('International') ? 'International-Vegetarian' : 'Indian-Vegetarian';
    } else if (profile.diabetesType.includes('Non-Veg')) {
      dietTypeKey = profile.diabetesType.includes('International') ? 'International-Non-Vegetarian' : 'Indian-Non-Vegetarian';
    } else {
      // Default guess
      dietTypeKey = profile.diabetesType.includes('International') ? 'International-Vegetarian' : 'Indian-Vegetarian';
    }
  }

  // Load template
  let template = null;
  try {
    const templateDoc = await db.collection('DietTemplates').doc(dietTypeKey).get();
    if (templateDoc.exists) {
      template = templateDoc.data();
    }
  } catch (error) {
    console.error('Error fetching diet template:', error);
  }

  // Fallback if not found
  if (!template) {
    // Load local templates
    template = {
      breakfast: [
        { "day": 1, "meal": "Oats Upma with veggies", "calories": 250, "carbs": 35, "protein": 8, "fat": 5 },
        { "day": 2, "meal": "Moong Dal Chilla (2) with mint chutney", "calories": 220, "carbs": 28, "protein": 12, "fat": 4 },
        { "day": 3, "meal": "Vegetable Dalia", "calories": 210, "carbs": 32, "protein": 7, "fat": 3 },
        { "day": 4, "meal": "Sprouted Moong Salad with paneer", "calories": 260, "carbs": 18, "protein": 16, "fat": 10 },
        { "day": 5, "meal": "Ragi Roti (1) with curd", "calories": 240, "carbs": 36, "protein": 6, "fat": 5 },
        { "day": 6, "meal": "Idli (2) with sambar (no potatoes)", "calories": 200, "carbs": 38, "protein": 6, "fat": 2 },
        { "day": 7, "meal": "Besan Chilla (2) with low-fat curd", "calories": 230, "carbs": 26, "protein": 11, "fat": 5 }
      ],
      lunch: [
        { "day": 1, "meal": "Brown rice (1 cup), Dal tadka, Mixed vegetable sabzi", "calories": 420, "carbs": 65, "protein": 14, "fat": 8 },
        { "day": 2, "meal": "Whole wheat chapati (2), Palak paneer, Cucumber salad", "calories": 450, "carbs": 40, "protein": 20, "fat": 15 },
        { "day": 3, "meal": "Quinoa pulav with chickpeas & curd", "calories": 400, "carbs": 55, "protein": 15, "fat": 7 },
        { "day": 4, "meal": "Chapati (2), Bhindi Masala, Boondi raita (low-fat)", "calories": 430, "carbs": 48, "protein": 12, "fat": 12 },
        { "day": 5, "meal": "Brown rice (1 cup), Rajma curry, Stir-fry beans", "calories": 410, "carbs": 62, "protein": 16, "fat": 6 },
        { "day": 6, "meal": "Millets roti (2), Baingan bharta, Dal fry", "calories": 440, "carbs": 50, "protein": 15, "fat": 10 },
        { "day": 7, "meal": "Multi-grain chapati (2), Lauki chana dal, Tomato onion salad", "calories": 380, "carbs": 45, "protein": 13, "fat": 7 }
      ],
      dinner: [
        { "day": 1, "meal": "Mixed vegetable soup, Grilled Paneer (100g)", "calories": 300, "carbs": 10, "protein": 18, "fat": 16 },
        { "day": 2, "meal": "Soya chunks curry, Broccoli stir-fry", "calories": 280, "carbs": 15, "protein": 22, "fat": 8 },
        { "day": 3, "meal": "Chapati (1), Tofu bhurji, Green salad", "calories": 310, "carbs": 24, "protein": 18, "fat": 10 },
        { "day": 4, "meal": "Clear vegetable broth, Moong dal khichdi (dry, 1 cup)", "calories": 290, "carbs": 45, "protein": 10, "fat": 4 },
        { "day": 5, "meal": "Grilled mushroom and paneer salad with lime dressing", "calories": 320, "carbs": 8, "protein": 19, "fat": 18 },
        { "day": 6, "meal": "Methi thepla (2) with roasted flaxseed curd", "calories": 330, "carbs": 38, "protein": 9, "fat": 10 },
        { "day": 7, "meal": "Stir-fry bell peppers, beans, paneer & cabbage soup", "calories": 270, "carbs": 12, "protein": 16, "fat": 14 }
      ],
      snacks: [
        { "day": 1, "meal": "Roasted chana (handful)", "calories": 100, "carbs": 15, "protein": 6, "fat": 2 },
        { "day": 2, "meal": "Walnuts & Almonds (10 total)", "calories": 120, "carbs": 3, "protein": 3, "fat": 11 },
        { "day": 3, "meal": "Buttermilk (1 glass) with chia seeds", "calories": 80, "carbs": 5, "protein": 3, "fat": 2 },
        { "day": 4, "meal": "Cucumber slices with hummus", "calories": 110, "carbs": 8, "protein": 4, "fat": 6 },
        { "day": 5, "meal": "Sprouted salad (half cup)", "calories": 90, "carbs": 12, "protein": 5, "fat": 1 },
        { "day": 6, "meal": "Green tea & 2 digestive biscuits", "calories": 95, "carbs": 14, "protein": 2, "fat": 3 },
        { "day": 7, "meal": "Roasted makhana (1 cup)", "calories": 110, "carbs": 18, "protein": 3, "fat": 2 }
      ]
    };
  }

  // Compile 7-day schedule
  const schedule = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Calculate base calorie multipliers (adjust meal size slightly to fit target calories)
  let targetSum = 0;
  for (let i = 0; i < 7; i++) {
    const bf = template.breakfast[i] || template.breakfast[0];
    const ln = template.lunch[i] || template.lunch[0];
    const dn = template.dinner[i] || template.dinner[0];
    const sn = template.snacks[i] || template.snacks[0];
    targetSum += (bf.calories + ln.calories + dn.calories + sn.calories);
  }
  const avgTemplateCal = targetSum / 7;
  const ratio = calorieTarget / avgTemplateCal;

  // Grocery list compiling
  const grocerySet = new Set();

  for (let i = 0; i < 7; i++) {
    const dayName = days[i];
    const bf = template.breakfast[i] || template.breakfast[0];
    const ln = template.lunch[i] || template.lunch[0];
    const dn = template.dinner[i] || template.dinner[0];
    const sn = template.snacks[i] || template.snacks[0];

    // Scale macro counts to user targets
    const formatMeal = (mealObj, time) => {
      const scaledCal = Math.round(mealObj.calories * ratio);
      const scale = scaledCal / mealObj.calories;
      
      // Extract main ingredients for grocery list
      const words = mealObj.meal.toLowerCase().split(/[ ,&()]+/);
      const stopWords = ['with', 'and', 'no', 'of', 'in', 'oil', 'low-fat', 'fat', 'dry', 'fresh', 'raw', 'cup', 'spoon', 'glass', 'slices', 'cooked', 'or', 'to', 'for', '1', '2', '3', '100g', '150g', 'bowl', 'slice', 'sauce', 'dressing'];
      words.forEach(word => {
        if (word.length > 2 && !stopWords.includes(word)) {
          // Capitalize
          const capWord = word.charAt(0).toUpperCase() + word.slice(1);
          grocerySet.add(capWord);
        }
      });

      return {
        name: mealObj.meal,
        calories: scaledCal,
        carbs: Math.round(mealObj.carbs * scale),
        protein: Math.round(mealObj.protein * scale),
        fat: Math.round(mealObj.fat * scale),
        time: time
      };
    };

    schedule.push({
      day: dayName,
      breakfast: formatMeal(bf, '08:00 AM'),
      lunch: formatMeal(ln, '01:30 PM'),
      dinner: formatMeal(dn, '08:00 PM'),
      snacks: formatMeal(sn, '05:00 PM'),
      totalCalories: Math.round((bf.calories + ln.calories + dn.calories + sn.calories) * ratio)
    });
  }

  // Create Water limit recommendation
  const waterTargetLiters = parseFloat(((profile.weight * 35) / 1000).toFixed(1));

  // Build AI explanation
  let explanation = `This 7-day plan is structured specifically for a ${profile.age}-year-old ${profile.gender} with ${profile.activityLevel} activity. `;
  if (latestSugarReading) {
    explanation += `Considering your latest blood sugar was ${latestSugarReading.value} mg/dL (${latestSugarReading.type}), this diet restricts high glycemic index items to prevent blood glucose spikes. `;
  }
  explanation += `We have targeted a daily intake of ${calorieTarget} kcal with high fiber, lean proteins, and complex carbohydrates to improve your insulin sensitivity and support steady energy throughout the day.`;

  return {
    dietType: dietTypeKey,
    calorieTarget,
    waterRecommendationLiters: waterTargetLiters,
    schedule,
    groceryList: Array.from(grocerySet).slice(0, 15), // Keep top 15 grocery ingredients
    aiExplanation: explanation
  };
};
