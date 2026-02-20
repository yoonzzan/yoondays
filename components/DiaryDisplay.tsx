import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

import { getBritishVoice, isBritish, classifyVoiceGender, deduplicateVoices } from '../utils/speech';
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
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('Auto');
  const [userSelectedVoiceURI, setUserSelectedVoiceURI] = useState<string | null>(null);
  const userSelectedVoiceURIRef = useRef<string | null>(null);
  // 성별로 분류된 음성 목록
  const [voicesByGender, setVoicesByGender] = useState<{
    female: SpeechSynthesisVoice[];
    male: SpeechSynthesisVoice[];
  }>({ female: [], male: [] });
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  useEffect(() => {
    // localStorage에서 저장된 음성 불러오기
    const savedURI = localStorage.getItem('english-diary-voice-uri');
    if (savedURI) {
      userSelectedVoiceURIRef.current = savedURI; // ref 먼저 업데이트 (effect 재실행 방지)
      setUserSelectedVoiceURI(savedURI);           // UI 표시용 state 업데이트
    }
  }, []);

  // state 변경 시 ref도 동기화 (effect 밖에서 최신값 참조용)
  useEffect(() => {
    userSelectedVoiceURIRef.current = userSelectedVoiceURI;
  }, [userSelectedVoiceURI]);

  useEffect(() => {
    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      if (voicesRef.current.length === 0) return;

      // 모든 영어 음성 (lang en- 또는 이름으로 알려진 것 포함), 중복 제거
      const allEnglish = deduplicateVoices(
        voicesRef.current.filter(v => {
          const langOk = v.lang.replace('_', '-').toLowerCase().startsWith('en');
          const nameOk = classifyVoiceGender(v) !== 'unknown';
          return langOk || nameOk;
        })
      );

      // 영국식 우선 정렬 함수
      const sortBritishFirst = (arr: SpeechSynthesisVoice[]) => [
        ...arr.filter(v => isBritish(v.lang)),
        ...arr.filter(v => !isBritish(v.lang)),
      ];

      setVoicesByGender({
        female: sortBritishFirst(allEnglish.filter(v => classifyVoiceGender(v) === 'female')),
        male: sortBritishFirst(allEnglish.filter(v => classifyVoiceGender(v) === 'male')),
      });

      // Active 음성 이름 표시 업데이트
      const savedURI = userSelectedVoiceURIRef.current;
      if (savedURI) {
        const selected = voicesRef.current.find(v => v.voiceURI === savedURI);
        setCurrentVoiceName(selected ? selected.name : 'Auto');
      } else {
        // Auto: getBritishVoice가 선택할 음성 이름 표시
        const autoVoice = getBritishVoice(voicesRef.current, 'female');
        setCurrentVoiceName(autoVoice ? `Auto → ${autoVoice.name}` : 'Auto');
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    const t1 = setTimeout(updateVoices, 200);
    const t2 = setTimeout(updateVoices, 600);
    const t3 = setTimeout(updateVoices, 1200);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      window.speechSynthesis.cancel();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    if (!uri) {
      setUserSelectedVoiceURI(null);
      userSelectedVoiceURIRef.current = null;
      const autoVoice = getBritishVoice(voicesRef.current, 'female');
      setCurrentVoiceName(autoVoice ? `Auto → ${autoVoice.name}` : 'Auto');
      localStorage.removeItem('english-diary-voice-uri');
    } else {
      setUserSelectedVoiceURI(uri);
      userSelectedVoiceURIRef.current = uri;
      const voice = voicesRef.current.find(v => v.voiceURI === uri);
      setCurrentVoiceName(voice ? voice.name : uri);
      localStorage.setItem('english-diary-voice-uri', uri);
    }
  };

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

        // Only set rate if it's different from default (1.0) to avoid audio artifacts on mobile
        if (speechRate !== 1.0) {
          utterance.rate = speechRate;
        }

        if (lang === 'english') {
          const savedURI = userSelectedVoiceURIRef.current;
          if (savedURI) {
            // 사용자가 직접 선택한 특정 음성
            const selectedVoice = voicesRef.current.find(v => v.voiceURI === savedURI);
            utterance.voice = selectedVoice || null;
            utterance.lang = selectedVoice?.lang || 'en-GB';
          } else {
            // Auto: getBritishVoice로 최적 영국식/영어 음성 선택 (한국어 방지)
            const autoVoice = getBritishVoice(voicesRef.current, 'female');
            utterance.voice = autoVoice;
            utterance.lang = autoVoice?.lang || 'en-GB';
          }
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
        {/* Audio Controls: Speed Only (Gender is now in the voice dropdown) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
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

        {/* Voice Selector — Compact */}
        <div className="flex items-center gap-2 px-1 mt-2">
          {/* 🔊 아이콘 */}
          <span className="text-base shrink-0" aria-hidden="true">🔊</span>

          {/* 셀렉트 — 가능한 넓게 */}
          <select
            className="flex-1 min-w-0 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 cursor-pointer"
            value={userSelectedVoiceURI ?? ''}
            onChange={handleManualVoiceChange}
          >
            <option value="">🎯 Auto (Best English)</option>
            {voicesByGender.female.length > 0 && (
              <optgroup label="👩 Female">
                {voicesByGender.female.map((v: SpeechSynthesisVoice) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {isBritish(v.lang) ? '🇬🇧 ' : ''}{v.name}
                  </option>
                ))}
              </optgroup>
            )}
            {voicesByGender.male.length > 0 && (
              <optgroup label="👨 Male">
                {voicesByGender.male.map((v: SpeechSynthesisVoice) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {isBritish(v.lang) ? '🇬🇧 ' : ''}{v.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Auto일 때만 실제 선택된 음성 이름을 배지로 표시 */}
          {!userSelectedVoiceURI && currentVoiceName && currentVoiceName !== 'Auto' && (
            <span className="shrink-0 text-xs text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full whitespace-nowrap">
              {currentVoiceName.replace('Auto → ', '')}
            </span>
          )}

          {/* ℹ️ 도움말 버튼 */}
          <button
            onClick={() => setShowVoiceGuide(!showVoiceGuide)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
            title="목소리가 이상한가요?"
            aria-label="음성 도움말"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 도움말 패널 */}
        {showVoiceGuide && (
          <div className="mx-1 mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-xs leading-relaxed">
            <p className="font-bold mb-1">📱 아이폰 음성 문제 해결</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>기계음이 들리면 위 목록에서 <strong>직접 목소리를 선택</strong>하세요.</li>
              <li>목록에 Kate 등이 없다면:
                <ol className="list-decimal list-inside ml-4 mt-1 text-amber-800">
                  <li><strong>설정 &gt; 손쉬운 사용 &gt; 콘텐츠 말하기 &gt; 음성</strong></li>
                  <li><strong>영어 &gt; 영어(영국)</strong>에서 Kate(Premium) 다운로드</li>
                  <li>다운로드 후 <strong>앱 새로고침</strong></li>
                </ol>
              </li>
            </ul>
          </div>
        )}

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