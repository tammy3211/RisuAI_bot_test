// 저장된 봇들을 자동으로 로드하고 HMR 지원
import type { LorebookEntry } from '../../ts/mockDatabase';
import { editorState, saveEditorState } from './editorState.svelte';

// 모든 봇 로드 (API를 통해 동적으로 가져오기)
export async function loadAllBots() {
  try {
    const response = await fetch('/api/bots');
    if (!response.ok) {
      console.error('[botLoader] Failed to fetch bots:', response.statusText);
      return [];
    }

    const data = await response.json();
    const bots = data.bots || [];
    
    console.log('[botLoader] Found bots:', bots);
    
    // editorState 업데이트는 하되, 변경사항이 있을 때만 저장
    const hasChanged = JSON.stringify(editorState.savedBots) !== JSON.stringify(bots);
    editorState.savedBots = bots;
    
    if (hasChanged) {
      saveEditorState();
    }
    
    return bots;
  } catch (error) {
    console.error('[botLoader] Failed to load bots:', error);
    return [];
  }
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

/**
 * Load all files from a nested directory structure recursively
 * @param botName - Name of the bot to filter files for
 * @param baseFolder - Base folder name to extract relative paths from (e.g., 'content', 'out')
 * @returns Map of relative path -> file content
*/
export async function loadNestedFiles(
  botName: string,
  baseFolder: string
): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>();
  
  try {
    // Use Vite's glob import to find all files recursively
    const modules = import.meta.glob('/save/**/*', { 
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
      const escapedBotName = botName.replace(/[()]/g, '\\$&');
      const folderPattern = new RegExp(`/save/${escapedBotName}/${baseFolder.replace(/[()]/g, '\\$&')}/(.+)$`);
      const match = path.match(folderPattern);
      
      if (match) {
        const relativePath = match[1]; // e.g., "world_setting.md" or "folder/character_v.md" or "filters/text.md"
        
        try {
          const loader = modules[path] as () => Promise<string>;
          const content = await loader();
          
          // Store with exact relative path (including subdirectories and extension)
          fileMap.set(relativePath, content);
        } catch (error) {
          console.warn(`[botLoader] Failed to load file: ${path}`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to load nested markdown files for ${botName}:`, error);
  }
  
  return fileMap;
}

/**
 * Load regex scripts for a bot with external file resolution
 * @param botName - Name of the bot to load regex scripts for
 * @returns Array of resolved regex scripts with 'out' content loaded from files
*/
export async function loadBotRegexScripts(
  botName: string
): Promise<Array<{ comment: string; in: string; out: string; outFile?: string; type: string; flag?: string; ableFlag?: boolean }>> {
  try {
    const regexPath = `/save/${botName}/regex/regex.json`;
    const response = await fetch(regexPath + '?t=' + Date.now());
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    
    // Load all files from regex/out/ directory
    const outFiles = await loadNestedFiles(botName, 'regex/out');
    
    // Resolve out content from files
    const resolvedScripts = await Promise.all(data.map(async (script: any, idx: number) => {
      let outFile = script.outFile;
      let out = script.out ?? '';
      
      // If no outFile specified, try to generate a fallback name
      if (!outFile) {
        const fallbackName = script.comment?.trim().length
        ? script.comment.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').toLowerCase()
        : `regex_${idx}`;
        outFile = `${fallbackName}.md`;
      }
      
      // Find exact matching file in out map (with full path including subdirectories)
      if (outFiles.has(outFile)) {
        out = outFiles.get(outFile) ?? '';
      } else if (!out) {
        console.warn(`[botLoader] Regex output file not found: ${outFile}`);
      }
      
      return {
        comment: script.comment ?? '',
        in: script.in ?? '',
        out,
        outFile,
        type: script.type ?? 'editinput',
        flag: script.flag ?? 'g',
        ableFlag: script.ableFlag ?? true
      };
    }));
    
    return resolvedScripts;
  } catch (error) {
    console.warn(`[botLoader] Failed to load regex scripts for ${botName}:`, error);
    return [];
  }
}

/**
 * Load first message for a bot
 * @param botName - Name of the bot to load first message for
 * @returns First message content or empty string
*/
export async function loadBotFirstMes(botName: string): Promise<string> {
  try {
    const response = await fetch(`/save/${botName}/first_mes.md?t=${Date.now()}`);
    if (response.ok) {
      return await response.text();
    }
    return '';
  } catch (err) {
    console.warn(`[botLoader] No first_mes.md found for ${botName}`);
    return '';
  }
}

/**
 * Load trigger script for a bot from lua_script/main.lua
 * @param botName - Name of the bot to load trigger script for
 * @returns Array with single triggerscript object containing Lua code
*/
export async function loadBotTriggerScript(botName: string): Promise<any[]> {
  try {
    const luaPath = `/save/${botName}/triggerscript/lua_script/main.lua`;
    const response = await fetch(luaPath + '?t=' + Date.now());
    
    if (!response.ok) {
      return [];
    }
    
    const luaCode = await response.text();
    
    // Create triggerscript format
    return [{
      comment: 'Lua Script',
      type: 'start',
      conditions: [],
      effect: [{
        type: 'triggerlua',
        code: luaCode
      }]
    }];
  } catch (error) {
    console.warn(`[botLoader] Failed to load Lua script for ${botName}:`, error);
    return [];
  }
}

/**
 * Load assets for a bot
 * @param botName - Name of the bot to load assets for
 * @returns Object with emotionImages, additionalAssets, and ccAssets arrays
*/
export async function loadBotAssets(
  botName: string
): Promise<{
  emotionImages: [string, string][];
  additionalAssets: [string, string, string][];
  ccAssets: Array<{ type: string; uri: string; name: string; ext: string }>;
  mainImage: string;
}> {
  try {
    const assetsPath = `/save/${botName}/assets/assets.json`;
    const response = await fetch(assetsPath + '?t=' + Date.now());
    
    if (!response.ok) {
      console.warn(`No assets found for bot: ${botName}`);
      return {
        emotionImages: [],
        additionalAssets: [],
        ccAssets: [],
        mainImage: ''
      };
    }
    
    const assets = await response.json();
    if (!Array.isArray(assets)) {
      console.warn(`Invalid assets format for bot: ${botName}`);
      return {
        emotionImages: [],
        additionalAssets: [],
        ccAssets: [],
        mainImage: ''
      };
    }
    
    const emotionImages: [string, string][] = [];
    const additionalAssets: [string, string, string][] = [];
    const ccAssets: Array<{ type: string; uri: string; name: string; ext: string }> = [];
    let mainImage = '';
    
    // Process each asset based on type (like CharX v3 import)
    for (const asset of assets) {
      const fileName = asset.name || '';
      const imgPath = `/save/${botName}/assets/${asset.uri}`;
      
      if (asset.type === 'icon' && asset.name === 'main') {
        // Main icon
        mainImage = imgPath;
      } else if (asset.type === 'emotion') {
        // Emotion images: [name, path]
        emotionImages.push([fileName, imgPath]);
      } else if (asset.type === 'x-risu-asset') {
        // Additional assets: [name, path, ext]
        additionalAssets.push([fileName, imgPath, asset.ext || 'unknown']);
      } else {
        // Other assets go to ccAssets
        ccAssets.push({
          type: asset.type ?? 'asset',
          uri: imgPath,
          name: fileName,
          ext: asset.ext ?? 'unknown'
        });
      }
    }
    
    return {
      emotionImages,
      additionalAssets,
      ccAssets,
      mainImage
    };
  } catch (error) {
    console.warn(`[botLoader] Failed to load assets for ${botName}:`, error);
    return {
      emotionImages: [],
      additionalAssets: [],
      ccAssets: [],
      mainImage: ''
    };
  }
}

// Load lorebook for a specific bot

export async function loadBotLorebook(botName: string): Promise<LorebookEntry[]> {
  try {
    const lorebookPath = `/save/${botName}/lorebook/lorebook.json`;
    const response = await fetch(lorebookPath + '?t=' + Date.now());
    
    if (!response.ok) {
      console.warn(`No lorebook found for bot: ${botName}`);
      return [];
    }
    
    const lorebooks: LorebookEntry[] = await response.json();
    
    // Build a map of all files in content/ directory
    const contentFiles = await loadNestedFiles(botName, 'lorebook/content');
    
    // Load content for each lorebook entry
    for (const entry of lorebooks) {
      const match = entry.content?.match(/^\{(.+?)\}$/);
      if (match) {
        const fileName = match[1]; // e.g., "world_setting.md" or "subfolder/character.md"
        
        // Find exact matching file in content map (must match full path with extension)
        if (contentFiles.has(fileName)) {
          entry.mdContent = contentFiles.get(fileName);
          entry.mdFile = fileName;
        } else {
          console.warn(`[lorebookLoader] File not found: ${fileName}`);
          entry.mdContent = '';
          entry.mdFile = `File not found: ${fileName}`;
        }
      }
    }
    
    return lorebooks;
  } catch (error) {
    console.error(`Failed to load lorebook for ${botName}:`, error);
    return [];
  }
}

// Load backgroundDOM

export async function loadBotBackgroundHTML(botName: string): Promise<string> {
  try {
    const backgroundDOMPath = `/save/${botName}/triggerscript/backgroundDOM.md`;
    const response = await fetch(backgroundDOMPath + '?t=' + Date.now());

    if (!response.ok) {
      console.warn(`No backgroundDOM found for bot: ${botName}`);
      return '';
    }

    const backgroundDOM: string = await response.text();
    return backgroundDOM;
  } catch (error) {
    console.error(`Failed to load backgroundDOM for ${botName}:`, error);
    return '';
  }

}

/**
 * Load data for a specific bot by name
 */
export async function loadBotData(botName: string) {
  if (!botName) {
    console.warn('[botLoader] No bot name provided');
    return null;
  }
  
  // Load all bot data in parallel
  const [description, regexScripts, lorebooks, firstMessage, assets, triggerScript, backgroundHTML] = await Promise.all([
    loadBotDescription(botName),
    loadBotRegexScripts(botName),
    loadBotLorebook(botName),
    loadBotFirstMes(botName),
    loadBotAssets(botName),
    loadBotTriggerScript(botName),
    loadBotBackgroundHTML(botName)
  ]);
  
  return {
    name: botName,
    description,
    firstMessage,
    regexScripts,
    lorebooks,
    emotionImages: assets.emotionImages,
    additionalAssets: assets.additionalAssets,
    ccAssets: assets.ccAssets,
    image: assets.mainImage,
    triggerscript: triggerScript,
    backgroundHTML: backgroundHTML
  };
}

// 현재 선택된 봇의 모든 데이터를 로드하고 mock character 객체를 반환
export async function loadSelectedBotData() {
  if (!editorState.selectedBot) {
    return {
      name: '',
      description: '',
      firstMessage: '',
      regexScripts: [],
      lorebooks: [],
      emotionImages: [],
      additionalAssets: [],
      ccAssets: [],
      image: '',
      triggerscript: [],
      backgroundHTML: ''
    };
  }
  
  const botName = editorState.selectedBot;
  
  // Load all bot data in parallel
  const [description, regexScripts, lorebooks, firstMessage, assets, triggerScript, backgroundHTML] = await Promise.all([
    loadBotDescription(botName),
    loadBotRegexScripts(botName),
    loadBotLorebook(botName),
    loadBotFirstMes(botName),
    loadBotAssets(botName),
    loadBotTriggerScript(botName),
    loadBotBackgroundHTML(botName)
  ]);
  
  // Update editorState
  editorState.botName = botName;
  editorState.botDescription = description;
  editorState.regexScripts = regexScripts;
  editorState.lorebookEntries = lorebooks;
  
  // Prepare mock character for ChatParser
  const botData = {
    name: botName,
    description,
    firstMessage,
    regexScripts,
    lorebooks,
    emotionImages: assets.emotionImages,
    additionalAssets: assets.additionalAssets,
    ccAssets: assets.ccAssets,
    image: assets.mainImage,
    triggerscript: triggerScript,
    backgroundHTML: backgroundHTML
  };
  
  try {
    const { prepareMockCharacter } = await import('../../ts/mockDatabase');
    await prepareMockCharacter(botData);
    console.log('[botLoader] Mock character prepared for:', botName);
  } catch (error) {
    console.error('[botLoader] Failed to prepare mock character:', error);
  }
  
  // Save to localStorage so bot selection persists across page refreshes
  saveEditorState();
  
  return {
    name: botName,
    description,
    firstMessage,
    regexScripts,
    lorebooks,
    emotionImages: assets.emotionImages,
    additionalAssets: assets.additionalAssets,
    ccAssets: assets.ccAssets,
    image: assets.mainImage,
    triggerscript: triggerScript,
    backgroundHTML: backgroundHTML
  };
}

