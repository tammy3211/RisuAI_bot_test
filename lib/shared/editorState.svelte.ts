/**
 * 에디터 전역 상태 관리 (Svelte 5 runes 사용)
 * 모든 탭에서 공유되는 봇/사용자 정보와 변수
 * 
 * $state로 감싼 단일 객체를 export
 * localStorage에 자동 저장/로드
 */

const STORAGE_KEY = 'risuai-editor-state';

// localStorage에서 초기 데이터 로드
function loadFromStorage() {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('[editorState] Loading from localStorage:', saved);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[editorState] Loaded data:', parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
  }
  return null;
}

// localStorage에 저장
export function saveEditorState() {
  if (typeof window === 'undefined') return;
  
  console.log('[editorState] saveEditorState called');
  console.log('[editorState] Current botSource:', editorState.botSource);
  console.log('[editorState] Current botDescription length:', editorState.botDescription.length);
  console.log('[editorState] Current botDescription preview:', editorState.botDescription.substring(0, 50));
  
  try {
    // customVars를 순수 객체로 변환
    const plainCustomVars: {[key: string]: string} = {};
    for (const key in editorState.customVars) {
      plainCustomVars[key] = editorState.customVars[key];
    }
    
    // 메서드 제외하고 순수 데이터만 추출
    const dataToSave: any = {
      botSource: editorState.botSource,
      savedBots: editorState.savedBots,
      selectedBot: editorState.selectedBot,
      userName: editorState.userName,
      userPersona: editorState.userPersona,
      customVars: plainCustomVars
    };
    
    // botSource가 'saved'가 아닐 때만 botName과 botDescription 저장
    if (editorState.botSource !== 'saved') {
      dataToSave.botName = editorState.botName;
      dataToSave.botDescription = editorState.botDescription;
      console.log('[editorState] Saving bot info (custom mode)');
    } else {
      console.log('[editorState] Skipping bot info (saved mode - will load from file)');
    }
    
    const jsonData = JSON.stringify(dataToSave);
    console.log('[editorState] Saving to localStorage:', jsonData);
    localStorage.setItem(STORAGE_KEY, jsonData);
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// 기본값
const defaultState = {
  botSource: 'custom',
  savedBots: [] as string[],
  selectedBot: '',
  userName: 'User',
  userPersona: 'Friendly, helpful, and knowledgeable.',
  botName: 'TestBot',
  botDescription: 'A friendly AI assistant.',
  regexScripts: [] as any[],
  lorebookEntries: [] as any[],
  customVars: {
    'test_var': 'example value'
  } as {[key: string]: string}
};

// localStorage에서 로드하거나 기본값 사용
const savedState = loadFromStorage();
const initialState = savedState ? { ...defaultState, ...savedState } : defaultState;

export const editorState = $state({
  ...initialState,
  
  // Helper methods
  addCustomVar(key: string, value: string = '') {
    this.customVars[key] = value;
    saveEditorState();
  },
  
  removeCustomVar(key: string) {
    delete this.customVars[key];
    saveEditorState();
  }
});
