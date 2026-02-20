/**
 * British English 언어 코드 여부 확인.
 * en-GB, en-UK 계열.
 */
export const isBritish = (lang: string): boolean => {
    const normalized = lang.replace('_', '-').toLowerCase();
    return normalized.startsWith('en-gb') || normalized.startsWith('en-uk');
};

/**
 * 영어 언어 코드 여부 확인 (모든 영어 변형 포함: en-US, en-AU 등).
 */
const isEnglish = (lang: string): boolean => {
    return lang.replace('_', '-').toLowerCase().startsWith('en');
};

/**
 * 여성 목소리 이름 목록 (이름 기반 성별 추정).
 */
const FEMALE_VOICE_NAMES = [
    // 영국식
    'Kate', 'Serena', 'Stephanie', 'Martha', 'Catherine', 'Tessa',
    // 기타 영어권 여성
    'Moira',       // 아일랜드
    'Karen',       // 호주
    'Fiona',       // 스코틀랜드
    'Samantha', 'Victoria', 'Susan', 'Nicky', 'Sandy', 'Ava',
    'Allison', 'Alice', 'Anna', 'Shelley', 'Flo', 'Grandma',
    'Kathy', 'Princess', 'Zarvox', 'Bells', 'Bubbles', 'Whisper',
    'Superstar', 'Siobhan', 'Zoe', 'Veena', 'Damayanti',
];

/**
 * 남성 목소리 이름 목록 (이름 기반 성별 추정).
 */
const MALE_VOICE_NAMES = [
    // 영국식
    'Daniel', 'Arthur', 'Gordon',
    // 기타 영어권 남성
    'Rishi',       // 인도계 영어
    'Alex', 'Fred', 'Albert', 'Eddy', 'Reed', 'Grandpa', 'Rocko',
    'Thomas', 'Oliver', 'Ralph', 'Junior', 'Boing', 'Deranged',
    'Hysterical', 'Trinoids', 'Bad News', 'Good News', 'Majed',
    'Cellos', 'Bahh', 'Pipe Organ', 'Tom', 'Bruce', 'Lee',
];

/**
 * 목소리 이름으로 성별을 추정합니다.
 */
export const classifyVoiceGender = (
    voice: SpeechSynthesisVoice
): 'female' | 'male' | 'unknown' => {
    const name = voice.name;
    if (FEMALE_VOICE_NAMES.some(f => name.includes(f))) return 'female';
    if (MALE_VOICE_NAMES.some(m => name.includes(m))) return 'male';
    // 이름 자체에 Female/Male 키워드가 있는 경우 (Google TTS 등)
    if (name.toLowerCase().includes('female')) return 'female';
    if (name.toLowerCase().includes('male')) return 'male';
    return 'unknown';
};

/**
 * 동일한 이름의 중복 목소리를 제거합니다.
 * 품질 우선순위: Premium > Enhanced > localService > 일반
 */
export const deduplicateVoices = (
    voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice[] => {
    const seen = new Map<string, SpeechSynthesisVoice>();

    for (const voice of voices) {
        // 이름에서 품질 접미사 제거하여 기본 이름 추출
        const baseName = voice.name
            .replace(/(\s*(Premium|Enhanced|Compact|Standard|Neural))$/i, '')
            .trim();

        const existing = seen.get(baseName);
        if (!existing) {
            seen.set(baseName, voice);
        } else {
            // 더 좋은 품질 버전으로 교체
            const isPremium = (v: SpeechSynthesisVoice) =>
                v.name.includes('Premium') || v.name.includes('Enhanced');
            if (isPremium(voice) && !isPremium(existing)) {
                seen.set(baseName, voice);
            } else if (voice.localService && !existing.localService) {
                seen.set(baseName, voice);
            }
        }
    }

    return Array.from(seen.values());
};

/**
 * Novelty/효과음 목소리 목록 (Auto 선택에서 제외).
 */
const NOVELTY_VOICES = [
    'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos',
    'Deranged', 'Good News', 'Hysterical', 'Junior', 'Kathy', 'Pipe Organ',
    'Princess', 'Ralph', 'Trinoids', 'Whisper', 'Zarvox', 'Rocko', 'Shelley',
    'Superstar', 'Grandma', 'Grandpa', 'Eddy', 'Flo', 'Reed', 'Sandy', 'Majed',
];

const isNovelty = (voice: SpeechSynthesisVoice): boolean =>
    NOVELTY_VOICES.some(n => voice.name.includes(n));

/**
 * 최적의 영어 목소리를 선택합니다.
 * 영국식(en-GB) 음성을 최우선으로 시도하고, 없으면 전체 영어로 폴백합니다.
 */
export const getBritishVoice = (
    voices: SpeechSynthesisVoice[],
    gender: 'female' | 'male' = 'female'
): SpeechSynthesisVoice | null => {

    const preferredVoices = {
        female: ['Kate', 'Serena', 'Stephanie', 'Martha', 'Catherine', 'Tessa', 'Google UK English Female'],
        male: ['Daniel', 'Arthur', 'Gordon', 'Google UK English Male'],
    };

    const targetNames = preferredVoices[gender];
    let result: SpeechSynthesisVoice | undefined;

    // --- 🇬🇧 영국식 음성 우선 탐색 ---

    // 1. 영국식 + Premium/Enhanced 고품질
    for (const name of targetNames) {
        result = voices.find(v =>
            v.name.includes(name) &&
            (v.name.includes('Premium') || v.name.includes('Enhanced')) &&
            isBritish(v.lang)
        );
        if (result) return result;
    }

    // 2. 영국식 + 로컬 설치(localService)
    for (const name of targetNames) {
        result = voices.find(v =>
            v.name.includes(name) &&
            v.localService === true &&
            isBritish(v.lang)
        );
        if (result) return result;
    }

    // 3. 영국식 + 선호 이름 (표준)
    for (const name of targetNames) {
        result = voices.find(v => v.name.includes(name) && isBritish(v.lang));
        if (result) return result;
    }

    // 4. 영국식 + Female/Male 키워드 포함
    const genderKeyword = gender === 'female' ? 'female' : 'male';
    result = voices.find(v =>
        isBritish(v.lang) &&
        v.name.toLowerCase().includes(genderKeyword) &&
        !isNovelty(v)
    );
    if (result) return result;

    // 5. 영국식 + Novelty 제외
    result = voices.find(v => isBritish(v.lang) && !isNovelty(v));
    if (result) return result;

    // --- 🌐 전체 영어로 폴백 (Kate가 en-US 등으로 분류된 경우 커버) ---

    // 6. 전체 영어 + Premium/Enhanced + 선호 이름
    for (const name of targetNames) {
        result = voices.find(v =>
            v.name.includes(name) &&
            (v.name.includes('Premium') || v.name.includes('Enhanced')) &&
            isEnglish(v.lang)
        );
        if (result) return result;
    }

    // 7. 전체 영어 + 로컬 설치 + 선호 이름
    for (const name of targetNames) {
        result = voices.find(v =>
            v.name.includes(name) &&
            v.localService === true &&
            isEnglish(v.lang)
        );
        if (result) return result;
    }

    // 8. 전체 영어 + 선호 이름 (표준)
    for (const name of targetNames) {
        result = voices.find(v => v.name.includes(name) && isEnglish(v.lang));
        if (result) return result;
    }

    // 9. 영국식 (최후 수단, Novelty 포함)
    result = voices.find(v => isBritish(v.lang));
    return result || null;
};
