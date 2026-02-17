import React, { forwardRef } from 'react';
import { DiaryEntry } from '../types';

interface DiaryCardProps {
    entry: DiaryEntry;
}

/**
 * A specialized component designed to look like a classic paper diary page.
 * This component is intended to be captured as an image via html2canvas.
 */
const DiaryCard = forwardRef<HTMLDivElement, DiaryCardProps>(({ entry }, ref) => {
    return (
        <div
            ref={ref}
            className="bg-[#fdfbf7] p-8 md:p-12 w-[600px] mx-auto shadow-2xl relative overflow-hidden text-slate-800 font-serif h-auto min-h-[800px]"
            style={{
                width: '600px',
                fontFamily: "'Georgia', 'Times New Roman', Times, serif"
            }}
        >
            {/* Background Texture Effect (Subtle Noise) */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply h-full w-full"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Decorative Border Line - Adjusted to follow height */}
            <div className="absolute top-6 left-6 right-6 bottom-6 border-2 border-slate-200 pointer-events-none rounded-sm bg-transparent" />
            <div className="absolute top-8 left-8 right-8 bottom-8 border border-slate-100 pointer-events-none rounded-sm bg-transparent" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full">

                {/* Header */}
                <header className="mb-10 text-center border-b border-slate-200 pb-6 mt-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2 font-sans">Daily English Log</div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">{entry.date}</h1>
                    <div className="w-16 h-1 bg-slate-800 mx-auto mt-4 mb-2 rounded-full opacity-20"></div>
                </header>

                {/* Body: Diary Content */}
                <div className="flex-1 space-y-6 mb-12">
                    {entry.sentences.map((sentence, index) => (
                        <div key={index} className="group break-inside-avoid">
                            {/* English Sentence */}
                            <p className="text-xl leading-relaxed text-slate-800 font-medium mb-2">
                                {sentence.english}
                            </p>

                            {/* Korean Translation */}
                            <p className="text-sm text-slate-500 font-sans leading-relaxed pl-1 border-l-2 border-slate-200">
                                {sentence.korean}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400 font-sans mb-4">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                        <span className="uppercase tracking-wider font-bold text-slate-300">Keywords</span>
                        <span className="italic block break-words">"{entry.originalContent}"</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                        <span className="font-bold text-slate-300 tracking-wider">MY ENGLISH DAY</span>
                    </div>
                </footer>

            </div>
        </div>
    );
});

export default DiaryCard;
