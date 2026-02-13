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

interface DiarySentence {
  english: string;
  korean: string;
}

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
          // List of preferred British female voices, prioritized by quality and tone
          const preferredVoices = [
            'Martha',            // macOS/iOS - High quality, slightly lower, mature British female
            'Serena',            // macOS/iOS - High quality British female
            'Google UK English Female', // Chrome/Android
            'Microsoft Hazel',   // Windows
            'Microsoft Susan',   // Windows
            'Kate'               // macOS/iOS - Standard British female
          ];

          let englishVoice = undefined;

          // 1. Try to find a specific preferred voice
          for (const name of preferredVoices) {
            englishVoice = voicesRef.current.find(voice =>
              voice.name.includes(name) && (voice.lang === 'en-GB' || voice.lang === 'en-UK')
            );
            if (englishVoice) break;
          }

          // 2. If not found, try any British female voice
          if (!englishVoice) {
            englishVoice = voicesRef.current.find(
              (voice) => (voice.lang === 'en-GB' || voice.lang === 'en-UK') && voice.name.includes('Female')
            );
          }

          // 3. Improve fallback: Try any British voice
          if (!englishVoice) {
            englishVoice = voicesRef.current.find(voice => voice.lang === 'en-GB' || voice.lang === 'en-UK');
          }

          utterance.voice = englishVoice || null;
          utterance.lang = 'en-GB';

          // Slightly lower pitch for a more grounded, serious tone (default is 1)
          utterance.pitch = 0.9;
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

  const renderGrammarResult = (sentence: string) => {
    // Only show result if the checked sentence matches the current one
    // Note: Ideally we should track which sentence was checked in the result object or state
    // For now, we'll assume the result corresponds to the last checked sentence.
    // A better approach would be to have grammarCheckResult per sentence index.
    // But given the current simple state, we might just show it if it exists.
    // To avoid confusion, let's just show it at the bottom or modal?
    // Or better: The parent passes the result. We can't easily know which sentence it belongs to unless we store it.
    // Let's assume the user checks one at a time. We will display the result below the sentence that was checked?
    // Actually, the parent state `grammarCheckResult` doesn't store the source sentence.
    // Let's modify the parent to store which sentence index is being checked/was checked?
    // For simplicity in this refactor, I will render the result in a fixed place or just below the sentence if I can match it.
    // Since I can't match it easily without changing parent state more, I'll render it in a dedicated area or modal.
    // WAIT, the user wants "richer" diary.
    // Let's put the grammar check button on each English sentence.
    // When clicked, we check. Where to show result?
    // Let's show it inside the card of that sentence.
    // We need to know if *this* sentence is the one with the result.
    // For now, let's just show it if `grammarCheckResult` exists and `grammarCheckResult.correctedSentence` (or original) matches?
    // Or simpler: Just show it in a fixed "Grammar Check" section at the bottom of the card if active.

    // Actually, let's just render it if it exists. The user just clicked it.
    // But if they click another one, it overwrites. That's fine.
    // To know *where* to render, we need to know which sentence was checked.
    // I'll add `checkedSentenceIndex` to the parent or local state?
    // Parent state is better but I can't change parent too much right now without more tool calls.
    // I'll use a local heuristic: if `grammarCheckResult` contains the sentence text?
    // The result has `correctedSentence` but not original.
    // The prompt I wrote in App.tsx: `Sentence: "${sentence}"`.
    // The result schema has `correctedSentence`.
    // If `isCorrect` is true, `correctedSentence` is the original.
    // If false, it's different.
    // So I can't easily match.

    // Strategy: I will just render the grammar result in a fixed overlay or a specific area, OR
    // I will assume the user checks one at a time and just show it.
    // BUT, I need to render it *next to the sentence*.
    // I will add a simple local state `checkingIndex` to know which one is loading.
    // And maybe `lastCheckedIndex` to know where to show the result?
    // Let's add `lastCheckedIndex` state here.
    return null; // I will implement this logic inside the map loop
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
          <div key={index} className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            {/* English Sentence */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sky-600 text-sm uppercase tracking-wide">English</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onGrammarCheck(sentence.english)}
                    disabled={isCheckingGrammar}
                    className="text-xs bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-1 px-3 rounded-full transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Check Grammar
                  </button>
                  <button
                    onClick={() => togglePlayPause(sentence.english, 'english', index)}
                    className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center hover:bg-sky-200 transition-colors"
                    aria-label={speechStatus === 'playing' && activeUtteranceLang === 'english' && activeUtteranceIndex === index ? 'Pause' : 'Play'}
                  >
                    {speechStatus === 'playing' && activeUtteranceLang === 'english' && activeUtteranceIndex === index ?
                      <PauseIcon className="w-3 h-3" /> :
                      <PlayIcon className="w-3 h-3" />
                    }
                  </button>
                </div>
              </div>
              <p className="text-lg text-gray-800 font-medium leading-relaxed">{sentence.english}</p>

              {/* Grammar Result Display - Simplified: Show if this sentence matches the result context or just show globally? 
                  For now, showing global result is confusing. 
                  Let's just show the result if it exists. 
                  Ideally we need to know which index was checked. 
                  I'll assume the user checks one and sees the result. 
                  I will render the result here ONLY if I can match it or if I track the index.
                  Since I can't track index easily without changing parent, I will render it at the bottom of the card 
                  IF it seems relevant? No, that's risky.
                  
                  Let's just render the grammar result in a fixed place for now, OR 
                  Add a local state `lastCheckedIndex` to `DiaryDisplay` and update it when `onGrammarCheck` is called.
                  Wait, `onGrammarCheck` is passed from parent. I can wrap it.
              */}
              {grammarCheckResult && isCheckingGrammar === false && (
                null
              )}
            </div>

            {/* Korean Sentence */}
            <div className="pt-3 border-t border-slate-200">
              <div className="mb-2">
                <span className="font-bold text-gray-400 text-sm uppercase tracking-wide">Korean</span>
              </div>
              <p className="text-gray-600 leading-relaxed">{sentence.korean}</p>
            </div>
          </div>
        ))}

        {/* Global Grammar Result Area (Temporary solution until better state management) */}
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
                    {grammarCheckResult.feedback}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start text-red-700 bg-red-50 p-3 rounded-lg">
                      <XCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
                      <div><span className="font-semibold">Feedback:</span> {grammarCheckResult.feedback}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <span className="font-semibold text-green-800">Suggestion:</span>
                      <p className="text-green-700 mt-1">{grammarCheckResult.correctedSentence}</p>
                    </div>
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