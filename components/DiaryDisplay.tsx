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
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('');
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Update current voice name whenever gender or voices change
  useEffect(() => {
    const updateVoiceName = () => {
      const voice = getBritishVoice(voicesRef.current, voiceGender);
      setCurrentVoiceName(voice ? `${voice.name} (${voice.lang})` : 'Default / Not found');
    };

    updateVoiceName();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoiceName);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoiceName);
  }, [voiceGender]);

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
  }, [speechRate, voiceGender]);

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

        // Only set rate if it's different from default (1.0) to avoid audio artifacts on mobile
        if (speechRate !== 1.0) {
          utterance.rate = speechRate;
        }

        if (lang === 'english') {
          const englishVoice = getBritishVoice(voicesRef.current, voiceGender);
          utterance.voice = englishVoice || null;
          utterance.lang = 'en-GB';

          // Only set pitch if necessary (some iOS versions degrade quality if pitch is explicitly set)
          // Default is 1.0, so we don't need to force it unless we want a specific effect
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
        {/* Audio Controls: Gender & Speed */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Gender Selection */}
          <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex-shrink-0 self-start sm:self-center">
            <button
              onClick={() => setVoiceGender('female')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${voiceGender === 'female'
                ? 'bg-rose-100 text-rose-700 shadow-sm ring-1 ring-rose-200'
                : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
              👩 Female
            </button>
            <button
              onClick={() => setVoiceGender('male')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${voiceGender === 'male'
                ? 'bg-sky-100 text-sky-700 shadow-sm ring-1 ring-sky-200'
                : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
              👨 Male
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex-grow flex flex-col sm:flex-row items-center sm:space-x-3 gap-2 sm:gap-0 w-full sm:w-auto">
            <label htmlFor="speech-rate-slider" className="font-semibold text-gray-700 text-sm whitespace-nowrap min-w-[70px]">
              Speed <span className="text-sky-600 font-bold">{speechRate.toFixed(1)}x</span>
            </label>
            <div className="flex items-center w-full space-x-2">
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
              {speechRate !== 1.0 && (
                <button
                  onClick={() => setSpeechRate(1.0)}
                  className="text-xs text-slate-500 hover:text-sky-600 font-medium px-2 py-1 bg-white rounded border border-slate-200 whitespace-nowrap shadow-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Voice Quality Debug & Guide Info */}
        <div className="text-xs text-gray-500 px-1">
          <div className="flex justify-between items-center">
            <span>Voice: <span className="font-semibold text-gray-700">{currentVoiceName}</span></span>
            <button
              onClick={() => setShowVoiceGuide(!showVoiceGuide)}
              className="text-sky-600 underline hover:text-sky-800"
            >
              목소리가 이상한가요?
            </button>
          </div>

          {showVoiceGuide && (
            <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-900 text-xs leading-relaxed animate-fade-in-up">
              <p className="font-bold mb-1">📱 아이폰에서 기계음처럼 들릴 때 해결법:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li><strong>설정</strong> {'>'} <strong>손쉬운 사용</strong>으로 이동합니다.</li>
                <li><strong>콘텐츠 말하기</strong> {'>'} <strong>음성</strong>을 선택합니다.</li>
                <li><strong>영어</strong>를 선택한 후, <strong>영어 (영국)</strong> 또는 영국식 목소리를 찾습니다.</li>
                <li>원하는 목소리(예: <strong>Serena, Kate, Stephanie</strong>)를 누릅니다.</li>
                <li><strong>고품질(Premium/Enhanced)</strong> 버전을 다운로드(구름 아이콘)합니다.</li>
                <li>이 페이지를 새로고침합니다.</li>
              </ol>
            </div>
          )}
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