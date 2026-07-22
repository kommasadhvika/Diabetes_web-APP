import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Successfully initialized Google Gemini API client.');
  } catch (error) {
    console.error('Error initializing Google Gemini client:', error.message);
  }
} else {
  console.error('GEMINI_API_KEY environment variable missing or empty.');
}

// Convert buffer to generative part object for Gemini Vision
const bufferToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    },
  };
};

// @desc    Generate text response from Gemini
export const generateText = async (prompt) => {
  if (!genAI) {
    throw new Error('Google Gemini API client is not initialized. Please configure a valid GEMINI_API_KEY.');
  }

  console.log('--- Gemini generateText Request Payload ---');
  console.log('Prompt:', prompt);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('--- Gemini generateText Response Payload ---');
    console.log('Text:', text);
    return text;
  } catch (error) {
    console.error('--- Gemini generateText API Failure ---');
    console.error('Error details:', error.message);
    throw error;
  }
};

// @desc    Generate structured JSON response from Gemini
export const generateJSON = async (prompt) => {
  if (!genAI) {
    throw new Error('Google Gemini API client is not initialized. Please configure a valid GEMINI_API_KEY.');
  }

  console.log('--- Gemini generateJSON Request Payload ---');
  console.log('Prompt:', prompt);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('--- Gemini generateJSON Response Payload ---');
    console.log('Text:', text);
    return JSON.parse(text);
  } catch (error) {
    console.error('--- Gemini generateJSON API Failure ---');
    console.error('Error details:', error.message);
    throw error;
  }
};

// @desc    Analyze image using Gemini Vision
export const generateVision = async (imageBuffer, mimeType, prompt) => {
  if (!genAI) {
    throw new Error('Google Gemini API client is not initialized. Please configure a valid GEMINI_API_KEY.');
  }

  console.log('--- Gemini generateVision Request Payload ---');
  console.log('Prompt:', prompt);
  console.log('Image mimeType:', mimeType);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const imagePart = bufferToGenerativePart(imageBuffer, mimeType);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('--- Gemini generateVision Response Payload ---');
    console.log('Text:', text);
    return text;
  } catch (error) {
    console.error('--- Gemini generateVision API Failure ---');
    console.error('Error details:', error.message);
    throw error;
  }
};

export const isMockAI = false;
export default genAI;

