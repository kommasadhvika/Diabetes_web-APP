import { generateText } from './geminiService.js';

const getFallbackWeeklySummaryText = (profile, stats) => {
  return `This weekly metabolic report summary has been compiled for ${profile.fullName || 'the patient'} (Diagnosis: ${profile.diabetesType || 'Type 2 Diabetes'}). Based on the logged metrics, the patient has recorded an average fasting glucose of ${stats.avgFasting || 'N/A'} mg/dL and an average post-meal glucose of ${stats.avgPostMeal || 'N/A'} mg/dL. The weekly logs demonstrate physical activity engagement totaling ${stats.totalExerciseMin || 0} minutes (burning approximately ${stats.totalCalBurned || 0} calories), alongside an average daily fluid intake of ${stats.avgWaterIntake || 0} mL. One clinic appointment was noted in this period.

To support insulin sensitivity and overall glycemic control, it is clinically recommended to maintain consistent post-meal walking regimens. High-fiber food options with a low glycemic index should remain central to daily meals, coupled with optimal hydration to assist kidney clearance. Please continue logging daily glucose and exercise readings. Adjustments to medication dosages or core schedules should only be undertaken in direct consultation with the primary care physician.`;
};

export const generateWeeklySummaryText = async (profile, stats) => {
  const prompt = `You are a clinic supervisor reviewing a patient's weekly logs. Write a professional, detailed 2-paragraph health compliance summary.
Patient profile: Name ${profile.fullName}, Diagnosis: ${profile.diabetesType}
Weekly stats:
- Average Fasting Glucose: ${stats.avgFasting || 'N/A'} mg/dL
- Average Post-Meal Glucose: ${stats.avgPostMeal || 'N/A'} mg/dL
- Total Physical Exercise Duration: ${stats.totalExerciseMin || 0} minutes
- Total Calories Burned: ${stats.totalCalBurned || 0} kcal
- Average Hydration Intake: ${stats.avgWaterIntake || 0} mL/day
- Scheduled Appointments: ${stats.appointmentsCount || 0}

Ensure the report includes advice on diet adjustments, checks compliance score, and maintains strict clinical professionalism.`;

  try {
    return await generateText(prompt);
  } catch (error) {
    console.warn('--- Report Summary AI Falling Back ---');
    console.warn('Reason:', error.message);
    return getFallbackWeeklySummaryText(profile, stats);
  }
};
