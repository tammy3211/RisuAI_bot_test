/**
 * BotService - 봇 데이터 관리 서비스
 *
 * 백엔드 API를 통한 봇 데이터 로드/저장/실시간 업데이트를 담당
 * 캐싱, 에러 처리, 타입 안전성을 제공
 */

import type { LorebookEntry } from '../../ts/mockDatabase';

// 봇 데이터 타입 정의
export interface BotData {
  name: string;
  description: string;
  firstMessage: string;
  regex: {
    scripts: RegexScript[];
    outFiles: Record<string, string>;
  };
  lorebook: {
    entries: LorebookEntry[];
    contentFiles: Record<string, string>;
  };
  trigger: {
    lua: string;
    backgroundHTML: string;
  };
  assets: {
    main: string;
    emotions: [string, string][];
    additional: [string, string, string][];
    ccAssets: Array<{ type: string; uri: string; name: string; ext: string }>;
  };
}

export interface RegexScript {
  comment: string;
  in: string;
  out: string;
  outFile?: string;
  type: string;
  flag?: string;
  ableFlag?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: number;
}

export interface FileChangeEvent {
  type: 'file-changed';
  botName: string;
  timestamp: number;
  path?: string;
}

export class BotService {
  private cache = new Map<string, BotData>();
  private ws: WebSocket | null = null;
  private watchers = new Map<string, Set<(event: FileChangeEvent) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * 봇 목록 조회
   */
  async listBots(): Promise<string[]> {
    try {
      const response = await fetch('/api/bots');
      const result: ApiResponse<{ bots: string[] }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load bots');
      }

      return result.data?.bots || [];
    } catch (error) {
      console.error('[BotService] Failed to list bots:', error);
      throw error;
    }
  }

  /**
   * 봇 전체 데이터 조회 (캐싱 지원)
   */
  async loadBot(botName: string, forceReload = false): Promise<BotData> {
    if (!forceReload && this.cache.has(botName)) {
      return this.cache.get(botName)!;
    }

    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}`);
      const result: ApiResponse<BotData> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load bot');
      }

      const botData = result.data!;
      this.cache.set(botName, botData);
      return botData;
    } catch (error) {
      console.error(`[BotService] Failed to load bot ${botName}:`, error);
      throw error;
    }
  }

  /**
   * 봇 설명 조회
   */
  async loadDescription(botName: string): Promise<string> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/description`);
      const result: ApiResponse<{ content: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load description');
      }

      return result.data?.content || '';
    } catch (error) {
      console.error(`[BotService] Failed to load description for ${botName}:`, error);
      return '';
    }
  }

  /**
   * 봇 설명 업데이트
   */
  async updateDescription(botName: string, content: string): Promise<void> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update description');
      }

      // 캐시 무효화
      this.invalidateCache(botName);
    } catch (error) {
      console.error(`[BotService] Failed to update description for ${botName}:`, error);
      throw error;
    }
  }

  /**
   * 봇 첫 메시지 조회
   */
  async loadFirstMessage(botName: string): Promise<string> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/first-message`);
      const result: ApiResponse<{ content: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load first message');
      }

      return result.data?.content || '';
    } catch (error) {
      console.error(`[BotService] Failed to load first message for ${botName}:`, error);
      return '';
    }
  }

  /**
   * Regex 스크립트 조회
   */
  async loadRegexScripts(botName: string): Promise<RegexScript[]> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/regex`);
      const result: ApiResponse<{ scripts: RegexScript[]; outFiles: Record<string, string> }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load regex scripts');
      }

      const data = result.data!;
      const scripts = data.scripts || [];

      // outFile이 있는 스크립트에 내용 채우기
      return scripts.map(script => ({
        ...script,
        out: script.outFile ? (data.outFiles[script.outFile] || script.out) : script.out
      }));
    } catch (error) {
      console.error(`[BotService] Failed to load regex scripts for ${botName}:`, error);
      return [];
    }
  }

  /**
   * 로어북 조회
   */
  async loadLorebook(botName: string): Promise<LorebookEntry[]> {
    console.log('[BotService] loadLorebook called for:', botName);
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/lorebook`);
      const result: ApiResponse<{ entries: LorebookEntry[]; contentFiles: Record<string, string> }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load lorebook');
      }

      const data = result.data!;
      const entries = data.entries || [];
      console.log('[BotService] loadLorebook received', entries.length, 'entries:', entries);

      // content 파일 내용 채우기
      return entries.map(entry => {
        const match = entry.content?.match(/^\{(.+?)\}$/);
        if (match) {
          const fileName = match[1];
          if (data.contentFiles[fileName]) {
            return {
              ...entry,
              mdContent: data.contentFiles[fileName],
              mdFile: fileName
            };
          }
        }
        return entry;
      });
    } catch (error) {
      console.error(`[BotService] Failed to load lorebook for ${botName}:`, error);
      return [];
    }
  }

  /**
   * 트리거 스크립트 조회
   */
  async loadTriggerScript(botName: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/trigger`);
      const result: ApiResponse<{ lua: string; backgroundHTML: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load trigger script');
      }

      const data = result.data!;
      return data.lua ? [{
        comment: 'Lua Script',
        type: 'start',
        conditions: [],
        effect: [{
          type: 'triggerlua',
          code: data.lua
        }]
      }] : [];
    } catch (error) {
      console.error(`[BotService] Failed to load trigger script for ${botName}:`, error);
      return [];
    }
  }

  /**
   * 배경 HTML 조회
   */
  async loadBackgroundHTML(botName: string): Promise<string> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/background`);
      const result: ApiResponse<{ content: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load background HTML');
      }

      return result.data?.content || '';
    } catch (error) {
      console.error(`[BotService] Failed to load background HTML for ${botName}:`, error);
      return '';
    }
  }

  /**
   * 에셋 조회
   */
  async loadAssets(botName: string): Promise<BotData['assets']> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}/assets`);
      const result: ApiResponse<BotData['assets']> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load assets');
      }

      return result.data || {
        main: '',
        emotions: [],
        additional: [],
        ccAssets: []
      };
    } catch (error) {
      console.error(`[BotService] Failed to load assets for ${botName}:`, error);
      return {
        main: '',
        emotions: [],
        additional: [],
        ccAssets: []
      };
    }
  }

  /**
   * 봇 생성
   */
  async createBot(botName: string): Promise<string> {
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botName })
      });

      const result: ApiResponse<{ botName: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create bot');
      }

      return result.data!.botName;
    } catch (error) {
      console.error(`[BotService] Failed to create bot ${botName}:`, error);
      throw error;
    }
  }

  /**
   * 봇 삭제
   */
  async deleteBot(botName: string): Promise<void> {
    try {
      const response = await fetch(`/api/bots/${encodeURIComponent(botName)}`, {
        method: 'DELETE'
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete bot');
      }

      // 캐시 무효화
      this.invalidateCache(botName);
    } catch (error) {
      console.error(`[BotService] Failed to delete bot ${botName}:`, error);
      throw error;
    }
  }

  /**
   * 실시간 업데이트 구독
   */
  watchBot(botName: string, callback: (event: FileChangeEvent) => void): () => void {
    console.log('[BotService] watchBot called for:', botName);
    
    if (!this.watchers.has(botName)) {
      this.watchers.set(botName, new Set());
    }

    this.watchers.get(botName)!.add(callback);

    // WebSocket 연결
    this.connectWebSocket(botName);

    // 언구독 함수 반환
    return () => {
      console.log('[BotService] Unsubscribing from:', botName);
      const watchers = this.watchers.get(botName);
      if (watchers) {
        watchers.delete(callback);
        if (watchers.size === 0) {
          this.watchers.delete(botName);
          this.disconnectWebSocket();
        }
      }
    };
  }

  /**
   * 캐시 무효화
   */
  private invalidateCache(botName: string): void {
    this.cache.delete(botName);
  }

  /**
   * 모든 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * WebSocket 연결
   */
  private connectWebSocket(botName: string): void {
    console.log('[BotService] connectWebSocket called for:', botName);
    console.log('[BotService] Current WebSocket state:', this.ws?.readyState);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[BotService] WebSocket already open, skipping');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/watch/${encodeURIComponent(botName)}`;
      
      console.log('[BotService] Attempting to connect to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[BotService] ✅ WebSocket connected for bot: ${botName}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        console.log('[BotService] WebSocket message received:', event.data);
        try {
          const message: FileChangeEvent = JSON.parse(event.data);
          if (message.type === 'file-changed') {
            console.log('[BotService] File change event:', message);
            // 해당 봇의 캐시 무효화
            this.invalidateCache(message.botName);

            // 콜백 호출
            const watchers = this.watchers.get(message.botName);
            if (watchers) {
              console.log('[BotService] Calling', watchers.size, 'watchers');
              watchers.forEach(callback => callback(message));
            } else {
              console.warn('[BotService] No watchers found for:', message.botName);
            }
          }
        } catch (error) {
          console.error('[BotService] Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log(`[BotService] WebSocket disconnected for bot: ${botName}`);
        this.attemptReconnect(botName);
      };

      this.ws.onerror = (error) => {
        console.error('[BotService] WebSocket error:', error);
      };

    } catch (error) {
      console.error('[BotService] Failed to connect WebSocket:', error);
      this.attemptReconnect(botName);
    }
  }

  /**
   * WebSocket 연결 해제
   */
  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 재연결 시도
   */
  private attemptReconnect(botName: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[BotService] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[BotService] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.watchers.has(botName)) {
        this.connectWebSocket(botName);
      }
    }, delay);
  }
}

// 싱글톤 인스턴스
export const botService = new BotService();