// RisuAI Chat Parser - 원본 프로젝트 함수들을 사용하여 채팅 파싱 로직 구현
// LLM API 호출은 제외하고 파싱 과정만 시뮬레이션

import { processScriptFull } from '../../src/ts/process/scripts';
import { runTrigger } from '../../src/ts/process/triggers';
import { runLuaEditTrigger } from '../../src/ts/process/scriptings';
import { getCurrentChat, getCurrentCharacter, setCurrentChat, type Chat, type Message } from '../../src/ts/storage/database.svelte';

// 채팅 파싱 결과 인터페이스
export interface ChatParseResult {
  originalInput: string;
  processedInput: string;
  aiResponse: string;
  processedResponse: string;
  displayText: string;
  triggersExecuted: string[];
  scriptStates: {[key: string]: any};
  storedMessage?: Message | null;
  messageIndex?: number;
}

interface AppendMessageResult {
  message: Message;
  index: number;
}

function ensureCurrentChat(): Chat {
  const chat = getCurrentChat();
  if (!chat) {
    throw new Error('No active chat');
  }
  if (!Array.isArray(chat.message)) {
    chat.message = [];
  }
  return chat;
}

function appendMessageToChat(role: Message['role'], data: string): AppendMessageResult {
  const chat = ensureCurrentChat();
  const newMessage: Message = {
    role,
    data,
    time: Date.now()
  };

  chat.message.push(newMessage);
  setCurrentChat(chat);

  return {
    message: newMessage,
    index: chat.message.length - 1
  };
}

/**
 * 사용자 입력을 처리합니다 (editinput 단계)
 */
export async function processUserInput(userInput: string): Promise<string> {
  const currentChar = getCurrentCharacter();
  if (!currentChar) {
    throw new Error('No character selected');
  }

  console.log('[ChatParser] Processing user input:', userInput);

  // 타임아웃으로 무한 루프 방지 (5초)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('processUserInput timeout')), 5000);
  });

  try {
    const result = await Promise.race([
      (async () => {
        // 1. Lua Edit Trigger (editinput)
        let processedInput = await runLuaEditTrigger(currentChar, 'editinput', userInput);
        console.log('[ChatParser] After Lua editinput:', processedInput);

        // 2. Regex Script (editinput)
        const scriptResult = await processScriptFull(currentChar, processedInput, 'editinput');
        processedInput = scriptResult.data;
        console.log('[ChatParser] After regex editinput:', processedInput);

        return processedInput;
      })(),
      timeoutPromise
    ]);

    return result;
  } catch (error) {
    console.error('[ChatParser] Error in processUserInput:', error);
    return userInput; // 에러 시 원본 입력 반환
  }
}

/**
 * AI 응답을 처리합니다 (editoutput 단계)
 */
export async function processAIResponse(aiResponse: string, messageIndex: number = -1): Promise<string> {
  const currentChar = getCurrentCharacter();
  if (!currentChar) {
    throw new Error('No character selected');
  }

  console.log('[ChatParser] Processing AI response:', aiResponse);

  // 타임아웃으로 무한 루프 방지 (3초)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('processAIResponse timeout')), 3000);
  });

  try {
    const result = await Promise.race([
      (async () => {
        // 1. Lua Edit Trigger (editoutput)
        let processedResponse = await runLuaEditTrigger(currentChar, 'editoutput', aiResponse, { index: messageIndex });
        console.log('[ChatParser] After Lua editoutput:', processedResponse);

        // 2. Regex Script (editoutput)
        const scriptResult = await processScriptFull(currentChar, processedResponse, 'editoutput', messageIndex);
        processedResponse = scriptResult.data;
        console.log('[ChatParser] After regex editoutput:', processedResponse);

        return processedResponse;
      })(),
      timeoutPromise
    ]);

    return result;
  } catch (error) {
    console.error('[ChatParser] Error in processAIResponse:', error);
    return aiResponse; // 에러 시 원본 응답 반환
  }
}

/**
 * 채팅 표시를 처리합니다 (editdisplay 단계)
 */
export async function processDisplay(displayText: string, messageIndex: number = -1): Promise<string> {
  const currentChar = getCurrentCharacter();
  if (!currentChar) {
    throw new Error('No character selected');
  }

  console.log('[ChatParser] Processing display:', displayText);

  // 타임아웃으로 무한 루프 방지 (3초)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('processDisplay timeout')), 3000);
  });

  try {
    const result = await Promise.race([
      (async () => {
        // 1. Lua Edit Trigger (editdisplay)
        let processedDisplay = await runLuaEditTrigger(currentChar, 'editdisplay', displayText, { index: messageIndex });
        console.log('[ChatParser] After Lua editdisplay:', processedDisplay);

        // 2. Regex Script (editdisplay)
        const scriptResult = await processScriptFull(currentChar, processedDisplay, 'editdisplay', messageIndex);
        processedDisplay = scriptResult.data;
        console.log('[ChatParser] After regex editdisplay:', processedDisplay);

        // 3. Display Trigger 실행 (character 타입일 때만)
        const currentChat = getCurrentChat();
        if (currentChat && currentChar.type !== 'group') {
          const triggerResult = await runTrigger(currentChar, 'display', {
            chat: currentChat,
            displayMode: true,
            displayData: processedDisplay
          });
          processedDisplay = triggerResult?.displayData ?? processedDisplay;
          console.log('[ChatParser] After display trigger:', processedDisplay);
        }

        return processedDisplay;
      })(),
      timeoutPromise
    ]);

    return result;
  } catch (error) {
    console.error('[ChatParser] Error in processDisplay:', error);
    return displayText; // 에러 시 원본 텍스트 반환
  }
}

/**
 * 채팅 트리거들을 실행합니다
 */
export async function runChatTriggers(triggerType: 'start' | 'output' | 'input' | 'manual', extraData?: any): Promise<any> {
  const currentChar = getCurrentCharacter();
  const currentChat = getCurrentChat();

  if (!currentChar || !currentChat) {
    throw new Error('No character or chat available');
  }

  // Group chat에서는 트리거 실행하지 않음
  if (currentChar.type === 'group') {
    console.log(`[ChatParser] Skipping ${triggerType} triggers for group chat`);
    return null;
  }

  console.log(`[ChatParser] Running ${triggerType} triggers`);

  const triggerData = {
    chat: currentChat,
    ...extraData
  };

  // 타임아웃으로 무한 루프 방지 (5초)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Trigger timeout: ${triggerType}`)), 5000);
  });

  try {
    const result = await Promise.race([
      runTrigger(currentChar, triggerType, triggerData),
      timeoutPromise
    ]);
    console.log(`[ChatParser] ${triggerType} trigger result:`, result);
    return result;
  } catch (error) {
    console.error(`[ChatParser] Error running ${triggerType} triggers:`, error);
    return null;
  }
}

/**
 * 모의 AI 응답을 생성합니다 (실제 LLM API 호출 없이)
 * AI 응답 자동 생성 비활성화 - 빈 문자열 반환
 */
export function generateMockAIResponse(): string {
  return '';
}

/**
 * 사용자 입력만 처리하는 채팅 플로우 (AI 응답 생성 없음)
 */
export async function simulateUserInputFlow(userInput: string): Promise<ChatParseResult> {
  const result: ChatParseResult = {
    originalInput: userInput,
    processedInput: '',
    aiResponse: '',
    processedResponse: '',
    displayText: '',
    triggersExecuted: [],
    scriptStates: {},
    storedMessage: null,
    messageIndex: undefined
  };

  try {
    console.log('[ChatParser] === Starting User Input Flow ===');

    // 1. 사용자 입력 처리
    result.processedInput = await processUserInput(userInput);
    result.triggersExecuted.push('editinput');

    // 2. 현재 채팅에 메시지 저장 (editinput 결과만 저장)
    const { message, index } = appendMessageToChat('user', result.processedInput);
    result.storedMessage = message;
    result.messageIndex = index;

    // 3. Start 트리거 실행 (저장된 메시지를 기반으로 동작)
    console.log('[ChatParser] Running start triggers...');
    const startTriggerResult = await runChatTriggers('start');
    result.triggersExecuted.push('start');
    if (startTriggerResult?.stopSending) {
      console.log('[ChatParser] Start trigger stopped sending');
      return result;
    }

    // AI 응답은 생성하지 않음
    result.aiResponse = '';
    result.processedResponse = '';
    result.displayText = result.processedInput;

    // 4. 현재 채팅의 scriptstate 저장
    const currentChat = getCurrentChat();
    if (currentChat?.scriptstate) {
      result.scriptStates = { ...currentChat.scriptstate };
    }

    console.log('[ChatParser] === User Input Flow Complete ===');
    console.log('[ChatParser] Result:', result);

  } catch (error) {
    console.error('[ChatParser] Error in user input flow:', error);
    throw error;
  }

  return result;
}

/**
 * AI 응답을 처리하는 채팅 플로우 (Output 트리거 + Display 처리)
 */
export async function simulateAIResponseFlow(aiResponse: string): Promise<ChatParseResult> {
  const result: ChatParseResult = {
    originalInput: '',
    processedInput: '',
    aiResponse: aiResponse,
    processedResponse: '',
    displayText: '',
    triggersExecuted: [],
    scriptStates: {},
    storedMessage: null,
    messageIndex: undefined
  };

  try {
    console.log('[ChatParser] === Starting AI Response Flow ===');

    // 1. AI 응답 처리
    console.log('[ChatParser] Processing AI response...');
    result.processedResponse = await processAIResponse(result.aiResponse);
    result.triggersExecuted.push('editoutput');

    // 2. 현재 채팅에 메시지 저장 (editoutput 결과만 저장)
    const { message, index } = appendMessageToChat('char', result.processedResponse);
    result.storedMessage = message;
    result.messageIndex = index;

    // 3. Output 트리거 실행
    console.log('[ChatParser] Running output triggers...');
    await runChatTriggers('output');
    result.triggersExecuted.push('output');

    // Display stage는 ChatScreen에서 ChatData 기반으로 실행
    result.displayText = result.processedResponse;

    // 4. 현재 채팅의 scriptstate 저장
    const currentChat = getCurrentChat();
    if (currentChat?.scriptstate) {
      result.scriptStates = { ...currentChat.scriptstate };
    }

    console.log('[ChatParser] === AI Response Flow Complete ===');
    console.log('[ChatParser] Result:', result);

  } catch (error) {
    console.error('[ChatParser] Error in AI response flow:', error);
    throw error;
  }

  return result;
}



/**
 * 현재 캐릭터의 채팅 데이터를 가져옵니다
 */
export function getCurrentChatData(): { character: any; chat: Chat | null; messages: Message[]; firstMessage: string } {
  const character = getCurrentCharacter();
  const chat = getCurrentChat();

  return {
    character,
    chat,
    messages: chat?.message || [],
    firstMessage: character?.firstMessage || ''
  };
}

/**
 * 채팅 데이터를 콘솔에 로깅합니다 (디버깅용)
 */
export function logChatData(label: string = 'Chat Data') {
  const data = getCurrentChatData();
  console.log(`[${label}] Character:`, data.character?.name);
  console.log(`[${label}] Chat:`, data.chat?.name);
  console.log(`[${label}] Messages:`, data.messages.length);
  console.log(`[${label}] Script State:`, data.chat?.scriptstate);
}

export function clearCurrentChatMessages() {
  try {
    const chat = getCurrentChat();
    if (!chat) {
      return;
    }
    chat.message = [];
    setCurrentChat(chat);
    console.log('[ChatParser] Cleared current chat messages');
  } catch (error) {
    console.error('[ChatParser] Failed to clear chat messages:', error);
  }
}