// Platform shim for editor (non-Tauri environment)
// Mock implementation of globalApi.svelte.ts for standalone editor

import type { Database } from '../../src/ts/storage/database.svelte';

// Runtime state for dynamic values
let _runtimeUserName = 'User';
let _runtimePersonaPrompt = '';
let _chatVariables: {[key: string]: string} = {}; // 채팅 변수 저장소

// Mock database for editor
let _mockDatabase: Partial<Database> = {
  username: 'User',
  personaPrompt: '',
  characters: [{
    name: 'TestBot',
    type: 'character',
    chatPage: 0,
    chats: [{
      message: [],
      scriptstate: {}, // 채팅 변수가 여기 저장됨
      name: 'Chat',
      localLore: []
    }]
  }] as any,
  templateDefaultVariables: '' // 템플릿 기본 변수
};

export function setRuntimeUserName(name: string) {
  _runtimeUserName = name;
  _mockDatabase.username = name;
  //console.log('[platform-shim] setRuntimeUserName:', name);
}

export function setRuntimePersonaPrompt(prompt: string) {
  _runtimePersonaPrompt = prompt;
  _mockDatabase.personaPrompt = prompt;
  //console.log('[platform-shim] setRuntimePersonaPrompt:', prompt);
}

export function setRuntimeBotName(name: string) {
  if (_mockDatabase.characters?.[0]) {
    _mockDatabase.characters[0].name = name;
    //console.log('[platform-shim] setRuntimeBotName:', name);
  }
}

export function setRuntimeBotDescription(desc: string) {
  if (_mockDatabase.characters?.[0]) {
    (_mockDatabase.characters[0] as any).firstMessage = desc;
    //console.log('[platform-shim] setRuntimeBotDescription:', desc);
  }
}

export function setRuntimeChatVars(vars: {[key: string]: string}) {
  _chatVariables = { ...vars };
  
  // mock database의 scriptstate에도 반영
  if (_mockDatabase.characters?.[0]?.chats?.[0]) {
    _mockDatabase.characters[0].chats[0].scriptstate = {};
    for (const [key, value] of Object.entries(vars)) {
      _mockDatabase.characters[0].chats[0].scriptstate['$' + key] = value;
    }
  }
  
  //console.log('[platform-shim] setRuntimeChatVars:', _chatVariables);
  //console.log('[platform-shim] scriptstate:', _mockDatabase.characters?.[0]?.chats?.[0]?.scriptstate);
}

export function getUserName(): string {
  //console.log('[platform-shim] getUserName called, returning:', _runtimeUserName);
  return _runtimeUserName;
}

export function getPersonaPrompt(): string {
  //console.log('[platform-shim] getPersonaPrompt called, returning:', _runtimePersonaPrompt);
  return _runtimePersonaPrompt;
}

export function getChatVar(key: string): string {
  const value = _chatVariables[key];
  //console.log('[platform-shim] getChatVar called for key:', key, 'returning:', value ?? 'null');
  return value ?? 'null';
}

export function setChatVar(key: string, value: string) {
  _chatVariables[key] = value;
  
  // CRITICAL: chat.scriptstate에도 동기화 (syncScriptStateToEditor가 읽을 수 있도록)
  if (_mockDatabase.characters?.[0]?.chats?.[0]?.scriptstate) {
    _mockDatabase.characters[0].chats[0].scriptstate['$' + key] = value;
  }
  
  console.log('[platform-shim] setChatVar:', key, '=', value, '(synced to scriptstate)');
}

export function getGlobalChatVar(key: string): string {
  // 에디터에서는 글로벌 변수도 일반 채팅 변수로 처리
  return getChatVar(key);
}

export function getDatabase(): Database {
  //console.log('[platform-shim] getDatabase called, returning username:', _mockDatabase.username, 'personaPrompt:', _mockDatabase.personaPrompt);
  return _mockDatabase as Database;
}

// CRITICAL: 전역 객체에 함수 등록 (util.ts가 이를 참조하도록)
// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__EDITOR_getUserName = getUserName;
  // @ts-ignore
  window.__EDITOR_getPersonaPrompt = getPersonaPrompt;
}

// Platform detection - all false for editor
export const isTauri = false;
export const isNodeServer = false;
export const googleBuild = false;
export const isMobile = false;

// Mock Svelte 5 $state objects (Svelte 4 compatible)
export const saving = { value: false };
export const requiresFullEncoderReload = { value: false };

// Mock AutoStorage
class MockAutoStorage {
  private storage = new Map<string, any>();
  async getItem(key: string) { return this.storage.get(key) ?? null; }
  async setItem(key: string, value: any) { this.storage.set(key, value); }
  async removeItem(key: string) { this.storage.delete(key); }
  async clear() { this.storage.clear(); }
}

export const forageStorage = new MockAutoStorage();

// Mock functions
export function addFetchLog(_arg: any) {}
export function getUnpargeables(_db?: Database, _uptype?: 'basename' | 'pure') { return []; }
export function replaceDbResources(db: Database, _replacer: any): Database { return db; }
export function checkCharOrder() {}
export function getRequestLog() { return []; }
export function openURL(url: string) { window.open(url, '_blank'); }
export function getModelMaxContext(_model: string): number | undefined { return undefined; }
export function textifyReadableStream(_stream: ReadableStream<Uint8Array>) { return Promise.resolve(''); }
export function toggleFullscreen() {}
export function trimNonLatin(data: string) { return data; }
export function updateHeightMode() {}
export function getLanguageCodes() { return []; }
export function getVersionString(): string { return '1.0.0-editor'; }

// Mock Writer classes
export class TauriWriter {
  write(_data: Uint8Array) {}
  close() {}
}

export class LocalWriter {
  private stream: WritableStream<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  async init(name = 'Binary', ext = ['bin']): Promise<boolean> {
    try {
      // Web browser implementation using StreamSaver
      const streamSaver = await import('streamsaver');
      const filename = `${name}.${ext[0]}`;
      this.stream = streamSaver.createWriteStream(filename);
      this.writer = this.stream.getWriter();
      return true;
    } catch (error) {
      console.error('Failed to initialize LocalWriter:', error);
      return false;
    }
  }

  async write(data: Uint8Array | string) {
    if (!this.writer) {
      throw new Error('LocalWriter not initialized. Call init() first.');
    }
    
    // Handle undefined or null data
    if (data === undefined || data === null) {
      console.warn('[LocalWriter] Skipping write - data is', data);
      return;
    }
    
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    
    // Skip empty writes
    if (bytes.length === 0) {
      console.log('[LocalWriter] Skipping empty write');
      return;
    }
    
    console.log('[LocalWriter] Writing', bytes.length, 'bytes');
    await this.writer.write(bytes);
  }

  async close() {
    console.log('[LocalWriter] Closing writer...');
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
      this.stream = null;
      console.log('[LocalWriter] Writer closed successfully');
    }
  }
}

export class VirtualWriter {
  private buffer = new AppendableBuffer();

  async init(): Promise<boolean> {
    return true;
  }

  async write(data: Uint8Array | string) {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.buffer.append(bytes);
  }

  async close() {}

  toBuffer(): Uint8Array {
    return this.buffer.toBuffer();
  }
}

export class BlankWriter {
  async init(): Promise<boolean> {
    return true;
  }

  async write(_data: Uint8Array | string) {}

  async close() {}
}

export class AppendableBuffer {
  buffer: Uint8Array;
  
  constructor() {
    this.buffer = new Uint8Array(0);
  }
  
  append(data: Uint8Array) {
    const newBuffer = new Uint8Array(this.buffer.length + data.length);
    newBuffer.set(this.buffer);
    newBuffer.set(data, this.buffer.length);
    this.buffer = newBuffer;
  }
  
  toBuffer(): Uint8Array {
    return this.buffer;
  }
}

export class PerformanceDebugger {
  start() {}
  end() {}
}

// Mock fetch-related functions
export const globalFetch = fetch;
export const fetchNative = fetch;

// Mock file operations
export async function downloadFile(_url: string, _filename?: string) {}
export async function saveAsset(_path: string, _data: any) {}
export async function loadAsset(_path: string) { return null; }

/**
 * Read image from URL or path
 * For bot assets, reads from /save/{botName}/assets/
 */
export async function readImage(path: string): Promise<Uint8Array | null> {
  if (!path) return null;
  
  try {
    // If it's a full URL or data URL, fetch it
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      const response = await fetch(path);
      if (!response.ok) return null;
      return new Uint8Array(await response.arrayBuffer());
    }
    
    // Otherwise, treat it as a relative path from /save/
    // Expected format: /save/{botName}/assets/{path}
    const response = await fetch(path);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    console.error('Failed to read image:', path, error);
    return null;
  }
}

export function getFileSrc(path: string) { return path; }

console.log('✅ Platform shim loaded (globalApi.svelte mock)');
