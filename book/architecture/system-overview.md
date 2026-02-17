# [System] 영국식 영어 데이 시스템 아키텍처 (System Architecture)

## 1. 개요 (Overview)
**My English Day**는 **React** 기반의 클라이언트 사이드 애플리케이션(SPA)입니다. **Vite**를 빌드 도구로 사용하며, **Typescript**로 작성되었습니다.
핵심 기능은 **Google Gemini API**를 활용한 생성형 AI 서비스(일기 작성, 문법 코칭)와 **Web Speech API**를 이용한 원어민 음성 재생(TTS), 그리고 **Web Share API**를 통한 일기 카드 공유입니다.

## 2. 시스템 구조 (System Structure)

### 2.1 컴포넌트 및 모듈 구조 (Component Hierarchy & Modules)
```mermaid
graph TD
    subgraph View Layer
        App[App.tsx (Main Layout)] --> KeywordsInput[KeywordsInput.tsx (STT & Level Selection)]
        App --> DiaryDisplay[DiaryDisplay.tsx (Output & TTS)]
        App --> MyDiariesView[MyDiariesView.tsx (List & Image Export)]
        MyDiariesView --> DiaryCard[DiaryCard.tsx (Hidden Capture Target)]
    end

    subgraph Business Logic Layer
        App --> useDiaryStorage[hooks/useDiaryStorage.ts (State & LocalStorage)]
        App --> GeminiService[services/gemini.ts (AI API Wrapper)]
    end
    
    KeywordsInput --> SpeechRecognition[Web Speech API (STT)]
    DiaryDisplay --> SpeechSynthesis[Web Speech API (TTS)]
    MyDiariesView --> Html2Canvas[html2canvas (Image Gen)]
    MyDiariesView --> WebShare[Web Share API (Mobile Sharing)]
```

### 2.2 핵심 모듈 (Core Modules)

*   **App.tsx (Main Controller)**
    *   **Orchestration**: UI 컴포넌트와 비즈니스 로직(`hooks`, `services`)을 연결.
    *   **Global State**: `level` (Beginner/Advanced), `speechRate` 등 UI 상태 관리.

*   **services/gemini.ts (AI Service)**
    *   **API Encapsulation**: `GoogleGenAI` SDK를 초기화하고 API 키 관리.
    *   **Features**: `generateDiary` (일기 생성), `checkGrammar` (문법 체크) 함수 제공.
    *   **Prompt Engineering**: `utils/prompts.ts`에서 레벨별(Beginner/Adult) 프롬프트 로드.

*   **hooks/useDiaryStorage.ts (Data Management)**
    *   **State & Persistence**: `diaries` 상태 관리 및 `localStorage` 동기화 로직 캡슐화.
    *   **CRUD**: 일기 저장(`addDiaryEntry`), 로드, 정렬 기능 제공.

*   **MyDiariesView.tsx & DiaryCard.tsx (Export)**
    *   **Visual Generation**: `DiaryCard` 컴포넌트를 숨겨진 상태로 렌더링하고 `html2canvas`로 캡처.
    *   **Smart Sharing**: 모바일(`Web Share API`)과 PC(`download anchor`) 환경을 감지하여 최적의 공유 방식 제공.

## 3. 데이터 흐름 (Data Flow)

### 3.1 레벨별 일기 생성 (Level-Based Generation)
1.  **User Input**: 키워드 입력 및 **Level 선택 (Beginner/Adult)**.
2.  **Prompt Construction**:
    *   **Beginner**: 쉬운 단어(A1-A2), 짧은 문장.
    *   **Adult**: 고급 어휘(C1-C2), 영국식 이디엄, 원어민 뉘앙스.
3.  **API Call**: `services/gemini.ts` -> Google Gemini API.
4.  **Result**: JSON (`{english, korean}`) 반환 및 UI 표시.

### 3.2 이미지 공유 프로세스 (Image Share)
1.  **User Action**: `Download Card` 버튼 클릭.
2.  **Lazy Load**: `html2canvas` 라이브러리 동적 로딩 (Dynamic Import).
3.  **Capture**: `DiaryCard` 컴포넌트(종이 질감 디자인)를 Canvas로 변환.
4.  **Blob Conversion**: Canvas -> Blob 비동기 변환.
5.  **Share/Download**:
    *   **Mobile (Secure Context)**: `navigator.share()`로 공유 시트 호출 (Instagram, KakaoTalk 등).
    *   **Fallback (PC/HTTP)**: 파일 다운로드 링크 생성 및 자동 클릭.

### 3.3 음성 합성 프로세스 (TTS)
1.  **Priority Logic**: `Kate` > `Serena` > `Stephanie` > `Martha` 순으로 고품질 영국 여성 음성 탐색.
2.  **Async Handling**: 브라우저의 비동기 음성 로딩(`voiceschanged`)을 감지하여 UI 즉시 업데이트.

## 4. 데이터 모델 (Data Models)

### Diary Entry
```typescript
interface DiaryEntry {
  date: string; // YYYY-MM-DD
  originalContent: string; // User keywords
  sentences: {
    english: string; // British English
    korean: string;
  }[];
}
```

### Grammar Check Result
```typescript
interface GrammarCheckResult {
  isCorrect: boolean;
  feedback: string; // Korean explanation with British context
  correctedSentence: string; // Sophisticated alternative
}
```
