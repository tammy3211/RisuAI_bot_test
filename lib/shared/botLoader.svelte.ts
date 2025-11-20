// 봇 데이터 로드 및 관리를 담당하는 서비스
import { editorState, saveEditorState } from './editorState.svelte';
import { botService } from './botService';

// 봇 목록 로드 (BotService 사용)
export async function loadAllBots() {
  try {
    const bots = await botService.listBots();

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

// 봇 설명 로드 (BotService 사용)
export async function loadBotDescription(botName: string): Promise<string> {
  try {
    return await botService.loadDescription(botName);
  } catch (error) {
    console.error(`[botLoader] Failed to load description for ${botName}:`, error);
    return '';
  }
}

















// 현재 선택된 봇의 모든 데이터를 로드하고 mock character 객체를 반환 (BotService 사용)
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

  try {
    // BotService를 통해 전체 봇 데이터 로드
    const botData = await botService.loadBot(botName);

    // editorState 업데이트
    editorState.botName = botData.name;
    editorState.botDescription = botData.description;
    editorState.regexScripts = botData.regex.scripts;
    editorState.lorebookEntries = botData.lorebook.entries;

    // mockDatabase 동기화
    const { prepareMockCharacter } = await import('../../ts/mockDatabase');
    await prepareMockCharacter({
      name: botData.name,
      description: botData.description,
      firstMessage: botData.firstMessage,
      regexScripts: botData.regex.scripts,
      lorebooks: botData.lorebook.entries,
      emotionImages: botData.assets.emotions,
      additionalAssets: botData.assets.additional,
      ccAssets: botData.assets.ccAssets,
      image: botData.assets.main,
      triggerscript: botData.trigger.lua ? [{
        comment: 'Lua Script',
        type: 'start',
        conditions: [],
        effect: [{
          type: 'triggerlua',
          code: botData.trigger.lua
        }]
      }] : [],
      backgroundHTML: botData.trigger.backgroundHTML
    });

    console.log('[botLoader] Mock character prepared for:', botName);

    // localStorage에 저장
    saveEditorState();

    return {
      name: botData.name,
      description: botData.description,
      firstMessage: botData.firstMessage,
      regexScripts: botData.regex.scripts,
      lorebooks: botData.lorebook.entries,
      emotionImages: botData.assets.emotions,
      additionalAssets: botData.assets.additional,
      ccAssets: botData.assets.ccAssets,
      image: botData.assets.main,
      triggerscript: botData.trigger.lua ? [{
        comment: 'Lua Script',
        type: 'start',
        conditions: [],
        effect: [{
          type: 'triggerlua',
          code: botData.trigger.lua
        }]
      }] : [],
      backgroundHTML: botData.trigger.backgroundHTML
    };
  } catch (error) {
    console.error(`[botLoader] Failed to load bot data for ${botName}:`, error);
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
}

