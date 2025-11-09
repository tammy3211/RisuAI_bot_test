# RisuAI Module Tester# RisuAI Character Editor & Tester



RisuAI의 CBS, Chat, Lorebook, Regex 모듈을 테스트할 수 있는 Svelte 기반 웹 에디터입니다.RisuAI 프로젝트에서 사용할 수 있는 캐릭터 봇을 만들 때 CBS, Lua Script, Regex Trigger 등을 쉽게 테스트하고 실험할 수 있는 웹 기반 에디터입니다.



## 🎯 주요 기능## 🎯 주요 기능



- ✅ **실제 RisuAI 모듈 통합**: CBS, Chat, Lorebook, Regex 모듈을 직접 import하여 사용### 1. **CBS Script 테스터** ⭐ NEW - 실제 CBS 파서 통합

- ✅ **Svelte 5**: 최신 Svelte runes 지원- **실제 RisuAI의 CBS 엔진을 사용**하여 정확한 테스트 가능

- ✅ **탭 기반 UI**: 채팅, Lorebook, Regex, CBS 테스트를 쉽게 전환- CBS (ChatBot Script) 코드를 작성하고 즉시 테스트

- ✅ **의존성 자동 해결**: Vite를 통해 모든 RisuAI 모듈 의존성 자동 import- 실시간 출력 확인

- 변수, 조건문 등 CBS 기능 실험

## 📁 프로젝트 구조- Playground의 Syntax 기능과 동일한 파싱 엔진 사용



```### 2. **Lua Script 에디터**

editor/- Lua 스크립트 작성 및 저장

├── App.svelte                    # 메인 Svelte 컴포넌트 (UI + 탭 전환)- 스크립트 구문 확인

├── index.html                    # HTML 엔트리 포인트- RisuAI에서 사용할 Lua 트리거 준비

├── main.ts                       # TypeScript 엔트리 포인트

├── package.json                  # Svelte 5 + Vite 6 설정### 3. **Regex Trigger 테스터**

├── svelte.config.js              # Svelte 컴파일러 설정 (runes 활성화)- 정규표현식 패턴 테스트

├── vite.config.ts                # Vite 빌드 설정- 실시간 매칭 및 교체 결과 확인

├── vite-plugin-mock-globalapi.ts # globalApi.svelte 모듈 intercept 플러그인- JSON + MD 구조로 Regex 관리

├── tsconfig.json                 # TypeScript 설정- 저장된 Regex 목록 보기 및 테스트

├── ts/

│   ├── platform-shim.ts          # globalApi.svelte mock (Tauri 대체)### 4. **Lorebook 관리**

│   ├── cbs.ts                    # CBS 모듈 (../src에서 import)- JSON으로 메타데이터 관리 (키워드, 우선순위 등)

│   ├── chat.ts                   # Chat 모듈- MD 파일로 실제 컨텐츠 작성

│   ├── lorebook.ts               # Lorebook 모듈- 각 항목을 개별 파일로 관리하여 버전 관리 용이

│   └── regex.ts                  # Regex 모듈- 로어북 항목 미리보기 및 상세 보기

├── save/                         # 테스트 데이터 저장 공간

│   └── name/                     # 캐릭터 예제### 5. **문서 뷰어**

│       ├── lorebook/             # 로어북 항목들 (JSON + MD)- 캐릭터 설명 (description.md) 보기

│       ├── regex/                # Regex 트리거들 (JSON + MD)- 첫 메시지 (first_mes.md) 보기

│       └── *.md                  # 캐릭터 설명, 첫 메시지 등- 마크다운 형식 지원

└── old_editor/                   # 이전 버전 파일들 (deprecated)

```## 🚀 사용 방법



## 🚀 시작하기### 방법 1: Vite 개발 서버 실행 (권장 - CBS 파서 사용)



### 1. 의존성 설치이 방법을 사용하면 실제 RisuAI의 CBS TypeScript 모듈을 import하여 사용할 수 있습니다.



```bash```bash

cd editor# editor 폴더로 이동

pnpm installcd editor

```

# 의존성 설치 (처음 한 번만)

### 2. 개발 서버 실행pnpm install



```bash# 개발 서버 실행

pnpm devpnpm dev

```

# 또는 배치 파일 사용 (Windows)

브라우저에서 `http://localhost:5175` 열기start-dev.bat



### 3. 빌드 (프로덕션)# 또는 쉘 스크립트 사용 (Linux/Mac)

./start-dev.sh

```bash```

pnpm build

```브라우저가 자동으로 열리고 `http://localhost:5175`에서 접속됩니다.



## 🔧 기술 스택### 방법 2: 웹 브라우저로 직접 열기 (간단하지만 CBS 파서 미지원)



- **Svelte 5.43.5**: UI 프레임워크 (runes 지원)```bash

- **Vite 6.4.1**: 빌드 도구 및 개발 서버# 로컬 서버 실행 (선택사항)

- **TypeScript 5.0**: 타입 안정성python -m http.server 8000

- **RisuAI Modules**: CBS, Chat, Lorebook, Regex 모듈 직접 import```



## 💡 작동 원리- 파일 직접 열기: `file:///path/to/RisuAI/editor/index.html`

- 로컬 서버: `http://localhost:8000`

### 순환 참조 해결

⚠️ **주의**: 이 방법으로는 실제 CBS 파서를 사용할 수 없고, 간단한 변수 대체만 가능합니다.

RisuAI의 `globalApi.svelte.ts`와 `util.ts` 사이에 순환 참조가 있어, 다음 방법으로 해결:

### CBS Script 사용하기

1. **platform-shim.ts**: `globalApi.svelte.ts`의 mock 버전 제공 (Tauri 기능 제외)

2. **vite-plugin-mock-globalapi.ts**: Vite 플러그인으로 import를 intercept하여 mock으로 교체1. **CBS Script 탭** 클릭

3. **Svelte 5**: 원본 코드의 `$state` runes를 지원2. CBS 코드를 작성합니다

   ```cbs

### 모듈 Import 흐름   Hello {{user}}, I am {{char}}!

   Today is {{date}} and the time is {{time}}.

```   

App.svelte   {{#if {{equal::{{user}}::Alice}}}}

  → import CBS/Chat/Lorebook/Regex from './ts/*.ts'   Welcome back, Alice!

    → import from '../src/ts/*.ts' (RisuAI 원본)   {{/if}}

      → import globalApi.svelte → Vite intercepts → platform-shim.ts   ```

```3. 테스트 텍스트에 CBS 변수를 포함한 문장 입력

4. **🧪 테스트 실행** 버튼 클릭

## 📋 탭 기능5. 결과 확인

6. **💾 저장** 버튼으로 파일 다운로드

### 💬 채팅 테스트

- 로어북, CBS, Regex가 실제 채팅에서 어떻게 작동하는지 테스트### Lua Script 사용하기

- User/Assistant 메시지 추가 및 처리

1. **Lua Script 탭** 클릭

### 📚 Lorebook2. Lua 코드 작성

- JSON 메타데이터 + MD 컨텐츠 관리   ```lua

- 키워드 기반 자동 활성화 테스트   -- Lua Script Example

   function processText(input)

### 🔧 Regex       local result = input:upper()

- 정규표현식 패턴 테스트       return result

- editinput/editoutput 트리거 시뮬레이션   end

   

### 📝 CBS (ChatBot Script)   return processText(text)

- RisuAI 템플릿 언어 테스트   ```

- `{{user}}`, `{{char}}`, 조건문 등 실시간 파싱3. **📄 스크립트 보기** 버튼으로 스크립트 검토

4. **💾 저장** 버튼으로 `.lua` 파일 다운로드

## 🐛 문제 해결5. 저장된 파일을 RisuAI의 `lua_tigger` 폴더에 추가



### 포트 충돌### Regex Trigger 사용하기

```bash

# 기본 포트 5175가 사용 중이면 다른 포트 사용1. **Regex Trigger 탭** 클릭

vite --port 51762. **저장된 Regex 목록** 섹션에서 원하는 Regex 확인

```3. **테스트** 버튼을 클릭하면 해당 Regex가 위의 테스트 영역에 로드됨

4. 또는 직접 패턴 입력:

### 캐시 삭제   - 패턴 입력 (예: `\b(\w+)\b`)

```bash   - 플래그 설정 (g, i, m 등)

rm -rf node_modules/.vite   - 교체 문자열 입력 (예: `[$1]`)

pnpm dev5. 테스트 텍스트 입력

```6. **🧪 테스트** 버튼 클릭

7. 매칭 결과와 교체된 텍스트 확인

### 타입 에러8. **💾 저장**으로 JSON 파일 다운로드

```bash

pnpm check  # Svelte 타입 체크**새 Regex 추가하기:**

```1. `save/name/regex/regex.json`에 항목 추가

2. 해당하는 MD 파일 생성 (예: `my_regex.md`)

## 📝 개발 가이드3. **🔄 Regex 목록 새로고침** 버튼으로 갱신



### 새 탭 추가하기### Lorebook 사용하기



1. `App.svelte`의 `tabs` 배열에 탭 정의 추가1. **Lorebook 탭** 클릭

2. 탭 내용을 `{#if activeTab === 'newtab'}` 블록으로 추가2. 로어북 항목 목록이 자동으로 표시됩니다

3. 필요시 `ts/` 폴더에 모듈 추가3. 각 항목에서:

   - **전체 보기**: 메타데이터와 전체 내용 확인

### 스타일 수정   - **MD 편집**: VSCode에서 해당 MD 파일 편집 안내

4. **🔄 새로고침**: JSON/MD 파일 수정 후 목록 갱신

모든 스타일은 `App.svelte`의 `<style>` 블록에 정의되어 있습니다.5. **📥 전체 내보내기**: 모든 항목을 단일 JSON으로 내보내기



## 📚 참고 자료**새 로어북 항목 추가하기:**

1. `save/name/lorebook/lorebook.json`에 항목 추가:

- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)   ```json

- [Vite Documentation](https://vitejs.dev/)   {

- [RisuAI Repository](https://github.com/kwaroran/RisuAI)     "key": "my_lore",

     "comment": "내 로어",

## 🤝 기여     "content": "{my_lore}",

     "secondkey": "키워드1, 키워드2",

이 프로젝트는 RisuAI의 서브 프로젝트입니다. 개선 사항이나 버그 리포트는 이슈로 제출해주세요.     "insertorder": 100,

     "alwaysActive": false,

## 📄 라이선스     "selective": true

   }

RisuAI 프로젝트와 동일한 라이선스를 따릅니다.   ```

2. `save/name/lorebook/my_lore.md` 파일 생성
3. MD 파일에 실제 내용 작성
4. 에디터에서 **🔄 새로고침**

### 문서 보기

1. **문서 보기 탭** 클릭
2. 보고 싶은 문서의 **전체 보기** 버튼 클릭
3. 모달 창에서 마크다운 내용 확인
4. 필요시 VSCode 등의 에디터로 직접 수정

## 📁 파일 구조

```
editor/
├── main.ts                 # 메인 애플리케이션 진입점 (TypeScript)
├── tester.html            # CBS 테스터 UI
├── index.html             # 에디터 메인 페이지
├── vite.config.ts         # Vite 설정 (TypeScript 빌드)
├── tsconfig.json          # TypeScript 설정
├── package.json           # 프로젝트 의존성
├── ts/                    # TypeScript 모듈 (✨ 새로 추가)
│   ├── types.ts          # 타입 정의
│   ├── utils.ts          # 유틸리티 함수
│   ├── cbs.ts            # CBS 파서 (실제 RisuAI cbs.ts import)
│   ├── chat.ts           # 채팅 테스트 모듈
│   ├── lorebook.ts       # 로어북 관리 모듈
│   └── regex.ts          # Regex 테스트 모듈
├── save/                  # 저장 데이터
│   └── name/              # 캐릭터별 폴더
│       ├── description.md      # 캐릭터 설명
│       ├── first_mes.md       # 첫 메시지
│       ├── lorebook/          # 로어북
│       │   ├── lorebook.json           # 로어북 메타데이터
│       │   ├── world_setting.md        # 각 항목의 MD 파일
│       │   └── ...
│       └── regex/             # Regex 트리거
│           ├── regex.json              # Regex 메타데이터
│           └── *.md                    # 각 regex의 내용 MD
└── old_editor/           # 기존 JavaScript 파일 (레거시)
    ├── cbs.js
    ├── chat.js
    ├── lorebook.js
    ├── regex.js
    └── utils.js
```

## 🆕 TypeScript로 전환

**모든 JavaScript 코드가 TypeScript로 변환되었습니다!**

### 장점:
- ✅ **타입 안전성**: 컴파일 타임에 에러 감지
- ✅ **모듈 시스템**: ES6 import/export 사용
- ✅ **실제 CBS 통합**: `src/ts/cbs.ts`를 직접 import하여 사용
- ✅ **개발 경험 향상**: IntelliSense, 자동완성 지원
- ✅ **유지보수 용이**: 명확한 타입과 인터페이스

기존 JavaScript 파일들은 `old_editor/` 폴더에 보관되어 있습니다.

## 🔧 새로운 구조 설명

### TypeScript 모듈 구조

**ts/types.ts** - 타입 정의:
```typescript
export interface LorebookEntry {
    key: string;
    secondkey?: string;
    comment?: string;
    content?: string;
    // ...
}
```

**ts/cbs.ts** - 실제 CBS 파서 import:
```typescript
import { registerCBS, defaultCBSRegisterArg, type CBSRegisterArg } from '../../src/ts/cbs';
```

### Lorebook 구조

**lorebook.json** - 메타데이터 정의:
```json
{
  "key": "world_setting",
  "comment": "세계관 설정",
  "content": "{world_setting}",
  "secondkey": "세계, world, setting",
  "insertorder": 100,
  "alwaysActive": false,
  "selective": true
}
```

**{key}.md** - 실제 컨텐츠:
- `content` 필드의 `{world_setting}` 부분이 `world_setting.md` 파일 내용으로 대체됩니다
- MD 파일로 분리되어 버전 관리 및 편집이 쉽습니다
- VSCode 등의 에디터로 직접 수정 가능

### Regex 구조

**regex.json** - Regex 설정:
```json
{
  "comment": "이모티콘 텍스트 변환",
  "in": ":(\\)|\\(|D|P|O)",
  "out": "[emotion: $1]",
  "type": "editinput",
  "content": "{emoticon_to_text}"
}
```

**{name}.md** - 상세 설명:
- 각 Regex의 용도, 예시, 패턴 설명을 MD 파일로 문서화
- 팀원들이 쉽게 이해하고 수정 가능

## 💡 CBS 주요 문법

### 기본 변수
- `{{user}}` - 사용자 이름
- `{{char}}` - 캐릭터 이름
- `{{time}}` - 현재 시간
- `{{date}}` - 현재 날짜

### 조건문
```cbs
{{#if {{equal::{{user}}::Alice}}}}
Hello Alice!
{{/if}}

{{#if {{? maxcontext > 20000}}}}
Large context available
{{/if}}
```

### 변수 설정/가져오기
```cbs
{{settempvar::name::value}}
{{gettempvar::name}}
```

### 더 많은 CBS 함수
- 전체 목록은 RisuAI의 `src/ts/cbs.ts` 파일 참조
- 또는 `src/etc/docs/cbs_docs.cbs` 참조

## 🌙 Lua Script 예제

```lua
-- 기본 문자열 처리
function processText(input)
    -- 대문자로 변환
    local upper = input:upper()
    
    -- 소문자로 변환
    local lower = input:lower()
    
    -- 치환
    local replaced = input:gsub("old", "new")
    
    return replaced
end

-- RisuAI 변수 사용
function useRisuVars()
    local userName = risu.getvar("user_name")
    risu.setvar("greeting", "Hello " .. userName)
end
```

## 🔍 Regex Trigger 예제

### 단어를 대괄호로 감싸기
- **패턴**: `\b(\w+)\b`
- **플래그**: `g`
- **교체**: `[$1]`
- **결과**: `Hello World` → `[Hello] [World]`

### 이메일 추출
- **패턴**: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- **플래그**: `g`

### 특정 단어 강조
- **패턴**: `\b(중요|주의|경고)\b`
- **플래그**: `gi`
- **교체**: `**$1**`

## 🔧 RisuAI와 통합하기

### 1. 저장된 파일 사용하기
에디터에서 저장한 파일들을 RisuAI 프로젝트에 추가:

```bash
# CBS 파일
cp cbs_script.cbs ../src/etc/your_character.cbs

# Lua 파일
cp lua_script.lua ../public/lua/your_script.lua

# Regex JSON
# RisuAI 설정에서 직접 import
```

### 2. 캐릭터 카드 생성 시
- VSCode로 `save/name/` 폴더의 MD 파일들을 편집
- 에디터로 CBS, Lua, Regex를 테스트
- 완성된 설정을 RisuAI로 import

### 3. 실시간 테스트
1. 에디터에서 스크립트 작성 및 테스트
2. 문제없으면 저장
3. RisuAI에서 실제 캐릭터에 적용
4. 대화하며 동작 확인

## 🎨 커스터마이징

### 스타일 변경
`index.html`의 `<style>` 섹션을 수정하여 색상, 레이아웃 등을 변경할 수 있습니다.

### 기능 추가
`editor.js`를 수정하여:
- 새로운 CBS 함수 테스트 추가
- Lua 실행 환경 통합 (lua.vm.js 등)
- 추가 파일 형식 지원

## 📚 참고 자료

- **RisuAI CBS 문서**: `src/etc/docs/cbs_docs.cbs`
- **CBS 구현**: `src/ts/cbs.ts`
- **Trigger 시스템**: `src/ts/process/triggers.ts`
- **Regex 스크립트**: `src/ts/process/scripts.ts`

## 🐛 문제 해결

### 파일이 로드되지 않음
- 브라우저의 CORS 정책 때문일 수 있습니다
- 로컬 서버를 실행하세요: `python -m http.server 8000`

### Lua 스크립트가 실행되지 않음
- 이 에디터는 Lua 실행 환경이 없습니다
- 스크립트 작성/검토만 가능하며, 실제 실행은 RisuAI에서 수행됩니다

### 저장한 파일을 찾을 수 없음
- 브라우저의 다운로드 폴더를 확인하세요
- localStorage에도 자동 저장됩니다

### 데이터 초기화하기
에디터의 모든 설정(사용자 이름, 봇 정보, 커스텀 변수 등)은 브라우저의 localStorage에 자동으로 저장됩니다.

**데이터를 초기화하고 싶다면:**
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭으로 이동
3. 다음 명령어 입력:
   ```javascript
   localStorage.removeItem('risuai-editor-state')
   ```
4. 페이지 새로고침 (F5)

**또는 모든 localStorage 데이터 삭제:**
```javascript
localStorage.clear()
```

## 🤝 기여하기

개선 사항이나 버그를 발견하시면:
1. 이슈 등록
2. Pull Request 제출
3. 문서 업데이트

## 📝 라이선스

RisuAI 프로젝트의 라이선스를 따릅니다.

---

**Happy Character Creating! 🎉**
