# Lua 트리거 스크립트 사용법

Lua 트리거 스크립트는 보안상의 이유로 JavaScript를 대체하기 위해 도입된 샌드박스형 스크립트 언어입니다. 
안전한 환경에서 채팅 이벤트를 처리하고, 입출력을 수정하며, 사용자와 상호작용할 수 있습니다.

## 📁 파일 위치

```
triggerscript/
└── lua_script/
    └── main.lua    # Lua 스크립트 메인 파일
```

## 🎯 콜백 함수 (Callback Functions)

Lua 스크립트에서 사용할 수 있는 주요 콜백 함수입니다.

### 기본 이벤트 콜백

```lua
-- 채팅이 전송될 때 호출
function onStart(triggerId)
    alertNormal(triggerId, "채팅 시작!")
end

-- AI 응답이 수신될 때 호출
function onOutput(triggerId)
    alertNormal(triggerId, "AI 응답 받음!")
end

-- 사용자 입력이 수신될 때 호출
function onInput(triggerId)
    alertNormal(triggerId, "사용자 입력 받음!")
end
```

### 버튼 이벤트 콜백

`{{button::표시텍스트::함수이름}}` 형식의 버튼 또는 `risu-trigger` 속성을 가진 HTML 버튼을 클릭하면 해당 함수가 호출됩니다.

**CBS 버튼**:
```lua
-- {{button::클릭::onButton}} 버튼 클릭 시 호출
function onButton(triggerId)
    alertNormal(triggerId, "버튼이 클릭되었습니다!")
end
```

**HTML 버튼** (regex.json의 out 파일에서 사용):
```html
<!-- 기본 버튼 -->
<button risu-trigger="myTrigger">클릭</button>

<!-- ID를 전달하는 버튼 -->
<button risu-trigger="selectItem" risu-id="item-123">아이템 선택</button>
```

**triggerId로 버튼 ID 받기**:
`risu-id` 속성의 값은 `triggerId` 매개변수로 전달됩니다. CBS 문법 `{{trigger_id}}`로도 접근 가능합니다.

```lua
function selectItem(triggerId)
    -- triggerId는 버튼의 risu-id 속성 값 (예: "item-123")
    -- risu-id가 없으면 nil
    if triggerId then
        alertNormal(triggerId, "선택된 아이템: " .. triggerId)
        setState(triggerId, "selected_item", triggerId)
    end
end
```

### 편집 이벤트 리스너

`listenEdit(type, callback)` 함수로 다양한 편집 이벤트를 감지할 수 있습니다.

**타입**:
- `"editRequest"`: API 요청 전 프롬프트 수정
- `"editDisplay"`: 화면 표시 전 메시지 수정
- `"editInput"`: 사용자 입력 수정
- `"editOutput"`: AI 응답 수정

**예시**:
```lua
-- 화면에 표시되는 모든 메시지에 접두사 추가
listenEdit("editDisplay", function(triggerId, data)
    local prefix = getState(triggerId, "prefix") or "[시스템] "
    return prefix .. data
end)

-- AI 응답에서 특정 단어 치환
listenEdit("editOutput", function(triggerId, data)
    return data:gsub("안녕", "안녕하세요")
end)
```

## 📚 주요 함수 목록

### 알림 및 입력 함수

```lua
-- 일반 알림
alertNormal(triggerId, "알림 메시지")

-- 에러 알림
alertError(triggerId, "에러 메시지")

-- 사용자 입력 받기 (비동기)
local input = alertInput(triggerId, "값을 입력하세요"):await()

-- 선택지 표시 (비동기)
local choice = alertSelect(triggerId, {"옵션1", "옵션2", "옵션3"}):await()

-- 확인 다이얼로그 (비동기)
local confirmed = alertConfirm(triggerId, "진행하시겠습니까?"):await()
```

### 채팅 관리 함수

```lua
-- 특정 인덱스의 채팅 메시지 가져오기
local chat = getChat(triggerId, 0)  -- { role, data, time }

-- 마지막 채팅 가져오기
getCharacterLastMessage(triggerId)   -- 캐릭터의 마지막 채팅
getUserLastMessage(triggerId)    -- 유저의 마지막 채팅

-- 채팅 메시지 설정
setChat(triggerId, 0, "새로운 메시지")

-- 채팅 역할 변경 (user/char)
setChatRole(triggerId, 0, "user")

-- 전체 채팅 가져오기
local allChats = getFullChat(triggerId)  -- 배열

-- 전체 채팅 설정
setFullChat(triggerId, allChats)

-- 채팅 길이 가져오기
local length = getChatLength(triggerId)

-- 채팅 추가
addChat(triggerId, "user", "사용자 메시지")
addChat(triggerId, "char", "AI 응답")

-- 특정 위치에 채팅 삽입
insertChat(triggerId, 0, "user", "첫 메시지")

-- 채팅 삭제
removeChat(triggerId, 0)

-- 채팅 범위 잘라내기
cutChat(triggerId, 0, 5)  -- 0~5번 메시지만 남김
```

### 상태 관리 함수

```lua
-- 상태 변수 가져오기(string)
local value = getChatVar(triggerId, "변수이름")

-- 상태 변수 가져오기(json)
local value = getState(triggerId, "변수이름")

-- 상태 변수 설정
setChatVar(triggerId, "변수이름", "값")
setState(triggerId, "숫자", 123)
setState(triggerId, "테이블", {key = "value"})
```

### 로어북 함수

```lua
-- 로어북 검색 (동기)
local lorebooks = getLoreBooks(triggerId, "검색어")

-- 모든 로어북 로드 (비동기)
local allLorebooks = loadLoreBooks(triggerId):await()
```

### LLM 호출 함수

```lua
-- LLM 호출 (비동기)
local response = LLM(triggerId, "프롬프트", false):await()

-- Axios 기반 LLM 호출 (비동기)
local response = axLLM(triggerId, "프롬프트", true):await()
```

### 이미지 함수

```lua
-- 캐릭터 이미지 가져오기 (비동기)
local charImage = getCharacterImage(triggerId):await()

-- 페르소나 이미지 가져오기 (비동기)
local personaImage = getPersonaImage(triggerId):await()
```

### 유틸리티 함수

```lua
-- CBS 문법 파싱
local parsed = cbs("{{getvar::변수}}")

-- 토큰 수 계산 (비동기)
local tokens = getTokens(triggerId, "텍스트"):await()

-- 대기 (비동기)
sleep(triggerId, 1000):await()  -- 1초 대기

-- 로그 출력
log("디버그 메시지")
log({key = "value", num = 123})

-- 화면 새로고침
reloadDisplay(triggerId)

-- 특정 채팅 메시지 새로고침
reloadChat(triggerId, 0)

-- ⚠️ stopChat(triggerId) - 사용 불가 (버그 있음)
-- AI 응답 생성을 중단하려 했으나 현재 작동하지 않습니다.
```

### 고급 함수 (Low Level Access)

```lua
-- 유사도 검색 (비동기)
local results = similarity(triggerId, "소스 텍스트", {"비교1", "비교2"}):await()

-- HTTP 요청 (비동기, GET only, 120자 제한)
local response = request(triggerId, "https://api.example.com/data"):await()
```

## 🔄 비동기 함수 사용법

Lua 스크립트에서 비동기 함수를 사용할 때는 `async()` 래퍼와 `:await()`를 사용합니다.

### 동기 함수 정의

```lua
function synchronousFunction(triggerId, arg1, arg2)
    -- 일반 동기 함수
    return arg1 + arg2
end
```

### 비동기 함수 정의

```lua
myAsyncFunction = async(function(triggerId, url)
    local response = request(triggerId, url):await()
    local parsed = json.decode(response.data)
    return parsed
end)

-- 사용
local result = myAsyncFunction(triggerId, "https://example.com"):await()
```

## 💡 실전 예시

### 예시 1: 상태창 표시

```lua
-- 상태 변수 초기화
function onStart(triggerId)
    local hp = getState(triggerId, "hp")
    if hp == nil then
        setState(triggerId, "hp", 100)
        setState(triggerId, "max_hp", 100)
        setState(triggerId, "level", 1)
    end
end

-- 화면 표시 시 상태창 추가
listenEdit("editDisplay", function(triggerId, data)
    local hp = getState(triggerId, "hp") or 100
    local maxHp = getState(triggerId, "max_hp") or 100
    local level = getState(triggerId, "level") or 1
    
    local statusBar = string.format(
        "<div class='status-bar'>HP: %d/%d | Level: %d</div>",
        hp, maxHp, level
    )
    
    return statusBar .. data
end)
```

### 예시 2: 버튼을 통한 상호작용

```lua
-- {{button::HP 회복::healButton}}
function healButton(triggerId)
    local hp = getState(triggerId, "hp") or 100
    local maxHp = getState(triggerId, "max_hp") or 100
    
    local healAmount = 20
    local newHp = math.min(hp + healAmount, maxHp)
    
    setState(triggerId, "hp", newHp)
    alertNormal(triggerId, string.format("HP를 %d 회복했습니다! (현재: %d/%d)", healAmount, newHp, maxHp))
    reloadDisplay(triggerId)
end
```

### 예시 3: AI 응답 필터링

```lua
listenEdit("editOutput", function(triggerId, data)
    -- 욕설 필터링
    local filtered = data:gsub("욕설1", "***")
    filtered = filtered:gsub("욕설2", "***")
    
    -- 특정 패턴 강조
    filtered = filtered:gsub("%*([^%*]+)%*", "<em>%1</em>")
    
    return filtered
end)
```

### 예시 4: LLM을 활용한 요약

```lua
summarizeChat = async(function(triggerId)
    local chats = getFullChat(triggerId)
    local chatText = ""
    
    for i, chat in ipairs(chats) do
        chatText = chatText .. chat.role .. ": " .. chat.data .. "\n"
    end
    
    local prompt = "다음 대화를 3줄로 요약해주세요:\n\n" .. chatText
    local response = LLM(triggerId, prompt, false):await()
    
    alertNormal(triggerId, "요약: " .. response.message)
end)

-- 버튼: {{button::대화 요약::summaryButton}}
function summaryButton(triggerId)
    summarizeChat(triggerId):await()
end
```

## 📚 참고 자료

- **CBS 문법**: [`cbs.md`](cbs.md) - CBS 템플릿 사용법 (`cbs()` 함수 참고)
- **Lua 함수 정의**: [`src/ts/process/scriptings.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/scriptings.ts) (Line 1146~1295)
- **API 함수 목록**: [`src/ts/process/scriptings.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/scriptings.ts) (Line 120~320)

## ⚠️ 주의사항 및 제약

### 함수 변동

함수가 자주 바뀌거나 추가되기 때문에 `src/ts/process/scriptings.ts` 파일을 참고해서 작성해야 합니다.

### 보안 제약

1. **triggerId 고정**: 모든 함수는 `triggerId`를 첫 번째 인자로 받아야 하며, 이는 보안을 위해 고정되어 있습니다.
2. **샌드박스 환경**: Lua 스크립트는 샌드박스 내에서 실행되어 시스템 접근이 제한됩니다.
3. **HTTP 제한**: `request()` 함수는 GET 요청만 가능하며, URL 길이는 120자로 제한됩니다.
4. **요청 제한**: HTTP 요청은 분당 5회로 제한됩니다.

### 버그 및 사용 불가 함수

- **`stopChat(triggerId)`**: 현재 버그로 인해 작동하지 않습니다. AI 응답 생성 중단 기능은 사용할 수 없습니다.
