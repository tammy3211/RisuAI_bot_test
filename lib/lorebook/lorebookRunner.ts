import type { LorebookEntry } from './lorebookLoader.svelte';
import { setupDatabaseMocks, getMockDatabase, getMockCharacter } from '../../ts/mockDatabase';

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
  selectedLorebook: LorebookEntry | null
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
    mockChar.loreSettings = mockChar.loreSettings ?? {
      scanDepth: db.loreBookDepth ?? 5,
      tokenBudget: db.loreBookToken ?? 800,
      fullWordMatching: false,
      recursiveScanning: true,
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

    if (selectedLorebook) {
      result.actives = result.actives.filter((active: any) =>
        matchesLorebook(active?.source, selectedLorebook)
      );
      result.matchLog = result.matchLog.filter((log: any) =>
        matchesLorebook(log?.source, selectedLorebook)
      );
    }

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

function matchesLorebook(source: string | undefined, lorebook: LorebookEntry) {
  if (!source || typeof source !== 'string') return false;
  const name = lorebook.comment || lorebook.key;
  if (!name) return false;
  return source === name || source.includes(name);
}
