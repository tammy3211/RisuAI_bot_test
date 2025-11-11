// Mock database for RisuAI functions using editorState
import { editorState } from '../lib/shared/editorState.svelte';

let storeSetupPromise: Promise<void> | null = null;

function buildScriptState() {
  const scriptstate: Record<string, string> = {};
  const customVars = editorState.customVars ?? {};
  for (const [key, value] of Object.entries(customVars)) {
    scriptstate[`$${key}`] = value !== undefined ? String(value) : '';
  }
  return scriptstate;
}

function createMockChat() {
  return {
    message: [] as any[],
    note: '',
    name: 'Mock Chat',
    localLore: [] as any[],
    modules: [] as string[],
    scriptstate: buildScriptState(),
    id: 'mock-chat'
  };
}

async function applyEditorStateRuntime() {
  try {
    const {
      setRuntimeUserName,
      setRuntimePersonaPrompt,
      setRuntimeBotName,
      setRuntimeBotDescription,
      setRuntimeChatVars
    } = await import('./platform-shim');

    setRuntimeUserName(editorState.userName);
    setRuntimePersonaPrompt(editorState.userPersona);
    setRuntimeBotName(editorState.botName);
    setRuntimeBotDescription(editorState.botDescription);
    setRuntimeChatVars(editorState.customVars ?? {});
  } catch (error) {
    console.warn('[mockDatabase] Failed to synchronize runtime data:', error);
  }
}

// Mock character based on editorState
export function getMockCharacter() {
  return {
    type: 'character' as const,
    chaId: 'test-char',
    name: editorState.botName ?? 'TestBot',
    firstMessage: 'Hello!',  // 기본 인사말
    desc: editorState.botDescription ?? '',
    notes: '',
    chats: [createMockChat()],
    chatFolders: [] as any[],
    chatPage: 0,
    viewScreen: 'none' as const,
    globalNote: '',
    additionalAssets: [] as any[],
    virtualscript: [] as any[],
    utilityBot: false,
    exampleMessage: '',
    creatorNotes: '',
    systemPrompt: '',
    postHistoryInstructions: '',
    alternateGreetings: [] as string[],
    tags: [] as string[],
    creator: '',
    characterVersion: '1.0',
    personality: '',
    scenario: '',
    firstMsgIndex: 0,
    bias: [] as [string, number][],
    emotionImages: [] as [string, string][],
    globalLore: [] as any[],
    sdData: [] as [string, string][],
    customscript: [] as any[],
    triggerscript: [] as any[],
    modules: [] as string[],
    depth_prompt: {
      prompt: '',
      depth: 0,
      role: 'system' as const,
    },
    replaceGlobalNote: '',
    loreSettings: null,
  } as any;
}

// Mock database
export function getMockDatabase(): any {
  return {
    username: editorState.userName,
    personaPrompt: editorState.userPersona ?? '페르소나 프롬프트가 들어가는 자리입니다.',
    characters: [getMockCharacter()],
    // Prompt settings
    mainPrompt: '메인 프롬프트가 들어가는 자리입니다.',
    jailbreak: '',
    jailbreakToggle: false,
    globalNote: '글로벌 노트 프롬프트가 들어가는 자리입니다.',
    authorNote: '작가의 노트 프롬프트가 들어가는 자리입니다.',
    additionalPrompt: '',
    descriptionPrefix: 'description of {{char}}: ',
    promptPreprocess: true,
    chainOfThought: false,
    // Regex & Plugins
    presetRegex: [],
    plugins: [],
    // Bot presets
    botPresets: [],
    botPresetsId: 0,
    presetChain: '',
    // Modules
    enabledModules: [],
    modules: [],
    moduleIntergration: '',
    // Template settings
    dynamicAssets: false,
    templateDefaultVariables: '',
    customPromptTemplateToggle: '',
    promptTemplate: null,
    promptSettings: {
      sendName: false,
      utilOverride: false,
      postEndInnerFormat: '모든 프롬프트 요소가 조합된 후 마지막에 추가되는 시스템 메시지입니다.',
      sendChatAsSystem: false,
      customChainOfThought: false,
    },
    promptInfoInsideChat: false,
    promptTextInfoInsideChat: false,
    globalChatVariables: {},
    // Memory
    hypaV3: false,
    // Selection
    botLastSelected: 0,
    chatLastSelected: 0,
    // AI model settings
    aiModel: 'textgen_webui',  // system role을 합치지 않는 모델
    apiType: 'openai',
    maxContext: 4096,
    maxResponse: 2048,
    temperature: 0.7,
    // Lorebook
    loreBookDepth: 5,
    loreBookToken: 10000,
    // Bias
    bias: [],
    // Group settings
    groupOtherBotRole: 'user',
    // Error handling
    inlayErrorResponse: false,
    outputImageModal: false,
    // Stats
    statics: {
      messages: 0,
    },
    // Additional common fields
    formatingOrder: ['main', 'description', 'personaPrompt', 'chats', 'lastChat', 'jailbreak', 'lorebook', 'globalNote', 'authorNote'],
    autoSuggestPrompt: '',
    currentPluginProvider: '',
    supaMemoryPrompt: '',
    supaMemoryKey: '',
    useExperimental: false,
    translator: '',
    imageCompression: 100,
    removeFromMemory: false,
    rememberToolUsage: false,
  };
}

// Setup global mocks for RisuAI imports
export async function setupDatabaseMocks() {
  try {
    if (!storeSetupPromise) {
      storeSetupPromise = import('../../src/ts/stores.svelte').then(({ selectedCharID, CharEmotion, DBState }) => {
        try {
          selectedCharID.set(0);
        } catch (e) {
          console.warn('[mockDatabase] Failed to set selectedCharID:', e);
        }
        try {
          CharEmotion.set({});
        } catch (e) {
          // ignore
        }
        try {
          Object.assign(DBState.db as any, getMockDatabase());
        } catch (e) {
          console.warn('[mockDatabase] Failed to seed DBState:', e);
        }
      }).catch((e) => {
        console.warn('[mockDatabase] Failed to import stores.svelte:', e);
      });
    }
    await storeSetupPromise;
    await applyEditorStateRuntime();
    
    // Inject mock character into actual database
    const { DBState, selectedCharID } = await import('src/ts/stores.svelte');
    const db = DBState.db;
    
    if (!db || !Array.isArray(db.characters) || db.characters.length === 0) {
      console.log('[mockDatabase] Injecting mock character into runtime DB');
      const mockDb = getMockDatabase();
      Object.assign(DBState.db as any, mockDb);
      selectedCharID.set(0);
    } else {
      console.log('[mockDatabase] Using existing DB with', db.characters.length, 'characters');
    }
    
    console.log('[mockDatabase] Setup complete');
  } catch (e) {
    console.warn('[mockDatabase] Could not setup database mocks:', e);
  }
}

export async function prepareMockCharacter(scripts: Array<{ comment: string; in: string; out: string; type: string; flag?: string; ableFlag?: boolean }>) {
  await setupDatabaseMocks();
  try {
    await applyEditorStateRuntime();
    const db = getMockDatabase();
    const mockChar = db.characters?.[0] ?? getMockCharacter();
    mockChar.customscript = scripts as any;
    if (!Array.isArray(mockChar.chats) || mockChar.chats.length === 0) {
      mockChar.chats = [createMockChat()];
    }
    mockChar.chatPage = 0;
    const { DBState, selectedCharID } = await import('../../src/ts/stores.svelte');
    if (!Array.isArray(DBState.db.characters)) {
      DBState.db.characters = [] as any;
    }
    Object.assign(DBState.db as any, db);
    DBState.db.characters[0] = mockChar as any;
    selectedCharID.set(0);

    try {
  const { setDatabase } = await import('src/ts/storage/database.svelte');
      setDatabase(db);
    } catch (innerError) {
      console.warn('[mockDatabase] Failed to push mock database via setDatabase:', innerError);
    }

    return mockChar as any;
  } catch (e) {
    console.warn('[mockDatabase] Failed to prepare mock character:', e);
    const fallbackChar = getMockCharacter() as any;
    fallbackChar.customscript = scripts as any;
    return fallbackChar;
  }
}
