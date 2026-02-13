/**
 * Selects the best available British English voice from the provided list.
 * Prioritizes high-quality voices like Martha and Serena.
 */
export const getBritishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    // List of preferred British female voices, prioritized by quality and tone
    const preferredVoices = [
        'Martha',            // macOS/iOS - High quality, slightly lower, mature British female
        'Serena',            // macOS/iOS - High quality British female
        'Google UK English Female', // Chrome/Android
        'Microsoft Hazel',   // Windows
        'Microsoft Susan',   // Windows
        'Kate'               // macOS/iOS - Standard British female
    ];

    let englishVoice: SpeechSynthesisVoice | undefined = undefined;

    // 1. Try to find a specific preferred voice
    for (const name of preferredVoices) {
        englishVoice = voices.find(voice =>
            voice.name.includes(name) && (voice.lang === 'en-GB' || voice.lang === 'en-UK')
        );
        if (englishVoice) break;
    }

    // 2. If not found, try any British female voice
    if (!englishVoice) {
        englishVoice = voices.find(
            (voice) => (voice.lang === 'en-GB' || voice.lang === 'en-UK') && voice.name.includes('Female')
        );
    }

    // 3. Improve fallback: Try any British voice
    if (!englishVoice) {
        englishVoice = voices.find(voice => voice.lang === 'en-GB' || voice.lang === 'en-UK');
    }

    return englishVoice || null;
};
