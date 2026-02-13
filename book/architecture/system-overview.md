# [System] 영국식 영어 데이 시스템 아키텍처 (System Architecture)

## 1. 개요 (Overview)
**Yoon English Day**는 **React** 기반의 클라이언트 사이드 애플리케이션(SPA)입니다. **Vite**를 빌드 도구로 사용하며, **Typescript**로 작성되었습니다.
핵심 기능은 **Google Gemini API**를 활용한 생성형 AI 서비스(일기 작성, 문법 코칭)와 **Web Speech API**를 이용한 원어민 음성 재생(TTS)입니다.

## 2. 시스템 구조 (System Structure)

### 2.1 컴포넌트 구조 (Component Hierarchy)
```mermaid
graph TD
    App[App.tsx (Controller)] --> KeywordsInput[KeywordsInput.tsx (User Input)]
    App --> DiaryDisplay[DiaryDisplay.tsx (Output & Interaction)]
    App --> MyDiariesView[MyDiariesView.tsx (Storage View)]
    
    KeywordsInput --> SpeechRecognition[Speech Web API (STT)]
    DiaryDisplay --> SpeechSynthesis[Speech Web API (TTS)]
    DiaryDisplay --> Modal[Grammar Check Modal]
```

### 2.2 핵심 모듈 (Core Modules)

*   **App.tsx (Main Controller)**
    *   **State Management**: `diarySentences`, `keywords`, `speechRate`, `grammarCheckResult` 등 전역 상태 관리.
    *   **API Logic**: `GoogleGenAI` 인스턴스 생성 및 프롬프트 관리 (`handleGenerateDiary`, `handleGrammarCheck`).
    *   **Data Persistence**: `localStorage`를 이용한 일기 저장 및 불러오기 (`savedDiaries`).

*   **DiaryDisplay.tsx (Presentation & Audio)**
    *   **Rendering**: 생성된 영국 영어 일기 및 한국어 번역 표시.
    *   **Audio Control**: `speechSynthesis` API를 제어하여 재생, 일시정지, 속도 조절 기능 제공.
    *   **Voice Selection**: `voicesRef`를 통해 브라우저 내장 음성 중 최적의 영국 여성 목소리를 선택.

## 3. 데이터 흐름 (Data Flow)

### 3.1 일기 생성 프로세스 (Diary Generation)
1.  **User Input**: 사용자가 키워드(예: `rain`, `tea`) 입력.
2.  **Request**: `App.tsx`에서 **영국 영어 코치 페르소나**가 적용된 프롬프트 생성.
3.  **Process**: `Google Gemini API` (`gemini-3-flash-preview`) 호출.
4.  **Response**: JSON 형식으로 `sentences` 배열([`{english, korean}`]) 반환.
5.  **Update**: `diarySentences` 상태 업데이트 및 UI 렌더링.

### 3.2 심화 문법 체크 프로세스 (Deep Dive Grammar Check)
1.  **User Action**: 특정 문장의 `Check Grammar` 버튼 클릭.
2.  **Request**: 해당 문장과 함께 **심화 분석 프롬프트** 생성.
3.  **Process**: `Google Gemini API` 호출.
4.  **Response**: JSON 형식으로 `isCorrect`, `feedback`(한국어), `correctedSentence` 반환.
5.  **Display**: 모달 창에 분석 결과 표시.

### 3.3 음성 합성 프로세스 (Text-to-Speech)
1.  **User Action**: 재생 버튼 클릭.
2.  **Voice Selection**:
    *   시스템에 설치된 음성 목록 로드 (`window.speechSynthesis.getVoices()`).
    *   우선순위 로직 실행: `Martha` > `Serena` > `Google UK English Female` > 기타 `en-GB`.
3.  **Playback**: `SpeechSynthesisUtterance` 객체 생성 (Pitch 0.9 설정) 및 `speak()` 호출.
4.  **Event Handling**: `onend`, `onerror` 이벤트를 통해 상태(`playing`/`idle`) 동기화.

## 4. 데이터 모델 (Data Models)

### Diary Entry
```typescript
interface DiaryEntry {
  id: string;
  date: string;
  keywords: string;
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
  feedback: string; // Korean explanation
  correctedSentence: string; // Sophisticated British English alternative
}
```
