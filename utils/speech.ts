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
            'Martha',            // iOS/macOS - High quality female
            'Serena',            // iOS/macOS - High quality female
            'Stephanie',         // UK Female
            'Kate',              // iOS/macOS - Standard female
            'Catherine',         // iOS - Newer standard female
            'Tessa',             // Older Mac female
            'Google UK English Female' // Chrome/Android
        ],
        male: [
            'Daniel',            // iOS/macOS - Standard British Male
            'Arthur',            // iOS/macOS - Alternative British Male
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
            (voice.lang === 'en-GB' || voice.lang === 'en-UK')
        );
        if (englishVoice) break;
    }

    // 2. If no premium/enhanced voice, try specific preferred names (Standard quality)
    if (!englishVoice) {
        for (const name of targetNames) {
            englishVoice = voices.find(voice =>
                voice.name.includes(name) &&
                (voice.lang === 'en-GB' || voice.lang === 'en-UK')
            );
            if (englishVoice) break;
        }
    }

    // 3. Fallback: Any voice with Gender in the name (Best attempt for unknown voices)
    if (!englishVoice) {
        const genderKeyword = gender === 'female' ? 'Female' : 'Male';
        englishVoice = voices.find(
            (voice) => (voice.lang === 'en-GB' || voice.lang === 'en-UK') &&
                voice.name.toLowerCase().includes(genderKeyword.toLowerCase())
        );
    }

    // 4. Final Fallback: Any British voice (Last resort)
    if (!englishVoice) {
        englishVoice = voices.find(voice => voice.lang === 'en-GB' || voice.lang === 'en-UK');
    }

    return englishVoice || null;
};
