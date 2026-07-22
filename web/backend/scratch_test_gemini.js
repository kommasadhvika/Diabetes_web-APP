import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API key:', apiKey);

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('Sending test prompt to Gemini...');
  const result = await model.generateContent('Say hello');
  const response = await result.response;
  console.log('Gemini reply:', response.text());
} catch (error) {
  console.error('Gemini Test Script Failed!');
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
}
