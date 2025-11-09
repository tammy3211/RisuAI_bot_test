# 🔄 자동 리로드 기능 가이드

## ✨ 새로운 기능: 봇 데이터 자동 로드

`save/` 폴더의 봇 description 파일이 변경되면 **자동으로 에디터에 반영**됩니다!

## 📁 폴더 구조

```
editor/
└── save/
    ├── name/              <- 폴더 이름 = 봇 이름 (예: "name")
    │   ├── description.md <- 봇 설명 (자동 감지 대상)
    │   ├── first_mes.md
    │   ├── lorebook/
    │   └── regex/
    ├── alice/
    │   └── description.md
    └── bob/
        └── description.md
```

**중요**: 
- **폴더 이름** = **봇 이름** (Bot Name)
- `description.md` 파일의 내용 = 봇 설명 (Bot Description)

## 🎯 사용 방법

### 1. 개발 서버 실행

```bash
cd editor
pnpm dev
```

### 2. 에디터에서 봇 선택

1. **"저장된 봇 선택"** 라디오 버튼 클릭
2. 드롭다운에서 봇 선택 (예: "name")
3. **자동으로 봇 데이터가 로드됩니다!**
   - Bot Name: `name` (폴더 이름)
   - Bot Description: `description.md`의 내용

### 3. description.md 파일 편집

VS Code나 다른 에디터로 `save/name/description.md` 파일을 수정:

```markdown
# 수정 전
Hello, I am a bot.

# 수정 후
Hello, I am an improved bot with new features!
```

### 4. 자동 리로드 확인! 🎉

파일을 저장하면:
- ✅ Vite HMR이 변경 감지
- ✅ 봇 데이터 자동 리로드
- ✅ 에디터의 "봇 정보" 섹션 업데이트
- ✅ localStorage에 자동 저장
- ✅ **브라우저 새로고침 불필요!**

## 🔧 작동 원리

### 1. import.meta.glob으로 파일 감시

```typescript
// editor/ts/botLoader.svelte.ts
const botDescriptions = import.meta.glob('../save/**/description.md', {
  as: 'raw',
  eager: false
});
```

Vite가 `save/` 폴더의 모든 `description.md` 파일을 자동으로 감시합니다.

### 2. HMR (Hot Module Replacement)

```typescript
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // description.md 변경 감지
    loadAllBots();           // 봇 목록 새로고침
    loadSelectedBotData();   // 현재 선택된 봇 리로드
  });
}
```

### 3. localStorage 자동 저장

```typescript
export async function loadSelectedBotData() {
  const description = await loadBotDescription(editorState.selectedBot);
  
  editorState.botName = editorState.selectedBot;  // 폴더 이름 = 봇 이름
  editorState.botDescription = description;
  
  saveEditorState();  // localStorage에 저장
}
```

## 📝 새 봇 추가하기

### 1. 폴더 생성

```bash
mkdir editor/save/my-new-bot
```

### 2. description.md 파일 생성

```bash
# editor/save/my-new-bot/description.md
echo "This is my new bot!" > editor/save/my-new-bot/description.md
```

### 3. 에디터 확인

- 개발 서버가 실행 중이면 **즉시 드롭다운에 "my-new-bot" 추가됨**
- 선택하면 자동으로 로드!

## 🎨 활용 예제

### 예제 1: 캐릭터 설명 실시간 편집

1. `save/name/description.md` 열기
2. 캐릭터 성격 추가:
   ```markdown
   ## 성격
   - 밝고 긍정적
   - 호기심 많음
   - 친구 같은 존재
   ```
3. 저장 → 에디터에 즉시 반영!

### 예제 2: CBS 변수 테스트

1. description에 CBS 변수 추가:
   ```markdown
   {{char}}는 {{user}}를 도와주는 AI입니다.
   ```
2. CBS 탭에서 파싱 결과 확인

### 예제 3: 여러 봇 빠르게 전환

```bash
# 봇 A 편집
vi save/alice/description.md
# → 저장 → 에디터 확인

# 봇 B 편집
vi save/bob/description.md
# → 저장 → 에디터 확인
```

드롭다운에서 선택만 하면 즉시 전환!

## 🐛 문제 해결

### description.md 변경이 반영 안 됨

1. **파일 이름 확인**: `description.md` (오타 주의)
2. **개발 서버 재시작**:
   ```bash
   Ctrl+C
   pnpm dev
   ```
3. **브라우저 콘솔 확인**: F12 → Console 탭

### 봇이 드롭다운에 안 보임

1. **폴더 구조 확인**:
   ```
   save/
   └── my-bot/
       └── description.md  ← 이 파일 필수!
   ```
2. **개발 서버 재시작**

### localStorage 데이터 초기화

브라우저 콘솔(F12)에서:
```javascript
localStorage.removeItem('risuai-editor-state')
// 또는
localStorage.clear()
```

## 📚 관련 파일

- `editor/ts/botLoader.svelte.ts` - 봇 로드 로직
- `editor/lib/shared/BotSourceSelector.svelte` - 봇 선택 UI
- `editor/lib/shared/editorState.svelte.ts` - 전역 상태 관리
- `editor/vite-env.d.ts` - Vite 타입 정의

## 🚀 다음 단계

- [ ] `first_mes.md` 자동 로드
- [ ] `lorebook/` 폴더 자동 스캔
- [ ] `regex/` 폴더 자동 스캔
- [ ] 봇 생성 UI 추가
- [ ] 봇 삭제 기능
