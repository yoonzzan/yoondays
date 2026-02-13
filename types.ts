// Defines the structure of a single sentence in a diary entry
export interface DiarySentence {
    english: string;
    korean: string;
}

// Defines the structure of a complete diary entry
export interface DiaryEntry {
    date: string; // Storing date as 'YYYY-MM-DD' string for consistency
    sentences: DiarySentence[];
}

// Defines the result of a grammar check
export interface GrammarCheckResult {
    isCorrect: boolean;
    feedback: string;
    correctedSentence: string;
}
