# 2026-02-19: iOS 음성 문제 추가 수정 (Manual Selection)

## 📌 배경 (Background)
- 사용자가 iOS 설정에서 `Kate (Premium)` 등 고품질 음성을 설정했음에도 불구하고, 웹앱에서는 여전히 `Rocko` 등 기계음이 출력되는 현상이 지속됨.
- `speechSynthesis.getVoices()`가 반환하는 음성 목록에서 자동 선택 로직이 원하는 음성을 찾지 못하거나, 브라우저가 인식하는 이름이 예상과 다를 수 있음.

## 🛠️ 수정 내용 (Fixes)

### 1. 음성 직접 선택 기능 추가 (Manual Voice Selection)
- **Problem**: 자동 로직(Auto Logic)은 완벽하지 않으며, 사용자 기기 환경(OS 버전, 다운로드된 음성 등)에 따라 예측 불가능함.
- **Solution**: 사용자가 직접 원하는 목소리를 선택할 수 있는 **Dropdown 메뉴**를 추가.
    - `DiaryDisplay` 컴포넌트 상단에 "Voice:" 라벨과 함께 Select 박스 배치.
    - 브라우저가 인식한 **모든 영국식 영어(en-GB/en-UK)** 음성 목록을 표시.
    - 사용자가 선택한 음성은 `localStorage`에 `english-diary-voice-uri` 키로 저장되어, 재방문 시에도 유지됨.
    - "Auto (Best Available)" 옵션을 기본값으로 제공하여 기존 자동 로직도 유지.

### 2. 영국식 음성 감지 로직 완화 (Relaxed Detection)
- 기존: `lang === 'en-gb'` (엄격한 일치)
- 변경: `lang.startsWith('en-gb')` (유연한 일치)
    - 일부 기기에서 `en-GB-standard` 등의 형태로 언어 코드가 반환될 수 있는 가능성을 고려하여 감지 로직을 완화함.

### 3. Novelty Voice 필터링 유지
- 여전히 "Auto" 모드에서는 `Rocko` 등 장난감 목소리가 선택되지 않도록 블랙리스트 필터링이 작동함.

## 📝 기대 효과
- 사용자가 "Kate"를 가지고 있다면, 드롭다운 목록에서 "Kate"를 직접 눈으로 확인하고 선택할 수 있음.
- 만약 드롭다운 목록에 "Kate"가 없다면, 이는 브라우저가 해당 음성에 접근하지 못하는 것이므로 사용자에게 명확한 피드백(설정 확인 등)을 줄 수 있음.
- 더 이상 "왜 내 폰엔 Kate가 있는데 안 나오지?"라는 의문을 갖지 않고, 직접 제어 가능.
