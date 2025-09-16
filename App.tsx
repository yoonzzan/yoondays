import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KeywordsInput from './components/KeywordsInput';
import DiaryDisplay from './components/DiaryDisplay';
import BottomNav from './components/BottomNav';
import MyDiariesView from './components/MyDiariesView';
import { GoogleGenAI, Type } from '@google/genai';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

interface DiaryEntry {
  date: string; // Storing date as 'YYYY-MM-DD' string for consistency
  englishDiary: string;
  koreanDiary: string;
}

interface GrammarCheckResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence: string;
}

const App: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [englishDiary, setEnglishDiary] = useState('');
  const [koreanDiary, setKoreanDiary] = useState('');
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
    if (!englishDiary || !koreanDiary) return;

    // Use 'en-CA' locale to get YYYY-MM-DD format reliably
    const dateKey = new Date().toLocaleDateString('en-CA');

    const newEntry: DiaryEntry = {
        date: dateKey,
        englishDiary,
        koreanDiary,
    };

    setDiaries(prevDiaries => {
        const existingIndex = prevDiaries.findIndex(d => d.date === dateKey);

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
    
    if (!process.env.API_KEY) {
      setError('API key is not configured.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setEnglishDiary('');
    setKoreanDiary('');
    setGrammarCheckResult(null); // Reset grammar check on new generation

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const schema = {
        type: Type.OBJECT,
        properties: {
          englishDiary: {
            type: Type.STRING,
            description: 'A short diary entry in simple English (3-4 sentences) based on the keywords. Suitable for an English learner.',
          },
          koreanDiary: {
            type: Type.STRING,
            description: 'A natural Korean translation of the English diary entry.',
          },
        },
        required: ['englishDiary', 'koreanDiary'],
      };

      const prompt = `You are a friendly and insightful English writing coach. Your goal is to help a user transform their daily keywords into a beautiful, natural-sounding diary entry. The user is an English learner who wants to see how their simple keywords can become a more expressive and vivid story.

Here are the user's keywords for the day: "${keywords}"

Your task is to:
1.  **Write an English diary entry (3-5 sentences):**
    *   Weave the keywords into a coherent and engaging narrative.
    *   Use rich but accessible vocabulary and varied sentence structures. The tone should be reflective and personal, like a real diary.
    *   Feel free to add small, logical details to make the story more vivid and complete.

2.  **Provide a natural Korean translation** of the English entry.

Return the result as a single JSON object.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const resultText = response.text.trim();
      const result = JSON.parse(resultText);

      if (result.englishDiary && result.koreanDiary) {
        setEnglishDiary(result.englishDiary);
        setKoreanDiary(result.koreanDiary);
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

  const handleGrammarCheck = async () => {
    if (!englishDiary || !process.env.API_KEY) return;
    
    setIsCheckingGrammar(true);
    setGrammarCheckResult(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const schema = {
        type: Type.OBJECT,
        properties: {
          isCorrect: {
            type: Type.BOOLEAN,
            description: "Is the sentence grammatically correct?",
          },
          feedback: {
            type: Type.STRING,
            description: "If incorrect, explain the error simply. If correct, say 'Grammar looks good!'.",
          },
          correctedSentence: {
            type: Type.STRING,
            description: "If incorrect, provide the corrected sentence. If correct, return the original sentence.",
          },
        },
        required: ['isCorrect', 'feedback', 'correctedSentence'],
      };

      const prompt = `You are an expert English grammar checker. Analyze the following sentence for a Korean English learner.
Sentence: "${englishDiary}"
Provide your feedback in a JSON object.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });
      
      const result = JSON.parse(response.text.trim());
      setGrammarCheckResult(result);

    } catch (err) {
      console.error('Error checking grammar:', err);
      setError('Sorry, an error occurred while checking grammar.');
    } finally {
      setIsCheckingGrammar(false);
    }
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
                englishDiary={englishDiary}
                koreanDiary={koreanDiary}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
                isGenerating={isGenerating}
                onGrammarCheck={handleGrammarCheck}
                grammarCheckResult={grammarCheckResult}
                isCheckingGrammar={isCheckingGrammar}
              />
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={handleSaveDiary}
              disabled={!englishDiary || isGenerating}
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