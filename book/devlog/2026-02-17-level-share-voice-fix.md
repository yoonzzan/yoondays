# 2026-02-17: Level, Share, and Voice Fix

## 📌 주요 작업 (Key Changes)

### 1. 사용자 레벨 선택 (Level Selection)
- **목표**: 영어 초보자와 숙련자 모두를 만족시키는 일기 생성.
- **구현**:
    - `KeywordsInput` 컴포넌트에 `Beginner` / `Adult` 옵션 추가.
    - `utils/prompts.ts`에서 레벨별 프롬프트 분기 처리.
        - **Beginner**: A1-A2 수준, 짧은 문장.
        - **Adult**: C1-C2 수준, 영국식 이디엄, 원어민 뉘앙스.

### 2. 이미지 공유 및 다운로드 (Image Share)
- **목표**: 인스타그램 감성의 일기 카드를 쉽게 저장하고 공유.
- **구현**:
    - `DiaryCard` 컴포넌트를 숨김(`position: absolute; left: -9999px`) 상태로 렌더링.
    - `html2canvas`로 캡처하여 이미지 생성.
    - **모바일**: `Web Share API` (`navigator.share`)를 사용하여 OS 기본 공유 시트 호출.
    - **PC/Fallback**: `a.download` 속성을 이용한 파일 다운로드.
- **최적화**:
    - `html2canvas` 라이브러리 용량이 크므로, 버튼 클릭 시 **Dynamic Import** (`await import('html2canvas')`) 하도록 변경하여 초기 로딩 속도 개선.

### 3. 코드 리팩토링 (Refactoring)
- **Target**: `App.tsx`의 비대함 해결.
- **분리**:
    - **API Logic** -> `services/gemini.ts` (GoogleGenAI SDK 래핑)
    - **Local Storage** -> `hooks/useDiaryStorage.ts` (Custom Hook)
- **결과**: `App.tsx`는 UI 렌더링과 이벤트 핸들링만 담당, 코드 가독성 및 유지보수성 향상.

### 4. iOS 음성 문제 해결 (Voice Issue Fix)
- **문제**: 배포 후 아이폰에서 고품질 음성(`Kate`) 대신 기계음(`Rocko`)이 출력됨.
- **원인**:
    1.  `getBritishVoice` 우선순위에서 `Martha`가 `Kate`보다 앞섬.
    2.  `speechSynthesis.getVoices()`가 비동기로 로드되는데, `useEffect`에서 시점 차이로 빈 배열을 참조함.
- **해결**:
    1.  우선순위 변경: `['Kate', 'Serena', 'Stephanie', ...]` 순서로 변경.
    2.  `voiceschanged` 이벤트 리스너에서 상태(`currentVoiceName`)를 업데이트하여 리렌더링 유발.

### 5. 배포 (Deployment)
- `package.json`의 `homepage`를 `https://yoonzzan.github.io/yoondays`로 수정.
- `App.tsx` 등 소스코드 내 하드코딩된 경로(`base: './'`) 수정.

---

## 📝 배운 점 (Learnings)

### Dynamic Import of Large Libraries
- `html2canvas`와 같은 무거운 라이브러리는 `import()` 문법을 사용하여 필요할 때만 불러오는 패턴이 성능 최적화에 매우 효과적이다.

### Web Speech API Timing Issue
- `window.speechSynthesis.getVoices()`는 브라우저마다 로딩 타이밍이 다르다. 반드시 `voiceschanged` 이벤트를 리스닝하고, **상태 업데이트(setState)**를 통해 컴포넌트가 다시 렌더링되도록 보장해야 한다. 단순히 `ref`만 업데이트하면 화면에 반영되지 않는다.

### Mobile Share via Web Share API
- `navigator.share`는 **Secure Context (HTTPS)**에서만 동작한다. 로컬 개발 환경(`http://localhost`)에서는 동작하지 않을 수 있으므로, 항상 `typeof navigator.share === 'function'` 체크와 `try-catch`로 Fallback(다운로드)을 마련해야 한다.
