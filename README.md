# 🤖 RisuAI Bot Tester

RisuAI 봇을 테스트하고 편집하는 웹 기반 에디터입니다.

## ✨ 기능

- **Chat**: editinput → editoutput → editdisplay 플로우 테스트
- **Regex**: 정규식 스크립트 작성 및 테스트 (editinput/editoutput/editdisplay)
- **Lorebook**: 로어북 항목 관리 및 키워드 매칭 테스트
- **CBS**: ChatBot Script 실시간 실행 및 결과 확인

## 🚀 시작하기

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:5173` 접속

## 📁 구조

```
RisuAI_bot_test/
├── lib/           # UI 컴포넌트 (Tailwind CSS)
│   ├── chat/      # 채팅 시뮬레이터
│   ├── regex/     # Regex 테스터
│   ├── lorebook/  # Lorebook 관리자
│   └── cbs/       # CBS 에디터
├── ts/            # RisuAI 모듈 (원본 코드)
└── save/          # 봇 데이터
    └── [name]/
        ├── description.md
        ├── regex/regex.json
        └── lorebook/lorebook.json
```

## 💡 사용법

### Chat 테스트
1. Bot Source Selector에서 봇 선택
2. 메시지 입력 → Regex/CBS 자동 적용
3. 콘솔에서 처리 과정 확인

### Regex 작성
1. Regex 탭에서 "+ 추가" 클릭
2. 패턴, 교체, 타입 입력
3. 테스터로 실시간 확인

### Lorebook 관리
1. Lorebook 탭에서 "+ 항목 추가"
2. 키워드, 컨텐츠 입력
3. `save/[name]/lorebook/` 저장

## 🛠️ 기술

- Svelte 5 (Runes)
- TypeScript
- Tailwind CSS
- Vite

## 🔗 링크

- [RisuAI 메인](https://github.com/kwaroran/RisuAI)

---

Made with ❤️ for RisuAI
