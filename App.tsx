import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KeywordsInput from './components/KeywordsInput';
import DiaryDisplay from './components/DiaryDisplay';
import BottomNav from './components/BottomNav';
import MyDiariesView from './components/MyDiariesView';
import { GoogleGenAI } from '@google/genai';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

import { DiarySentence, DiaryEntry, GrammarCheckResult } from './types';
import { getDiaryGenerationConfig, getGrammarCheckConfig } from './utils/prompts';

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

      const { schema, prompt } = getDiaryGenerationConfig(keywords);

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