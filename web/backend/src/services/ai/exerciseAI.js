import { generateJSON } from './geminiService.js';

const getFallbackExercisePlan = (profile) => {
  const weeklyPlan = {
    "Monday": [
      {
        "name": "Post-Meal Brisk Walk",
        "duration": 25,
        "repetitions": "1 session",
        "caloriesBurned": 110,
        "difficulty": "Easy",
        "imageUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=brisk+walk+tutorial",
        "youtubeId": ""
      }
    ],
    "Tuesday": [
      {
        "name": "Full Body Stretching",
        "duration": 15,
        "repetitions": "1 session",
        "caloriesBurned": 50,
        "difficulty": "Easy",
        "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=body+stretching+for+diabetes",
        "youtubeId": ""
      }
    ],
    "Wednesday": [
      {
        "name": "Post-Dinner Brisk Walk",
        "duration": 25,
        "repetitions": "1 session",
        "caloriesBurned": 110,
        "difficulty": "Easy",
        "imageUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=brisk+walk+tutorial",
        "youtubeId": ""
      }
    ],
    "Thursday": [
      {
        "name": "Light Dumbbell / Shoulder Work",
        "duration": 20,
        "repetitions": "3 sets of 10 reps",
        "caloriesBurned": 90,
        "difficulty": "Medium",
        "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=dumbbell+shoulder+workout",
        "youtubeId": ""
      }
    ],
    "Friday": [
      {
        "name": "Active Yoga Flow",
        "duration": 20,
        "repetitions": "1 session",
        "caloriesBurned": 80,
        "difficulty": "Easy",
        "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=yoga+for+diabetes+control",
        "youtubeId": ""
      }
    ],
    "Saturday": [
      {
        "name": "Gentle Cycling / Spin",
        "duration": 20,
        "repetitions": "1 session",
        "caloriesBurned": 130,
        "difficulty": "Medium",
        "imageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=stationary+cycling+tips",
        "youtubeId": ""
      }
    ],
    "Sunday": [
      {
        "name": "Bodyweight Squats & Core",
        "duration": 15,
        "repetitions": "3 sets of 12 squats",
        "caloriesBurned": 85,
        "difficulty": "Medium",
        "imageUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=bodyweight+squats+form",
        "youtubeId": ""
      }
    ]
  };

  return {
    userId: profile.userId || '',
    weeklyPlan
  };
};

export const generateWeeklyExercisePlan = async (profile, latestSugarReading = null) => {
  const heightM = profile.height / 100;
  const bmi = (profile.weight / (heightM * heightM)).toFixed(1);

  try {
    const prompt = `You are a clinical diabetic exercise physiologist. Create a personalized, 7-day physical workout plan (from Monday to Sunday) for a patient with:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- BMI: ${bmi}
- Activity Level: ${profile.activityLevel}
- Diabetes Type / Diet Preference: ${profile.diabetesType}
- Medical details: "${profile.medicalNotes}"
${latestSugarReading ? `- Latest Blood Sugar reading: ${latestSugarReading.value} mg/dL (${latestSugarReading.type})` : ''}

Generate a schedule where each day has 1-2 exercises tailored to their biometrics and diabetes type. 
For every exercise include:
1. Exercise Name (be specific, e.g. "Post-Meal Brisk Walk", "Bodyweight squats")
2. Duration (in minutes)
3. Repetitions / Sets info (e.g. "3 sets of 12 reps" or "1 continuous session")
4. Calories Burned (an estimate based on weight and exercise type)
5. Difficulty Level (Easy, Medium, Hard)
6. Image URL (choose a highly relevant Unsplash photo URL representing this exercise, e.g. https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80)
7. Video tutorial link or YouTube search link.

Format the response EXACTLY as a JSON object matching this structure:
{
  "userId": "${profile.userId}",
  "weeklyPlan": {
    "Monday": [
      {
        "name": "Brisk Walk",
        "duration": 20,
        "repetitions": "1 session",
        "caloriesBurned": 120,
        "difficulty": "Easy",
        "imageUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80",
        "videoUrl": "https://www.youtube.com/results?search_query=brisk+walk+tutorial",
        "youtubeId": ""
      }
    ],
    "Tuesday": [ ... ],
    "Wednesday": [ ... ],
    "Thursday": [ ... ],
    "Friday": [ ... ],
    "Saturday": [ ... ],
    "Sunday": [ ... ]
  }
}

Suggested Unsplash Images mapping guidelines:
- Walking/running: https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80
- Squats/Strength: https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80
- Cycling/Spin: https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80
- Stretching/Yoga: https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80
- Shoulder/dumbbell work: https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80

Ensure the JSON is valid and only return the JSON, no markdown formatting. Make sure the workout difficulty matches their biometrics and age (e.g., gentler workouts if age is high or BMI indicates heavy load).`;

    const jsonResult = await generateJSON(prompt);
    if (!jsonResult) {
      throw new Error('Empty JSON response from Gemini');
    }
    return jsonResult;
  } catch (error) {
    console.warn('--- Exercise Planner AI Falling Back ---');
    console.warn('Reason:', error.message);
    return getFallbackExercisePlan(profile);
  }
};
