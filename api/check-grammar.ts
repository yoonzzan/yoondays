import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { text } = await request.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text to check is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (!process.env.API_KEY) {
    return new Response(JSON.stringify({ error: 'API key is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GRAMMAR_CHECK_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      isCorrect: { type: Type.BOOLEAN },
      feedback: { type: Type.STRING },
      correctedSentence: { type: Type.STRING },
    },
    required: ['isCorrect', 'feedback', 'correctedSentence'],
  };
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `As an expert English grammar checker for a Korean learner, analyze: "${text}". Provide feedback in a JSON object.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: GRAMMAR_CHECK_SCHEMA },
    });
    const result = JSON.parse(response.text.trim());
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calling Gemini API for grammar check:', error);
    return new Response(JSON.stringify({ error: 'Failed to check grammar from API.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}