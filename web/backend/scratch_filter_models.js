import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

try {
  let url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const json = await response.json();
  if (json.models) {
    const geminiModels = json.models
      .map(m => m.name)
      .filter(name => name.toLowerCase().includes('gemini'));
    console.log('Available Gemini Models:', geminiModels);
  } else {
    console.log('No models key found in response:', json);
  }
} catch (error) {
  console.error('Failed to list Gemini models:', error);
}
