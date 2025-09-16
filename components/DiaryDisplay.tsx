import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface GrammarCheckResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence: string;
}

interface DiaryDisplayProps {
  englishDiary: string;
  koreanDiary: string;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isGenerating: boolean;
  onGrammarCheck: () => void;
  grammarCheckResult: GrammarCheckResult | null;
  isCheckingGrammar: boolean;
}

const DiaryDisplay: React.FC<DiaryDisplayProps> = ({
  englishDiary,
  koreanDiary,
  speechRate,
  setSpeechRate,
  isGenerating,
  onGrammarCheck,
  grammarCheckResult,
  isCheckingGrammar,
}) => {
  const hasContent = englishDiary || koreanDiary;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeUtteranceLang, setActiveUtteranceLang] = useState<'english' | 'korean' | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeechStatus('idle');
    setActiveUtteranceLang(null);
  };

  useEffect(() => {
    if (speechStatus !== 'idle') {
      handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechRate]);
  
  const togglePlayPause = (text: string, lang: 'english' | 'korean') => {
    if (!text || !window.speechSynthesis) {
      alert('Your browser does not support speech synthesis.');
      return;
    }

    const isSameUtterance = activeUtteranceLang === lang;

    if (speechStatus === 'playing' && isSameUtterance) {
      window.speechSynthesis.pause();
      setSpeechStatus('paused');
    } else if (speechStatus === 'paused' && isSameUtterance) {
      window.speechSynthesis.resume();
      setSpeechStatus('playing');
    } else {
      handleStop();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;

        if (lang === 'english') {
          const langCode = 'en-GB';
          const englishVoice = voicesRef.current.find(
            (voice) => voice.lang === langCode && voice.name.includes('Female')
          ) || voicesRef.current.find(voice => voice.lang === langCode);
          
          utterance.voice = englishVoice || null;
          utterance.lang = langCode;
        } else {
          utterance.lang = 'ko-KR';
        }

        utterance.onend = () => {
          setSpeechStatus('idle');
          setActiveUtteranceLang(null);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setSpeechStatus('idle');
          setActiveUtteranceLang(null);
        };

        window.speechSynthesis.speak(utterance);
        setSpeechStatus('playing');
        setActiveUtteranceLang(lang);
      }, 100);
    }
  };
  
  const renderGrammarResult = () => {
    if (isCheckingGrammar) {
      return (
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 mr-2 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Checking grammar...
        </div>
      );
    }

    if (!grammarCheckResult) return null;

    if (grammarCheckResult.isCorrect) {
      return (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-sm">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          <span className="text-green-800">{grammarCheckResult.feedback}</span>
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm space-y-2">
        <div className="flex items-start">
          <XCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800"><span className="font-semibold">Feedback:</span> {grammarCheckResult.feedback}</p>
        </div>
        <div className="pl-7">
          <p className="text-gray-700 font-semibold">Suggestion:</p>
          <p className="text-green-700 bg-green-50 p-2 rounded-md mt-1">{grammarCheckResult.correctedSentence}</p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-gray-500 space-y-4 animate-pulse">
          <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-semibold text-lg text-gray-600">Generating diary...</p>
        </div>
      );
    }

    if (!hasContent) {
      return (
        <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg p-8 text-gray-400">
          Your generated diary will appear here.
        </div>
      );
    }

    return (
      <>
        {/* English Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">English</h3>
            <button
              onClick={onGrammarCheck}
              disabled={isCheckingGrammar || !englishDiary}
              className="text-xs bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-1 px-3 rounded-full transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Check Grammar
            </button>
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={englishDiary}
              className="w-full h-36 p-4 pr-28 border-2 border-slate-200 bg-slate-100 rounded-lg resize-none focus:outline-none text-gray-800 leading-relaxed"
              aria-label="English diary text"
            />
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              {speechStatus !== 'idle' && activeUtteranceLang === 'english' && (
                <button
                  onClick={handleStop}
                  className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Stop playback"
                >
                  <StopIcon />
                </button>
              )}
              <button 
                onClick={() => togglePlayPause(englishDiary, 'english')}
                className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md hover:bg-sky-600 transition-colors disabled:bg-gray-300"
                disabled={!englishDiary}
                aria-label={speechStatus === 'playing' && activeUtteranceLang === 'english' ? 'Pause English diary' : 'Play English diary'}
              >
                {speechStatus === 'playing' && activeUtteranceLang === 'english' ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>
          </div>
          {renderGrammarResult()}
        </div>

        {/* Korean Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Korean</h3>
          <div className="relative">
            <textarea
              readOnly
              value={koreanDiary}
              className="w-full h-36 p-4 pr-28 border-2 border-slate-200 bg-slate-100 rounded-lg resize-none focus:outline-none text-gray-800 leading-relaxed"
              aria-label="Korean diary text"
            />
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              {speechStatus !== 'idle' && activeUtteranceLang === 'korean' && (
                <button
                  onClick={handleStop}
                  className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Stop playback"
                >
                  <StopIcon />
                </button>
              )}
              <button 
                onClick={() => togglePlayPause(koreanDiary, 'korean')}
                className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md hover:bg-sky-600 transition-colors disabled:bg-gray-300"
                disabled={!koreanDiary}
                aria-label={speechStatus === 'playing' && activeUtteranceLang === 'korean' ? 'Pause Korean diary' : 'Play Korean diary'}
              >
                {speechStatus === 'playing' && activeUtteranceLang === 'korean' ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Speech Rate Slider */}
        <div className="space-y-2 pt-2">
          <label htmlFor="speech-rate" className="font-semibold text-gray-700 text-sm">
            Listening Speed: <span className="text-sky-600 font-bold">{speechRate.toFixed(1)}x</span>
          </label>
          <input
            id="speech-rate"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>
      </>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Today's Diary</h2>
      {renderContent()}
    </div>
  );
};

export default DiaryDisplay;