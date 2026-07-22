import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function testModel() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    console.log('Sending test prompt to gemini-2.5-flash-lite...');
    const result = await model.generateContent('Say hello! Tell me if you are functioning properly.');
    const response = await result.response;
    console.log('Gemini 2.0 flash reply:', response.text());
  } catch (error) {
    console.error('Gemini 2.0 flash test failed:', error.message);
  }
}

testModel();
