# [Spec] 기술 명세서 및 API 문서 (Technical Specifications)

## 1. 개요 (Overview)
본 문서는 **Yoon English Day** 애플리케이션의 핵심 비즈니스 로직(일기 생성, 문법 코칭, 음성 처리)에 대한 기술적 세부사항을 정의합니다.
Google Gemini API와의 프롬프트 엔지니어링 전략 및 Web Speech API의 구체적인 구현 방식을 포함합니다.

## 2. Gemini API Intergrations (App.tsx)

### 2.1 일기 생성 (Generate Diary)
사용자가 입력한 키워드를 바탕으로 자연스러운 **영국식 영어** 일기를 생성합니다.

*   **함수명**: `handleGenerateDiary(keywords: string)`
*   **AI Model**: `gemini-3-flash-preview`
*   **입력 (Input)**: 사용자 키워드 문자열 (예: "sunny, park, coffee")
*   **출력 (Output)**: `DiarySentence[]` (JSON Schema)
    ```typescript
    interface DiarySentence {
      english: string; // British English text
      korean: string;  // Korean translation
    }
    ```
*   **프롬프트 전략 (Prompt Engineering)**:
    - **Persona**: "Warm, sophisticated British English writing coach".
    - **Constraint**:
        - 반드시 영국식 철자(`colour`, `centre`, `organise`) 사용.
        - 영국식 어휘(`flat`, `lift`, `holiday`, `biscuit`, `autumn`) 우선.
        - 위트 있고 품격 있는 문체 구사.

### 2.2 심화 문법 체크 (Deep Dive Grammar Check)
선택된 문장에 대해 심층 분석을 수행하고, **한국어 피드백**을 제공합니다.

*   **함수명**: `handleGrammarCheck(sentence: string)`
*   **AI Model**: `gemini-3-flash-preview`
*   **입력 (Input)**: 분석할 영어 문장 (string)
*   **출력 (Output)**: `GrammarCheckResult` (JSON Schema)
    ```typescript
    interface GrammarCheckResult {
      isCorrect: boolean;
      feedback: string;          // Detailed explanation in Korean
      correctedSentence: string; // Suggested improvement in British English
    }
    ```
*   **프롬프트 전략 (Prompt Engineering)**:
    - **Goal**: 단순 오류 수정이 아닌, **표현력 향상(Elevate)** 및 **교육(Teach)**.
    - **Logic**:
        - 문법이 맞더라도 더 세련된 영국식 표현이 있다면 제안할 것.
        - **피드백(`feedback`)은 반드시 한국어로 작성.**
        - 칭찬과 격려를 아끼지 않는 "영국 선생님" 톤 유지.

## 3. Web Speech API (DiaryDisplay.tsx)

### 3.1 음성 합성 및 제어 (Speech Synthesis)
브라우저 내장 TTS 엔진을 사용하여 영국식 영어 발음을 재생합니다.

*   **함수명**: `togglePlayPause(text: string, lang: 'english' | 'korean', index: number)`
*   **음성 선택 로직 (Voice Selection Strategy)**:
    1.  **Prioritized Voices**: 플랫폼별 고품질 영국 여성 음성을 우선 탐색.
        - `Martha` (macOS/iOS - Best)
        - `Serena` (macOS/iOS - Excellent)
        - `Google UK English Female` (Chrome/Android)
        - `Microsoft Hazel`, `Microsoft Susan` (Windows)
    2.  **Fallback**: 위 목록에 없으면 `lang` 속성이 `en-GB` 또는 `en-UK`인 음성 중 `Female` 키워드가 포함된 음성 선택.
    3.  **Last Resort**: `en-GB` 언어 코드를 가진 아무 음성이나 선택.
*   **음성 설정 (Audio Settings)**:
    - **Pitch**: `0.9` (기본값 `1.0`보다 약간 낮고 차분한 톤으로 설정).
    - **Rate**: 사용자 설정값(`speechRate`) 반영 (`0.8` ~ `1.2`).
*   **에러 처리 (Error Handling)**:
    - `onerror` 이벤트 리스너에서 `interrupted` 및 `canceled` 에러는 무시(Ignore)하여, 재생 중 속도 조절이나 중지 시 불필요한 에러 로그 방지.
