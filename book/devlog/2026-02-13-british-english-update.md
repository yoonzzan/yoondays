# [DevLog] 2026-02-13 영국식 영어 데이 (British English Update) 🇬🇧

## 📅 개요
**Yoon English Day** 프로젝트를 영국식 영어 학습에 특화된 버전(`yoondays`)으로 업데이트했습니다.
기존의 단순 일기 생성 기능을 넘어, **영국식 표현(British English)**, **심화 문법 코칭(Deep Dive Grammar Check)**, **고품질 음성(TTS Optimization)** 기능을 중심으로 사용자 경험을 전면 개편했습니다.

## ✅ 주요 작업 내역 (Done)

### 1. 영국식 영어 선생님 페르소나 적용
- **Prompt Engineering**: AI에게 "따뜻하고 세련된 영국 영어 글쓰기 코치" 역할을 부여했습니다.
- **British Spelling & Vocab**: `colour`, `centre`, `flat`, `holiday`, `biscuit` 등 영국식 철자와 어휘를 **필수**로 사용하도록 지시했습니다.
- **Tone & Manner**: 약간의 위트(Wit)가 섞인 품격 있는 문체를 구사하도록 조정했습니다.

### 2. 심화 문법 체크 & 한국어 피드백 (Deep Dive Grammar Check)
- **기존 문제**: 단순히 오류 유무만 체크("Correct/Incorrect")하여 학습 효과가 제한적이었습니다.
- **개선**:
    - **심화 분석**: 문법적 오류뿐만 아니라, **자연스러운 영국식 표현인지**를 분석합니다.
    - **한국어 해설**: 피드백 내용은 **상세한 한국어**로 제공하여 학습자의 이해를 돕습니다.
    - **Level-Up 제안**: 문장이 맞아도 **더 고급스러운 표현(Sophisticated Alternatives)**을 함께 제안합니다.

### 3. 음성 합성 최적화 (TTS Optimization)
- **Voice Selection**: 기기(Mac, Win, iOS, Android) 내장 음성 중 **가장 자연스러운 영국 여성 목소리**를 우선 선택하도록 로직을 개선했습니다.
    - 1순위: `Martha`, `Serena` (macOS/iOS - High Quality)
    - 2순위: `Google UK English Female` (Chrome/Android)
    - 3순위: 기타 `en-GB` 여성 목소리
- **Pitch Adjustment**: 기본 톤보다 차분하고 무게감 있는 느낌을 위해 **Pitch를 0.9**로 조정했습니다.

### 4. 기술적 개선 (Technical Updates)
- **AI Model Upgrade**: `gemini-2.5-flash`에서 권장 모델인 **`gemini-3-flash-preview`**로 교체하여 응답 속도와 안정성을 확보했습니다.
- **UI/UX Refinement**: 불필요한 버튼 제거, 스크린 리더 접근성(Aria labels) 개선.
- **Repo Migration**: 원격 저장소를 `yoon-english-day`에서 **`yoondays`**로 변경하고 코드를 푸시했습니다.

## 🐛 트러블슈팅 (Troubleshooting)

### 1. Gemini API 404 Error
- **증상**: 문법 체크 시 `404 Not Found` 에러 발생.
- **원인**: 사용하려던 실험적 모델(`gemini-2.0-flash-thinking-exp-01-21`)이 현재 API 키 또는 리전에서 유효하지 않음.
- **해결**: 안정적이고 최신 모델인 **`gemini-3-flash-preview`**로 교체하여 해결.

### 2. Prompt Template Literal Syntax Error
- **증상**: 코드 수정 중 백틱(\`)이 포함된 프롬프트 문자열이 제대로 닫히지 않아 구문 오류(Syntax Error) 발생.
- **원인**: `multi_replace_file_content` 도구 사용 시 문자열 경계 처리가 미흡했음.
- **해결**: 템플릿 리터럴 내부의 백틱을 이스케이프(`\``) 처리하거나, 전체 프롬프트 블록을 재작성하여 해결.

### 3. Git Remote Conflict
- **증상**: 원격 저장소(`yoondays`) 변경 시 `git push` 실패 (non-fast-forward).
- **원인**: 원격 저장소에 이미 초기화된 파일(`README.md` 등)이 있어 로컬 히스토리와 충돌.
- **해결**: 로컬 작업 내용이 최신이므로 `git push -f origin main`으로 강제 푸시하여 동기화 완료.

## 💡 배운 점 (TIL)

- **Gemini Model Selection**: 실험적 모델(experimental)은 언제든 사라지거나 접근이 제한될 수 있으므로, 프로덕션 환경에서는 `flash` 계열의 안정적 모델이나 최신 프리뷰 모델(`gemini-3-flash-preview`)을 사용하는 것이 좋습니다.
- **Web Speech API Nuances**: 브라우저 내장 TTS는 플랫폼마다 제공하는 음성 이름이 상이합니다. Apple 기기에서는 `Martha`, `Serena`가 훌륭하지만, 윈도우나 안드로이드에서는 `Microsoft Hazel`이나 `Google UK English Female`을 찾아야 합니다. 다양한 환경을 고려한 **Fallback 로직**이 필수적입니다.
