import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KeywordsInput from './components/KeywordsInput';
import DiaryDisplay from './components/DiaryDisplay';
import BottomNav from './components/BottomNav';
import MyDiariesView from './components/MyDiariesView';
import { GoogleGenAI, Type } from '@google/genai';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

interface DiarySentence {
  english: string;
  korean: string;
}

interface DiaryEntry {
  date: string; // Storing date as 'YYYY-MM-DD' string for consistency
  sentences: DiarySentence[];
}

interface GrammarCheckResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence: string;
}

const App: React.FC = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [keywords, setKeywords] = useState('');
  const [diarySentences, setDiarySentences] = useState<DiarySentence[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'today' | 'myDiaries'>('today');
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [grammarCheckResult, setGrammarCheckResult] = useState<GrammarCheckResult | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);

  // Load diaries from localStorage on mount
  useEffect(() => {
    try {
      const savedDiaries = localStorage.getItem('myEnglishDayDiaries');
      if (savedDiaries) {
        setDiaries(JSON.parse(savedDiaries));
      }
    } catch (e) {
      console.error("Failed to load diaries from local storage", e);
    }
  }, []);

  // Save diaries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('myEnglishDayDiaries', JSON.stringify(diaries));
    } catch (e) {
      console.error("Failed to save diaries to local storage", e);
    }
  }, [diaries]);

  const handleSaveDiary = () => {
    if (diarySentences.length === 0) return;

    // Use 'en-CA' locale to get YYYY-MM-DD format reliably
    const dateKey = new Date().toLocaleDateString('en-CA');

    const newEntry: DiaryEntry = {
      date: dateKey,
      sentences: diarySentences,
    };

    setDiaries((prevDiaries: DiaryEntry[]) => {
      const existingIndex = prevDiaries.findIndex((d: DiaryEntry) => d.date === dateKey);

      if (existingIndex !== -1) {
        const updatedDiaries = [...prevDiaries];
        updatedDiaries[existingIndex] = newEntry;
        return updatedDiaries;
      } else {
        // Add new entries to the beginning, but sort by date descending
        const sortedDiaries = [newEntry, ...prevDiaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sortedDiaries;
      }
    });

    setToastMessage('Diary entry saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateDiary = async () => {
    if (!keywords.trim()) {
      setError('Please enter some keywords.');
      return;
    }

    if (!apiKey) {
      setError('API key is not configured. Please check your .env.local file.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDiarySentences([]);
    setGrammarCheckResult(null); // Reset grammar check on new generation

    try {
      const ai = new GoogleGenAI({ apiKey });

      const schema = {
        type: Type.OBJECT,
        properties: {
          sentences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                english: {
                  type: Type.STRING,
                  description: "A single sentence of the diary entry in English.",
                },
                korean: {
                  type: Type.STRING,
                  description: "The Korean translation of the English sentence.",
                },
              },
              required: ["english", "korean"],
            },
          },
        },
        required: ['sentences'],
      };

      const prompt = `You are a warm, sophisticated British English writing coach. Your goal is to help a user transform their daily keywords into a beautiful, natural-sounding diary entry in British English. The user is an English learner.

Here are the user's keywords for the day: "${keywords}"

Your task is to:
1.  **Write a British English diary entry (7-10 sentences):**
    *   Weave the keywords into a coherent and engaging narrative.
    *   **Crucial:** Use British spelling (e.g., 'colour', 'realise', 'centre') and vocabulary (e.g., 'flat', 'lift', 'biscuit', 'holiday').
    *   Use rich but accessible vocabulary and varied sentence structures.
    *   The tone should be reflective, personal, and slightly witty if appropriate.

2.  **Provide a natural Korean translation** for each sentence.

Return the result as a JSON object containing an array of sentence pairs.`;

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
        setDiarySentences(result.sentences);
      } else {
        throw new Error('Invalid response format from API.');
      }
    } catch (err) {
      console.error('Error generating diary:', err);
      setError('Sorry, something went wrong while generating the diary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrammarCheck = async (sentence: string) => {
    if (!sentence || !apiKey) return;

    setIsCheckingGrammar(true);
    setGrammarCheckResult(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const schema = {
        type: Type.OBJECT,
        properties: {
          isCorrect: {
            type: Type.BOOLEAN,
            description: "Is the sentence grammatically correct?",
          },
          feedback: {
            type: Type.STRING,
            description: "A detailed commentary in Korean, but teaching British English concepts. If incorrect, explain the error in Korean. If correct, praise specific British features in Korean and suggest a 'level-up' sophisticated alternative phrasing.",
          },
          correctedSentence: {
            type: Type.STRING,
            description: "If incorrect, provide the corrected sentence. If correct, return the original sentence.",
          },
        },
        required: ['isCorrect', 'feedback', 'correctedSentence'],
      };

      const prompt = `You are a sophisticated and encouraging British English teacher. Your student is a Korean speaker learning British English.
Your task is to provide a "Deep Dive" analysis of the following sentence.

Sentence: "${sentence}"

Since this sentence was likely generated by an AI written in British English, it is probably grammatically correct.
**Your Main Goal is NOT just to find errors, but to TEACH and ELEVATE.**

1.  **If the sentence is correct**:
    *   **isCorrect**: true
    *   **feedback**: Praise specific British elements (e.g., "Splendid use of 'pavement'!"). **Crucially, offer a variation.** "To sound even more like a Londoner, you might also say: '[Alternative Refined Sentence]'."
    *   **correctedSentence**: The original sentence (since it's correct).

2.  **If the sentence has errors**:
    *   **isCorrect**: false
    *   **feedback**: Explain the error politely in a British manner.
    *   **correctedSentence**: The corrected version.

Return in JSON format only.

**IMPORTANT:** The \`feedback\` field MUST be written in **Korean** (한국어). The \`correctedSentence\` remains in English.

Example Feedback (Korean): "문법적으로 완벽합니다! 특히 'flat'이라는 단어를 사용해서 영국적인 느낌을 잘 살렸네요. 만약 조금 더 격식 있게 표현하고 싶다면 이렇게 말해볼 수도 있어요..."`;

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
      const result = JSON.parse(resultText);
      setGrammarCheckResult(result);

    } catch (err) {
      console.error('Error checking grammar:', err);
      setError('Sorry, an error occurred while checking grammar.');
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const handleCloseGrammarCheck = () => {
    setGrammarCheckResult(null);
    setIsCheckingGrammar(false);
  };

  const renderContent = () => {
    if (activeTab === 'today') {
      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <KeywordsInput
              keywords={keywords}
              setKeywords={setKeywords}
              onGenerate={handleGenerateDiary}
              isGenerating={isGenerating}
            />
            <div className="flex flex-col">
              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
              <DiaryDisplay
                diarySentences={diarySentences}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
                isGenerating={isGenerating}
                onGrammarCheck={handleGrammarCheck}
                onCloseGrammarCheck={handleCloseGrammarCheck}
                grammarCheckResult={grammarCheckResult}
                isCheckingGrammar={isCheckingGrammar}
              />
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={handleSaveDiary}
              disabled={diarySentences.length === 0 || isGenerating}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
            >
              Save Entry
            </button>
          </div>
        </>
      );
    }

    if (activeTab === 'myDiaries') {
      return <MyDiariesView diaries={diaries} speechRate={speechRate} setSpeechRate={setSpeechRate} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-up z-50">
          <CheckCircleIcon />
          <span className="ml-2 font-medium">{toastMessage}</span>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;