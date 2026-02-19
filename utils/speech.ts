/**
 * Helper to check if a language code is British English.
 * Handles variations like 'en-GB', 'en_GB', 'en-UK' and case insensitivity.
 */
const isBritish = (lang: string): boolean => {
    const normalized = lang.replace('_', '-').toLowerCase();
    return normalized.startsWith('en-gb') || normalized.startsWith('en-uk');
};

/**
 * Selects the best available British English voice based on gender.
 */
export const getBritishVoice = (
    voices: SpeechSynthesisVoice[],
    gender: 'female' | 'male' = 'female'
): SpeechSynthesisVoice | null => {

    // Preferred voices by gender
    const preferredVoices = {
        female: [
            'Kate',              // iOS High Quality
            'Serena',            // iOS High Quality
            'Stephanie',         // iOS High Quality
            'Martha',            // iOS Standard
            'Catherine',         // iOS Newer Standard
            'Tessa',             // macOS older
            'Google UK English Female' // Chrome/Android
        ],
        male: [
            'Daniel',            // iOS/macOS Standard
            'Arthur',            // iOS/macOS Alternative
            'Gordon',            // Mac Male
            'Google UK English Male' // Chrome/Android
        ]
    };

    const targetNames = preferredVoices[gender];
    let englishVoice: SpeechSynthesisVoice | undefined = undefined;

    // 1. Try to find a preferred voice with "Premium" or "Enhanced" quality first
    for (const name of targetNames) {
        englishVoice = voices.find(voice =>
            voice.name.includes(name) &&
            (voice.name.includes('Premium') || voice.name.includes('Enhanced')) &&
            isBritish(voice.lang)
        );
        if (englishVoice) return englishVoice;
    }

    // 2. Try to find preferred voices that are 'localService' (usually higher quality/downloaded)
    for (const name of targetNames) {
        englishVoice = voices.find(voice =>
            voice.name.includes(name) &&
            voice.localService === true &&
            isBritish(voice.lang)
        );
        if (englishVoice) return englishVoice;
    }

    // 3. Fallback to any preferred voice name (Standard quality)
    for (const name of targetNames) {
        englishVoice = voices.find(voice =>
            voice.name.includes(name) &&
            isBritish(voice.lang)
        );
        if (englishVoice) return englishVoice;
    }

    // 3. Fallback: Any voice with Gender in the name (Best attempt for unknown voices)
    if (!englishVoice) {
        const genderKeyword = gender === 'female' ? 'Female' : 'Male';
        englishVoice = voices.find(
            (voice) => isBritish(voice.lang) &&
                voice.name.toLowerCase().includes(genderKeyword.toLowerCase())
        );
    }

    // 4. Final Fallback: Any British voice that is NOT novelty (Avoid Rocko, etc.)
    if (!englishVoice) {
        const NOVELTY_VOICES = [
            'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos',
            'Deranged', 'Good News', 'Hysterical', 'Junior', 'Kathy', 'Pipe Organ',
            'Princess', 'Ralph', 'Trinoids', 'Whisper', 'Zarvox', 'Rocko', 'Shelley',
            'Superstar', 'Grandma', 'Grandpa', 'Eddy', 'Flo', 'Reed', 'Sandy', 'Majed'
        ];

        englishVoice = voices.find(voice =>
            isBritish(voice.lang) &&
            !NOVELTY_VOICES.some(novelty => voice.name.includes(novelty))
        );
    }

    // 5. Absolute Last Resort: Just return the first British voice found (even if novelty, better than nothing)
    if (!englishVoice) {
        englishVoice = voices.find(voice => isBritish(voice.lang));
    }

    return englishVoice || null;
};
