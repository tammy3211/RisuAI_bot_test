# 정규식 스크립트 (Regex Script) 사용법

정규식 스크립트는 채팅의 입력, 출력, 프롬프트, 화면 표시 등을 동적으로 수정할 수 있는 강력한 기능입니다.

## 📁 폴더 구조

```
regex/
├── regex.json          # 정규식 스크립트 메타데이터 (필수)
└── out/               # 출력 내용 파일들 (.md 파일)
    ├── emoticon_to_text.md
    ├── action_emphasis.md
    └── filters/
        └── text_emphasis.md
```

## 📋 regex.json 구조

`regex.json`은 모든 정규식 스크립트를 정의하는 JSON 배열 파일입니다.

### 기본 데이터 구조

```json
[
  {
    "comment": "스크립트 제목",
    "in": "정규식 패턴",
    "out": "직접 출력 내용",
    "outFile": "out 폴더의 파일 경로",
    "type": "editinput",
    "flag": "g",
    "ableFlag": true
  }
]
```

### 각 필드 설명

- **`comment`** (string, 필수): 스크립트 제목/설명
  - 관리 및 식별용
  - 예: `"이모티콘을 텍스트로 변환"`, `"행동 묘사 강조"`

- **`in`** (string, 필수): 매칭할 정규식 패턴
  - JavaScript 정규식 문법 사용
  - 예: `":(\\)|\\(|D|P|O)"`, `"\\*([^*]+)\\*"`
  - **CBS 사용 가능**: flag에 `<cbs>`를 포함하면 CBS 문법 사용 가능

- **`out`** (string): 직접 출력 내용
  - `outFile`을 사용하지 않을 경우 직접 입력
  - 간단한 치환에 사용
  - **CBS 사용 가능**: `{{getvar::변수명}}` 등 사용 가능

- **`outFile`** (string, 권장): 출력 내용이 담긴 파일 경로
  - `out/` 폴더 기준 상대 경로
  - 예: `"emoticon_to_text.md"`, `"filters/text_emphasis.md"`
  - **강력 권장**: 복잡한 출력은 파일로 관리

- **`type`** (string, 필수): 스크립트 적용 시점
  - `"editinput"`: 사용자 입력 수정 (전송 전)
  - `"editoutput"`: AI 응답 수정 (생성 후)
  - `"editprocess"`: 프롬프트 수정 (API 전송 전)
  - `"editdisplay"`: 화면 표시 수정 (렌더링 시)

- **`flag`** (string): 정규식 플래그 및 특수 플래그
  
  **정규식 플래그** (조합 가능):
  - `"g"`: 전역 매칭 (모든 일치 항목)
  - `"i"`: 대소문자 무시
  - `"m"`: 멀티라인 모드 (^와 $가 각 줄의 시작/끝에 매칭)
  - `"u"`: 유니코드 모드
  - `"s"`: dotAll 모드 (`.`이 줄바꿈 문자도 매칭)
  
  **특수 플래그** (정규식 플래그와 함께 사용 가능):
  - `"<cbs>"`: CBS 문법 활성화 (in 필드에서 CBS 사용 가능)
  - `"<move_top>"`: 매칭된 내용을 텍스트 맨 위로 이동
  - `"<move_bottom>"`: 매칭된 내용을 텍스트 맨 아래로 이동
  - `"<repeat_back>"`: 매칭된 내용을 원본 뒤에 반복
  - `"<no_end_nl>"`: 출력 끝의 줄바꿈 제거
  
  **조합 예시**:
  - `"gi"`: 전역 + 대소문자 무시
  - `"gm"`: 전역 + 멀티라인
  - `"g<cbs>"`: 전역 + CBS 활성화
  - `"gi<move_top>"`: 전역 + 대소문자 무시 + 맨 위로 이동

- **`ableFlag`** (boolean, 필수): 플래그 사용 여부
  - `true`: flag 필드의 플래그 사용
  - `false`: 플래그 무시

## 🎯 타입(Type) 상세 설명

### editinput
사용자가 입력한 텍스트를 **전송 전**에 수정합니다.

**사용 예시**:
- 이모티콘 변환
- 오타 자동 수정
- 띄어쓰기 정규화

### editoutput
AI가 생성한 응답을 **생성 후**에 수정합니다.

**사용 예시**:
- 행동 묘사 강조 (`*행동*` → `<em>행동</em>`)
- 특정 단어 치환
- 출력 형식 통일

### editprocess
LLM에 전송되는 **프롬프트**를 수정합니다.

**사용 예시**:
- 시스템 프롬프트 동적 변경
- 특정 키워드 삽입
- 컨텍스트 조정

### editdisplay
채팅 화면에 **표시되는 내용**을 수정합니다.

**사용 예시**:
- HTML/CSS로 시각적 효과 추가
- 상태창 렌더링
- 커스텀 UI 요소 삽입

## 📂 out 폴더 사용법

### 권장 사항

간단한 치환을 제외하고는 **`out/` 폴더에 `.md` 파일을 만들어 관리하는 것을 강력히 권장**합니다.

### 사용 방법

1. **파일 생성**: `regex/out/emoticon_to_text.md` 파일 생성
2. **내용 작성**: 출력할 텍스트 작성 (CBS 사용 가능)
3. **JSON에서 참조**: `"outFile": "emoticon_to_text.md"`

### 서브폴더 활용

```
out/
├── emoticon_to_text.md
├── action_emphasis.md
└── filters/
    ├── text_emphasis.md
    └── profanity_filter.md
```

**참조 형식**: `"filters/text_emphasis.md"`

## 💡 CBS (Curly Braced Syntaxes) 사용

정규식 스크립트에서 CBS 문법을 사용할 수 있습니다.

### out 파일에서 CBS 사용

**out/character_status.md**:
```markdown
<div class="status-card">
  <h3>{{getvar::char_name}}</h3>
  <p>HP: {{getvar::hp}}/{{getvar::max_hp}}</p>
  <p>레벨: {{getvar::level}}</p>
</div>
```

### in 필드에서 CBS 사용

`flag`에 `<cbs>`를 포함하면 `in` 필드에서도 CBS를 사용할 수 있습니다.

```json
{
  "comment": "변수 기반 매칭",
  "in": "{{getvar::trigger_word}}",
  "out": "매칭됨!",
  "type": "editinput",
  "flag": "g<cbs>",
  "ableFlag": true
}
```

### 주요 CBS 함수

- `{{getvar::변수명}}` : 변수 가져오기
- `{{calc::수식}}` : 수식 계산
- `{{random::옵션1::옵션2}}` : 랜덤 선택
- `{{roll::2d6}}` : 주사위 굴리기
- `{{#when 조건}}...{{/when}}` : 조건문
- `{{raw::assetname}}` : 에셋 경로

> 자세한 CBS 문법은 [`cbs.md`](cbs.md)를 참고하세요.

## 🎨 HTML/CSS 사용 시 주의사항

정규식 스크립트에서 HTML/CSS를 사용할 때 몇 가지 제약이 있습니다.

### 💡 CSS 스타일 권장 위치

**중요**: `<style>` 태그는 정규식 스크립트의 out 파일이 아닌 **`../triggerscript/backgroundDOM.md`**에 선언하는 것을 강력히 권장합니다.

**이유**: 
- 정규식 매칭이 일어날 때마다 CSS가 중복 삽입되어 **성능 저하** 발생
- backgroundDOM에 선언하면 한 번만 로드되어 효율적

**권장 구조**:
```
triggerscript/
└── backgroundDOM.md   # 모든 CSS 스타일을 여기에 선언

regex/
└── out/
    └── status_display.md   # HTML만 작성 (CSS 제외)
```

**backgroundDOM.md 예시**:
```html
<!-- status_display.md -->
<style>
.status-panel { background: #667eea; border-radius: 12px; }
.status-panel.x-risu-header { font-size: 1.2em; font-weight: bold; }
.status-panel.x-risu-stat { display: flex; justify-content: space-between; }
</style>
```

**out/status_display.md 예시** (CSS 없이 HTML만):
```html
<div class="status-panel">
  <div class="status-panel header">📊 캐릭터 상태</div>
  <div class="status-panel stat"><span>HP:</span><span>{{getvar::hp}}</span></div>
</div>
```

### ❌ 사용 불가

- `:root` 선택자
- JavaScript (`<script>` 태그)
- `<input type="radio">` (파싱 문제로 비추천)
- **빈 줄이 포함된 HTML 구조** (마크다운/HTML 동시 파싱 문제)

### ⚠️ HTML 구조 작성 규칙

**중요**: div 태그 사이에 빈 줄(`\n`)을 넣으면 파싱 오류가 발생합니다.

**❌ 잘못된 사용 - 빈 줄 포함**:
```html
<div>
  <div>내용1</div>

  <div>내용2</div>
</div>
```

**✅ 올바른 사용 - 빈 줄 없이 연속**:
```html
<div>
  <div>내용1</div>
  <div>내용2</div>
</div>
```

또는 **한 줄로 작성**:
```html
<div><div>내용1</div><div>내용2</div></div>
```

> **이유**: 마크다운과 HTML을 동시에 파싱하면서 빈 줄이 있으면 HTML 구조가 깨질 수 있습니다.

### ✅ CSS 클래스 네이밍 규칙

**중요**: CSS에서 연속된 클래스 선택자(`.class.subclass`)를 사용할 때 파싱 문제가 있습니다.

#### 기본 원칙

**CSS 정의**:
```css
/* ❌ 잘못된 사용 - 파싱 오류 발생 */
.status.active { color: green; }

/* ✅ 올바른 사용 - x-risu- 접두사 필수 */
.status.x-risu-active { color: green; }
```

**HTML 사용**:
```html
<!-- HTML에서는 일반적인 방식으로 작성 -->
<div class="status active">활성</div>
```

> **파싱 과정**: HTML의 `class="status active"`는 자동으로 `class="x-risu-status x-risu-active"`로 변환되어, CSS의 `.status.x-risu-active` 선택자와 매칭됩니다.

#### 부모-자식 선택자는 예외

띄어쓰기가 있는 부모-자식 관계는 `x-risu-` 접두사가 **불필요**합니다:

```css
/* ✅ 부모-자식 관계는 그대로 사용 */
.parent .child { color: blue; }
.container > .item { margin: 10px; }
```

**요약**: 
- `.class.subclass` (붙어있음) → `.class.x-risu-subclass` 사용
- `.parent .child` (띄어쓰기) → 그대로 사용

## 📝 실전 예시: 상태창 출력

### regex.json

```json
{
  "comment": "상태창 표시",
  "in": "<status>\\[(.+?)\\]</status>",
  "out": "",
  "outFile": "status_display.md",
  "type": "editdisplay",
  "flag": "g",
  "ableFlag": true
}
```

### out/status_display.md

```html
<style>
.status-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-family: 'Segoe UI', sans-serif;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.status-panel.x-risu-header {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.status-panel.x-risu-stat {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}
</style>

<div class="status-panel">
  <div class="status-panel header">📊 캐릭터 상태</div>
  <div class="status-panel stat">
    <span>이름:</span>
    <span>{{getvar::char_name}}</span>
  </div>
  <div class="status-panel stat">
    <span>HP:</span>
    <span>{{getvar::hp}}/{{getvar::max_hp}}</span>
  </div>
  <div class="status-panel stat">
    <span>MP:</span>
    <span>{{getvar::mp}}/{{getvar::max_mp}}</span>
  </div>
  <div class="status-panel stat">
    <span>레벨:</span>
    <span>{{getvar::level}}</span>
  </div>
  <div class="status-panel stat">
    <span>경험치:</span>
    <span>{{getvar::exp}}/{{calc::{{getvar::level}}*100}}</span>
  </div>
</div>
```

### 사용법

채팅에서 다음과 같이 입력하면:
```
<status>[Name: Airisu | HP: 80/100 | MP: 50/100 | Level: 15]</status>
```

화면에는 CSS가 적용된 예쁜 상태창이 표시됩니다.

## 📚 참고 자료

- **CBS 문법**: [`cbs.md`](cbs.md) - CBS 템플릿 사용법
- **정규식 스크립트 타입 정의**: [`src/ts/process/scripts.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/scripts.ts) (Line 18)
- **스크립트 처리 로직**: [`src/ts/process/scripts.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/scripts.ts)

## ⚠️ 주의사항

1. **정규식 이스케이프**: JSON에서 백슬래시(`\`)는 이중으로 작성해야 합니다. (`\\d`, `\\*` 등)
2. **flag 조합**: 여러 플래그는 연속으로 작성합니다. (`"gi"`, `"gm"`, `"g<cbs>"`)
3. **outFile 우선**: `out`과 `outFile` 둘 다 있으면 `outFile`이 우선됩니다.
4. **HTML/CSS 제약**: `:root`, `<script>`, `radio` 사용 불가
5. **클래스 네이밍**: 서브클래스는 `x-risu-` 접두사 필수
6. **성능 고려**: 너무 복잡한 정규식은 성능에 영향을 줄 수 있습니다.
