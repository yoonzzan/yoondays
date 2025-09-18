import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const DIARY_GENERATION_PROMPT = (keywords: string) => `You are a friendly and insightful English writing coach. Your goal is to help a user transform their daily keywords into a beautiful, natural-sounding diary entry. The user is an English learner who wants to see how their simple keywords can become a more expressive and vivid story.

Here are the user's keywords for the day: "${keywords}"

Your task is to:
1.  **Write an English diary entry (3-5 sentences):**
    *   Weave the keywords into a coherent and engaging narrative.
    *   Use rich but accessible vocabulary and varied sentence structures. The tone should be reflective and personal, like a real diary.
    *   Feel free to add small, logical details to make the story more vivid and complete.

2.  **Provide a natural Korean translation** for each English sentence.

Return the result as a single JSON array, where each object in the array contains an "englishSentence" and its corresponding "koreanSentence".`;

const DIARY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      englishSentence: { type: Type.STRING },
      koreanSentence: { type: Type.STRING },
    },
    required: ['englishSentence', 'koreanSentence'],
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { keywords } = req.body;

  if (!keywords) {
    return res.status(400).json({ error: 'Keywords are required.' });
  }

  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'API key is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: DIARY_GENERATION_PROMPT(keywords),
      config: { responseMimeType: 'application/json', responseSchema: DIARY_SCHEMA },
    });
    
    let sentences;
    try {
        sentences = JSON.parse(response.text.trim());
    } catch (parseError) {
        console.error('Failed to parse Gemini API response:', response.text);
        throw new Error('API returned invalid JSON format.');
    }

    return res.status(200).json(sentences);

  } catch (error) {
    console.error('Error in generate-diary handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: 'Failed to generate diary from API.', details: errorMessage });
  }
}
