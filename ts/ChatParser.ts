// RisuAI Chat Parser - 원본 processScriptFull을 활용한 간결한 구현

import { processScriptFull } from '../../src/ts/process/scripts';
import { runTrigger } from '../../src/ts/process/triggers';
import { risuChatParser } from '../../src/ts/parser.svelte';
import { getCurrentChat, getCurrentCharacter, setCurrentChat } from '../../src/ts/storage/database.svelte';
import { editorState, saveEditorState } from '../lib/shared/editorState.svelte';

// ============================================================================
// localStorage 저장/로드
// ============================================================================

const STORAGE_KEY = 'risuai_bot_test_chat';

export function saveChatToLocalStorage() {
  try {
    const chat = getCurrentChat();
    if (!chat) return;
    
    // CBS 변수와 customVars는 같으므로 customVars만 저장
    const chatData = {
      messages: chat.message || [],
      customVars: editorState.customVars || {},
      savedAt: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatData));
    console.log('[ChatParser] Chat saved to localStorage:', chatData.messages.length, 'messages');
  } catch (error) {
    console.error('[ChatParser] Failed to save chat:', error);
  }
}

export function loadChatFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      console.log('[ChatParser] No saved chat found in localStorage');
      return false;
    }
    
    console.log('[ChatParser] Found saved data, attempting to load...');
    const chatData = JSON.parse(saved);
    
    // getCurrentChat이 null이면 chat 객체를 생성
    let chat = getCurrentChat();
    if (!chat) {
      console.log('[ChatParser] Chat not found, creating new chat object...');
      const char = getCurrentCharacter();
      if (!char) {
        console.warn('[ChatParser] No character found, cannot create chat');
        return false;
      }
      
      // 새 chat 객체 생성
      const newChat = {
        message: [],
        note: '',
        name: 'Chat',
        localLore: [],
        modules: [],
        scriptstate: {},
        id: `chat-${Date.now()}`,
        lastDate: Date.now()
      };
      
      // chats 배열이 없으면 생성
      if (!char.chats) {
        char.chats = [];
      }
      if (char.chats.length === 0) {
        char.chats.push(newChat);
      }
      
      chat = getCurrentChat();
      if (!chat) {
        console.error('[ChatParser] Failed to create chat object');
        return false;
      }
    }
    
    console.log('[ChatParser] Chat object available, restoring messages...');
    
    // 메시지 복원
    chat.message = chatData.messages || [];
    
    // customVars 복원
    editorState.customVars = chatData.customVars || {};
    
    // scriptstate 동기화 (customVars → scriptstate)
    chat.scriptstate = {};
    for (const key in editorState.customVars) {
      chat.scriptstate['$' + key] = editorState.customVars[key];
    }
    
    setCurrentChat(chat);
    saveEditorState();
    
    console.log('[ChatParser] Chat loaded from localStorage:', chat.message.length, 'messages');
    return true;
  } catch (error) {
    console.error('[ChatParser] Failed to load chat:', error);
    return false;
  }
}

export function clearChatFromLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ChatParser] Chat cleared from localStorage');
  } catch (error) {
    console.error('[ChatParser] Failed to clear chat:', error);
  }
}

// ============================================================================
// CBS 변수 동기화 (chat.scriptstate ↔ editorState.customVars)
// ============================================================================

function syncScriptStateToEditor() {
  try {
    const chat = getCurrentChat();
    if (!chat?.scriptstate) return;

    for (const key in chat.scriptstate) {
      if (key.startsWith('$')) {
        editorState.customVars[key.substring(1)] = String(chat.scriptstate[key]);
      }
    }
    saveEditorState();
  } catch (error) {
    console.error('[ChatParser] Sync error:', error);
  }
}

function syncEditorToScriptState() {
  try {
    const chat = getCurrentChat();
    if (!chat) return;

    chat.scriptstate ??= {};
    for (const key in editorState.customVars) {
      chat.scriptstate['$' + key] = editorState.customVars[key];
    }
    setCurrentChat(chat);
  } catch (error) {
    console.error('[ChatParser] Sync error:', error);
  }
}

// ============================================================================
// 핵심 처리 함수 (processScriptFull 래퍼)
// ============================================================================

async function processWithSync(text: string, mode: 'editinput' | 'editoutput' | 'editdisplay', index = -1) {
  const char = getCurrentCharacter();
  if (!char) throw new Error('No character selected');

  syncEditorToScriptState();
  const result = await processScriptFull(char, text, mode, index, mode === 'editdisplay' ? { firstmsg: index === -1 } : {});
  syncScriptStateToEditor();
  
  return result.data;
}

export const processUserInput = (text: string, index = -1) => processWithSync(text, 'editinput', index);
export const processAIResponse = (text: string, index = -1) => processWithSync(text, 'editoutput', index);
export const processDisplay = (text: string, index = -1) => processWithSync(text, 'editdisplay', index);

// ============================================================================
// 채팅 플로우 (ChatScreen에서 사용)
// ============================================================================

export async function simulateUserInputFlow(userInput: string) {
  const char = getCurrentCharacter();
  if (!char) throw new Error('No character selected');

  // 1. CBS 변수 실행 (runVar: true)
  const parsed = risuChatParser(userInput, { chara: char, runVar: true, chatID: -1, cbsConditions: {} });
  
  // 2. editinput 처리
  const processed = await processUserInput(parsed);
  
  // 3. 메시지 저장
  const chat = getCurrentChat();
  if (!chat) throw new Error('No active chat');
  
  chat.message ??= [];
  chat.message.push({ role: 'user', data: processed, time: Date.now() });
  setCurrentChat(chat);
  saveChatToLocalStorage();

  // 4. Start 트리거
  if (char.type !== 'group') {
    await runTrigger(char, 'start', { chat });
  }

  return { processedInput: processed, messageIndex: chat.message.length - 1 };
}

export async function simulateAIResponseFlow(aiResponse: string) {
  const char = getCurrentCharacter();
  if (!char) throw new Error('No character selected');

  // 1. CBS 변수 실행
  const parsed = risuChatParser(aiResponse, { chara: char, runVar: true, chatID: -1, cbsConditions: {} });
  
  // 2. editoutput 처리
  const processed = await processAIResponse(parsed);
  
  // 3. 메시지 저장
  const chat = getCurrentChat();
  if (!chat) throw new Error('No active chat');
  
  chat.message ??= [];
  chat.message.push({ role: 'char', data: processed, time: Date.now() });
  setCurrentChat(chat);
  saveChatToLocalStorage();

  // 4. Output 트리거
  if (char.type !== 'group') {
    await runTrigger(char, 'output', { chat });
  }

  return { processedResponse: processed, messageIndex: chat.message.length - 1 };
}

// ============================================================================
// 유틸리티
// ============================================================================

export function getCurrentChatData() {
  const character = getCurrentCharacter();
  const chat = getCurrentChat();
  return {
    character,
    chat,
    messages: chat?.message || [],
    firstMessage: character?.firstMessage || ''
  };
}

export function clearCurrentChatMessages() {
  const chat = getCurrentChat();
  if (chat) {
    chat.message = [];
    chat.scriptstate = {};
    setCurrentChat(chat);
    
    // customVars도 초기화
    editorState.customVars = {};
    saveEditorState();
    
    // localStorage에서도 삭제
    clearChatFromLocalStorage();
    
    console.log('[ChatParser] Chat cleared');
  }
}

export function updateMessage(index: number, newData: string) {
  const chat = getCurrentChat();
  if (!chat || !chat.message[index]) throw new Error('Invalid message index');
  
  chat.message[index].data = newData;
  chat.message[index].time = Date.now();
  setCurrentChat(chat);
  saveChatToLocalStorage();
}

export function deleteMessage(index: number) {
  const chat = getCurrentChat();
  if (!chat || !chat.message[index]) throw new Error('Invalid message index');
  
  chat.message.splice(index, 1);
  setCurrentChat(chat);
  saveChatToLocalStorage();
}