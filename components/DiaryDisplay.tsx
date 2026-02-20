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
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('');
  const [userSelectedVoiceURI, setUserSelectedVoiceURI] = useState<string | null>(null);
  // ref: effect 재실행 없이 최신 선택값을 읽기 위함 (race condition 방지)
  const userSelectedVoiceURIRef = useRef<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<{ main: SpeechSynthesisVoice[]; other: SpeechSynthesisVoice[] }>({ main: [], other: [] });
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
    const updateVoiceName = () => {
      voicesRef.current = window.speechSynthesis.getVoices();

      // 음성 목록이 아직 비어있으면 스킵 (타이머가 재시도 예정)
      if (voicesRef.current.length === 0) return;

      // 모든 영어 음성 필터 (언어코드 en- 또는 이름으로 알려진 영어 음성)
      const allEnglish = voicesRef.current.filter(v => {
        const langOk = v.lang.replace('_', '-').toLowerCase().startsWith('en');
        // 이름으로 알 수 있는 영어 음성이면 lang코드와 무관하게 포함
        const nameOk = classifyVoiceGender(v) !== 'unknown';
        return langOk || nameOk;
      });
      const deduped = deduplicateVoices(allEnglish);

      // 성별별 엄격하게 필터 (unknown은 별도 그룹으로)
      const genderedVoices = deduped.filter(v => classifyVoiceGender(v) === voiceGender);
      const unknownVoices = deduped.filter(v => classifyVoiceGender(v) === 'unknown');

      // 영국식 우선 정렬
      const sortBritishFirst = (arr: SpeechSynthesisVoice[]) => [
        ...arr.filter(v => isBritish(v.lang)),
        ...arr.filter(v => !isBritish(v.lang)),
      ];

      setAvailableVoices({
        main: sortBritishFirst(genderedVoices),
        other: sortBritishFirst(unknownVoices),
      });

      let voice: SpeechSynthesisVoice | null = null;

      // ref로 읽어서 effect 재실행 없이 최신 선택값 참조
      const savedURI = userSelectedVoiceURIRef.current;
      if (savedURI) {
        voice = voicesRef.current.find(v => v.voiceURI === savedURI) || null;
      }

      if (!voice) {
        voice = getBritishVoice(voicesRef.current, voiceGender);
      }

      setCurrentVoiceName(voice ? `${voice.name}` : 'Default');
    };

    // 즉시 1회 시도
    updateVoiceName();

    // voiceschanged 이벤트 리스너 등록
    window.speechSynthesis.addEventListener('voiceschanged', updateVoiceName);

    // iOS 프로덕션 대응: voiceschanged를 놓쳤을 경우를 위한 재시도 타이머
    // (iOS에서 음성 로드는 보통 300~700ms 소요)
    const t1 = setTimeout(updateVoiceName, 200);
    const t2 = setTimeout(updateVoiceName, 600);
    const t3 = setTimeout(updateVoiceName, 1200);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoiceName);
      window.speechSynthesis.cancel();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // userSelectedVoiceURI를 의존성에서 제거: ref로 최신값을 읽으므로 effect 재실행 불필요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceGender]);

  const handleManualVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    if (uri === 'auto') {
      setUserSelectedVoiceURI(null);
      userSelectedVoiceURIRef.current = null;
      localStorage.removeItem('english-diary-voice-uri');
    } else {
      setUserSelectedVoiceURI(uri);
      userSelectedVoiceURIRef.current = uri;
      localStorage.setItem('english-diary-voice-uri', uri);
    }
  };

  // 성볔 탭 전환 시: 이전 선택 초기화 → Auto가 새 성볔에 맞는 최적 음성 선택
  const handleGenderChange = (gender: 'female' | 'male') => {
    setVoiceGender(gender);
    setUserSelectedVoiceURI(null);
    userSelectedVoiceURIRef.current = null;
    localStorage.removeItem('english-diary-voice-uri');
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
          let englishVoice: SpeechSynthesisVoice | null | undefined = null;

          // 1. Try User Selection
          if (userSelectedVoiceURI) {
            englishVoice = voicesRef.current.find(v => v.voiceURI === userSelectedVoiceURI);
          }

          // 2. Fallback to Auto
          if (!englishVoice) {
            englishVoice = getBritishVoice(voicesRef.current, voiceGender);
          }

          utterance.voice = englishVoice || null;
          utterance.lang = englishVoice?.lang || 'en-GB';

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
              onClick={() => handleGenderChange('female')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${voiceGender === 'female'
                ? 'bg-rose-100 text-rose-700 shadow-sm ring-1 ring-rose-200'
                : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
              👩 Female
            </button>
            <button
              onClick={() => handleGenderChange('male')}
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
        <div className="text-xs text-gray-500 px-1 mt-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <span className="whitespace-nowrap">Voice:</span>
              <select
                className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md p-1.5 max-w-[220px] shadow-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                value={userSelectedVoiceURI || 'auto'}
                onChange={handleManualVoiceChange}
              >
                <option value="auto">🎯 Auto (Best Available)</option>
                {/* 🇬🇧 영국식 발음 그룹 */}
                {availableVoices.main.filter(v => isBritish(v.lang)).length > 0 && (
                  <optgroup label="🇬🇧 영국식 발음">
                    {availableVoices.main
                      .filter(v => isBritish(v.lang))
                      .map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          🇬🇧 {v.name}
                        </option>
                      ))}
                  </optgroup>
                )}
                {/* 기타 영어 그룹 */}
                {availableVoices.main.filter(v => !isBritish(v.lang)).length > 0 && (
                  <optgroup label="기타 영어">
                    {availableVoices.main
                      .filter(v => !isBritish(v.lang))
                      .map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name}
                        </option>
                      ))}
                  </optgroup>
                )}
                {/* 성별 미분류 (최하단) */}
                {availableVoices.other.length > 0 && (
                  <optgroup label="기타">
                    {availableVoices.other.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {isBritish(v.lang) ? '🇬🇧 ' : ''}{v.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <button
              onClick={() => setShowVoiceGuide(!showVoiceGuide)}
              className="text-sky-600 underline hover:text-sky-800 text-right sm:text-left"
            >
              목소리가 이상한가요?
            </button>
          </div>

          {/* Show currently active voice in Auto mode */}
          {!userSelectedVoiceURI && (
            <p className="mt-1 text-gray-400">
              Active: <span className="font-medium text-gray-600">{currentVoiceName}</span>
            </p>
          )}

          {showVoiceGuide && (
            <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-900 text-xs leading-relaxed animate-fade-in-up">
              <p className="font-bold mb-1">📱 아이폰 음성 문제 해결 가이드:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li><strong>자동(Auto)</strong> 모드에서 'Rocko' 같은 기계음이 들리면, 위 목록에서 <strong>직접 목소리를 선택</strong>해 보세요.</li>
                <li>목록에 원하는 목소리(Kate 등)가 없다면:
                  <ol className="list-decimal list-inside ml-4 mt-1 text-amber-800">
                    <li><strong>설정 &gt; 손쉬운 사용 &gt; 콘텐츠 말하기 &gt; 음성</strong>으로 이동</li>
                    <li><strong>영어 &gt; 영어(영국)</strong>에서 Kate(Premium) 등을 다운로드</li>
                    <li>다운로드 후 <strong>폰을 재시작</strong>하거나 앱을 새로고침하세요.</li>
                  </ol>
                </li>
              </ul>
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