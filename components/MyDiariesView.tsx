import React, { useState } from 'react';
import DiaryDisplay from './DiaryDisplay';

interface DiaryEntry {
  date: string;
  englishDiary: string;
  koreanDiary: string;
}

interface MyDiariesViewProps {
  diaries: DiaryEntry[];
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

const MyDiariesView: React.FC<MyDiariesViewProps> = ({ diaries, speechRate, setSpeechRate }) => {
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);

  const formatDate = (dateString: string) => {
    // dateString is in "YYYY-MM-DD" format.
    // To avoid timezone issues with new Date(), we construct it from parts.
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (selectedDiary) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setSelectedDiary(null)}
          className="mb-6 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-200 rounded-lg shadow-sm transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to List
        </button>
        <DiaryDisplay 
          englishDiary={selectedDiary.englishDiary}
          koreanDiary={selectedDiary.koreanDiary}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          isGenerating={false}
          onGrammarCheck={() => {}} // No-op for saved diaries
          grammarCheckResult={null}
          isCheckingGrammar={false}
        />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">My Diaries</h2>
      {diaries.length === 0 ? (
        <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg p-8 text-gray-400">
          You have no saved diaries yet.
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {diaries.map((diary) => (
            <div
              key={diary.date}
              onClick={() => setSelectedDiary(diary)}
              className="bg-slate-50 p-4 rounded-lg cursor-pointer hover:bg-sky-100 hover:shadow-md transition-all border border-slate-200"
            >
              <p className="font-semibold text-sky-700">{formatDate(diary.date)}</p>
              <p className="text-gray-600 mt-2 text-sm truncate">
                {diary.englishDiary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDiariesView;