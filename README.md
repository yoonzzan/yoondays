<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🇬🇧 Yoon English Day (British Edition)

**Yoon English Day**는 당신의 하루를 아름다운 **영국식 영어 일기**로 만들어주는 AI 기반 웹 애플리케이션입니다.
단순한 키워드 몇 개만 입력하면, **Gemini 3 Flash** 모델이 문맥을 파악하여 자연스럽고 세련된 영국 영어(British English) 문장을 생성해줍니다.

## ✨ 주요 기능 (Key Features)

### 1. ✍️ 영국식 영어 일기 생성 (British English Generation)
- **키워드 기반 생성**: 오늘 하루 있었던 일(예: `sunny`, `coffee`, `relax`)을 입력하면 완벽한 일기 한 편이 완성됩니다.
- **철저한 영국식 표기**: `colour`, `centre`, `realise` 등 영국식 철자(Spelling)를 준수합니다.
- **영국적 어휘 사용**: `apartment` 대신 `flat`, `vacation` 대신 `holiday`, `cookies` 대신 `biscuits` 등 현지 어휘를 우선 사용합니다.
- **위트 있는 톤앤매너**: 딱딱한 기계 번역이 아닌, 따뜻하고 약간의 위트가 섞인 자연스러운 문체를 구사합니다.

### 2. 🧐 심화 문법 체크 & 코칭 (Deep Dive Grammar Check)
- **단순 교정 그 이상**: 문법 오류만 잡는 것이 아닙니다. 문장이 **얼마나 자연스러운지**, **영국 사람이 실제로 이렇게 쓰는지**를 분석합니다.
- **한국어 피드백**: 분석 결과와 해설은 이해하기 쉽게 **한국어**로 제공됩니다.
- **레벨업 표현 제안**: 문장이 맞아도 더 고급스러운 표현(Sophisticated Alternatives)을 제안하여 영어 실력을 높여줍니다.
- **최신 AI 모델**: 가장 빠르고 강력한 `gemini-3-flash-preview` 모델을 사용하여 실시간으로 피드백을 제공합니다.

### 3. 🎧 최적화된 음성 재생 (Optimized British Voice)
- **영국 여성 성우 우선순위**: 기기 내장 음성 중 가장 품질이 좋은 영국 여성 목소리(`Martha`, `Serena` 등)를 지능적으로 찾아 재생합니다.
- **톤(Pitch) 조절**: 기본음보다 차분하고 무게감 있는 톤(Pitch 0.9)으로 설정되어, 안정감 있는 듣기 연습이 가능합니다.
- **스마트한 에러 처리**: 재생 속도 조절 시 발생하던 끊김(interrupted) 에러를 해결하여 부드러운 청취 경험을 제공합니다.

### 4. 🎨 사용자 경험 개선 (UI/UX)
- **직관적인 인터페이스**: 불필요한 요소를 제거하고 핵심 기능에 집중했습니다.
- **접근성(Accessibility) 강화**: 스크린 리더 사용자를 위한 `aria-label` 및 키보드 네비게이션을 지원합니다.
- **반응형 디자인**: 모바일과 데스크톱 모두에서 쾌적하게 사용할 수 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)
- **Framework**: React, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini (`gemini-3-flash-preview`) via Google Gen AI SDK
- **Speech**: Web Speech API (Browser Native TTS)

---

## 🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계가 필요합니다.

### 전제 조건 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- Google Gemini API Key ([발급받기](https://aistudio.google.com/))

### 설치 및 실행

1. **저장소 클론 및 이동**
   ```bash
   git clone https://github.com/yoonzzan/yoon-english-day.git
   cd yoon-english-day
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   `.env.local` 파일을 생성하고 API 키를 입력하세요.
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:5173`으로 접속하여 확인하세요.

---

## 📝 라이선스 (License)
Copyright © 2025 yoonzzan. All rights reserved.
