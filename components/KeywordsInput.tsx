import React, { useState, useRef, useEffect } from 'react';
import { MicIcon } from './icons/MicIcon';

// For browsers that only support the prefixed version
declare global {
  interface Window {
    // Fix: Add SpeechRecognition to the Window interface to fix TypeScript error.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface KeywordsInputProps {
  keywords: string;
  setKeywords: (keywords: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const KeywordsInput: React.FC<KeywordsInputProps> = ({ keywords, setKeywords, onGenerate, isGenerating }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null); // SpeechRecognition instance

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.lang = 'ko-KR';
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setKeywords(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [setKeywords]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Keywords</h2>
      <div className="relative flex-grow">
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={isRecording ? "듣고 있어요..." : "오늘 하루에 대한 키워드를 입력하세요... (예: 맑음, 공원 산책, 친구와 커피)"}
          className="w-full h-full p-4 pr-12 bg-slate-800 border border-slate-700 rounded-lg resize-none text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
        />
        <button
          onClick={handleMicClick}
          className={`absolute top-4 right-4 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'
            }`}
          aria-label={isRecording ? "녹음 중지" : "녹음 시작"}
        >
          <MicIcon />
        </button>
      </div>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-wait disabled:scale-100"
      >
        {isGenerating ? 'Generating...' : 'Generate Diary Entry'}
      </button>
    </div>
  );
};

export default KeywordsInput;