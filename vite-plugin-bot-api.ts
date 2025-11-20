/**
 * Vite Plugin: Bot API
 *
 * 봇 데이터 관리를 위한 REST API와 WebSocket 실시간 업데이트를 제공
 * 파일 시스템 기반 데이터 저장소와 연동
 */

import type { Plugin } from 'vite';
import fs from 'fs-extra';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

interface BotApiOptions {
  saveDir?: string;
  enableWebSocket?: boolean;
}

export function botApiPlugin(options: BotApiOptions = {}): Plugin {
  const {
    saveDir = path.resolve('save'),
    enableWebSocket = true
  } = options;

  let wss: WebSocketServer | null = null;
  const watchers = new Map<string, Set<WebSocket>>();
  const fileWatchers = new Map<string, fs.FSWatcher>();

  return {
    name: 'bot-api',

    configureServer(server) {
      // WebSocket 서버 설정
      if (enableWebSocket) {
        wss = new WebSocketServer({ noServer: true });

        server.httpServer!.on('upgrade', (req: IncomingMessage, socket, head) => {
          const url = req.url || '';

          // /api/watch/:botName만 처리
          const watchMatch = url.match(/^\/api\/watch\/(.+)$/);
          if (watchMatch) {
            const botName = decodeURIComponent(watchMatch[1]);

            wss!.handleUpgrade(req, socket, head, (ws) => {
              console.log(`[BotAPI] WebSocket connected for bot: ${botName}`);

              if (!watchers.has(botName)) {
                watchers.set(botName, new Set());
              }
              watchers.get(botName)!.add(ws);

              ws.on('close', () => {
                console.log(`[BotAPI] WebSocket disconnected for bot: ${botName}`);
                watchers.get(botName)?.delete(ws);
              });

              ws.on('error', (error: any) => {
                console.error(`[BotAPI] WebSocket error for bot ${botName}:`, error);
              });
            });
          }
          // 다른 WebSocket 요청 (Vite HMR 등)은 무시
        });
      }

      // 파일 변경 감지 설정
      if (enableWebSocket) {
        setupFileWatching(saveDir);
      }

      // REST API 미들웨어
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        try {
          // 봇 목록 조회: GET /api/bots
          if (url === '/api/bots' && method === 'GET') {
            await handleListBots(res);
            return;
          }

          // 봇 생성: POST /api/bots
          if (url === '/api/bots' && method === 'POST') {
            await handleCreateBot(req, res);
            return;
          }

          // 봇 삭제: DELETE /api/bots/:botName
          const deleteMatch = url.match(/^\/api\/bots\/([^/?]+)$/);
          if (deleteMatch && method === 'DELETE') {
            const botName = decodeURIComponent(deleteMatch[1]);
            await handleDeleteBot(botName, res);
            return;
          }

          // 봇 전체 데이터 조회: GET /api/bots/:botName
          const botMatch = url.match(/^\/api\/bots\/([^/?]+)$/);
          if (botMatch && method === 'GET') {
            const botName = decodeURIComponent(botMatch[1]);
            await handleLoadBot(botName, res);
            return;
          }

          // 봇 설명: GET/PUT /api/bots/:botName/description
          const descMatch = url.match(/^\/api\/bots\/([^/?]+)\/description$/);
          if (descMatch) {
            const botName = decodeURIComponent(descMatch[1]);
            if (method === 'GET') {
              await handleLoadDescription(botName, res);
            } else if (method === 'PUT') {
              await handleUpdateDescription(req, botName, res);
            }
            return;
          }

          // 첫 메시지: GET /api/bots/:botName/first-message
          const firstMsgMatch = url.match(/^\/api\/bots\/([^/?]+)\/first-message$/);
          if (firstMsgMatch && method === 'GET') {
            const botName = decodeURIComponent(firstMsgMatch[1]);
            await handleLoadFirstMessage(botName, res);
            return;
          }

          // Regex: GET /api/bots/:botName/regex
          const regexMatch = url.match(/^\/api\/bots\/([^/?]+)\/regex$/);
          if (regexMatch && method === 'GET') {
            const botName = decodeURIComponent(regexMatch[1]);
            await handleLoadRegex(botName, res);
            return;
          }

          // Lorebook: GET /api/bots/:botName/lorebook
          const lorebookMatch = url.match(/^\/api\/bots\/([^/?]+)\/lorebook$/);
          if (lorebookMatch && method === 'GET') {
            const botName = decodeURIComponent(lorebookMatch[1]);
            await handleLoadLorebook(botName, res);
            return;
          }

          // 트리거: GET /api/bots/:botName/trigger
          const triggerMatch = url.match(/^\/api\/bots\/([^/?]+)\/trigger$/);
          if (triggerMatch && method === 'GET') {
            const botName = decodeURIComponent(triggerMatch[1]);
            await handleLoadTrigger(botName, res);
            return;
          }

          // 배경: GET /api/bots/:botName/background
          const bgMatch = url.match(/^\/api\/bots\/([^/?]+)\/background$/);
          if (bgMatch && method === 'GET') {
            const botName = decodeURIComponent(bgMatch[1]);
            await handleLoadBackground(botName, res);
            return;
          }

          // 에셋: GET /api/bots/:botName/assets
          const assetsMatch = url.match(/^\/api\/bots\/([^/?]+)\/assets$/);
          if (assetsMatch && method === 'GET') {
            const botName = decodeURIComponent(assetsMatch[1]);
            await handleLoadAssets(botName, res);
            return;
          }

          next();
        } catch (error) {
          console.error('[BotAPI] Request error:', error);
          sendError(res, 'INTERNAL_ERROR', 'Internal server error');
        }
      });
    },

    buildEnd() {
      // 빌드 종료 시 정리
      cleanup();
    }
  };

  // 파일 감시 설정
  function setupFileWatching(baseDir: string) {
    try {
      // 봇 폴더들을 감시
      const watcher = fs.watch(baseDir, { recursive: true }, (_eventType, filename) => {
        if (!filename) return;

        const filePath = path.resolve(baseDir, filename.toString());
        const relativePath = path.relative(baseDir, filePath);
        const pathParts = relativePath.split(path.sep);

        if (pathParts.length >= 1) {
          const botName = pathParts[0];

          // 봇 폴더 내 파일 변경 시 알림
          if (watchers.has(botName)) {
            watchers.get(botName)!.forEach(ws => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'file-changed',
                  botName,
                  timestamp: Date.now(),
                  path: relativePath
                }));
              }
            });
          }
        }
      });

      fileWatchers.set('main', watcher);
    } catch (error) {
      console.warn('[BotAPI] Failed to setup file watching:', error);
    }
  }

  // 정리 함수
  function cleanup() {
    if (wss) {
      wss.close();
      wss = null;
    }

    watchers.clear();

    fileWatchers.forEach(watcher => {
      watcher.close();
    });
    fileWatchers.clear();
  }

  // 헬퍼 함수들
  async function handleListBots(res: any) {
    try {
      if (!await fs.pathExists(saveDir)) {
        return sendSuccess(res, { bots: [] });
      }

      const entries = await fs.readdir(saveDir, { withFileTypes: true });
      const bots = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();

      sendSuccess(res, { bots });
    } catch (error) {
      sendError(res, 'LIST_FAILED', 'Failed to list bots');
    }
  }

  async function handleCreateBot(req: any, res: any) {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { botName } = JSON.parse(body);

        if (!botName || typeof botName !== 'string') {
          return sendError(res, 'INVALID_REQUEST', 'Invalid bot name');
        }

        const safeBotName = botName.trim().replace(/[<>:"/\\|?*]/g, '_');
        if (!safeBotName) {
          return sendError(res, 'INVALID_REQUEST', 'Invalid bot name');
        }

        const botPath = path.join(saveDir, safeBotName);

        if (await fs.pathExists(botPath)) {
          return sendError(res, 'ALREADY_EXISTS', 'Bot already exists', 409);
        }

        // 템플릿에서 복사 (기존 로직 유지)
        const templatePath = path.resolve('template', 'default');
        if (await fs.pathExists(templatePath)) {
          await fs.copy(templatePath, botPath);
        } else {
          // 기본 폴더 구조 생성
          await fs.ensureDir(botPath);
          await fs.ensureDir(path.join(botPath, 'regex'));
          await fs.ensureDir(path.join(botPath, 'regex', 'out'));
          await fs.ensureDir(path.join(botPath, 'lorebook'));
          await fs.ensureDir(path.join(botPath, 'lorebook', 'content'));
          await fs.ensureDir(path.join(botPath, 'triggerscript'));
          await fs.ensureDir(path.join(botPath, 'assets'));

          // 기본 파일들 생성
          await fs.writeFile(path.join(botPath, 'description.md'), `# ${safeBotName}\n\nA new bot.`);
          await fs.writeFile(path.join(botPath, 'first_mes.md'), `Hello! I'm ${safeBotName}.`);
          await fs.writeFile(path.join(botPath, 'regex', 'regex.json'), '[]');
          await fs.writeFile(path.join(botPath, 'lorebook', 'lorebook.json'), '[]');
        }

        sendSuccess(res, { botName: safeBotName });
      } catch (error) {
        sendError(res, 'CREATE_FAILED', 'Failed to create bot');
      }
    });
  }

  async function handleDeleteBot(botName: string, res: any) {
    try {
      const botPath = path.join(saveDir, botName);

      if (!await fs.pathExists(botPath)) {
        return sendError(res, 'NOT_FOUND', 'Bot not found', 404);
      }

      await fs.remove(botPath);
      sendSuccess(res, {});
    } catch (error) {
      sendError(res, 'DELETE_FAILED', 'Failed to delete bot');
    }
  }

  async function handleLoadBot(botName: string, res: any) {
    try {
      const botData = await loadFullBotData(botName);
      sendSuccess(res, botData);
    } catch (error: any) {
      sendError(res, 'LOAD_FAILED', error.message, 404);
    }
  }

  async function handleLoadDescription(botName: string, res: any) {
    try {
      const content = await loadFile(path.join(saveDir, botName), 'description.md');
      sendSuccess(res, { content });
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load description');
    }
  }

  async function handleUpdateDescription(req: any, botName: string, res: any) {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { content } = JSON.parse(body);
        const filePath = path.join(saveDir, botName, 'description.md');
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content);
        sendSuccess(res, {});
      } catch (error) {
        sendError(res, 'UPDATE_FAILED', 'Failed to update description');
      }
    });
  }

  async function handleLoadFirstMessage(botName: string, res: any) {
    try {
      const content = await loadFile(path.join(saveDir, botName), 'first_mes.md');
      sendSuccess(res, { content });
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load first message');
    }
  }

  async function handleLoadRegex(botName: string, res: any) {
    try {
      const regexData = await loadRegexData(path.join(saveDir, botName));
      sendSuccess(res, regexData);
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load regex scripts');
    }
  }

  async function handleLoadLorebook(botName: string, res: any) {
    try {
      const lorebookData = await loadLorebookData(path.join(saveDir, botName));
      sendSuccess(res, lorebookData);
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load lorebook');
    }
  }

  async function handleLoadTrigger(botName: string, res: any) {
    try {
      const triggerData = await loadTriggerData(path.join(saveDir, botName));
      sendSuccess(res, triggerData);
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load trigger script');
    }
  }

  async function handleLoadBackground(botName: string, res: any) {
    try {
      const content = await loadFile(path.join(saveDir, botName, 'triggerscript'), 'backgroundDOM.md');
      sendSuccess(res, { content });
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load background HTML');
    }
  }

  async function handleLoadAssets(botName: string, res: any) {
    try {
      const assetsData = await loadAssetsData(path.join(saveDir, botName));
      sendSuccess(res, assetsData);
    } catch (error) {
      sendError(res, 'LOAD_FAILED', 'Failed to load assets');
    }
  }

  function sendSuccess(res: any, data: any) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data,
      timestamp: Date.now()
    }));
  }

  function sendError(res: any, code: string, message: string, statusCode = 500) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: { code, message },
      timestamp: Date.now()
    }));
  }
}

// 데이터 로드 헬퍼 함수들
async function loadFullBotData(botName: string) {
  const botPath = path.resolve('save', botName);

  if (!await fs.pathExists(botPath)) {
    throw new Error(`Bot not found: ${botName}`);
  }

  const [
    description,
    firstMessage,
    regex,
    lorebook,
    trigger,
    assets
  ] = await Promise.all([
    loadFile(botPath, 'description.md'),
    loadFile(botPath, 'first_mes.md'),
    loadRegexData(botPath),
    loadLorebookData(botPath),
    loadTriggerData(botPath),
    loadAssetsData(botPath)
  ]);

  return {
    name: botName,
    description,
    firstMessage,
    regex,
    lorebook,
    trigger,
    assets
  };
}

async function loadFile(basePath: string, fileName: string): Promise<string> {
  const filePath = path.join(basePath, fileName);
  if (!await fs.pathExists(filePath)) {
    return '';
  }
  return await fs.readFile(filePath, 'utf-8');
}

async function loadRegexData(botPath: string) {
  const scripts = JSON.parse(await loadFile(botPath, 'regex/regex.json') || '[]');

  // out 파일들 로드
  const outDir = path.join(botPath, 'regex', 'out');
  const outFiles: Record<string, string> = {};

  if (await fs.pathExists(outDir)) {
    const files = await fs.readdir(outDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        outFiles[file] = await fs.readFile(path.join(outDir, file), 'utf-8');
      }
    }
  }

  return { scripts, outFiles };
}

async function loadLorebookData(botPath: string) {
  const lorebookPath = path.join(botPath, 'lorebook/lorebook.json');
  console.log('[BotAPI] Loading lorebook from:', lorebookPath);
  
  const rawData = await loadFile(botPath, 'lorebook/lorebook.json') || '[]';
  const entries = JSON.parse(rawData);
  
  console.log('[BotAPI] Loaded', entries.length, 'lorebook entries');
  if (entries.length > 0) {
    console.log('[BotAPI] First entry:', entries[0]?.comment || entries[0]?.key);
  }

  // content 파일들 로드
  const contentDir = path.join(botPath, 'lorebook', 'content');
  const contentFiles: Record<string, string> = {};

  if (await fs.pathExists(contentDir)) {
    const files = await fs.readdir(contentDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        contentFiles[file] = await fs.readFile(path.join(contentDir, file), 'utf-8');
      }
    }
  }

  return { entries, contentFiles };
}

async function loadTriggerData(botPath: string) {
  const lua = await loadFile(path.join(botPath, 'triggerscript'), 'main.lua');
  const backgroundHTML = await loadFile(path.join(botPath, 'triggerscript'), 'backgroundDOM.md');

  return { lua, backgroundHTML };
}

async function loadAssetsData(botPath: string) {
  const assets = JSON.parse(await loadFile(botPath, 'assets/assets.json') || '[]');

  const emotionImages: [string, string][] = [];
  const additionalAssets: [string, string, string][] = [];
  const ccAssets: Array<{ type: string; uri: string; name: string; ext: string }> = [];
  let mainImage = '';

  for (const asset of assets) {
    const fileName = asset.name || '';
    const imgPath = `/save/${path.basename(botPath)}/assets/${asset.uri}`;

    if (asset.type === 'icon' && asset.name === 'main') {
      mainImage = imgPath;
    } else if (asset.type === 'emotion') {
      emotionImages.push([fileName, imgPath]);
    } else if (asset.type === 'x-risu-asset') {
      additionalAssets.push([fileName, imgPath, asset.ext || 'unknown']);
    } else {
      ccAssets.push({
        type: asset.type ?? 'asset',
        uri: imgPath,
        name: fileName,
        ext: asset.ext ?? 'unknown'
      });
    }
  }

  return {
    main: mainImage,
    emotions: emotionImages,
    additional: additionalAssets,
    ccAssets
  };
}