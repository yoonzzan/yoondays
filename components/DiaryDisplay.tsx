import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SentencePair, GrammarCheckResult } from '../App';

// --- Speech Synthesis Hook ---
type SpeechStatus = 'idle' | 'playing' | 'paused';
const useSpeechSynthesis = (speechRate: number) => {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [activeUtterance, setActiveUtterance] = useState<{ lang: string; index: number } | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus('idle');
    setActiveUtterance(null);
  }, []);

  useEffect(() => { stop(); }, [speechRate, stop]);

  const togglePlayPause = useCallback((text: string, lang: 'english' | 'korean', index: number) => {
    if (!text || !window.speechSynthesis) return;
    const isSame = activeUtterance?.index === index && activeUtterance?.lang === lang;
    if (status === 'playing' && isSame) {
      window.speechSynthesis.pause();
      setStatus('paused');
    } else if (status === 'paused' && isSame) {
      window.speechSynthesis.resume();
      setStatus('playing');
    } else {
      stop();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;
        if (lang === 'english') {
          utterance.lang = 'en-GB';
          const preferredVoices = ['Google UK English Female', 'Microsoft Libby - English (United Kingdom)', 'Kate'];
          utterance.voice = preferredVoices.map(name => voicesRef.current.find(v => v.name === name)).find(v => v) ||
            voicesRef.current.find(v => v.lang === 'en-GB' && v.name.includes('Female')) ||
            voicesRef.current.find(v => v.lang === 'en-GB') || null;
        } else {
          utterance.lang = 'ko-KR';
          utterance.voice = voicesRef.current.find(voice => voice.lang === 'ko-KR') || null;
        }
        utterance.onend = () => { setStatus('idle'); setActiveUtterance(null); };
        utterance.onerror = (e) => { console.error('TTS Error:', e); setStatus('idle'); setActiveUtterance(null); };
        window.speechSynthesis.speak(utterance);
        setStatus('playing');
        setActiveUtterance({ lang, index });
      }, 100);
    }
  }, [status, activeUtterance, speechRate, stop]);
  return { status, activeUtterance, togglePlayPause, stop };
};

// --- API Service Logic (Client-Side) ---
const checkGrammar = async (text: string): Promise<GrammarCheckResult> => {
    const response = await fetch('/api/check-grammar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to check grammar.');
  }
  return await response.json();
};

// --- Diary Display Component ---
interface DiaryDisplayProps {
  diarySentences: SentencePair[];
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isGenerating: boolean;
}

const DiaryDisplay: React.FC<DiaryDisplayProps> = ({ diarySentences, speechRate, setSpeechRate, isGenerating }) => {
  const [grammarResult, setGrammarResult] = useState<GrammarCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const { status, activeUtterance, togglePlayPause, stop } = useSpeechSynthesis(speechRate);
  const hasContent = diarySentences.length > 0;

  useEffect(() => { setGrammarResult(null); setCheckError(null); }, [diarySentences]);

  const handleGrammarCheck = useCallback(async () => {
    const englishDiary = diarySentences.map(s => s.englishSentence).join(' ');
    if (!englishDiary) return;
    setIsChecking(true);
    setGrammarResult(null);
    setCheckError(null);
    try {
      const result = await checkGrammar(englishDiary);
      setGrammarResult(result);
    } catch (err) {
      console.error('Error checking grammar:', err);
      setCheckError('Sorry, an error occurred while checking grammar.');
    } finally {
      setIsChecking(false);
    }
  }, [diarySentences]);

  const renderGrammarResult = () => {
    if (isChecking) return <div className="mt-4 flex items-center text-sm text-gray-500"><svg className="animate-spin h-4 w-4 mr-2 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Checking...</div>;
    if (checkError) return <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{checkError}</div>;
    if (!grammarResult) return null;
    return grammarResult.isCorrect ? (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-sm"><CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /><span className="text-green-800">{grammarResult.feedback}</span></div>
    ) : (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm space-y-2">
        <div className="flex items-start"><XCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" /><p className="text-red-800"><span className="font-semibold">Feedback:</span> {grammarResult.feedback}</p></div>
        <div className="pl-7"><p className="text-gray-700 font-semibold">Suggestion:</p><p className="text-green-700 bg-green-50 p-2 rounded-md mt-1">{grammarResult.correctedSentence}</p></div>
      </div>
    );
  };
  
  const renderSentence = (sentence: SentencePair, index: number) => {
    const isPlaying = (lang: string) => status === 'playing' && activeUtterance?.index === index && activeUtterance?.lang === lang;
    const showStop = (lang: string) => status !== 'idle' && activeUtterance?.index === index && activeUtterance?.lang === lang;
    
    return (
      <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <p className="text-gray-800 leading-relaxed flex-1">{sentence.englishSentence}</p>
          <div className="flex items-center space-x-1">
            {showStop('english') && <button onClick={stop} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200" aria-label="Stop"><StopIcon /></button>}
            <button onClick={() => togglePlayPause(sentence.englishSentence, 'english', index)} className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center hover:bg-sky-200" aria-label={isPlaying('english') ? 'Pause' : 'Play'}>
              {isPlaying('english') ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-200">
          <p className="text-gray-600 leading-relaxed flex-1">{sentence.koreanSentence}</p>
          <div className="flex items-center space-x-1">
            {showStop('korean') && <button onClick={stop} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200" aria-label="Stop"><StopIcon /></button>}
            <button onClick={() => togglePlayPause(sentence.koreanSentence, 'korean', index)} className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center hover:bg-sky-200" aria-label={isPlaying('korean') ? 'Pause' : 'Play'}>
              {isPlaying('korean') ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isGenerating) return <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-gray-500 space-y-4 animate-pulse min-h-[300px]"><svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="font-semibold text-lg text-gray-600">Generating diary...</p></div>;
    if (!hasContent) return <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg p-8 text-gray-400 min-h-[300px]">Your generated diary will appear here.</div>;
    return (
      <div className="flex flex-col space-y-4">
        <div className="space-y-3">{diarySentences.map(renderSentence)}</div>
        <div className="pt-2 border-t mt-2">
          <button onClick={handleGrammarCheck} disabled={isChecking || !hasContent} className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-full transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed w-full md:w-auto">Check Grammar</button>
          {renderGrammarResult()}
        </div>
        <div className="space-y-2 pt-2">
          <label htmlFor="speech-rate" className="font-semibold text-gray-700 text-sm">Listening Speed: <span className="text-sky-600 font-bold">{speechRate.toFixed(1)}x</span></label>
          <input id="speech-rate" type="range" min="0.5" max="2" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
        </div>
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