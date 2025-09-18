import { GoogleGenAI, Type } from '@google/genai';

// This function will be deployed as a serverless function on Vercel
export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { keywords } = await request.json();

  if (!keywords) {
    return new Response(JSON.stringify({ error: 'Keywords are required.' }), {
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

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: DIARY_GENERATION_PROMPT(keywords),
      config: { responseMimeType: 'application/json', responseSchema: DIARY_SCHEMA },
    });
    const resultText = response.text.trim();
    const sentences = JSON.parse(resultText);

    return new Response(JSON.stringify(sentences), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate diary from API.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}