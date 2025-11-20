// CharX 파일 내보내기 유틸리티
import { botService, type BotData } from './botService';
import { showError, showSuccess } from './alert.svelte';

/**
 * BotData를 RisuAI character 형식으로 변환
 */
export function convertBotToCharacter(botData: BotData): any {
  // UUID 생성 함수
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Helper: 경로에서 확장자 추출
  const getExtension = (path: string): string => {
    const match = path.match(/\.(\w+)$/);
    return match ? match[1] : 'png';
  };

  // Lorebook 변환
  const globalLore = botData.lorebook.entries.map(lore => ({
    key: lore.key,
    secondkey: lore.secondkey || '',
    insertorder: lore.insertorder || 0,
    comment: lore.comment || '',
    content: lore.content,
    mode: lore.mode || 'normal',
    alwaysActive: lore.alwaysActive || false,
    selective: lore.selective || false,
    extentions: lore.extentions || {},
    activationPercent: lore.activationPercent,
    useRegex: lore.useRegex || false,
    bookVersion: lore.bookVersion || 2,
    id: lore.id || generateUUID(),
    folder: lore.folder
  }));

  // 기본 Chat 생성
  const defaultChat = {
    message: [],
    note: '',
    name: 'Chat 1',
    localLore: []
  };

  // ccAssets 생성: icon, emotion, x-risu-asset 모두 포함
  const ccAssets: Array<{ type: string; uri: string; name: string; ext: string }> = [];

  // Main icon 추가
  if (botData.assets.main) {
    ccAssets.push({
      type: 'icon',
      uri: botData.assets.main,
      name: 'main',
      ext: getExtension(botData.assets.main)
    });
  }

  // Emotions 추가
  for (const [name, path] of botData.assets.emotions) {
    ccAssets.push({
      type: 'emotion',
      uri: path,
      name: name,
      ext: getExtension(path)
    });
  }

  // Additional assets 추가
  for (const [name, path, ext] of botData.assets.additional) {
    ccAssets.push({
      type: 'x-risu-asset',
      uri: path,
      name: name,
      ext: ext || getExtension(path)
    });
  }

  const character = {
    type: 'character',
    name: botData.name,
    image: botData.assets.main || '',
    firstMessage: botData.firstMessage,
    desc: botData.description,
    chats: [defaultChat],
    chatPage: 0,
    viewScreen: 'none' as const,
    globalLore: globalLore,
    chaId: generateUUID(),
    customscript: botData.regex.scripts || [],
    triggerscript: botData.trigger.lua ? [{
      comment: 'Lua Script',
      type: 'start',
      conditions: [],
      effect: [{
        type: 'triggerlua',
        code: botData.trigger.lua
      }]
    }] : [],
    tags: ['RisuAI_bot_test'],
    firstMsgIndex: -1,
    backgroundHTML: botData.trigger.backgroundHTML || '',
    ccAssets: ccAssets
  };

  return character;
}

/**
 * 봇을 CharX 파일로 내보내기
 */
export async function exportBotAsCharX(botName: string): Promise<void> {
  try {
    console.log('[charExporter] Starting export for:', botName);
    
    // 봇 데이터 로드
    const botData = await botService.loadBot(botName);
    console.log('[charExporter] Bot data loaded:', botData);
    
    if (!botData) {
      throw new Error('Failed to load bot data');
    }

    // 이미지가 없으면 경고
    if (!botData.assets.main) {
      console.error('[charExporter] No image found for bot:', botName);
      showError(`봇 "${botName}"의 이미지를 찾을 수 없습니다.\n\nsave/${botName}/assets/ 폴더에 icon 타입의 이미지를 추가해주세요.`);
      return;
    }

    console.log('[charExporter] Image path:', botData.assets.main);
    console.log('[charExporter] All assets:', botData.assets);
    console.log('[charExporter] Converting to character format...');
    
    // 이미지를 임시로 forageStorage에 저장 (RisuAI가 읽을 수 있도록)
    const { forageStorage } = await import('src/ts/globalApi.svelte');
    
    // main 이미지 처리
    const mainImagePath = botData.assets.main;
    const mainImageResponse = await fetch(mainImagePath);
    const mainImageBlob = await mainImageResponse.blob();
    const mainImageBytes = new Uint8Array(await mainImageBlob.arrayBuffer());
    
    // forageStorage에 임시 저장 (원본 경로를 키로 사용)
    await forageStorage.setItem(mainImagePath, mainImageBytes);
    console.log('[charExporter] Saved main image to forageStorage:', mainImagePath);
    
    // emotion 이미지들도 저장
    for (const [, path] of botData.assets.emotions) {
      const response = await fetch(path);
      const blob = await response.blob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await forageStorage.setItem(path, bytes);
      console.log('[charExporter] Saved emotion image to forageStorage:', path);
    }
    
    // additional assets도 저장
    for (const [, path] of botData.assets.additional) {
      const response = await fetch(path);
      const blob = await response.blob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await forageStorage.setItem(path, bytes);
      console.log('[charExporter] Saved additional asset to forageStorage:', path);
    }
    
    try {
      // Character 형식으로 변환
      const character = convertBotToCharacter(botData);
      console.log('[charExporter] Character converted:', character);
      
      console.log('[charExporter] Importing exportCharacterCard...');
      
      // RisuAI의 exportCharacterCard 함수 사용
      const { exportCharacterCard } = await import('src/ts/characterCards');
      
      console.log('[charExporter] Calling exportCharacterCard...');
      await exportCharacterCard(character, 'charx', {
        spec: 'v3'
      });
      
      console.log('[charExporter] Export complete!');
      showSuccess(`"${botName}" CharX 파일 내보내기 완료!`);
    } finally {
      // forageStorage에서 임시 이미지 삭제
      await forageStorage.removeItem(mainImagePath);
      for (const [, path] of botData.assets.emotions) {
        await forageStorage.removeItem(path);
      }
      for (const [, path] of botData.assets.additional) {
        await forageStorage.removeItem(path);
      }
      console.log('[charExporter] Cleaned up temporary images from forageStorage');
    }
    
  } catch (error) {
    console.error('[charExporter] Export failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    showError(`CharX 내보내기 실패:\n${errorMessage}`);
  }
}

/**
 * 봇을 JSON 파일로 내보내기
 */
export async function exportBotAsJSON(botName: string): Promise<void> {
  try {
    console.log('[charExporter] Loading bot:', botName);
    
    const botData = await botService.loadBot(botName);
    
    if (!botData) {
      throw new Error('Failed to load bot data');
    }

    console.log('[charExporter] Converting to character format...');
    
    const character = convertBotToCharacter(botData);
    
    console.log('[charExporter] Exporting as JSON...');
    
    const { exportCharacterCard } = await import('src/ts/characterCards');
    
    await exportCharacterCard(character, 'json', {
      spec: 'v3'
    });
    
    console.log('[charExporter] Export complete!');
    
  } catch (error) {
    console.error('[charExporter] Export failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    showError(`JSON 내보내기 실패:\n${errorMessage}`);
  }
}

/**
 * 봇을 PNG 파일로 내보내기
 */
export async function exportBotAsPNG(botName: string): Promise<void> {
  try {
    console.log('[charExporter] Loading bot:', botName);
    
    const botData = await botService.loadBot(botName);
    
    if (!botData) {
      throw new Error('Failed to load bot data');
    }

    console.log('[charExporter] Converting to character format...');
    
    const character = convertBotToCharacter(botData);
    
    console.log('[charExporter] Exporting as PNG...');
    
    const { exportCharacterCard } = await import('src/ts/characterCards');
    
    await exportCharacterCard(character, 'png', {
      spec: 'v3'
    });
    
    console.log('[charExporter] Export complete!');
    
  } catch (error) {
    console.error('[charExporter] Export failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    showError(`PNG 내보내기 실패:\n${errorMessage}`);
  }
}
