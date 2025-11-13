import type { LorebookEntry } from '../lib/lorebook/lorebookLoader.svelte';
import { setupDatabaseMocks, getMockDatabase, getMockCharacter } from './mockDatabase';

export interface LorebookPromptResult {
  actives: Array<{
    prompt: string;
    source: string;
    [key: string]: unknown;
  }>;
  matchLog: Array<{
    prompt: string;
    source: string;
    activated: string;
    [key: string]: unknown;
  }>;
}

export async function runLorebookPrompt(
  lorebooks: LorebookEntry[],
  conversation: string,
  settings: {
    recursiveScanning: boolean;
    fullWordMatching: boolean;
    scanDepth: number;
    tokenBudget: number;
  }
): Promise<LorebookPromptResult> {
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
    mockChar.loreSettings = {
      scanDepth: settings.scanDepth,
      tokenBudget: settings.tokenBudget,
      fullWordMatching: settings.fullWordMatching,
      recursiveScanning: settings.recursiveScanning,
    };
    mockChar.globalLore = cloneLorebooks(lorebooks);

    const finalDb = {
      ...db,
      username: db.username ?? 'User',
      loreBookDepth: db.loreBookDepth ?? 5,
      loreBookToken: db.loreBookToken ?? 800,
      characters: [mockChar],
    } as any;

    Object.assign(DBState.db, finalDb);
    DBState.db.characters[0] = mockChar;
    selectedCharID.set(0);

    console.log('[lorebookRunner] Calling loadLoreBookV3Prompt...');
    const { loadLoreBookV3Prompt } = await import('src/ts/process/lorebook.svelte');
    const result = await loadLoreBookV3Prompt();
    console.log('[lorebookRunner] Result:', result);

    // 항상 전체 로어북 매칭 결과 반환 (필터링하지 않음)
    return result as LorebookPromptResult;
  } catch (error) {
    console.error('[lorebookRunner] Error:', error);
    throw error;
  }
}

function buildMessages(text: string, assistantName: string) {
  const lines = text.split(/\r?\n/);
  const messages: Array<{ role: string; data: string; name?: string }> = [];
  let currentRole: 'user' | 'assistant' | 'system' = 'user';

  const roleMap: Record<string, 'user' | 'assistant' | 'system'> = {
    user: 'user',
    assistant: 'assistant',
    bot: 'assistant',
    char: 'assistant',
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

    messages.push({
      role: currentRole,
      data: content,
      name: currentRole === 'assistant' ? assistantName : undefined,
    });
  }

  if (messages.length === 0) {
    messages.push({ role: 'user', data: text || '테스트 메시지' });
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
  };
}

function cloneLorebooks(lorebooks: LorebookEntry[]) {
  try {
    const cloned = structuredClone(lorebooks);
    // Replace {name} patterns with actual mdContent
    for (const entry of cloned) {
      if (entry.content && entry.content.match(/^\{.+\}$/)) {
        // If content is in {name} format and mdContent exists, use mdContent
        if (entry.mdContent) {
          entry.content = entry.mdContent;
        }
      }
    }
    return cloned;
  } catch (error) {
    const cloned = JSON.parse(JSON.stringify(lorebooks));
    // Replace {name} patterns with actual mdContent
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
