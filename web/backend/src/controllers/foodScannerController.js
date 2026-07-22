import { db } from '../config/db.js';
import { generateVision, isMockAI } from '../services/ai/geminiService.js';
import { emitToUser } from '../config/socket.js';

// @desc    Scan food image and return nutrition analysis
// @route   POST /api/food-scanner/scan
export const scanFoodImage = async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a food image' });
  }

  try {
    const prompt = `You are a clinical nutrition AI assistant specialized in diabetes-friendly diet scanning.
Analyze this food image and return a JSON object with the following fields:
{
  "foodName": "Name of the food identified",
  "calories": 350,
  "carbsGrams": 45,
  "proteinGrams": 15,
  "fatGrams": 10,
  "glycemicIndex": 65,
  "glycemicLoad": 15,
  "diabeticSuitability": "Excellent" | "Moderate" | "Avoid",
  "clinicalAnalysis": "A brief explanation of why this food is suitable or not for a diabetic patient.",
  "healthyAlternatives": [
    "Alternative meal option 1",
    "Alternative meal option 2"
  ]
}
Return ONLY a valid JSON object matching the schema above. Do not include markdown code block syntax (like \`\`\`json) or additional conversational text in your output, just the raw JSON.`;

    const mimeType = req.file.mimetype;
    const imageBuffer = req.file.buffer;

    let analysisResult = null;
    let rawText = '';

    try {
      rawText = await generateVision(imageBuffer, mimeType, prompt);
      
      // Clean markdown JSON delimiters if present
      let cleanedText = rawText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      analysisResult = JSON.parse(cleanedText);
    } catch (err) {
      console.error('Error parsing Gemini Vision response:', err.message);
      console.log('Raw response was:', rawText);
      return res.status(500).json({
        success: false,
        message: `Gemini Vision analysis failed: ${err.message}. Raw output: ${rawText ? rawText.slice(0, 150) : ''}`
      });
    }

    if (!analysisResult) {
      return res.status(500).json({ success: false, message: 'Failed to parse food image composition results.' });
    }

    // Save scan results to Firestore
    const scanRef = db.collection('FoodScans').doc();
    const newScan = {
      id: scanRef.id,
      userId,
      imageUrl: 'data:' + mimeType + ';base64,' + imageBuffer.toString('base64'),
      analysis: analysisResult,
      createdAt: new Date().toISOString()
    };
    await scanRef.set(newScan);

    // Gamification hook: award 25 XP for scanning a meal!
    import('../utils/gamification.js').then(async ({ awardXp, trackStreak }) => {
      await awardXp(userId, 25, 'Food image scanned');
      await trackStreak(userId, 'food_scan');
    }).catch(err => console.error('Gamification food scan error:', err));

    // Emit Socket event to user
    emitToUser(userId, 'foodScanned', newScan);

    res.status(200).json({
      success: true,
      scan: newScan
    });
  } catch (error) {
    console.error('Scan food image error:', error.message);
    res.status(500).json({ success: false, message: 'Server error analyzing food image' });
  }
};

// @desc    Get user scan history
// @route   GET /api/food-scanner/history
export const getScanHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const scansSnap = await db.collection('FoodScans')
      .where('userId', '==', userId)
      .get();

    const scans = [];
    scansSnap.forEach(doc => {
      scans.push(doc.data());
    });

    scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: scans.length,
      scans
    });
  } catch (error) {
    console.error('Get scan history error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving scan history' });
  }
};
