import { GoogleGenAI } from '@google/genai';
import { getDiaryGenerationConfig, getGrammarCheckConfig } from '../utils/prompts';
import { DiarySentence, GrammarCheckResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn('API key is not configured. Please check your .env.local file.');
}

const ai = new GoogleGenAI({ apiKey });

export const generateDiary = async (keywords: string, level: 'beginner' | 'advanced'): Promise<DiarySentence[]> => {
    if (!apiKey) throw new Error('API key is missing.');

    const { schema, prompt } = getDiaryGenerationConfig(keywords, level);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
        },
    });

    const resultText = response.text?.trim();
    if (!resultText) {
        throw new Error('No text generated.');
    }

    const result = JSON.parse(resultText);

    if (result.sentences && Array.isArray(result.sentences)) {
        return result.sentences;
    } else {
        throw new Error('Invalid response format from API.');
    }
};

export const checkGrammar = async (sentence: string): Promise<GrammarCheckResult> => {
    if (!apiKey) throw new Error('API key is missing.');

    const { schema, prompt } = getGrammarCheckConfig(sentence);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
        },
    });

    const resultText = response.text?.trim();
    if (!resultText) {
        throw new Error('No feedback generated.');
    }

    return JSON.parse(resultText);
};
