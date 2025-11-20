# Assets 폴더 구조 및 사용법

## 📁 폴더 구조(예시)

```
assets/
├── assets.json          # 에셋 메타데이터 (필수)
├── icon/               # 아이콘 이미지 저장 폴더
│   └── [봇이름].webp
└── other/              # 기타 에셋 저장 폴더
    ├── [이미지].png
    ├── [동영상].mp4
    └── [음성].mp3
```

## 📋 assets.json 구조

`assets.json`은 봇의 모든 에셋을 정의하는 JSON 배열 파일입니다.

### 필수 요구사항

**⚠️ 중요: 반드시 하나의 에셋이 `type: "icon"` 이고 `name: "main"` 이어야 합니다.**

이 에셋은 봇의 메인 아이콘으로 사용됩니다.

### 데이터 구조

```json
[
  {
    "type": "icon",
    "uri": "icon/BotName.webp",
    "name": "main",
    "ext": "webp"
  },
  {
    "type": "x-risu-asset",
    "uri": "other/asset1.png",
    "name": "배경이미지",
    "ext": "png"
  },
  {
    "type": "emotion",
    "uri": "other/happy.png",
    "name": "happy",
    "ext": "png"
  }
]
```

### 각 필드 설명

- `type` (string, 필수): 에셋의 종류
  - `"icon"`: 봇의 메인 아이콘 (반드시 name이 "main"이어야 함)
  - `"x-risu-asset"`: 범용 추가 에셋 (이미지, 동영상, 음성 등)
  
  > 참고: `emotion`, `background`, `user_icon` 타입도 존재하지만, 이 프로젝트에서는 사용하지 않고 모두 `x-risu-asset`로 대체합니다.

- `uri` (string, 필수): 파일의 상대 경로
  - `icon/` 폴더: 아이콘 파일
  - `other/` 폴더: 기타 모든 에셋
  - 예: `"icon/MyBot.webp"`, `"other/scene1.png"`

- `name` (string, 필수): 에셋의 이름
  - 메인 아이콘은 반드시 `"main"`
  - 다른 에셋은 자유롭게 명명 가능
  - 채팅에서 `{{img::이름}}` 혹은 `{{raw::이름}}` 형식으로 참조할 때 사용

- `ext` (string, 필수): 파일 확장자
  - 이미지: `"png"`, `"jpg"`, `"jpeg"`, `"webp"`, `"gif"`
  - 동영상: `"mp4"`, `"webm"`
  - 음성: `"mp3"`, `"wav"`, `"ogg"`

## 🎨 에셋 종류 및 지원 형식

### 이미지 (Images)
지원 형식: PNG, JPG, JPEG, WebP, GIF

사용 예시: 배경 이미지, 일러스트, CG, 스티커

### 동영상 (Videos)
지원 형식: MP4, WebM

사용 예시: 오프닝/엔딩 영상, 애니메이션, 컷신

### 음성 (Audio)
지원 형식: MP3, WAV, OGG

사용 예시: 배경 음악 (BGM), 효과음, 음성 대사

---

## 💡 AI 어시스턴트 활용 예시

### 이미지 여러 개 추가하기

먼저 이미지 파일들을 `assets/other/` 폴더에 넣은 후, AI에게 요청합니다:
```
"이미지 3개를 추가해줘.
happy (other/happy.png), sad (other/sad.png), angry (other/angry.png)"
```

AI가 생성할 코드:
```json
[
  {
    "type": "x-risu-asset",
    "uri": "other/happy.png",
    "name": "happy",
    "ext": "png"
  },
  {
    "type": "x-risu-asset",
    "uri": "other/sad.png",
    "name": "sad",
    "ext": "png"
  },
  {
    "type": "x-risu-asset",
    "uri": "other/angry.png",
    "name": "angry",
    "ext": "png"
  }
]
```

## 📚 참고 자료

RisuAI 메인 프로젝트의 자세한 구조는 다음 파일을 참고하세요:

- **에셋 처리 로직**: [`src/ts/characterCards.ts`](https://github.com/kwaroran/RisuAI/blob/main/src/ts/characterCards.ts) (Line 1480-1530)
- **에셋 타입 정의**: CharX v3 스펙 참고
- **에셋 렌더링**: [`src/lib/ChatScreens/ChatBody.svelte`](https://github.com/kwaroran/RisuAI/blob/main/src/lib/ChatScreens/ChatBody.svelte)

## ⚠️ 주의사항

1. **메인 아이콘 필수**: `type: "icon"`, `name: "main"` 에셋이 반드시 하나 있어야 합니다.
2. **파일 경로 정확성**: `uri`는 `assets/` 폴더를 기준으로 한 상대 경로입니다.
3. **파일 확장자 일치**: `ext` 필드와 실제 파일 확장자가 일치해야 합니다.
4. **이름 고유성**: 동일한 `name`은 사용하지 않는 것이 좋습니다.
5. **파일 크기**: 모든 에셋 용량의 총합이 250MB를 넘지 않는 것이 좋습니다.