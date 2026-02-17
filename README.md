<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🇬🇧 My English Day (British Edition)

**My English Day**는 당신의 하루를 아름다운 **영국식 영어 일기**로 만들어주는 AI 기반 웹 애플리케이션입니다.
단순한 키워드 몇 개만 입력하면, **Gemini 3 Flash** 모델이 문맥을 파악하여 자연스럽고 세련된 영국 영어(British English) 문장을 생성해줍니다.

## ✨ 주요 기능 (Key Features)

### 1. 🎯 레벨별 맞춤 일기 생성 (Level Selection)
- **👶 Beginner (초급)**: 영어를 처음 시작하는 분들을 위해 쉽고 간결한 문장(A1-A2 수준)으로 작성됩니다. 아이들도 읽기 쉬운 단어를 사용합니다.
- **🧑 Adult (고급)**: 원어민처럼 세련되고 풍부한 영국식 표현(C1-C2 수준)을 배우고 싶은 분들을 위한 모드입니다.

### 2. ✍️ 영국식 영어 학습 (Authentic British English)
- **키워드 기반 생성**: 오늘 하루 있었던 일(예: `sunny`, `coffee`, `relax`)을 입력하면 완벽한 일기 한 편이 완성됩니다.
- **철저한 영국식 표기**: `colour`, `centre`, `realise` 등 영국식 철자(Spelling)를 준수합니다.
- **영국적 어휘 사용**: `apartment` -> `flat`, `vacation` -> `holiday`, `cookies` -> `biscuits` 등 현지 어휘를 우선 사용합니다.

### 3. 📸 감성 일기 카드 공유 (Share & Export)
- **클래식 페이퍼 디자인**: 따뜻한 종이 질감의 예쁜 카드 이미지로 일기를 소장하세요.
- **스마트 공유 (Mobile)**: 모바일에서는 **[공유하기]** 버튼을 통해 인스타그램, 카카오톡 등으로 바로 보낼 수 있습니다.
- **이미지 다운로드 (PC)**: PC에서는 고화질 이미지로 바로 저장됩니다.

### 4. 🧐 심화 문법 체크 & 코칭 (Deep Dive Grammar Check)
- **단순 교정 그 이상**: 문법 오류 교정뿐만 아니라, **"영국 사람이라면 이렇게 말해요"** 식의 자연스러운 표현을 제안합니다.
- **한국어 피드백**: 분석 결과와 해설은 이해하기 쉽게 **한국어**로 제공됩니다.

### 5. 🎧 최적화된 음성 재생 (Optimized British Voice)
- **고품질 영국 발음**: 기기 내장 음성 중 가장 자연스러운 영국 여성 목소리(`Serena`, `Stephanie` 등)를 찾아 재생합니다.
- **음성 문제 해결 가이드**: 아이폰에서 기계음이 들릴 경우, 해결 방법(고품질 음성 다운로드)을 앱 내에서 안내합니다.

---

## 🛠️ 기술 스택 (Tech Stack)
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini (`gemini-3-flash-preview`)
- **Features**: 
    - `html2canvas` (Image Generation)
    - `Web Share API` (Native Mobile Sharing)
    - `Web Speech API` (TTS & STT)

---

## 🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계가 필요합니다.

### 전제 조건 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- Google Gemini API Key ([발급받기](https://aistudio.google.com/))

### 설치 및 실행

1. **저장소 클론 및 이동**
   ```bash
   git clone https://github.com/yoonzzan/yoondays.git
   cd yoondays
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
Copyright © 2026 yoonzzan. All rights reserved.
