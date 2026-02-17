import React, { useState, useRef } from 'react';
import DiaryDisplay from './DiaryDisplay';
import DiaryCard from './DiaryCard';
import { DiaryEntry } from '../types';

interface MyDiariesViewProps {
  diaries: DiaryEntry[];
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

const MyDiariesView: React.FC<MyDiariesViewProps> = ({ diaries, speechRate, setSpeechRate }) => {
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateString: string) => {
    // dateString is in "YYYY-MM-DD" format.
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || !selectedDiary) return;

    setIsDownloading(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // 1. Capture the hidden card element
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher scale for better resolution (Retina)
        backgroundColor: '#fdfbf7', // Match the card background
        logging: false,
      } as any);

      // 2. Convert canvas to Blob (Promisified)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      const fileName = `English_Diary_${selectedDiary.date}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 3. Try Web Share API (Mobile: Save to Photos / Share to SNS)
      // Note: This requires HTTPS (Secure Context) to work on mobile devices.
      // If running on http://localhost or http://IP, it will likely skip to fallback.
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My English Diary',
            text: 'Check out my English diary entry!',
          });
          // Shared successfully
          setIsDownloading(false);
          return;
        } catch (shareError) {
          // If user cancelled, just stop.
          if ((shareError as Error).name === 'AbortError') {
            setIsDownloading(false);
            return;
          }
          console.warn('Share failed, trying download fallback:', shareError);
          // If share failed for other reasons, proceed to download fallback below
        }
      }

      // 4. Fallback: Direct Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Failed to generate image:", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (selectedDiary) {
    return (
      <div className="animate-fade-in relative">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setSelectedDiary(null)}
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-200 rounded-lg shadow-sm transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to List
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all flex items-center disabled:bg-slate-300 disabled:cursor-wait"
          >
            {isDownloading ? (
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Download Card
          </button>
        </div>

        <DiaryDisplay
          diarySentences={selectedDiary.sentences}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          isGenerating={false}
          onGrammarCheck={() => { }} // No-op for saved diaries
          onCloseGrammarCheck={() => { }} // No-op for saved diaries
          grammarCheckResult={null}
          isCheckingGrammar={false}
        />

        {/* Hidden Container for Image Generation */}
        <div className="absolute top-0 left-[-9999px]">
          <DiaryCard ref={cardRef} entry={selectedDiary} />
        </div>
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
            <button
              key={diary.date}
              onClick={() => setSelectedDiary(diary)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDiary(diary);
                }
              }}
              className="w-full text-left bg-slate-50 p-4 rounded-lg cursor-pointer hover:bg-sky-100 hover:shadow-md transition-all border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              aria-label={`View diary from ${formatDate(diary.date)}`}
            >
              <p className="font-semibold text-sky-700">{formatDate(diary.date)}</p>
              <p className="text-gray-600 mt-2 text-sm truncate">
                {diary.sentences[0]?.english || 'No content'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDiariesView;