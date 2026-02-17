# Project Context (Context)

**Last Updated:** 2026-02-17
**Version:** 2.1.0 (Level & Share Update)

## 📌 현재 상태 (Current Status)
**My English Day**는 **영국식 영어 일기** 생성 및 **공유** 기능을 갖춘 완성형 앱으로 도약했습니다.
사용자는 자신의 레벨(Beginner/Adult)에 맞춰 학습할 수 있으며, 예쁜 일기 카드를 인스타그램 등으로 공유할 수 있습니다.

## ✅ 최근 작업 내역 (Recent Changes)
- **[2026-02-17] Level & Share Feature Update**
    - **Level Selection**: 👶 Beginner(쉬운 영어) vs 🧑 Adult(고급 영국 영어) 선택 기능 추가.
    - **Image Share**: `html2canvas` + `Web Share API`를 활용한 감성 일기 카드 공유/다운로드.
    - **Refactoring**: `services/gemini.ts`, `hooks/useDiaryStorage.ts` 분리로 코드 구조 개선.
    - **Performance**: 무거운 라이브러리(`html2canvas`) 동적 임포트(Dynamic Import) 적용.
    - **UI/UX**: 모바일 최적화 및 아이폰 음성(Kate/Serena) 우선순위 로직 강화.
    - **Deploy**: `https://yoonzzan.github.io/yoondays` 배포 완료.

## 🚀 다음 단계 (Next Steps)
- **Monitoring**: 배포 후 모바일 환경에서의 공유/음성 재생 안정성 모니터링.
- **User Feedback**: 레벨별 난이도 적절성 및 디자인 만족도 체크.
- **Future Features**:
    - **Calendar View**: 월별 일기 모아보기.
    - **Streak Tracking**: 연속 학습일수 추적.

## 📂 문서화 (Documentation)
- **Architecture**: `book/architecture/system-overview.md` (Updated)

### 📜 개발 로그 (DevLogs History)
- **[2026-02-17] Level & Share Update**: `book/devlog/2026-02-17-level-share-voice-fix.md`
- **[2026-02-13] British English Update**: `book/devlog/2026-02-13-british-english-update.md`
