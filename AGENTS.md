# RisuAI Bot Test Project - Architecture Guide

이 문서는 RisuAI 봇 테스트 프로젝트의 구조와 작동 방식을 설명합니다. 다른 AI 에이전트가 이 프로젝트를 이해하고 이어서 작업할 수 있도록 작성되었습니다.

## 📋 프로젝트 개요

**목적**: RisuAI 캐릭터의 Lorebook, Regex, CBS(Chat Bot Script), 채팅 기능을 독립적으로 테스트할 수 있는 도구

**기술 스택**:
- Svelte 5 (runes 사용)
- TypeScript
- Vite
- Tailwind CSS

**핵심 철학**: 원본 RisuAI 프로젝트(`../src/`)의 모듈을 최대한 재사용하되, 플랫폼 의존성(Tauri, 데이터베이스 등)은 모킹하여 독립 실행 가능하도록 구성

---

## 🔄 원본 프로젝트 모듈 통합 방식

### 1. Import 경로
```typescript
// 원본 RisuAI 모듈 import
import { processScriptFull } from '../../src/ts/process/scripts';
import { risuChatParser } from '../../src/ts/parser.svelte';
```

### 2. Vite 플러그인을 통한 Import 우회

#### `vite-plugin-mock-globalapi.ts`
**목적**: 원본 RisuAI의 `globalApi.svelte.ts`를 `platform-shim.ts`로 리다이렉트

**작동 방식**:
```typescript
// 모든 globalApi.svelte import를 platform-shim.ts로 치환
resolveId(source) {
  if (source.includes('globalApi.svelte')) {
    return mockPath; // platform-shim.ts
  }
}
```

**이유**: `globalApi.svelte.ts`는 Tauri, 데이터베이스 등 플랫폼 의존성이 있어 독립 실행 불가. 모킹된 버전으로 대체.

#### `vite-plugin-patch-scripts.ts`
**목적**: `scripts.ts`의 `resetScriptCache()` 함수 패치

**패치 내용**:
```typescript
// Before
processScriptCache = new Map()

// After
try {
  processScriptCache = new Map()
} catch (e) {
  // processScriptCache not yet initialized
}
```

**이유**: 초기화 시점 문제로 undefined 에러 발생 방지

#### `vite-plugin-watch-bots.ts`
**목적**: `save/` 폴더의 봇 파일 변경 시 자동 리로드

**작동 방식**:
```typescript
server.watcher.on('change', (path) => {
  if (path.includes('save')) {
    server.ws.send({ type: 'full-reload' });
  }
});
```

### 3. Vite 설정 (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [
    patchScriptsPlugin(),    // MUST be first
    mockGlobalApiPlugin(),   // Import 우회
    wasm(),                  // WebAssembly 지원
    topLevelAwait(),         // Top-level await 지원
    svelte({
      compilerOptions: { runes: true }
    }),
    watchBotsPlugin()        // 파일 감시
  ],
  resolve: {
    alias: {
      // globalApi.svelte를 platform-shim.ts로 치환
      [path.resolve(__dirname, '../src/ts/globalApi.svelte.ts')]: 
        path.resolve(__dirname, './ts/platform-shim.ts'),
      '@src': path.resolve(__dirname, '../src'),
      'src': path.resolve(__dirname, '../src')
    }
  }
});
```

---

## 📁 프로젝트 구조

```
RisuAI_bot_test/
├── lib/                    # UI 컴포넌트
│   ├── chat/              # 채팅 탭
│   ├── lorebook/          # 로어북 탭
│   ├── regex/             # Regex 탭
│   ├── cbs/               # CBS 탭
│   ├── shared/            # 공유 컴포넌트 및 상태
│   └── UI/                # 재사용 가능한 UI 컴포넌트
├── ts/                    # TypeScript 유틸리티 모듈
├── save/                  # 봇 데이터 (description.md, lorebook 등)
├── vite-plugin-*.ts       # Vite 플러그인
└── vite.config.ts         # Vite 설정
```

---

## 🔧 핵심 TypeScript 모듈 (`ts/`)

### `platform-shim.ts`
**역할**: 원본 RisuAI의 `globalApi.svelte.ts` 모킹

**제공 함수**:
- `getUserName()`, `getPersonaPrompt()` - 사용자 정보
- `getChatVar()`, `setChatVar()` - 채팅 변수 관리
- `getDatabase()` - 모킹된 데이터베이스 반환

**핵심 기능**:
```typescript
// 채팅 변수 저장소
let _chatVariables: {[key: string]: string} = {};

export function setChatVar(key: string, value: string) {
  _chatVariables[key] = value;
  
  // CRITICAL: chat.scriptstate에도 동기화
  if (_mockDatabase.characters?.[0]?.chats?.[0]?.scriptstate) {
    _mockDatabase.characters[0].chats[0].scriptstate['$' + key] = value;
  }
}
```

**중요**: `setChatVar`는 `_chatVariables`와 `chat.scriptstate` 양쪽에 저장해야 `{{setvar::}}`가 작동함.

### `mockDatabase.ts`
**역할**: RisuAI의 데이터베이스 구조를 모킹

**핵심 타입**:
- `Character` - 캐릭터 데이터 구조
- `Chat` - 채팅 세션 (`message`, `scriptstate`, `localLore` 등)
- `LorebookEntry` - 로어북 항목

**핵심 함수**:
- `getMockDatabase()` - 기본 데이터베이스 구조 생성
- `getCurrentCharacter()` - 현재 선택된 캐릭터 반환
- `getCurrentChat()` - 현재 채팅 세션 반환
- `setCurrentChat()` - 채팅 업데이트

**DBState 동기화**:
```typescript
// 원본 RisuAI의 DBState에 모킹 데이터 주입
const { DBState } = await import('src/ts/stores.svelte');
Object.assign(DBState.db, getMockDatabase());
```

### `ChatParser.ts`
**역할**: 채팅 메시지 처리 및 CBS 변수 동기화

**핵심 함수**:

#### `processScriptFull` 래퍼
```typescript
async function processWithSync(text: string, mode: 'editinput' | 'editoutput' | 'editdisplay') {
  syncEditorToScriptState();   // editorState → chat.scriptstate
  const result = await processScriptFull(char, text, mode, ...);
  syncScriptStateToEditor();   // chat.scriptstate → editorState
  return result.data;
}
```

#### CBS 변수 동기화
```typescript
// editorState.customVars ↔ chat.scriptstate 동기화
function syncScriptStateToEditor() {
  for (const key in chat.scriptstate) {
    if (key.startsWith('$')) {
      editorState.customVars[key.substring(1)] = String(chat.scriptstate[key]);
    }
  }
}

function syncEditorToScriptState() {
  for (const key in editorState.customVars) {
    // scriptstate에 없는 변수만 추가 (setChatVar로 변경된 값 보존)
    if (!('$' + key in chat.scriptstate)) {
      chat.scriptstate['$' + key] = editorState.customVars[key];
    }
  }
}
```

**중요**: `syncEditorToScriptState()`는 기존 값을 덮어쓰지 않음. `setChatVar()`로 변경된 값이 유지되도록 병합 방식 사용.

#### 채팅 플로우
```typescript
export async function simulateUserInputFlow(userInput: string) {
  // 1. CBS 변수 실행 ({{var::}}, {{getvar::}} 등)
  const parsed = risuChatParser(userInput, { runVar: true });
  
  // 2. editinput 처리 ({{input::}} 등)
  const processed = await processUserInput(parsed);
  
  // 3. 메시지 저장
  chat.message.push({ role: 'user', data: processed });
  
  // 4. localStorage 저장
  saveChatToLocalStorage();
  
  // 5. Start 트리거 실행
  await runTrigger(char, 'start', { chat });
}
```

#### localStorage 관리
```typescript
// 채팅 메시지만 저장 (변수는 editorState에서 별도 관리)
export function saveChatToLocalStorage() {
  const chatData = {
    messages: chat.message || [],
    savedAt: Date.now()
  };
  saveJSON('risuai_bot_test_chat', chatData);
}
```

**중요**: `customVars`는 `editorState`에서 자동 저장되므로 여기서는 메시지만 저장.

### `lorebookRunner.ts`
**역할**: 로어북 활성화 테스트

**원본 모듘**: `src/ts/process/lorebook.svelte.ts`의 `loadLoreBookPrompt()` 사용

**핵심 함수**:
```typescript
export async function testLorebookActivation(
  botData: any,
  inputText: string,
  depthLimit: number = 3
): Promise<{
  activatedEntries: ActivatedEntry[];
  prompt: string;
  recursionDepth: number;
}> {
  // DBState에 봇 데이터 주입
  Object.assign(DBState.db, mockDb);
  
  // 원본 loadLoreBookPrompt 실행
  const result = await loadLoreBookPrompt({
    chara: mockChar,
    currentChat: mockChat,
    recursiveCharCount: 3000,
    depthLimit: depthLimit
  });
  
  return result;
}
```

### `regexProcessor.ts`
**역할**: Regex 스크립트 테스트

**원본 모듈**: `src/ts/process/scripts.ts`의 `runRegex()` 사용

**핵심 함수**:
```typescript
export async function processRegexScripts(
  text: string,
  scripts: RegexScript[],
  mode: 'editinput' | 'editoutput' | 'editdisplay'
): Promise<string> {
  // Regex 스크립트를 순차 실행
  let result = text;
  for (const script of scripts) {
    result = await runRegex(mockChar, result, mode, script);
  }
  return result;
}
```

### `promptPreview.ts`
**역할**: 프롬프트 미리보기 생성

**원본 모듈**: `src/ts/process/prompt.ts`의 `processPrompt()` 사용

**핵심 함수**:
```typescript
export async function generatePromptPreview(
  botData: any,
  userInput: string,
  chatHistory: Message[]
): Promise<{
  systemPrompt: string;
  fullPrompt: string;
  tokens: number;
}> {
  // DBState에 봇 및 채팅 데이터 주입
  Object.assign(DBState.db, finalDb);
  
  // 원본 processPrompt 실행
  const result = await processPrompt({
    chat: mockChat,
    character: mockChar
  });
  
  return result;
}
```

---

## 🎨 UI 탭 구조

### App.svelte
**역할**: 메인 앱 컨테이너, 탭 전환

**탭 목록**:
- `chat` - 채팅 테스트
- `lorebook` - 로어북 테스트
- `regex` - Regex 테스트
- `cbs` - CBS 변수 테스트

### 공유 모듈 (`lib/shared/`)

#### `editorState.svelte.ts`
**역할**: 전역 상태 관리 (Svelte 5 runes)

**저장 데이터**:
```typescript
{
  botSource: 'custom' | 'saved',  // 봇 소스 선택
  savedBots: string[],            // 저장된 봇 목록
  selectedBot: string,            // 선택된 봇 이름
  userName: string,               // 사용자 이름
  userPersona: string,            // 사용자 페르소나
  botName: string,                // 커스텀 봇 이름
  botDescription: string,         // 커스텀 봇 설명
  customVars: {[key: string]: string}  // CBS 변수
}
```

**자동 저장**:
```typescript
// Proxy를 사용한 자동 저장 (customVars 제외)
const stateHandler: ProxyHandler<any> = {
  set(target, prop, value) {
    target[prop] = value;
    
    // customVars 변경은 무시 (수동 저장)
    if (prop === 'customVars') return true;
    
    // 다음 틱에 저장 (배치 처리)
    queueMicrotask(() => {
      saveJSON(STORAGE_KEY, dataToSave);
    });
    
    return true;
  }
};
```

**중요**: `customVars`는 자동 저장 대상에서 제외. `addCustomVar()`, `removeCustomVar()` 또는 채팅 저장 시에만 저장.

#### `botLoader.svelte.ts`
**역할**: `save/` 폴더에서 봇 데이터 로드 (HMR 지원)

**핵심 함수**:
```typescript
// save/*/description.md 로드
export async function loadBotDescription(botName: string): Promise<string> {
  const response = await fetch(`/save/${botName}/description.md?t=${Date.now()}`);
  return response.text();
}

// save/*/regex/*.md 로드 (재귀)
export async function loadBotRegexScripts(botName: string): Promise<RegexScript[]> {
  const modules = import.meta.glob('/save/**/*.md', { eager: false });
  // ... 패턴 매칭 및 파싱
}

// 전체 봇 데이터 로드
export async function loadSelectedBotData() {
  const [description, regexScripts, lorebooks, firstMessage, assets, triggerScript, backgroundHTML] = 
    await Promise.all([
      loadBotDescription(botName),
      loadBotRegexScripts(botName),
      loadBotLorebooks(botName),
      // ...
    ]);
  
  // editorState.currentBot에 저장
  // mockDatabase 동기화
}
```

#### `localStorage.svelte.ts`
**역할**: localStorage 읽기/쓰기 헬퍼

```typescript
export function loadJSON<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

export function saveJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
```

#### `BotSettings.svelte`
**역할**: 봇 선택 UI (커스텀 vs 저장된 봇)

**기능**:
- 봇 소스 선택 (`BotSourceSelector`)
- 커스텀 봇: 이름/설명 입력
- 저장된 봇: `save/` 폴더에서 로드

---

## 📋 각 탭 상세

### 1. Chat 탭 (`lib/chat/`)

#### `ChatTab.svelte`
**레이아웃**: 2열 (채팅 화면 | 봇 설정)

**컴포넌트**:
- `ChatScreen` - 채팅 UI
- `BotSettings` - 봇 선택/설정

#### `ChatScreen.svelte`
**기능**:
- 메시지 입력 및 전송 (User/AI 역할 선택)
- 메시지 편집/삭제
- 첫 메시지(First Message) 표시
- Clear 버튼 (메시지 초기화)
- 확장 버튼 → `RisuAIoriginScreen` 전체 화면 표시

**원본 모듈 사용**:
- `processScriptFull` (from `ChatParser.ts`)
- `processDisplay` (표시용 파싱)

**복제 기능**:
- 메시지 렌더링 로직 (자체 구현)
- localStorage 저장/로드 (자체 구현)

**핵심 코드**:
```typescript
async function sendMessage() {
  if (selectedRole === 'user') {
    // User 입력만 처리 (AI 응답 자동 생성 안 함)
    await simulateUserInputFlow(inputText);
  } else {
    // AI 응답으로 처리
    await simulateAIResponseFlow(inputText);
  }
  await hydrateMessages(); // 메시지 표시 업데이트
}
```

#### `RisuAIoriginScreen.svelte`
**기능**: 원본 RisuAI 스타일 채팅 화면 (전체 화면 모드)

**원본 모듈 사용**:
- `BackgroundDom.svelte` (from `src/lib/ChatScreens/`)
- `copyDefaultChatScreen.svelte` (복제 + 수정)

**동기화**:
```typescript
$effect(() => {
  // editorState.currentBot.backgroundHTML → DBState 동기화
  const backgroundHTML = editorState.currentBot?.data?.backgroundHTML;
  if (DBState.db?.characters?.[0]) {
    DBState.db.characters[0].backgroundHTML = backgroundHTML || '';
  }
});
```

#### `copyDefaultChatScreen.svelte`
**역할**: 원본 RisuAI의 `DefaultChatScreen.svelte` 복제 (읽기 전용 미리보기)

**원본 모듈 사용**:
- `ParseMarkdown` (메시지 렌더링)

**복제 기능**:
- 메시지 표시 UI
- 스크롤 처리
- 읽기 전용 입력창 (더미)

### 2. Lorebook 탭 (`lib/lorebook/`)

#### `LorebookTab.svelte`
**레이아웃**: 3열 (봇 목록 | 로어북 목록 | 테스터)

**컴포넌트**:
- `BotList` - 저장된 봇 목록
- `LorebookList` - 로어북 항목 목록
- `LorebookDetail` - 항목 상세 정보
- `LorebookTester` - 활성화 테스트

#### `LorebookTester.svelte`
**기능**:
- 입력 텍스트로 로어북 활성화 테스트
- 활성화된 항목 표시
- 재귀 깊이 제한 설정

**원본 모듈 사용**:
- `loadLoreBookPrompt` (from `lorebookRunner.ts` → `src/ts/process/lorebook.svelte.ts`)

**핵심 코드**:
```typescript
async function runTest() {
  const result = await testLorebookActivation(
    botData,
    inputText,
    recursionDepth
  );
  
  activatedEntries = result.activatedEntries;
  generatedPrompt = result.prompt;
}
```

### 3. Regex 탭 (`lib/regex/`)

#### `RegexTab.svelte`
**레이아웃**: 2열 (Regex 목록 | 테스터)

**컴포넌트**:
- `RegexItem` - Regex 스크립트 항목
- `RegexTester` - 실시간 테스트

#### `RegexTester.svelte`
**기능**:
- 입력 텍스트에 Regex 적용
- 모드 선택 (editinput/editoutput/editdisplay)
- Before/After 비교 표시

**원본 모듈 사용**:
- `runRegex` (from `regexProcessor.ts` → `src/ts/process/scripts.ts`)

**핵심 코드**:
```typescript
async function testRegex() {
  const result = await processRegexScripts(
    inputText,
    regexScripts,
    mode
  );
  
  outputText = result;
}
```

### 4. CBS 탭 (`lib/cbs/`)

#### `CBSTab.svelte`
**기능**:
- CBS 변수 목록 표시/편집
- CBS 스크립트 테스트 (`CBSParser`)

**원본 모듈 사용**:
- `risuChatParser` (CBS 변수 실행)

**핵심 코드**:
```typescript
// 변수 추가
editorState.addCustomVar(key, value);

// CBS 스크립트 테스트
const parsed = risuChatParser(inputText, { 
  runVar: true,
  chara: currentChar 
});
```

---

## 🔑 핵심 작동 원리

### 1. CBS 변수 흐름 (`{{setvar::}}`, `{{getvar::}}`)

```
[사용자 입력: "{{setvar::name::Alice}}"]
    ↓
[risuChatParser (runVar: true)]
    ↓ CBS 함수 실행
[setChatVar('name', 'Alice')] (platform-shim.ts)
    ↓
[_chatVariables.name = 'Alice']
[chat.scriptstate.$name = 'Alice']  ← 중요!
    ↓
[processScriptFull 실행]
    ↓
[syncScriptStateToEditor()] (ChatParser.ts)
    ↓
[chat.scriptstate → editorState.customVars 동기화]
    ↓
[editorState.customVars.name = 'Alice']
    ↓
[saveEditorState()] - localStorage 저장
```

**주의**: `setChatVar`는 `chat.scriptstate`도 업데이트해야 함! 그래야 `syncScriptStateToEditor`가 변경을 감지.

### 2. Lorebook 활성화 흐름

```
[사용자 입력: "Tell me about dragons"]
    ↓
[testLorebookActivation()] (lorebookRunner.ts)
    ↓
[DBState에 봇 데이터 주입]
    ↓
[loadLoreBookPrompt()] (원본 RisuAI 함수)
    ↓
[로어북 항목 검색 (key 매칭)]
    ↓
[재귀적 활성화 (depth limit)]
    ↓
[활성화된 항목 반환]
```

### 3. 메시지 저장/로드 흐름

```
[메시지 전송]
    ↓
[chat.message.push({ role, data })]
    ↓
[saveChatToLocalStorage()] (ChatParser.ts)
    ↓
[localStorage에 messages만 저장]
    ↓
[editorState.customVars는 별도 저장]
    
[새로고침]
    ↓
[loadChatFromLocalStorage()]
    ↓
[chat.message 복원]
    ↓
[editorState.customVars → chat.scriptstate 동기화]
    ↓
[hydrateMessages()] - 메시지 표시
```

---

## 🚨 중요 주의사항

### 1. `$effect` 사용 규칙
- **최상위 레벨에서만 사용** 가능
- `onMount` 내부에서 사용 불가
- 컴포넌트 외부(모듈 레벨)에서 사용 불가

**잘못된 예**:
```typescript
onMount(() => {
  $effect(() => { /* ... */ }); // ❌ effect_orphan 에러
});
```

**올바른 예**:
```typescript
let initialized = $state(false);

$effect(() => {
  if (!initialized) {
    // 초기화
    initialized = true;
  } else {
    // 변경 감지
  }
});
```

### 2. CBS 변수 동기화 주의점

**문제**: `syncEditorToScriptState()`가 `chat.scriptstate`를 무조건 덮어쓰면 `setChatVar`로 변경된 값이 사라짐.

**해결**: 병합 방식 사용
```typescript
function syncEditorToScriptState() {
  // scriptstate에 없는 변수만 추가
  for (const key in editorState.customVars) {
    if (!('$' + key in chat.scriptstate)) {
      chat.scriptstate['$' + key] = editorState.customVars[key];
    }
  }
}
```

### 3. localStorage 무한 루프 방지

**문제**: `editorState.$effect`가 `customVars` 변경을 감지 → 저장 → 다시 변경 감지 → 무한 루프

**해결**: `customVars`를 자동 저장 대상에서 제외
```typescript
// Proxy에서 customVars 무시
if (prop === 'customVars') return true;
```

### 4. DBState 동기화 타이밍

**문제**: `BackgroundDom.svelte`는 `DBState`를 읽지만, 봇 데이터는 `editorState`에 있음.

**해결**: 컴포넌트 마운트 시 동기화
```typescript
$effect(() => {
  const backgroundHTML = editorState.currentBot?.data?.backgroundHTML;
  DBState.db.characters[0].backgroundHTML = backgroundHTML || '';
});
```

---

## 📦 외부 의존성

### 원본 RisuAI 모듈 (직접 사용)
- `src/ts/process/scripts.ts` - `processScriptFull`, `runRegex`
- `src/ts/process/triggers.ts` - `runTrigger`
- `src/ts/process/lorebook.svelte.ts` - `loadLoreBookPrompt`
- `src/ts/process/prompt.ts` - `processPrompt`
- `src/ts/parser.svelte.ts` - `risuChatParser`, `ParseMarkdown`
- `src/ts/storage/database.svelte` - 타입 정의
- `src/ts/stores.svelte` - `DBState`, `selectedCharID`
- `src/lib/ChatScreens/BackgroundDom.svelte` - 배경 렌더링

### 모킹된 모듈
- `globalApi.svelte.ts` → `platform-shim.ts`
- 데이터베이스 → `mockDatabase.ts`

---

## 🛠️ 개발 시 참고사항

### 새로운 기능 추가 시

1. **원본 모듈 사용 가능성 확인**
   - `src/ts/`에서 필요한 함수 찾기
   - import 경로: `../../src/ts/...`

2. **플랫폼 의존성 체크**
   - Tauri API 사용 → 모킹 필요
   - 데이터베이스 직접 접근 → `mockDatabase` 사용
   - globalApi 사용 → `platform-shim` 확인

3. **상태 관리**
   - 전역 상태 → `editorState`에 추가
   - 로컬 상태 → `$state` 사용
   - 자동 저장 필요 → `editorState` Proxy 로직 수정

4. **테스트**
   - 새로고침 후 상태 복원 확인
   - localStorage 저장/로드 확인
   - 원본 RisuAI 동작과 일치 여부 확인

### 디버깅 팁

```typescript
// 1. CBS 변수 동기화 확인
console.log('[ChatParser][setvar]', chat.scriptstate);
console.log('[editorState]', editorState.customVars);

// 2. DBState 상태 확인
import { DBState } from 'src/ts/stores.svelte';
console.log('[DBState]', DBState.db);

// 3. localStorage 확인
console.log(localStorage.getItem('risuai-editor-state'));
console.log(localStorage.getItem('risuai_bot_test_chat'));
```

---

## 📚 추가 참고자료

- [Svelte 5 Runes 문서](https://svelte.dev/docs/svelte/what-are-runes)
- [Vite 플러그인 API](https://vitejs.dev/guide/api-plugin.html)
- [RisuAI 원본 프로젝트](../src/)

---

**작성일**: 2025-11-18  
**버전**: 1.0  
**작성자**: AI Agent
