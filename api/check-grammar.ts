import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const GRAMMAR_CHECK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN },
    feedback: { type: Type.STRING },
    correctedSentence: { type: Type.STRING },
  },
  required: ['isCorrect', 'feedback', 'correctedSentence'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text to check is required.' });
  }
  
  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'API key is not configured.' });
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `As an expert English grammar checker for a Korean learner, analyze: "${text}". Provide feedback in a JSON object.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: GRAMMAR_CHECK_SCHEMA },
    });

    let result;
    try {
        result = JSON.parse(response.text.trim());
    } catch (parseError) {
        console.error('Failed to parse Gemini API grammar response:', response.text);
        throw new Error('Grammar check API returned invalid JSON format.');
    }
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in check-grammar handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: 'Failed to check grammar from API.', details: errorMessage });
  }
}
