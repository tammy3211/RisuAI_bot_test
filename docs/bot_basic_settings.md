# 봇 기본 설정 파일

봇의 기본적인 동작을 정의하는 필수 파일들입니다.

## 📁 파일 구조

```
save/[봇이름]/
├── description.md      # 봇 설명 및 설정
├── first_mes.md        # 첫 메시지
└── assets/
    └── assets.json     # 자산 정의 (아이콘 필수)
```

## 📝 description.md - 봇 설명

봇의 외모, 성격, 배경 설정 등을 마크다운 형식으로 작성합니다.

### CBS 활용
봇 설명에 CBS 템플릿을 포함하여 동적인 설정을 만들 수 있습니다:

```cbs
{{char}}는 {{#if {{equal::{{metadata::language}}::ko}}}}한국어{{/if}}로 대화합니다.
```

## 💬 first_mes.md - 첫 메시지

사용자가 채팅을 시작할 때 표시되는 첫 번째 메시지를 정의합니다.

### 구성 요소
- **인사말**: 캐릭터의 성격을 드러내는 인사
- **자기소개**: 캐릭터의 이름과 역할 설명
- **대화 유도**: 사용자가 무엇을 할 수 있는지 안내
- **시나리오 설정**: 초기 상황이나 배경 설명

### CBS 활용
첫 메시지에 CBS를 사용하여 상황에 맞는 동적인 인사를 만들 수 있습니다:

```cbs
지금 시각은 {{time}}이네요. {{#when {{equal::{{timeofday}}::morning}}}}좋은 아침이에요!{{/when}}
```

## 🎨 assets/assets.json - 자산 정의

봇의 이미지, 아이콘 등의 자산을 정의하는 JSON 파일입니다.

### 필수 요구사항
**반드시 하나의 `type: "icon"` 자산이 `name: "main"`으로 존재해야 합니다.**

```json
[
  {
    "type": "icon",
    "uri": "icon/main.webp",
    "name": "main",
    "ext": "webp"
  }
]
```

### 자세한 사항
자산 시스템의 전체 구조와 규칙은 [`assets.md`](../assets/assets.md)를 참고하세요.


## ⚠️ 주의사항

1. **필수 파일**: `description.md`, `first_mes.md`, `assets/assets.json`은 모두 필수입니다.
2. **메인 아이콘**: assets.json에 `type: "icon"`이고 `name: "main"`인 항목이 반드시 하나 있어야 합니다.
3. **CBS 문법**: description.md와 first_mes.md에서 CBS 템플릿을 사용할 수 있습니다.

## 📚 참고 자료

- **CBS 문법**: [`cbs.md`](additional_settings/cbs.md) - CBS 템플릿 사용법
- **자산 시스템**: [`assets.md`](additional_settings/assets.md) - 이미지 및 파일 관리
- **로어북**: [`lorebook.md`](additional_settings/lorebook.md) - 로어북 구조 및 사용법
