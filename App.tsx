import React, { useState } from 'react';
import Header from './components/Header';
import KeywordsInput from './components/KeywordsInput';
import DiaryDisplay from './components/DiaryDisplay';
import BottomNav from './components/BottomNav';
import MyDiariesView from './components/MyDiariesView';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

import { DiarySentence, DiaryEntry, GrammarCheckResult } from './types';
import { generateDiary, checkGrammar } from './services/gemini';
import { useDiaryStorage } from './hooks/useDiaryStorage';

const App: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [diarySentences, setDiarySentences] = useState<DiarySentence[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'today' | 'myDiaries'>('today');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [grammarCheckResult, setGrammarCheckResult] = useState<GrammarCheckResult | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [level, setLevel] = useState<'beginner' | 'advanced'>('advanced');

  // Custom hook for diary storage management
  const { diaries, addDiaryEntry: saveToStorage } = useDiaryStorage();

  const handleSaveDiary = () => {
    if (diarySentences.length === 0) return;

    // Use 'en-CA' locale to get YYYY-MM-DD format reliably
    const dateKey = new Date().toLocaleDateString('en-CA');

    const newEntry: DiaryEntry = {
      date: dateKey,
      sentences: diarySentences,
      originalContent: keywords,
    };

    saveToStorage(newEntry);

    setToastMessage('Diary entry saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateDiary = async () => {
    if (!keywords.trim()) {
      setError('Please enter some keywords.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDiarySentences([]);
    setGrammarCheckResult(null); // Reset grammar check on new generation

    try {
      const sentences = await generateDiary(keywords, level);
      setDiarySentences(sentences);
    } catch (err: any) {
      console.error('Error generating diary:', err);
      setError(err.message || 'Sorry, something went wrong while generating the diary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrammarCheck = async (sentence: string) => {
    if (!sentence) return;

    setIsCheckingGrammar(true);
    setGrammarCheckResult(null);
    setError(null);

    try {
      const result = await checkGrammar(sentence);
      setGrammarCheckResult(result);
    } catch (err: any) {
      console.error('Error checking grammar:', err);
      setError(err.message || 'Sorry, an error occurred while checking grammar.');
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
              level={level}
              setLevel={setLevel}
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