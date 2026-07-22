import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  console.log('Sending test prompt to gemini-2.5-flash...');
  const result = await model.generateContent('Say hello');
  const response = await result.response;
  console.log('Gemini 2.5 flash reply:', response.text());
} catch (error) {
  console.error('Gemini 2.5 flash test failed:', error.message);
}
