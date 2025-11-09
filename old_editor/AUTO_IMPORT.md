# RisuAI Editor - Auto-Import 시스템

## 개요

RisuAI Editor는 원본 RisuAI 프로젝트의 모듈을 **Node.js처럼 자동으로 의존성을 가져오는** 테스터입니다.

## 🎯 핵심 기능: 자동 의존성 해결

### 문제점
원본 `src/ts/cbs.ts` 모듈은 다음과 같은 많은 의존성을 가지고 있습니다:
- `svelte/store` - Svelte의 상태 관리 시스템
- `./storage/database.svelte` - 데이터베이스 타입
- `./parser.svelte` - 파서 타입
- `./process/modules` - 모듈 시스템
- `./model/modellist` - LLM 모델 정보
- `./globalApi.svelte` - 전역 API (순환 참조 문제 있음!)
- `./stores.svelte` - Svelte stores
- 기타 등등...

### 해결 방법

#### 1. **Vite Alias를 통한 자동 경로 해결**
```typescript
// vite.config.ts
resolve: {
  alias: {
    // Svelte 런타임 mock
    'svelte/store': path.resolve(__dirname, './ts/svelte-store-mock.ts'),
    
    // 순환 참조 해결을 위한 globalApi mock
    './globalApi.svelte': path.resolve(__dirname, './ts/globalApi-mock.ts'),
    'src/ts/globalApi.svelte': path.resolve(__dirname, './ts/globalApi-mock.ts'),
    
    // Svelte stores mock
    './stores.svelte': path.resolve(__dirname, './ts/stores-mock.ts'),
    
    // 원본 소스 접근
    '@src': path.resolve(__dirname, '../src')
  }
}
```

이렇게 하면 원본 모듈을 import할 때 의존성이 자동으로 해결됩니다!

#### 2. **Mock 구현을 통한 런타임 지원**

**svelte-store-mock.ts** - Svelte 런타임 없이도 작동
```typescript
export function writable<T>(value: T): Writable<T> { ... }
export function get<T>(store: Readable<T>): T { ... }
```

**globalApi-mock.ts** - 순환 참조 차단
```typescript
export const isTauri = false;
export const isNodeServer = false;
export const forageStorage = new AutoStorage();
// ... 기타 필요한 함수들
```

**stores-mock.ts** - Svelte store 인스턴스 제공
```typescript
export const selectedCharID = writable(0);
export const CurrentTriggerIdStore = writable(null);
```

#### 3. **직접 Import 방식**
```typescript
// editor/ts/cbs.ts
import { 
    registerCBS, 
    defaultCBSRegisterArg, 
    type CBSRegisterArg 
} from '../../src/ts/cbs';  // 원본 모듈 직접 import!
```

더 이상 복잡한 의존성을 수동으로 관리할 필요가 없습니다!

## 🚀 사용 방법

### 1. 원본 모듈 직접 사용
```typescript
// 이전 방식 (복잡)
// 모든 의존성을 수동으로 가져오고 mock 구현...

// 현재 방식 (간단)
import { registerCBS } from '../../src/ts/cbs';
registerCBS(myConfig);  // 끝!
```

### 2. 새로운 모듈 추가
새 모듈을 추가하고 싶다면:

```typescript
// editor/ts/my-module.ts
import { someFunction } from '../../src/ts/some-module';
// 의존성이 자동으로 해결됩니다!
```

### 3. TypeScript 타입 지원
```typescript
import type { Database, character } from '../../src/ts/storage/database.svelte';
// 타입도 자동으로 가져옵니다!
```

## 📦 구조

```
editor/
  ts/
    svelte-store-mock.ts    # Svelte store mock 구현 ⭐
    globalApi-mock.ts       # globalApi mock (순환 참조 해결) ⭐
    stores-mock.ts          # Svelte stores mock ⭐
    mocks.ts                # 기타 mock 구현
    auto-import.ts          # 자동 import 헬퍼
    cbs.ts                  # CBS 모듈 (원본 직접 사용) ✅
    chat.ts                 # Chat 모듈
    lorebook.ts             # Lorebook 모듈
    regex.ts                # Regex 모듈
  vite.config.ts            # Vite alias 설정 (핵심!) ⭐⭐⭐
  main.ts                   # 메인 진입점
  index.html                # HTML 페이지
```

## 🔧 작동 원리

### Vite의 Module Resolution + Mock Layer
1. `import { registerCBS } from '../../src/ts/cbs'` 실행
2. cbs.ts가 `import { get } from 'svelte/store'` 요청
3. **Vite alias 확인**: `svelte/store` → `./ts/svelte-store-mock.ts`
4. Mock 구현이 제공됨 ✅
5. cbs.ts가 `import { isTauri } from './globalApi.svelte'` 요청
6. **Vite alias 확인**: `./globalApi.svelte` → `./ts/globalApi-mock.ts`
7. Mock 구현이 제공됨 (순환 참조 차단!) ✅
8. 모든 의존성 자동 해결! 🎉

### 순환 참조 문제 해결
```
원본:
globalApi.svelte → util.ts → globalApi.svelte (❌ 순환!)

Mock 사용:
globalApi.svelte (원본) → util.ts → globalApi-mock.ts (✅ 해결!)
```

### TypeScript 타입 체크
- 원본 타입 정의를 그대로 사용
- IDE 자동완성 지원
- 컴파일 타임 타입 체크

## 💡 장점

### Node.js 스타일 Auto-Import
- ✅ 의존성을 명시적으로 관리할 필요 없음
- ✅ 원본 코드 수정 없이 재사용
- ✅ 타입 안정성 보장
- ✅ 새 모듈 추가가 간단함

### 기존 방식과 비교
**기존:**
```typescript
// 50줄의 mock 구현
// 20개의 import 문
// 수동 의존성 관리
```

**현재:**
```typescript
import { registerCBS } from '../../src/ts/cbs';
// 끝!
```

## 🔍 트러블슈팅

### 모듈을 찾을 수 없는 경우
```bash
# Vite 개발 서버 재시작
cd editor
pnpm dev
```

### 타입 에러가 발생하는 경우
```typescript
// tsconfig.json의 paths 확인
{
  "compilerOptions": {
    "paths": {
      "@/*": ["../src/*"],
      "@src/*": ["../src/*"]
    }
  }
}
```

### Mock이 작동하지 않는 경우
`vite.config.ts`의 alias 설정을 확인하세요.

## 📚 추가 리소스

- [Vite Resolve Alias](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Svelte Stores](https://svelte.dev/docs#run-time-svelte-store)

## 🎓 핵심 개념

**Auto-Import의 핵심은:**
1. Vite의 alias로 경로를 리다이렉트
2. Mock으로 런타임 구현 제공
3. 원본 타입을 그대로 재사용

이렇게 하면 Node.js의 `node_modules` 시스템처럼 자동으로 의존성이 해결됩니다!
