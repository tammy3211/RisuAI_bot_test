# CBS (Curly Braced Syntaxes) 문법

CBS는 RisuAI의 강력한 템플릿 문법으로, 동적인 내용을 삽입하거나 조건부 텍스트를 생성할 수 있습니다.

## 📖 CBS 기본 개념

### 사용 가능한 위치

CBS 문법 `{{...}}`은 거의 모든 텍스트 필드에서 사용할 수 있습니다:

- **description.md**: 캐릭터 설명
- **first_mes.md**: 첫 메시지
- **lorebook content**: 로어북 내용 파일
- **regex out/outFile**: 정규식 스크립트 출력 (flag에 `<cbs>` 포함 시)
- **채팅 메시지**: 사용자가 직접 입력하는 메시지
- **기타 마크다운 파일**: 봇 설정 관련 파일들

### 기본 규칙

- **대소문자 구분 없음**: `{{user}}`, `{{User}}`, `{{USER}}` 모두 동일
- **중첩 가능**: `{{calc::{{getvar::a}}+{{getvar::b}}}}`처럼 CBS 안에 CBS 사용 가능
- **매개변수 구분**: `::` (콜론 2개)로 매개변수 구분
- **배열 생성**: `{{array::A::B::C}}`로 배열 생성
- **블록 문법**: `{{#NAME A}}...{{/NAME}}` 또는 `{{#NAME A}}...{{/}}`
  - 블록 문법은 `#`으로 시작
  - 블록 내용의 들여쓰기와 공백은 자동으로 제거됨 (`{{#if-pure A}}`같은 특수 문법 제외)

---

## 📊 데이터 문법

### 기본 데이터

#### `{{user}}`
현재 페르소나(사용자)의 이름으로 대체됩니다.

#### `{{char}}`
현재 캐릭터의 이름으로 대체됩니다. 그룹 채팅에서는:
- 발화자가 사용자인 경우: 그룹 채팅 이름
- 발화자가 캐릭터인 경우: 발화자의 이름

#### `{{description}}`
별칭: `{{char_desc}}`

캐릭터의 설명(description)으로 대체됩니다.

#### `{{example_dialogue}}`
별칭: `{{example_message}}`

캐릭터의 예시 대화 배열로 대체됩니다.

#### `{{persona}}`
별칭: `{{user_persona}}`

페르소나의 설명으로 대체됩니다.

#### `{{lorebook}}`
별칭: `{{world_info}}`

로어북 항목 배열로 대체됩니다.

#### `{{history}}`
별칭: `{{messages}}`

현재 채팅의 메시지 배열로 대체됩니다.

### 메시지 관련

#### `{{chat_index}}`
현재 메시지의 인덱스로 대체됩니다.
- 첫 메시지: `-1`
- 그 외 메시지: `0`부터 시작
- 채팅 외 컨텍스트: `-1`

#### `{{lastmessage}}`
채팅 로그의 마지막 메시지로 대체됩니다.

#### `{{lastmessageid}}`
별칭: `{{lastmessageindex}}`

채팅 로그의 마지막 메시지 인덱스로 대체됩니다.

#### `{{previous_char_chat}}`
별칭: `{{lastcharmessage}}`

채팅 로그에서 현재 캐릭터의 마지막 메시지로 대체됩니다.

#### `{{previous_user_chat}}`
별칭: `{{lastusermessage}}`

채팅 로그에서 사용자의 마지막 메시지로 대체됩니다.

#### `{{previous_chat_log::A}}`
채팅 로그에서 인덱스 `A`의 메시지로 대체됩니다. 메시지가 없으면 `Out of range`로 대체됩니다.

#### `{{first_msg_index}}`
채팅 로그의 첫 메시지 인덱스로 대체됩니다.

#### `{{user_history}}`
채팅 로그에서 사용자의 메시지 배열로 대체됩니다.

#### `{{char_history}}`
채팅 로그에서 캐릭터의 메시지 배열로 대체됩니다.

### 모델/설정 관련

#### `{{model}}`
현재 사용 중인 모델 ID로 대체됩니다.

#### `{{axmodel}}`
현재 보조 모델 ID로 대체됩니다.

#### `{{role}}`
현재 메시지 발신자의 역할(role)로 대체됩니다.
- 채팅 외 컨텍스트: role 문자열

#### `{{maxprompt}}`
클라이언트의 최대 토큰 설정으로 대체됩니다.

### 화면 정보

#### `{{screen_width}}`
화면 너비(픽셀)로 대체됩니다.

#### `{{screen_height}}`
화면 높이(픽셀)로 대체됩니다.

---

## ⏰ 시간 문법

#### `{{time}}`
현재 시각을 `HH:MM:SS` 형식으로 대체됩니다 (클라이언트 시간대).

#### `{{time::A}}`
별칭: `{{datetimeformat::A}}`, `{{date::A}}`

현재 시각을 형식 `A`로 대체됩니다.

**지원 형식**:
- `YYYY`: 연도 (4자리)
- `YY`: 연도 (2자리)
- `MM`: 월
- `DD`: 일
- `DDDD`: 연중 일수
- `HH`: 시 (24시간)
- `hh`: 시 (12시간)
- `mm`: 분
- `ss`: 초
- `A`: AM/PM
- `X`: Unix 타임스탬프 (초)
- `x`: Unix 타임스탬프 (밀리초)

**예시**:
```cbs
{{time::YYYY-MM-DD HH:mm:ss}}  # 2024-12-31 23:59:59
{{time::YYYY년 MM월 DD일}}      # 2024년 12월 31일
```

#### `{{time::A::B}}`
별칭: `{{datetimeformat::A::B}}`, `{{date::A::B}}`

Unix 타임스탬프 `B`를 형식 `A`로 대체됩니다.

#### `{{date}}`
현재 날짜를 `YYYY-MM-DD` 형식으로 대체됩니다 (클라이언트 시간대).

#### `{{isotime}}`
현재 시각을 `HH:MM:SS` 형식으로 대체됩니다 (UTC 시간대).

#### `{{isodate}}`
현재 날짜를 `YYYY-MM-DD` 형식으로 대체됩니다 (UTC 시간대).

### 메시지 시간

#### `{{message_time}}`
메시지가 전송된 시각으로 대체됩니다 (브라우저/OS 설정 형식).

**제한사항**:
- 채팅 외 컨텍스트 또는 첫 메시지: `[Cannot get time]`
- 오래된 버전에서 전송된 메시지: `[Cannot get time, message was sent in older version]`

#### `{{message_date}}`
메시지가 전송된 날짜로 대체됩니다 (브라우저/OS 설정 형식).

**제한사항**: `{{message_time}}`과 동일

#### `{{message_idle_duration}}`
사용자의 이전 메시지와 그 이전 메시지 사이의 시간 간격 (`HH:MM:SS` 형식).

**제한사항**:
- 이전 메시지가 없으면: `[No user message found]`
- 기타 제한사항은 `{{message_time}}`과 동일

#### `{{idle_duration}}`
사용자의 이전 메시지와 현재 시각 사이의 시간 간격 (`HH:MM:SS` 형식).

#### `{{message_unixtime_array}}`
채팅 로그의 Unix 타임스탬프 배열로 대체됩니다.

---

## 🎨 에셋/이모션 문법

#### `{{asset::A}}`
캐릭터의 추가 에셋 `A`의 경로를 포함한 요소로 대체됩니다. 요소 타입은 에셋 타입에 따라 자동 결정됩니다.

#### `{{emotion::A}}`
캐릭터의 감정 이미지 `A`를 포함한 이미지 요소로 대체됩니다.

#### `{{audio::A}}`
캐릭터의 추가 에셋 `A`를 포함한 오디오 요소로 대체됩니다.

#### `{{bg::A}}`
캐릭터의 추가 에셋 `A`를 포함한 배경 이미지 요소로 대체됩니다.

#### `{{video::A}}`
캐릭터의 추가 에셋 `A`를 포함한 비디오 요소로 대체됩니다.

#### `{{video-img::A}}`
캐릭터의 추가 에셋 `A`를 포함한 비디오 요소로 대체됩니다. `{{video::A}}`와 달리 이미지처럼 표시됩니다.

#### `{{raw::A}}`
캐릭터의 추가 에셋 `A`의 경로로 대체됩니다.

#### `{{image::A}}`
캐릭터의 추가 에셋 `A`를 포함한 이미지 요소로 대체됩니다.

#### `{{img::A}}`
캐릭터의 추가 에셋 `A`를 포함한 스타일 없는 이미지 요소로 대체됩니다.

#### `{{assetlist}}`
캐릭터의 추가 에셋 이름 배열로 대체됩니다.

#### `{{emotionlist}}`
캐릭터의 감정 이미지 이름 배열로 대체됩니다.

#### `{{source::A}}`
아이콘 경로로 대체됩니다:
- `A`가 `char`: 캐릭터 아이콘 경로
- `A`가 `user`: 사용자 아이콘 경로

---

## 🔢 수학 문법

#### `{{? A}}`
별칭: `{{calc::A}}`

표현식 `A`의 계산 결과로 대체됩니다.

**지원 연산자**:
- `A+B`: 덧셈
- `A-B`: 뺄셈
- `A*B`: 곱셈
- `A/B`: 나눗셈
- `A%B`: 나머지
- `A^B`: 거듭제곱
- `A||B`: OR (별칭: `|`)
- `A&&B`: AND (별칭: `&`)
- `!A`: NOT
- `A==B`: 같음 (별칭: `=`)
- `A!=B`: 다름
- `A>B`: 초과
- `A>=B`: 이상 (별칭: `≥`)
- `A<B`: 미만
- `A<=B`: 이하 (별칭: `≤`)
- `$변수명`: 채팅 변수 값 가져오기 (영문자, 숫자, 언더스코어만 사용)

**예시**:
```cbs
{{? 5+3}}                           # 8
{{? {{getvar::hp}}>50}}             # 1 (true) 또는 0 (false)
{{? $level*10+$bonus}}              # 변수 기반 계산
```

**참고**: 불린 값은 `1` (true), `0` (false)으로 표현됩니다.

### 비교 함수

#### `{{equal::A::B}}`
`A`와 `B`가 같으면 `1`, 다르면 `0`. 문자열 비교 가능.

#### `{{not_equal::A::B}}`
별칭: `{{notequal::A::B}}`

`A`와 `B`가 다르면 `1`, 같으면 `0`.

#### `{{remaind::A::B}}`
`A`를 `B`로 나눈 나머지.

#### `{{greater::A::B}}`
`A > B`이면 `1`, 아니면 `0`.

#### `{{greater_equal::A::B}}`
별칭: `{{greaterequal::A::B}}`

`A >= B`이면 `1`, 아니면 `0`.

#### `{{less::A::B}}`
`A < B`이면 `1`, 아니면 `0`.

#### `{{less_equal::A::B}}`
별칭: `{{lessequal::A::B}}`

`A <= B`이면 `1`, 아니면 `0`.

#### `{{and::A::B}}`
`A`와 `B`가 모두 `1`이면 `1`, 아니면 `0`.

#### `{{or::A::B}}`
`A` 또는 `B`가 `1`이면 `1`, 아니면 `0`.

#### `{{not::A}}`
`A`가 `0`이면 `1`, 아니면 `0`.

### 수학 함수

#### `{{pow::A::B}}`
`A`의 `B` 제곱.

#### `{{floor::A}}`
`A` 이하의 최대 정수.

#### `{{ceil::A}}`
`A` 이상의 최소 정수.

#### `{{abs::A}}`
`A`의 절댓값.

#### `{{round::A}}`
`A`를 반올림한 정수.

#### `{{min::A::B::C...}}`
가장 작은 값. 매개변수가 하나면 배열로 처리.

#### `{{max::A::B::C...}}`
가장 큰 값. 매개변수가 하나면 배열로 처리.

#### `{{sum::A::B::C...}}`
합계. 매개변수가 하나면 배열로 처리.

#### `{{average::A::B::C...}}`
평균. 매개변수가 하나면 배열로 처리.

#### `{{fix_number::A::B}}`
`A`를 소수점 `B`자리로 고정.

---

## 📝 문자열 문법

#### `{{startswith::A::B}}`
`A`가 `B`로 시작하면 `1`, 아니면 `0`.

#### `{{endswith::A::B}}`
`A`가 `B`로 끝나면 `1`, 아니면 `0`.

#### `{{contains::A::B}}`
`A`가 `B`를 포함하면 `1`, 아니면 `0`.

#### `{{lower::A}}`
`A`를 소문자로 변환.

#### `{{upper::A}}`
`A`를 대문자로 변환.

#### `{{capitalize::A}}`
`A`의 첫 글자를 대문자로 변환.

#### `{{trim::A}}`
`A`의 앞뒤 공백 제거.

#### `{{unicode_encode::A}}`
`A`를 유니코드 숫자로 인코딩.

#### `{{unicode_decode::A}}`
숫자 `A`를 유니코드 문자로 디코딩.

---

## ❓ 조건 문법

#### `{{prefill_supported}}`
모델이 prefilling을 지원하면 `1`, 아니면 `0`.

#### `{{jbtoggled}}`
Jailbreak가 활성화되어 있으면 `1`, 아니면 `0`.

#### `{{isfirstmsg}}`
첫 메시지면 `1`, 아니면 `0`.

#### `{{all::A::B::C...}}`
모든 매개변수가 `1`이면 `1`, 아니면 `0`. 매개변수가 하나면 배열로 처리.

#### `{{any::A::B::C...}}`
하나라도 `1`이면 `1`, 아니면 `0`. 매개변수가 하나면 배열로 처리.

#### `{{module_enabled::A}}`
네임스페이스 `A`의 모듈이 활성화되어 있으면 `1`, 아니면 `0`.

---

## 💾 변수 문법

#### `{{getvar::A}}`
채팅 변수 `A`의 값으로 대체됩니다. 정의되지 않았으면 `null`.

#### `{{setvar::A::B}}`
채팅 변수 `A`를 `B`로 설정하고 빈 문자열로 대체됩니다.

**제한사항**: 채팅 컨텍스트이고 첫 메시지가 아닐 때만 작동.

**권장**: 가능하면 트리거 스크립트 사용 권장.

#### `{{addvar::A::B}}`
채팅 변수 `A`를 `B`만큼 증가시키고 빈 문자열로 대체됩니다.

**예시**: `A`가 `5`일 때 `{{addvar::A::3}}`을 사용하면 `A`는 `8`이 됩니다.

**제한사항**: `{{setvar}}`와 동일.

#### `{{settempvar::A::B}}`
임시 변수 `A`를 `B`로 설정하고 빈 문자열로 대체됩니다.

**특징**: 현재 컨텍스트에서만 유효하며 채팅 종료 시 저장되지 않음. 성능 최적화됨.

#### `{{gettempvar::A}}`
임시 변수 `A`의 값으로 대체됩니다. 정의되지 않았으면 `null`.

#### `{{getglobalvar::A}}`
전역 변수 `A`의 값으로 대체됩니다. 정의되지 않았으면 `null`.

---

## 📋 배열 문법

#### `{{array::A::B::C...}}`
매개변수들로 배열을 생성합니다.

**참고**: 현재 배열은 `§`를 구분자로 사용하지만, 이는 변경될 수 있으므로 직접 `§`를 사용하지 말고 이 문법을 사용하세요.

#### `{{array_length::A}}`
별칭: `{{arraylength::A}}`

배열 `A`의 길이로 대체됩니다. 문자열에는 작동하지 않습니다.

#### `{{array_element::A::B}}`
배열 `A`의 인덱스 `B` 요소로 대체됩니다.
- 인덱스는 `0`부터 시작
- 범위 초과 시 `null`
- 음수 인덱스는 배열 끝에서부터 계산

#### `{{array_push::A::B}}`
배열 `A`의 끝에 요소 `B`를 추가한 배열로 대체됩니다.

#### `{{array_pop::A}}`
배열 `A`의 마지막 요소를 제거한 배열로 대체됩니다.

#### `{{array_shift::A}}`
배열 `A`의 첫 요소를 제거한 배열로 대체됩니다.

#### `{{array_splice::A::B::C::D...}}`
배열 `A`의 인덱스 `B`에 `C`, `D`, ... 를 삽입한 배열로 대체됩니다.

#### `{{array_assert::A::B::C}}`
배열 `A`의 인덱스 `B`에 요소 `C`를 삽입한 배열로 대체됩니다.

#### `{{split::A::B}}`
문자열 `A`를 `B`로 구분한 문자열 배열로 대체됩니다.

#### `{{join::A::B}}`
배열 `A`의 요소들을 `B`로 연결한 문자열로 대체됩니다.

#### `{{filter::A::B}}`
배열 `A`를 필터 `B`로 필터링한 배열로 대체됩니다.

**필터 옵션**:
- `nonempty`: 빈 문자열 제거
- `unique`: 중복 요소 제거
- `all`: `nonempty`와 `unique` 모두 적용

---

## 📚 딕셔너리 문법

딕셔너리는 JSON과 매우 유사한 키-값 쌍 구조입니다.

**기본 형식**: `{"key": "value", "key2": "value2", ...}`

### 딕셔너리 생성

#### `{{dict::A=B::C=D...}}`
별칭: `{{object::A=B::C=D...}}`, `{{o::A=B::C=D...}}`, `{{d::A=B::C=D...}}`

키-값 쌍으로 딕셔너리를 생성합니다.

**기본 예시**:
```cbs
{{dict::name=Alice::age=25::level=10}}
```

**결과**: `{"name": "Alice", "age": "25", "level": "10"}`

### 딕셔너리 조작

#### `{{dict_element::A::B}}`
별칭: `{{object_element::A::B}}`

딕셔너리 `A`의 키 `B`의 값으로 대체됩니다.

**예시**:
```cbs
{{setvar::player::{{dict::name=Alice::hp=100::level=5}}}}
이름: {{dict_element::{{getvar::player}}::name}}
HP: {{dict_element::{{getvar::player}}::hp}}
```

#### `{{dict_assert::A::B::C}}`
별칭: `{{object_assert::A::B::C}}`

딕셔너리 `A`에 키 `B`와 값 `C`를 삽입한 딕셔너리로 대체됩니다.

**예시**:
```cbs
{{setvar::player::{{dict::name=Alice::level=5}}}}
{{setvar::player::{{dict_assert::{{getvar::player}}::hp::100}}}}
# 결과: {"name": "Alice", "level": "5", "hp": "100"}
```

### ⚠️ 딕셔너리 사용 시 주의사항

1. **값(value)에는 배열 값도 가능하지만 문자열(string)만 사용 권장**
   - 값에 배열을 넣는 것은 작동하지만 권장하지 않음
   - ✅ 권장: `{{dict::name=Alice::score=100}}`
   - ⚠️ 비권장: `{{dict::items={{array::sword::shield}}}}`
   - 이유: 복잡도 증가 및 예상치 못한 동작 가능성
   
2. **중첩 딕셔너리 사용 금지**
   - 값에 딕셔너리나 JSON 구조를 넣으면 **오류 발생**
   - ❌ 사용 불가: `{{dict::player={{dict::name=Alice}}}}`


**올바른 사용 예시**:
```cbs
{{setvar::player_name::Alice}}
{{setvar::player_hp::100}}
{{setvar::player_level::5}}

{{setvar::player::{{dict::name={{getvar::player_name}}::hp={{getvar::player_hp}}::level={{getvar::player_level}}}}}}
```

**권장 대안**:
복잡한 데이터 구조가 필요한 경우 여러 변수를 사용하거나 배열을 활용하세요:
```cbs
{{setvar::player_names::{{array::Alice::Bob::Charlie}}}}
{{setvar::player_levels::{{array::5::10::8}}}}

플레이어: {{array_element::{{getvar::player_names}}::0}}
레벨: {{array_element::{{getvar::player_levels}}::0}}
```

---

## 🛠️ 유틸리티 문법

#### `{{slot}}`
프롬프트 템플릿, 파이프라인, 번역 프롬프트에서 사용 시 원본 슬롯 내용으로 대체됩니다.

#### `{{slot::A}}`
`{{#each C D}}` 블록 내에서 `D`가 `A`와 같으면 현재 배열 요소로 대체됩니다.

#### `{{position::A}}`
프롬프트 템플릿에서 사용 시 `pt_<A>` 위치를 사용하는 로어북으로 대체됩니다 (예: `pt_personality`). 현 프로젝트에서는 특별한 경우가 아니면 사용하지 않습니다.

#### `{{random::A::B...}}`
별칭: `{{random:A,B...}}`

제공된 매개변수 중 무작위로 하나를 선택합니다.

**예시**:
```cbs
{{random::맑음::흐림::비::눈}}
{{random::chicken::pizza::hamburger}}
```

매개변수가 없으면 `0`과 `1` 사이의 난수.

#### `{{pick::A::B...}}`
별칭: `{{pick:A,B...}}`

`{{random}}`과 동일하지만 동일한 메시지에 대해 일관된 결과를 제공합니다 (시드 고정).

#### `{{roll::A}}`
별칭: `{{roll:A}}`

`1`과 `A` 사이의 난수. `A`가 `d`로 시작하면 `d`를 제외한 숫자 사용.

**예시**:
```cbs
{{roll::6}}     # 1-6 사이 난수
{{roll::d20}}   # 1-20 사이 난수 (주사위)
```

#### `{{rollp::A}}`
별칭: `{{rollp:A}}`

`{{roll}}`과 동일하지만 동일한 메시지에 대해 일관된 결과를 제공합니다 (시드 고정).

#### `{{spread::A}}`
배열 `A`의 요소를 `::`로 연결한 문자열로 대체됩니다. 다중 매개변수 문법에 배열을 전달할 때 사용.

**예시**:
```cbs
{{random::{{spread::{{array::chicken::pizza::hamburger}}}}}}
# 위는 아래와 동일
{{random::chicken::pizza::hamburger}}
```

#### `{{replace::A::B::C}}`
문자열 `A`의 모든 `B`를 `C`로 치환한 문자열로 대체됩니다.

#### `{{range::A}}`
`0`부터 `A-1`까지의 숫자 배열로 대체됩니다.

#### `{{length::A}}`
문자열 `A`의 길이로 대체됩니다. 배열에는 작동하지 않습니다.

#### `{{none}}`
별칭: `{{blank}}`

빈 문자열로 대체됩니다. 기본 텍스트 제거에 유용.

**특수 용도**: 첫 메시지에서 사용 시 첫 메시지가 없는 것처럼 작동.

#### `{{br}}`
별칭: `{{newline}}`

줄바꿈으로 대체됩니다.

#### `{{tonumber::A}}`
`A`에서 `.`을 제외한 모든 비숫자 문자를 제거합니다. 유효한 숫자가 되는 것을 보장하지 않습니다.

---

## 🔁 블록 문법

### `{{#each A B}}`

배열 `A`의 각 요소에 대해 블록 내용을 반복합니다. 현재 요소는 `B`로 참조할 수 있습니다.

**구조**:
```cbs
{{#each 배열 변수명}}
내용
{{/each}}
```

**예시 1: 기본 사용**
```cbs
{{#each {{array::chicken::pizza::hamburger}} item}}
{{slot::item}}
{{/each}}
```

**결과**:
```
chickenpizzahamburger
```

**예시 2: 줄바꿈 포함**
```cbs
{{#each {{array::사과::바나나::오렌지}} fruit}}
- {{slot::fruit}}{{br}}
{{/each}}
```

**결과**:
```
- 사과
- 바나나
- 오렌지
```

**예시 3: 복잡한 반복**
```cbs
{{setvar::members::{{array::Alice::Bob::Charlie}}}}
{{setvar::levels::{{array::15::23::18}}}}

팀원 목록:
{{#each {{getvar::members}} member}}
{{slot::member}} (레벨: {{array_element::{{getvar::levels}}::{{chat_index}}}}){{br}}
{{/each}}
```

**참고**: 
- `{{slot::B}}`로 현재 요소에 접근합니다
- 블록 내용의 들여쓰기와 공백은 자동으로 제거됩니다
- 줄바꿈을 원하면 `{{br}}` 사용

---

## ⚠️ 중요 주의사항

### 1. `{{#if}}` 사용 금지

`{{#if}}`는 더 이상 사용되지 않습니다. **반드시 `{{#when}}`을 사용하세요.**

❌ **잘못된 사용**:
```cbs
{{#if {{getvar::level}}>5}}
텍스트
{{/if}}
```

✅ **올바른 사용**:
```cbs
{{#when {{? {{getvar::level}}>5}}}}
텍스트
{{/when}}
```

### 2. 비교 연산자 버그

`{{#when::5::>::3}}` 형식의 직접 비교 연산자는 현재 버그가 있어 작동하지 않습니다.

❌ **사용 불가**:
```cbs
{{#when::{{getvar::level}}::>::5}}
텍스트
{{/when}}
```

✅ **대안 1 - `{{? }}` 사용**:
```cbs
{{#when {{? {{getvar::level}}>5}}}}
텍스트
{{/when}}
```

✅ **대안 2 - 비교 함수 사용**:
```cbs
{{#when {{greater::{{getvar::level}}::5}}}}
텍스트
{{/when}}
```

---

## 💡 실전 예시

### 예시 1: 레벨 기반 인사

```cbs
안녕하세요, {{user}}님!

{{#when {{? {{getvar::player_level}}>10}}}}
숙련된 모험가시군요! 어려운 퀘스트도 도전해보세요.
{{:else}}
초보 모험가시군요. 천천히 경험을 쌓아가세요!
{{/when}}

현재 레벨: {{getvar::player_level}}
```

### 예시 2: 시간대별 다른 배경

```cbs
현재 시각: {{time::HH:mm:ss}}

{{#when {{? {{time::HH}}<12}}}}
아침 햇살이 창문으로 들어옵니다.
{{/when}}

{{#when {{? {{time::HH}}>=12 && {{time::HH}}<18}}}}
오후의 따스한 햇빛이 비춥니다.
{{/when}}

{{#when {{? {{time::HH}}>=18}}}}
어둠이 내린 밤, 별이 반짝입니다.
{{/when}}
```

### 예시 3: 복잡한 상태 계산

```cbs
# 캐릭터 상태

- 이름: {{getvar::char_name}}
- 레벨: {{getvar::char_level}}
- HP: {{calc::{{getvar::base_hp}}+{{getvar::bonus_hp}}}} / {{getvar::max_hp}}
- 피로도: {{random::낮음::보통::높음}}

{{#when {{? {{calc::{{getvar::base_hp}}+{{getvar::bonus_hp}}}}<{{calc::{{getvar::max_hp}}/2}}}}}}
⚠️ 체력이 절반 이하입니다! 휴식이 필요합니다.
{{/when}}
```

### 예시 4: 다국어 지원

```cbs
{{#when {{equal::{{metadata::language}}::ko}}}}
{{char}}는 친절한 AI 어시스턴트입니다.
무엇을 도와드릴까요?
{{/when}}

{{#when {{equal::{{metadata::language}}::en}}}}
{{char}} is a friendly AI assistant.
How can I help you?
{{/when}}

{{#when {{equal::{{metadata::language}}::ja}}}}
{{char}}は親切なAIアシスタントです。
何かお手伝いできますか？
{{/when}}
```

### 예시 5: 배열 반복 활용

```cbs
{{setvar::items::{{array::sword::shield::potion}}}}
{{setvar::quantities::{{array::1::1::5}}}}

보유 아이템:
{{#each {{getvar::items}} item}}
- {{slot::item}}{{br}}
{{/each}}

{{#when {{? {{array_element::{{getvar::quantities}}::2}}<3}}}}
포션이 부족합니다!
{{/when}}
```

**결과**:
```
보유 아이템:
- sword
- shield
- potion

포션이 부족합니다!
```

---

## 📚 참고 자료

- **CBS 함수 전체 목록**: [`src/ts/cbs.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/cbs.ts)
- **CBS 실행 로직**: [`src/ts/process/index.svelte.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/index.svelte.ts)

---

## 🤖 AI 어시스턴트 활용 예시

```
"레벨이 10 이상이면 '고급 콘텐츠'를, 그 이하면 '초급 콘텐츠'를 표시하는 CBS 코드를 작성해줘."
```

AI가 생성할 코드:
```cbs
{{#when {{? {{getvar::level}}>=10}}}}
고급 콘텐츠
{{:else}}
초급 콘텐츠
{{/when}}
```
