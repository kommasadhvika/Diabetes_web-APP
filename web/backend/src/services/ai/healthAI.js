import { generateJSON } from './geminiService.js';

const getFallbackHealthInsights = (profile, sugarLogs = [], waterLogs = [], exerciseLogs = []) => {
  let score = 75;
  let trendMsg = "Your blood sugar levels are being tracked. Maintain a consistent routine.";

  if (sugarLogs.length > 0) {
    const avg = sugarLogs.reduce((acc, log) => acc + log.value, 0) / sugarLogs.length;
    if (avg > 180) {
      score -= 10;
      trendMsg = `Average glucose is high (${Math.round(avg)} mg/dL). Add fiber to meals and walk post-meals.`;
    } else if (avg < 90) {
      score -= 5;
      trendMsg = `Average glucose is slightly low (${Math.round(avg)} mg/dL). Coordinate snack times with your doctor.`;
    } else {
      score += 5;
      trendMsg = `Average glucose is well managed (${Math.round(avg)} mg/dL). Keep up the steady monitoring.`;
    }
  }

  if (waterLogs.length > 0) {
    score += 5;
  }
  if (exerciseLogs.length > 0) {
    score += 5;
  }

  if (score > 100) score = 100;
  if (score < 20) score = 20;

  return {
    healthScore: score,
    trendMessage: trendMsg,
    tips: [
      "Drink a glass of water before each meal to promote hydration and satiety.",
      "Engage in 15 minutes of brisk walking within 30 minutes of completing lunch or dinner.",
      "Log your fasting glucose every morning to establish an baseline trend."
    ],
    dietSuggestions: [
      "Incorporate green leafy vegetables and high-fiber lentils to slow glucose release.",
      "Avoid simple sugars, processed snack bars, and sweetened beverages."
    ],
    exerciseSuggestions: [
      "Perform a post-meal walk for insulin-independent glucose clearance.",
      "Introduce light dumbbell resistance training twice a week if cleared by your doctor."
    ]
  };
};

export const generateHealthInsights = async (profile, sugarLogs = [], waterLogs = [], exerciseLogs = []) => {
  try {
    const prompt = `You are a clinical metabolic health specialist and endocrinology assistant.
Analyze the patient's biometric parameters and tracking history below to generate clinical recommendations, a trend alert message, and a refined overall health score (from 20 to 100).

Patient Profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Activity Level: ${profile.activityLevel}
- Diabetes Type: ${profile.diabetesType}
- Medical details: "${profile.medicalNotes}"

Glucose Readings (Last 10 logs):
${sugarLogs.slice(0, 10).map(l => `- Glucose: ${l.value} mg/dL (${l.type}) logged at ${l.createdAt}`).join('\n')}

Water Consumption (Last 5 logs):
${waterLogs.slice(0, 5).map(w => `- Hydration: ${w.intakeMl}mL logged on ${w.date}`).join('\n')}

Physical Exercise (Last 5 logs):
${exerciseLogs.slice(0, 5).map(e => `- Exercise: ${e.name} for ${e.durationMinutes} mins (burned ${e.caloriesBurned} kcal) logged at ${e.createdAt}`).join('\n')}

Requirements:
1. Formulate a refined overall "healthScore" (out of 100) that decreases with high glucose trends and sedentary activity, and increases with compliance in hydration and workouts.
2. Formulate a personalized "trendMessage" summarizing the patient's blood sugar logs, noting improvements or spikes.
3. Generate 3 personalized "tips" (actionable actions checklist).
4. Generate 2 "dietSuggestions" tailored to their profile and latest logs.
5. Generate 2 "exerciseSuggestions" matching their physical activity profile.

Format the response EXACTLY as a JSON object matching this structure:
{
  "healthScore": 82,
  "trendMessage": "Your blood sugar levels show slight postprandial elevations. Keep tracking and walk 15 mins post meal.",
  "tips": [
    "Tip 1...",
    "Tip 2...",
    "Tip 3..."
  ],
  "dietSuggestions": [
    "Suggestion 1...",
    "Suggestion 2..."
  ],
  "exerciseSuggestions": [
    "Suggestion 1...",
    "Suggestion 2..."
  ]
}

Return ONLY the valid JSON response, no markdown wrapping.`;

    const insights = await generateJSON(prompt);
    if (!insights) {
      throw new Error('Empty JSON response from Gemini');
    }
    return insights;
  } catch (error) {
    console.warn('--- Health Insights AI Falling Back ---');
    console.warn('Reason:', error.message);
    return getFallbackHealthInsights(profile, sugarLogs, waterLogs, exerciseLogs);
  }
};
