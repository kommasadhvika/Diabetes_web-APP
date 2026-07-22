import { generateText, isMockAI } from './geminiService.js';

export const getChatbotResponse = async (message, historyList = [], profile = null, sugarLogs = []) => {
  let bmi = 'N/A';
  let profileSummary = 'Patient profile parameters are incomplete.';

  if (profile) {
    if (profile.height && profile.weight) {
      const heightM = profile.height / 100;
      bmi = (profile.weight / (heightM * heightM)).toFixed(1);
    }
    profileSummary = `Patient details: Name: ${profile.fullName}, Age: ${profile.age}, Gender: ${profile.gender}, Height: ${profile.height}cm, Weight: ${profile.weight}kg, BMI: ${bmi}, Activity Level: ${profile.activityLevel}, Diabetes Type: ${profile.diabetesType}, Diagnosis notes: "${profile.medicalNotes}".`;
  }

  const recentGlucose = sugarLogs.length > 0
    ? `Recent Blood Sugar logs: ${sugarLogs.slice(0, 5).map(log => `${log.value} mg/dL (${log.type}) logged at ${log.createdAt}`).join(', ')}.`
    : 'No blood glucose logs recorded yet.';

  // Construct system instructions
  const systemPrompt = `You are "DiaPredict AI Advisor", a world-class clinical endocrinology AI chatbot specialized in diabetes management.
Guidelines:
1. Tailor your answers directly to the user's specific biometrics (Age, Weight, BMI), activity, and glucose parameters provided below.
2. Keep responses highly actionable, scientific, clear, and empathetic.
3. PERSONALIZATION RULES:
   - For Diet/Nutrition questions: focus on Low-GI items, meal options, carb counting, and portions based on BMI (${bmi}) and Diabetes Type.
   - For Exercise/Fitness questions: focus on insulin-independent glucose clearance mechanisms (like post-meal brisk walking) matching their activity level.
   - For Medication/Insulin questions: provide clinical guidelines, explaining mechanisms, but warn against changing dosages without MD oversight.
   - For Blood Glucose questions: review the sugar logs list provided below, analyze the logs trends, and give targeted clinical explanations.
4. IMPORTANT: Always include a friendly medical disclaimer at the bottom of your answer stating that your inputs are informational and they should coordinate with their doctor.

Context:
${profileSummary}
${recentGlucose}

Chat History:
${historyList.slice(-8).map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.message}`).join('\n')}
User: ${message}
Assistant:`;

  try {
    return await generateText(systemPrompt);
  } catch (error) {
    console.warn('--- Chatbot AI Failure, Falling Back ---');
    console.warn('Reason:', error.message);
    
    return `Hello! I am your DiaPredict AI Advisor. I am currently running in offline developer mode. 
Based on your query, here are some general diabetes management guidelines:
- Diet: Focus on low glycemic index foods (like leafy greens, lentils, quinoa, oats) and avoid refined sugars/carbs.
- Exercise: Brisk walking for 15-30 minutes after meals is highly effective for lowering post-meal blood sugar levels.
- Hydration: Proper hydration helps the body clear excess glucose through the kidneys.

Disclaimer: This information is for educational purposes only. Always consult your healthcare provider or endocrinologist before making changes to your treatment plan or diet.`;
  }
};
