/**
 * 에디터 전역 상태 관리 (Svelte 5 runes 사용)
 * 모든 탭에서 공유되는 봇/사용자 정보와 변수
 * 
 * $state로 감싼 단일 객체를 export
 * localStorage에 자동 저장/로드
 */

import { loadJSON, saveJSON } from './localStorage.svelte';

const STORAGE_KEY = 'risuai-editor-state';

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
    test_var: 'example value'
  } as { [key: string]: string }
};

// localStorage에서 로드하거나 기본값 사용
const savedState = loadJSON<typeof defaultState | null>(STORAGE_KEY, null, '[EditorState]');
const initialState = savedState ? { ...defaultState, ...savedState } : defaultState;

// localStorage에 저장
export function saveEditorState() {
  if (typeof window === 'undefined') return;

  try {
    const dataToSave: any = {
      botSource: editorState.botSource,
      savedBots: editorState.savedBots,
      selectedBot: editorState.selectedBot,
      userName: editorState.userName,
      userPersona: editorState.userPersona,
      customVars: { ...editorState.customVars }
    };

    if (editorState.botSource !== 'saved') {
      dataToSave.botName = editorState.botName;
      dataToSave.botDescription = editorState.botDescription;
    } else {
      dataToSave.selectedBot = editorState.selectedBot;
    }

    saveJSON(STORAGE_KEY, dataToSave, '[EditorState]');
  } catch (error) {
    console.warn('[EditorState] Failed to save:', error);
  }
}

// $state 객체 (단순 객체 + helper 메서드)
export const editorState = $state({
  ...initialState,

  addCustomVar(key: string, value: string = '') {
    this.customVars = { ...this.customVars, [key]: value };
    saveEditorState();
  },

  removeCustomVar(key: string) {
    const next = { ...this.customVars };
    delete next[key];
    this.customVars = next;
    saveEditorState();
  },

  setCustomVar(key: string, value: string) {
    this.customVars = { ...this.customVars, [key]: value };
    saveEditorState();
  }
});
