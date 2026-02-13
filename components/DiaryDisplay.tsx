import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

import { getBritishVoice } from '../utils/speech';
import { DiarySentence, GrammarCheckResult } from '../types';

interface DiaryDisplayProps {
  diarySentences: DiarySentence[];
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isGenerating: boolean;
  onGrammarCheck: (sentence: string) => void;
  onCloseGrammarCheck: () => void;
  grammarCheckResult: GrammarCheckResult | null;
  isCheckingGrammar: boolean;
}

const DiaryDisplay: React.FC<DiaryDisplayProps> = ({
  diarySentences,
  speechRate,
  setSpeechRate,
  isGenerating,
  onGrammarCheck,
  onCloseGrammarCheck,
  grammarCheckResult,
  isCheckingGrammar,
}) => {
  const hasContent = diarySentences.length > 0;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeUtteranceIndex, setActiveUtteranceIndex] = useState<number | null>(null);
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
    setActiveUtteranceIndex(null);
    setActiveUtteranceLang(null);
  };

  useEffect(() => {
    if (speechStatus !== 'idle') {
      handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechRate]);

  const togglePlayPause = (text: string, lang: 'english' | 'korean', index: number) => {
    if (!text || !window.speechSynthesis) {
      alert('Your browser does not support speech synthesis.');
      return;
    }

    const isSameUtterance = activeUtteranceLang === lang && activeUtteranceIndex === index;

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
          const englishVoice = getBritishVoice(voicesRef.current);
          utterance.voice = englishVoice || null;
          utterance.lang = 'en-GB';

          // Reset pitch to 1.0 for natural sound on mobile (non-standard pitch often causes artifacts)
          utterance.pitch = 1.0;
        } else {
          utterance.lang = 'ko-KR';
        }

        utterance.onend = () => {
          setSpeechStatus('idle');
          setActiveUtteranceIndex(null);
          setActiveUtteranceLang(null);
        };

        utterance.onerror = (event) => {
          // Ignore interruption errors which happen when stop() is called or rate changes
          if (event.error === 'interrupted' || event.error === 'canceled') {
            return;
          }
          console.error('Speech synthesis error:', event);
          setSpeechStatus('idle');
          setActiveUtteranceIndex(null);
          setActiveUtteranceLang(null);
        };

        window.speechSynthesis.speak(utterance);
        setSpeechStatus('playing');
        setActiveUtteranceIndex(index);
        setActiveUtteranceLang(lang);
      }, 100);
    }
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-gray-500 space-y-4 animate-pulse">
          <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-semibold text-lg text-gray-600">Generating diary…</p>
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
      <div className="space-y-6">
        {/* Speech Rate Slider */}
        <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label htmlFor="speech-rate-slider" className="font-semibold text-gray-700 text-sm whitespace-nowrap">
            Listening Speed: <span className="text-sky-600 font-bold">{speechRate.toFixed(1)}x</span>
          </label>
          <input
            id="speech-rate-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            aria-label="Adjust speech rate"
          />
        </div>

        {diarySentences.map((sentence, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all duration-300">
            {/* Header: Grammar Check */}
            <div className="flex justify-end mb-1">
              <button
                onClick={() => onGrammarCheck(sentence.english)}
                disabled={isCheckingGrammar}
                className="text-xs font-bold text-sky-500 hover:text-sky-600 disabled:text-gray-300 transition-colors flex items-center py-1 px-2 rounded-lg hover:bg-sky-50"
              >
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                Check Grammar
              </button>
            </div>

            {/* Main Content: English Text + Play Button in one row */}
            <div className="flex items-end gap-3 mb-4">
              <p className="flex-1 text-xl text-slate-800 font-medium leading-relaxed font-serif">
                {sentence.english}
              </p>

              <button
                onClick={() => togglePlayPause(sentence.english, 'english', index)}
                className="flex-none w-12 h-12 rounded-full bg-sky-500 text-white shadow-md flex items-center justify-center hover:bg-sky-600 active:scale-95 transition-all"
                aria-label={speechStatus === 'playing' && activeUtteranceLang === 'english' && activeUtteranceIndex === index ? 'Pause' : 'Play'}
              >
                {speechStatus === 'playing' && activeUtteranceLang === 'english' && activeUtteranceIndex === index ?
                  <PauseIcon className="w-5 h-5" /> :
                  <PlayIcon className="w-5 h-5 ml-1" />
                }
              </button>
            </div>

            {/* Korean Section */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-gray-500 text-base leading-relaxed">{sentence.korean}</p>
            </div>
          </div>
        ))}

        {/* Global Grammar Result Modal */}
        {(isCheckingGrammar || grammarCheckResult) && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-white p-4 rounded-xl shadow-2xl border border-slate-200 z-40 animate-fade-in-up">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-gray-800">Grammar Check</h4>
              <button
                onClick={onCloseGrammarCheck}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close grammar check"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            {isCheckingGrammar ? (
              <div className="flex items-center text-sky-600">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing sentence...
              </div>
            ) : grammarCheckResult ? (
              <div>
                {grammarCheckResult.isCorrect ? (
                  <div className="flex items-center text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">{grammarCheckResult.feedback}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start text-red-700 bg-red-50 p-3 rounded-lg">
                      <XCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div><span className="font-bold block mb-1">Feedback:</span> {grammarCheckResult.feedback}</div>
                    </div>
                    {grammarCheckResult.correctedSentence && grammarCheckResult.correctedSentence !== '' && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <span className="font-bold text-green-800 block mb-1">Suggestion:</span>
                        <p className="text-green-700 font-serif text-lg">{grammarCheckResult.correctedSentence}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
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