import { generateJSON } from './geminiService.js';
import { calculateCaloriesTarget } from '../aiService.js';

const getFallbackDietPlan = (profile, calorieTarget, waterTargetLiters) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealsFallback = {
    breakfast: {
      name: "Cinnamon Almond Oatmeal",
      imageUrl: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80",
      calories: Math.round(calorieTarget * 0.25),
      carbs: 30,
      protein: 12,
      fat: 6,
      time: "08:00 AM",
      glycemicImpact: "Low",
      whyRecommended: "High in soluble fiber to slow digestion and support glycemic control.",
      ingredients: ["1/2 cup Rolled Oats", "1 cup Unsweetened Almond Milk", "1 tbsp Chia Seeds", "1/2 tsp Cinnamon"],
      cookingSteps: ["Combine oats and almond milk in a pot.", "Bring to a boil, then simmer for 5 minutes.", "Stir in chia seeds and cinnamon before serving."],
      prepTimeMinutes: 10
    },
    lunch: {
      name: "Mediterranean Tofu Salad",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
      calories: Math.round(calorieTarget * 0.35),
      carbs: 25,
      protein: 20,
      fat: 12,
      time: "01:30 PM",
      glycemicImpact: "Low",
      whyRecommended: "Lean proteins combined with leafy greens limit glucose absorption rate.",
      ingredients: ["150g Firm Tofu (cubed)", "2 cups Mixed Salad Greens", "1/2 Cucumber (sliced)", "1 tbsp Olive Oil & Lemon dressing"],
      cookingSteps: ["Toss tofu cubes in a non-stick pan until lightly golden.", "In a large bowl, combine salad greens and cucumber.", "Add tofu, drizzle dressing, and toss gently."],
      prepTimeMinutes: 15
    },
    snacks: {
      name: "Mixed Nuts & Cucumber",
      imageUrl: "https://images.unsplash.com/photo-1596560548464-f010689b7f4f?w=400&q=80",
      calories: Math.round(calorieTarget * 0.1),
      carbs: 8,
      protein: 5,
      fat: 6,
      time: "05:00 PM",
      glycemicImpact: "Low",
      whyRecommended: "Provides healthy fats and minerals without a significant glycemic load.",
      ingredients: ["30g Mixed Almonds & Walnuts", "1 medium Cucumber (sliced)"],
      cookingSteps: ["Serve nuts in a small bowl accompanied by sliced cucumber."],
      prepTimeMinutes: 5
    },
    dinner: {
      name: "Grilled Chicken & Steamed Broccoli",
      imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
      calories: Math.round(calorieTarget * 0.3),
      carbs: 20,
      protein: 28,
      fat: 8,
      time: "08:00 PM",
      glycemicImpact: "Low",
      whyRecommended: "High protein and cruciferous vegetables enhance insulin sensitivity and overnight recovery.",
      ingredients: ["150g Chicken Breast or Paneer", "1.5 cups Broccoli florets", "1 tsp Olive Oil", "Pinch of salt and black pepper"],
      cookingSteps: ["Season chicken breast or paneer with pepper and salt.", "Grill in a pan with olive oil until fully cooked.", "Steam broccoli for 5 minutes and serve together."],
      prepTimeMinutes: 20
    }
  };

  const schedule = days.map(day => {
    return {
      day,
      breakfast: { ...mealsFallback.breakfast },
      lunch: { ...mealsFallback.lunch },
      snacks: { ...mealsFallback.snacks },
      dinner: { ...mealsFallback.dinner },
      totalCalories: Math.round(calorieTarget)
    };
  });

  return {
    dietType: "Low Glycemic Index (System Fallback)",
    calorieTarget,
    waterRecommendationLiters: waterTargetLiters,
    groceryList: [
      "Rolled Oats", "Unsweetened Almond Milk", "Chia Seeds", "Firm Tofu / Paneer",
      "Mixed Salad Greens", "Cucumber", "Mixed Almonds & Walnuts", "Chicken Breast / Tofu",
      "Broccoli florets", "Olive Oil"
    ],
    aiExplanation: "Due to temporary AI service load limits, we generated this high-quality Low Glycemic index metabolic plan locally. It aligns with your calculated calorie target and highlights fiber-rich, high-protein options.",
    schedule
  };
};

export const generateWeeklyDietPlan = async (profile, latestSugarReading = null) => {
  const calorieTarget = calculateCaloriesTarget(profile);
  const waterTargetLiters = parseFloat(((profile.weight * 35) / 1000).toFixed(1));

  try {
    const prompt = `You are a clinical diabetic nutritionist. Create a personalized, 7-day low glycemic index diet plan (from Monday to Sunday) for a patient with:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Activity Level: ${profile.activityLevel}
- Diabetes Type / Diet Preference: ${profile.diabetesType}
- Medical details: "${profile.medicalNotes}"
${latestSugarReading ? `- Latest Blood Sugar reading: ${latestSugarReading.value} mg/dL (${latestSugarReading.type})` : ''}

Target daily calories: ${calorieTarget} kcal. Water: ${waterTargetLiters} Liters.

Format the response EXACTLY as a JSON object matching this structure:
{
  "dietType": "Indian-Vegetarian or match patient config",
  "calorieTarget": ${calorieTarget},
  "waterRecommendationLiters": ${waterTargetLiters},
  "groceryList": ["Ingredient1", "Ingredient2", ...],
  "aiExplanation": "A short summary explaining the glycemic index choices...",
  "schedule": [
    {
      "day": "Monday",
      "breakfast": {
        "name": "Meal name",
        "imageUrl": "Choose a highly relevant Unsplash photo URL representing this breakfast, e.g. https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80",
        "calories": 250,
        "carbs": 30,
        "protein": 10,
        "fat": 5,
        "time": "08:00 AM",
        "glycemicImpact": "Low",
        "whyRecommended": "Explain why this is good for diabetes management.",
        "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity"],
        "cookingSteps": ["Step 1 description", "Step 2 description"],
        "prepTimeMinutes": 10
      },
      "lunch": {
        "name": "Meal name",
        "imageUrl": "Choose a highly relevant Unsplash photo URL representing this lunch, e.g. https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
        "calories": 450,
        "carbs": 45,
        "protein": 20,
        "fat": 10,
        "time": "01:30 PM",
        "glycemicImpact": "Low",
        "whyRecommended": "Explain why this is good for diabetes management.",
        "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity"],
        "cookingSteps": ["Step 1 description", "Step 2 description"],
        "prepTimeMinutes": 20
      },
      "snacks": {
        "name": "Meal name",
        "imageUrl": "Choose a highly relevant Unsplash photo URL representing this snack, e.g. https://images.unsplash.com/photo-1596560548464-f010689b7f4f?w=400&q=80",
        "calories": 100,
        "carbs": 12,
        "protein": 4,
        "fat": 3,
        "time": "05:00 PM",
        "glycemicImpact": "Low",
        "whyRecommended": "Explain why this is good for diabetes management.",
        "ingredients": ["Ingredient 1 with quantity"],
        "cookingSteps": ["Step 1 description"],
        "prepTimeMinutes": 5
      },
      "dinner": {
        "name": "Meal name",
        "imageUrl": "Choose a highly relevant Unsplash photo URL representing this dinner, e.g. https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
        "calories": 350,
        "carbs": 25,
        "protein": 18,
        "fat": 8,
        "time": "08:00 PM",
        "glycemicImpact": "Low",
        "whyRecommended": "Explain why this is good for diabetes management.",
        "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity"],
        "cookingSteps": ["Step 1 description", "Step 2 description"],
        "prepTimeMinutes": 25
      },
      "totalCalories": 1150
    }
  ]
}

Suggested Unsplash Images mapping guidelines:
- Oatmeal / Porridge: https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80
- Salad / Green Bowls: https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80
- Grilled Salmon / Fish: https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?w=400&q=80
- Paneer / Tofu dishes: https://images.unsplash.com/photo-1546069901-e234a49e63e2?w=400&q=80
- Nuts / Fruits snack: https://images.unsplash.com/photo-1596560548464-f010689b7f4f?w=400&q=80
- Eggs / Omelettes: https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80
- Quinoa / Brown Rice Bowls: https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80
- Soup / Broths: https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80
- General healthy food: https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80
- Tea / Herbal drink: https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80

Ensure you generate a complete 7-day schedule (Monday to Sunday) inside the "schedule" array. Every day MUST have different meals, different calorie distributions, and different ingredients to avoid repetitive plans. Make sure the JSON is valid and only return the JSON, no markdown formatting.`;

    const jsonResult = await generateJSON(prompt);
    if (!jsonResult) {
      throw new Error('Empty JSON response from Gemini');
    }
    return jsonResult;
  } catch (error) {
    console.warn('--- Diet Generator AI Falling Back ---');
    console.warn('Reason:', error.message);
    return getFallbackDietPlan(profile, calorieTarget, waterTargetLiters);
  }
};
