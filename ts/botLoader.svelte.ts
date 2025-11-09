// 저장된 봇들을 자동으로 로드하고 HMR 지원
import { editorState, saveEditorState } from '../lib/shared/editorState.svelte';

// import.meta.glob으로 모든 description.md 파일 가져오기
// 절대 경로 사용 (Vite root 기준)
const botDescriptions = import.meta.glob('/save/**/description.md', {
  query: '?raw',
  import: 'default',
  eager: false
});

console.log('[botLoader] Initialized with paths:', Object.keys(botDescriptions));

// 폴더 이름에서 봇 이름 추출
function extractBotName(path: string): string {
  // '/save/name/description.md' -> 'name'
  const match = path.match(/\/save\/([^/]+)\//);
  return match ? match[1] : '';
}

// 모든 봇 로드
export async function loadAllBots() {
  console.log('[botLoader] loadAllBots called');
  const bots: string[] = [];
  
  for (const path of Object.keys(botDescriptions)) {
    const botName = extractBotName(path);
    console.log('[botLoader] Found bot:', botName, 'from path:', path);
    if (botName) {
      bots.push(botName);
    }
  }
  
  console.log('[botLoader] Total bots found:', bots);
  editorState.savedBots = bots.sort();
  saveEditorState();
  
  return bots;
}

// 특정 봇의 description 로드 (fetch 사용으로 HMR 지원)
export async function loadBotDescription(botName: string): Promise<string> {
  const path = `/save/${botName}/description.md`;
  console.log('[botLoader] Trying to load:', path);
  
  try {
    // 캐시 버스팅: timestamp 추가
    const timestamp = Date.now();
    const url = `${path}?t=${timestamp}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[botLoader] Failed to fetch:', response.status, response.statusText);
      return '';
    }
    
    const content = await response.text();
    console.log('[botLoader] Loaded content type:', typeof content);
    console.log('[botLoader] Content preview:', content.substring(0, 100));
    console.log('[botLoader] Loaded at:', timestamp);
    return content;
  } catch (err) {
    console.error('[botLoader] Error loading bot description:', err);
    return '';
  }
}

// 현재 선택된 봇의 description을 자동으로 로드하고 editorState에 반영
export async function loadSelectedBotData() {
  if (!editorState.selectedBot) {
    return;
  }
  
  const description = await loadBotDescription(editorState.selectedBot);
  
  // 봇 이름은 폴더 이름과 동일
  editorState.botName = editorState.selectedBot;
  editorState.botDescription = description;
  
  saveEditorState();
  
  console.log(`✅ Bot loaded: ${editorState.botName}`);
}

// 초기 로드
loadAllBots();
