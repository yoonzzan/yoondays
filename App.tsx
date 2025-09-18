import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KeywordsInput from './components/KeywordsInput';
import DiaryDisplay from './components/DiaryDisplay';
import BottomNav from './components/BottomNav';
import MyDiariesView from './components/MyDiariesView';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

// --- Type Definitions ---
export interface SentencePair {
  englishSentence: string;
  koreanSentence: string;
}

export interface DiaryEntry {
  date: string; // Storing date as 'YYYY-MM-DD' string
  sentences: SentencePair[];
}

export interface GrammarCheckResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence: string;
}

// --- API Service Logic (Client-Side) ---
const generateDiarySentences = async (keywords: string): Promise<SentencePair[]> => {
  const response = await fetch('/api/generate-diary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate diary.');
  }

  const sentences = await response.json();
  if (Array.isArray(sentences) && sentences.length > 0) {
    return sentences;
  }
  throw new Error('Invalid response format from server.');
};

// --- Main App Component ---
const App: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [activeSentences, setActiveSentences] = useState<SentencePair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'today' | 'myDiaries'>('today');
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedDiariesRaw = localStorage.getItem('myEnglishDayDiaries');
      if (savedDiariesRaw) {
        const parsedDiaries: DiaryEntry[] = JSON.parse(savedDiariesRaw);
        if (Array.isArray(parsedDiaries)) setDiaries(parsedDiaries);
      }
    } catch (e) {
      console.error("Failed to load diaries from local storage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('myEnglishDayDiaries', JSON.stringify(diaries));
    } catch (e) {
      console.error("Failed to save diaries to local storage", e);
    }
  }, [diaries]);

  const handleSaveDiary = useCallback(() => {
    if (activeSentences.length === 0) return;
    const dateKey = new Date().toLocaleDateString('en-CA');
    const newEntry: DiaryEntry = { date: dateKey, sentences: activeSentences };
    setDiaries(prevDiaries => {
      const existingIndex = prevDiaries.findIndex(d => d.date === dateKey);
      const updatedDiaries = existingIndex !== -1 ? [...prevDiaries] : [newEntry, ...prevDiaries];
      if (existingIndex !== -1) updatedDiaries[existingIndex] = newEntry;
      return updatedDiaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    setToastMessage('Diary entry saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  }, [activeSentences]);

  const handleGenerateDiary = useCallback(async () => {
    if (!keywords.trim()) {
      setError('Please enter some keywords.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setActiveSentences([]);
    try {
      const sentences = await generateDiarySentences(keywords);
      setActiveSentences(sentences);
    } catch (err) {
      console.error('Error generating diary:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  }, [keywords]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <KeywordsInput {...{ keywords, setKeywords, onGenerate: handleGenerateDiary, isGenerating }} />
              <div className="flex flex-col">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
                <DiaryDisplay {...{ diarySentences: activeSentences, speechRate, setSpeechRate, isGenerating }} />
              </div>
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={handleSaveDiary}
                disabled={activeSentences.length === 0 || isGenerating}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
              >
                Save Entry
              </button>
            </div>
          </>
        );
      case 'myDiaries':
        return <MyDiariesView {...{ diaries, speechRate, setSpeechRate }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">{renderContent()}</main>
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-up z-50">
          <CheckCircleIcon />
          <span className="ml-2 font-medium">{toastMessage}</span>
        </div>
      )}
      <BottomNav {...{ activeTab, setActiveTab }} />
    </div>
  );
};

export default App;