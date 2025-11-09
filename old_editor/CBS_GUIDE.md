# CBS 테스터 사용 가이드

## 🚀 빠른 시작

### 1. 개발 서버 실행

```bash
cd editor
pnpm install  # 처음 한 번만
pnpm dev
```

브라우저가 자동으로 `http://localhost:5175/tester.html`로 열립니다.

### 2. CBS 테스트하기

1. **CBS 탭**을 클릭합니다
2. **테스트 환경 설정**에서 사용자 이름과 캐릭터 이름을 입력합니다
3. **테스트할 텍스트** 영역에 CBS 코드를 입력합니다
4. **🧪 테스트 실행** 버튼을 클릭합니다
5. **결과** 영역에서 파싱된 결과를 확인합니다

### 3. CBS 예제

```
안녕하세요 {{user}}님!
저는 {{char}}입니다.
현재 시간: {{time}}
오늘 날짜: {{date}}
난수: {{random}}
```

## 🎯 실제 RisuAI CBS 파서 사용

이 tester는 원본 RisuAI 프로젝트의 `src/ts/cbs.ts`를 직접 import하여 사용합니다.

### 작동 원리

1. **Vite 빌드 시스템**
   - TypeScript를 브라우저에서 실행 가능한 JavaScript로 변환
   - `src/ts/cbs.ts` 모듈을 import하여 사용

2. **Path Alias**
   ```typescript
   // vite.config.ts
   resolve: {
     alias: {
       'src': '../src'
     }
   }
   ```

3. **CBS Module Integration**
   ```typescript
   // editor/js/cbs.ts
   import { registerCBS, defaultCBSRegisterArg, type CBSRegisterArg } from '../../src/ts/cbs';
   ```

## 📁 파일 구조

```
editor/
├── vite.config.ts         # Vite 설정 (모듈 import 설정)
├── package.json           # 의존성 관리
├── tsconfig.json          # TypeScript 설정
├── tester.html           # CBS 테스터 UI
├── tester.ts             # Main controller (TypeScript)
└── js/
    └── cbs.ts            # CBS 모듈 (실제 cbs.ts import)
```

## 🔧 커스터마이징

### CBS 테스트 환경 수정

`editor/js/cbs.ts` 파일에서 `testRegisterArg` 객체를 수정하여 테스트 환경을 커스터마이징할 수 있습니다:

```typescript
const testRegisterArg: CBSRegisterArg = {
    getUserName: () => {
        return (document.getElementById('test-username') as HTMLInputElement)?.value || 'TestUser';
    },
    // ... 다른 함수들 커스터마이징
};
```

## 🐛 문제 해결

### CBS 파서가 작동하지 않을 때

1. **Vite 개발 서버가 실행 중인지 확인**
   ```bash
   pnpm dev
   ```

2. **브라우저 콘솔에서 에러 확인**
   - F12 → Console 탭

3. **모듈 import 에러**
   - `pnpm install` 실행 확인
   - `vite.config.ts`의 alias 설정 확인

### 빌드 에러

```bash
# 캐시 삭제 후 재설치
rm -rf node_modules
pnpm install
```

## 📝 추가 기능

### 더 많은 CBS 함수 지원

원본 `src/ts/cbs.ts`의 모든 함수가 지원됩니다:
- `{{user}}` - 사용자 이름
- `{{char}}` - 캐릭터 이름
- `{{time}}` - 현재 시간
- `{{date}}` - 현재 날짜
- `{{random}}` - 난수
- 그 외 RisuAI의 모든 CBS 함수

### Playground Syntax와 동일

이 tester의 CBS 파서는 RisuAI의 Playground → Syntax 기능과 정확히 동일한 파싱 엔진을 사용합니다.
