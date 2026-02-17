import { useState, useEffect } from 'react';
import { DiaryEntry } from '../types';

export const useDiaryStorage = () => {
    const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

    // Load diaries from localStorage on mount
    useEffect(() => {
        try {
            const savedDiaries = localStorage.getItem('myEnglishDayDiaries');
            if (savedDiaries) {
                setDiaries(JSON.parse(savedDiaries));
            }
        } catch (e) {
            console.error("Failed to load diaries from local storage", e);
        }
    }, []);

    // Save diaries to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('myEnglishDayDiaries', JSON.stringify(diaries));
        } catch (e) {
            console.error("Failed to save diaries to local storage", e);
        }
    }, [diaries]);

    const addDiaryEntry = (newEntry: DiaryEntry) => {
        setDiaries((prevDiaries: DiaryEntry[]) => {
            const existingIndex = prevDiaries.findIndex((d: DiaryEntry) => d.date === newEntry.date);

            if (existingIndex !== -1) {
                // Update existing
                const updatedDiaries = [...prevDiaries];
                updatedDiaries[existingIndex] = newEntry;
                return updatedDiaries;
            } else {
                // Add new to beginning, sort by date descending
                const sortedDiaries = [newEntry, ...prevDiaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return sortedDiaries;
            }
        });
    };

    return { diaries, addDiaryEntry };
};
