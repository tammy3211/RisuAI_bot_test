// 저장된 봇들을 자동으로 로드하고 HMR 지원
import { editorState, saveEditorState } from '../lib/shared/editorState.svelte';

// import.meta.glob으로 모든 description.md 파일 가져오기
// 절대 경로 사용 (Vite root 기준)
const botDescriptions = import.meta.glob('/save/**/description.md', {
  query: '?raw',
  import: 'default',
  eager: false
});

// 폴더 이름에서 봇 이름 추출
function extractBotName(path: string): string {
  // '/save/name/description.md' -> 'name'
  const match = path.match(/\/save\/([^/]+)\//);
  return match ? match[1] : '';
}

// 모든 봇 로드
export async function loadAllBots() {
  const bots: string[] = [];
  
  for (const path of Object.keys(botDescriptions)) {
    const botName = extractBotName(path);
    if (botName) {
      bots.push(botName);
    }
  }
  
  editorState.savedBots = bots.sort();
  saveEditorState();
  
  return bots;
}

// 특정 봇의 description 로드 (fetch 사용으로 HMR 지원)
export async function loadBotDescription(botName: string): Promise<string> {
  const path = `/save/${botName}/description.md`;
  
  try {
    // 캐시 버스팅: timestamp 추가
    const timestamp = Date.now();
    const url = `${path}?t=${timestamp}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return '';
    }
    
    const content = await response.text();
    return content;
  } catch (err) {
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
}

// 초기 로드
loadAllBots();

/**
 * Load all markdown files from a nested directory structure recursively
 * @param botName - Name of the bot to filter files for
 * @param baseFolder - Base folder name to extract relative paths from (e.g., 'content', 'out')
 * @returns Map of filename/path -> file content
 */
export async function loadNestedMarkdownFiles(
  botName: string,
  baseFolder: string
): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>();
  
  try {
    // Use Vite's glob import to find all .md files recursively
    const modules = import.meta.glob('/save/*/**/*.md', { 
      eager: false, 
      query: '?raw', 
      import: 'default' 
    });
    
    for (const path in modules) {
      // Check if this path matches the pattern for current bot
      if (!path.includes(`/save/${botName}/`)) {
        continue;
      }
      
      // Check if path includes the base folder
      const folderPattern = new RegExp(`/save/[^/]+/[^/]+/${baseFolder}/(.+\\.md)$`);
      const match = path.match(folderPattern);
      
      if (match) {
        const relativePath = match[1]; // e.g., "world_setting.md" or "folder/character_v.md"
        
        try {
          const loader = modules[path] as () => Promise<string>;
          const content = await loader();
          
          // Store with full relative path
          fileMap.set(relativePath, content);
          
          // Also store with just filename for backward compatibility
          const fileName = relativePath.split('/').pop();
          if (fileName && !fileMap.has(fileName)) {
            fileMap.set(fileName, content);
          }
          
          // Store with path separators replaced by underscores
          const underscorePath = relativePath.replace(/\//g, '_');
          if (!fileMap.has(underscorePath)) {
            fileMap.set(underscorePath, content);
          }
        } catch (error) {
          console.warn(`Failed to load file: ${path}`, error);
        }
      }
    }
    
    console.log(`[botLoader] Loaded ${fileMap.size} files from ${baseFolder}/ for ${botName}`);
  } catch (error) {
    console.error(`Failed to load nested markdown files for ${botName}:`, error);
  }
  
  return fileMap;
}
