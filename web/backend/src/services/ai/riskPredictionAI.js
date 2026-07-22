import { generateJSON } from './geminiService.js';

const getFallbackHealthRisks = (profile, sugarLogs = []) => {
  let hyperLevel = "Medium";
  let hypoLevel = "Low";
  let confHyper = 75;
  let confHypo = 70;
  let hyperExplanation = "Glucose levels are moderate. Regular tracking is recommended to catch spikes.";
  let hypoExplanation = "No frequent hypoglycemic levels detected under current logs.";

  if (sugarLogs.length > 0) {
    const highReadings = sugarLogs.filter(log => log.value > 160).length;
    const lowReadings = sugarLogs.filter(log => log.value < 70).length;

    if (highReadings > sugarLogs.length * 0.3) {
      hyperLevel = "High";
      confHyper = 85;
      hyperExplanation = "Multiple readings above 160 mg/dL indicate elevated post-meal or random glucose risks.";
    }
    if (lowReadings > 0) {
      hypoLevel = "Medium";
      confHypo = 80;
      hypoExplanation = "Glucose readings dropping below 70 mg/dL present an active concern.";
    }
  }

  return {
    diabetesRisk: {
      level: profile.diabetesType === "Pre-diabetes" ? "Medium" : "High",
      confidenceScore: 80,
      explanation: `Patient is diagnosed with ${profile.diabetesType || 'Diabetes'}. Management focus remains on metabolic stabilization.`,
      prevention: ["Maintain dietary portion control", "Record glucose levels before and after meals"]
    },
    hyperglycemiaRisk: {
      level: hyperLevel,
      confidenceScore: confHyper,
      explanation: hyperExplanation,
      prevention: ["Increase hydration intake when readings spike", "Engage in post-prandial aerobic activities"]
    },
    hypoglycemiaRisk: {
      level: hypoLevel,
      confidenceScore: confHypo,
      explanation: hypoExplanation,
      prevention: ["Keep quick-acting glucose resources on hand", "Monitor levels closely before intense exercises"]
    }
  };
};

export const predictHealthRisks = async (profile, sugarLogs = []) => {
  try {
    const prompt = `You are a clinical diabetes data analyst. Analyze this patient's profile and glucose logs history to calculate clinical risks:
- Age: ${profile.age}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Activity: ${profile.activityLevel}
- Type: ${profile.diabetesType}
- Medical details: "${profile.medicalNotes}"
- Glucose Logs: ${sugarLogs.slice(0, 15).map(log => `${log.value} mg/dL (${log.type}) at ${log.createdAt}`).join(', ')}

Format the response EXACTLY as a JSON object matching this structure:
{
  "diabetesRisk": {
    "level": "Low or Medium or High",
    "confidenceScore": 85,
    "explanation": "Brief description of factors...",
    "prevention": ["Action 1", "Action 2"]
  },
  "hyperglycemiaRisk": {
    "level": "Low or Medium or High",
    "confidenceScore": 90,
    "explanation": "Review of high blood sugar frequency...",
    "prevention": ["Drink water", "Saunter walks"]
  },
  "hypoglycemiaRisk": {
    "level": "Low or Medium or High",
    "confidenceScore": 75,
    "explanation": "Review of low blood sugar frequency...",
    "prevention": ["Carry fruit juice", "Check glucose before sleep"]
  }
}

Ensure the JSON is valid, only return the JSON, no markdown formatting.`;

    const result = await generateJSON(prompt);
    if (!result) {
      throw new Error('Empty JSON response from Gemini');
    }
    return result;
  } catch (error) {
    console.warn('--- Risk Predictor AI Falling Back ---');
    console.warn('Reason:', error.message);
    return getFallbackHealthRisks(profile, sugarLogs);
  }
};
