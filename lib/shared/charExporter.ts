// CharX 파일 내보내기 유틸리티
import { loadBotData } from './botLoader.svelte';
import type { BotData } from '../../ts/mockDatabase';
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

  // Lorebook 변환
  const globalLore = botData.lorebooks.map(lore => ({
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

  const character = {
    type: 'character',
    name: botData.name,
    image: botData.image || '',
    firstMessage: botData.firstMessage,
    desc: botData.description,
    notes: '',
    chats: botData.chats || [defaultChat],
    chatFolders: [],
    chatPage: 0,
    viewScreen: 'emotion' as const,
    bias: [],
    emotionImages: botData.emotionImages || [],
    globalLore: globalLore,
    chaId: generateUUID(),
    sdData: [],
    customscript: botData.regexScripts || [],
    triggerscript: botData.triggerscript || [],
    utilityBot: false,
    exampleMessage: '',
    removedQuotes: false,
    creatorNotes: '',
    systemPrompt: '',
    postHistoryInstructions: '',
    alternateGreetings: [],
    tags: ['RisuAI_bot_test'],
    creator: '',
    characterVersion: '1.0',
    personality: '',
    scenario: '',
    firstMsgIndex: -1,
    replaceGlobalNote: '',
    backgroundHTML: botData.backgroundHTML || '',
    additionalText: '',
    ccAssets: botData.ccAssets || [],
    additionalAssets: botData.additionalAssets || []
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
    const botData = await loadBotData(botName);
    console.log('[charExporter] Bot data loaded:', botData);
    
    if (!botData) {
      throw new Error('Failed to load bot data');
    }

    // 이미지가 없으면 경고
    if (!botData.image) {
      console.error('[charExporter] No image found for bot:', botName);
      showError(`봇 "${botName}"의 이미지를 찾을 수 없습니다.\n\nsave/${botName}/assets/ 폴더에 icon 타입의 이미지를 추가해주세요.`);
      return;
    }

    console.log('[charExporter] Image path:', botData.image);
    console.log('[charExporter] Converting to character format...');
    
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
    
    const botData = await loadBotData(botName);
    
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
    
    try {
      const { alertError } = await import('src/ts/alert');
      alertError(`JSON 내보내기 실패: ${errorMessage}`);
    } catch {
      alert(`JSON 내보내기 실패: ${errorMessage}`);
    }
  }
}

/**
 * 봇을 PNG 파일로 내보내기
 */
export async function exportBotAsPNG(botName: string): Promise<void> {
  try {
    console.log('[charExporter] Loading bot:', botName);
    
    const botData = await loadBotData(botName);
    
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
    
    try {
      const { alertError } = await import('src/ts/alert');
      alertError(`PNG 내보내기 실패: ${errorMessage}`);
    } catch {
      alert(`PNG 내보내기 실패: ${errorMessage}`);
    }
  }
}
