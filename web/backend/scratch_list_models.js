import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

try {
  // Let's try listing the models or calling another method
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const json = await response.json();
  console.log('API Response status:', response.status);
  console.log('API Response body:', JSON.stringify(json, null, 2));
} catch (error) {
  console.error('List models failed:', error);
}
