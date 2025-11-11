import type { LorebookEntry } from './lorebookLoader.svelte';
import { setupDatabaseMocks, getMockDatabase, getMockCharacter } from '../../ts/mockDatabase';

export interface PromptPreviewResult {
  /** 생성된 프롬프트 전체 */
  fullPrompt: string;
  /** 각 role별 메시지 배열 */
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    source?: string;
  }>;
  /** API 요청 본문 (JSON) */
  requestBody?: string;
}

/**
 * RisuAI의 sendChat을 활용하여 실제 프롬프트를 미리보기
 */
export async function generatePromptPreview(
  lorebooks: LorebookEntry[],
  conversation: string,
  _selectedLorebook: LorebookEntry | null,
  botName: string
): Promise<PromptPreviewResult> {
  try {
    await setupDatabaseMocks();

    const { DBState, selectedCharID } = await import('src/ts/stores.svelte');
    const db = getMockDatabase();
    const mockChar = getMockCharacter();

    // 봇의 description.md 로드
    let description = '';
    if (botName) {
      try {
        const descPath = `/save/${botName}/description.md`;
        const response = await fetch(descPath + '?t=' + Date.now());
        if (response.ok) {
          description = await response.text();
          console.log('[promptPreview] Loaded description.md:', description.substring(0, 100));
        }
      } catch (error) {
        console.warn('[promptPreview] Failed to load description.md:', error);
      }
    }

    // 봇의 first_mes.md 로드
    let firstMessage = '';
    if (botName) {
      try {
        const firstMesPath = `/save/${botName}/first_mes.md`;
        const response = await fetch(firstMesPath + '?t=' + Date.now());
        if (response.ok) {
          firstMessage = await response.text();
          console.log('[promptPreview] Loaded first_mes.md:', firstMessage.substring(0, 100));
        }
      } catch (error) {
        console.warn('[promptPreview] Failed to load first_mes.md:', error);
      }
    }

    // firstMessage가 없으면 기본값 설정
    if (!firstMessage) {
      firstMessage = 'Hello!';
    }

    // mockChar에 설정
    mockChar.desc = description.trim() || '선택한 봇의 description.md';
    mockChar.firstMessage = firstMessage.trim();
    mockChar.alternateGreetings = mockChar.alternateGreetings || [];

    // 로어북 설정
    mockChar.globalLore = cloneLorebooks(lorebooks);
    
    // 대화 메시지 생성
    const conversationMessages = buildMessages(conversation, mockChar.name || 'Assistant');
    
    // first_mes.md가 있으면 첫 메시지로 추가
    const chatMessages = firstMessage 
      ? [
          {
            role: 'char',
            data: firstMessage.trim(),
            time: Date.now() - 1000,
            saying: mockChar.name || 'Assistant',
          },
          ...conversationMessages
        ]
      : conversationMessages;

    mockChar.chats = [
      {
        ...(mockChar.chats?.[0] ?? createEmptyChat()),
        message: chatMessages,
        localLore: [],
        fmIndex: -1,  // 기본 firstMessage 사용
      },
    ];
    mockChar.chatPage = 0;
    mockChar.loreSettings = mockChar.loreSettings ?? {
      scanDepth: db.loreBookDepth ?? 5,
      tokenBudget: db.loreBookToken ?? 10000,
      fullWordMatching: false,
      recursiveScanning: true,
    };

    // 기본 프롬프트 설정
    const finalDb = {
      ...db,
      username: db.username ?? 'User',
      mainPrompt: db.mainPrompt ?? 'Write {{char}}\'s next reply in a fictional chat between {{char}} and {{user}}. Write 1 reply only in internet RP style, italicize actions, and avoid quotation marks. Use markdown. Be proactive, creative, and drive the plot and conversation forward. Write at least 1 paragraph, up to 4.',
      jailbreak: db.jailbreak ?? '',
      jailbreakToggle: false,
      globalNote: db.globalNote ?? '',
      personaPrompt: db.personaPrompt ?? '',
      loreBookDepth: db.loreBookDepth ?? 5,
      loreBookToken: db.loreBookToken ?? 10000,
      characters: [mockChar],
      statics: {
        messages: 0,
      },
    } as any;

    Object.assign(DBState.db, finalDb);
    DBState.db.characters[0] = mockChar;
    selectedCharID.set(0);

    console.log('[promptPreview] Mock character setup:', {
      name: mockChar.name,
      chatPage: mockChar.chatPage,
      messageCount: mockChar.chats[0]?.message?.length,
      lorebookCount: mockChar.globalLore?.length,
    });

    // sendChat을 preview 모드로 호출
    const { sendChat, previewFormated, previewBody } = await import('src/ts/process/index.svelte');
    
    console.log('[promptPreview] Calling sendChat with preview mode...');
    await sendChat(-1, {
      preview: true,
      previewPrompt: false
    });

    console.log('[promptPreview] Preview generated:', previewFormated.length, 'messages');

    // 선택된 로어북 필터링
    let formatedMessages = [...previewFormated];
    
    console.log('[promptPreview] Formated messages:', formatedMessages);
    
    // 메시지를 문자열로 조합
    const styledRole: Record<string, string> = {
      "function": "📐 Function",
      "user": "😐 User",
      "system": "⚙️ System",
      "assistant": "✨ Assistant",
    };

    let fullPrompt = '';
    for (const msg of formatedMessages) {
      const roleLabel = styledRole[msg.role] ?? '🤔 Unknown';
      fullPrompt += `### ${roleLabel}\n`;
      
      if ((msg as any).memo) {
        fullPrompt += `> Source: ${(msg as any).memo}\n`;
      }
      
      if ((msg as any).multimodals && (msg as any).multimodals.length > 0) {
        fullPrompt += `> ${(msg as any).multimodals.length} non-text content(s) included\n`;
      }
      
      if ((msg as any).thoughts && (msg as any).thoughts.length > 0) {
        fullPrompt += `> ${(msg as any).thoughts.length} thought(s) included\n`;
      }
      
      if ((msg as any).cachePoint) {
        fullPrompt += `> Cache point\n`;
      }
      
      fullPrompt += `\`\`\`\n${msg.content}\n\`\`\`\n\n`;
    }

    console.log('[promptPreview] Full prompt generated, length:', fullPrompt.length);
    console.log('[promptPreview] First 500 chars:', fullPrompt.substring(0, 500));

    const result = {
      fullPrompt: fullPrompt.trim(),
      messages: formatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        source: (msg as any).memo
      })),
      requestBody: previewBody || undefined
    };

    console.log('[promptPreview] Returning result:', {
      fullPromptLength: result.fullPrompt.length,
      messagesCount: result.messages.length,
      hasRequestBody: !!result.requestBody
    });

    return result;
  } catch (error) {
    console.error('[promptPreview] Error:', error);
    throw error;
  }
}

/**
 * API 요청 본문을 미리보기
 */
export async function generateRequestBodyPreview(
  lorebooks: LorebookEntry[],
  conversation: string,
  _selectedLorebook: LorebookEntry | null
): Promise<string> {
  try {
    await setupDatabaseMocks();

    const { DBState, selectedCharID } = await import('src/ts/stores.svelte');
    const db = getMockDatabase();
    const mockChar = getMockCharacter();

    mockChar.globalLore = cloneLorebooks(lorebooks);
    mockChar.chats = [
      {
        ...(mockChar.chats?.[0] ?? createEmptyChat()),
        message: buildMessages(conversation, mockChar.name || 'Assistant'),
        localLore: [],
      },
    ];
    mockChar.chatPage = 0;
    mockChar.loreSettings = mockChar.loreSettings ?? {
      scanDepth: db.loreBookDepth ?? 5,
      tokenBudget: db.loreBookToken ?? 10000,
      fullWordMatching: false,
      recursiveScanning: true,
    };

    const finalDb = {
      ...db,
      username: db.username ?? 'User',
      mainPrompt: db.mainPrompt ?? 'Write {{char}}\'s next reply in a fictional chat between {{char}} and {{user}}.',
      characters: [mockChar],
      statics: {
        messages: 0,
      },
    } as any;

    Object.assign(DBState.db, finalDb);
    DBState.db.characters[0] = mockChar;
    selectedCharID.set(0);

    const { sendChat, previewBody } = await import('src/ts/process/index.svelte');
    
    await sendChat(-1, {
      preview: false,
      previewPrompt: true
    });

    return previewBody || '{}';
  } catch (error) {
    console.error('[promptPreview] Error generating request body:', error);
    throw error;
  }
}

function buildMessages(text: string, assistantName: string) {
  const lines = text.split(/\r?\n/);
  const messages: Array<{
    role: string;
    data: string;
    name?: string;
    time?: number;
    saying?: string;
    chatId?: string;
  }> = [];
  let currentRole: 'user' | 'char' | 'system' = 'user';

  const roleMap: Record<string, 'user' | 'char' | 'system'> = {
    user: 'user',
    assistant: 'char',
    bot: 'char',
    char: 'char',
    system: 'system',
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^\{\{([^}]+)\}\}:(.*)$/i);
    let content = line;
    if (match) {
      const token = match[1].toLowerCase();
      currentRole = roleMap[token] ?? 'user';
      content = match[2].trim();
    }

    if (!content) continue;

    const message: any = {
      role: currentRole,
      data: content,
      time: Date.now(),
    };

    if (currentRole === 'char') {
      message.saying = assistantName;
    }

    messages.push(message);
  }

  if (messages.length === 0) {
    messages.push({
      role: 'user',
      data: text || '테스트 메시지',
      time: Date.now(),
    });
  }

  return messages;
}

function createEmptyChat() {
  return {
    message: [],
    note: '',
    name: 'Test Chat',
    localLore: [],
    modules: [],
    scriptstate: {},
    supaMemoryData: null,
    id: 'mock-chat-id',
    fmIndex: -1,  // 기본 firstMessage 사용
  };
}

function cloneLorebooks(lorebooks: LorebookEntry[]) {
  try {
    const cloned = structuredClone(lorebooks);
    for (const entry of cloned) {
      if (entry.content && entry.content.match(/^\{.+\}$/)) {
        if (entry.mdContent) {
          entry.content = entry.mdContent;
        }
      }
    }
    return cloned;
  } catch (error) {
    const cloned = JSON.parse(JSON.stringify(lorebooks));
    for (const entry of cloned) {
      if (entry.content && entry.content.match(/^\{.+\}$/)) {
        if (entry.mdContent) {
          entry.content = entry.mdContent;
        }
      }
    }
    return cloned;
  }
}
