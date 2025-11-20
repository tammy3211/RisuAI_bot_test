import { defineConfig } from "vite";
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from "path";
import fs from "fs-extra";
import { mockGlobalApiPlugin } from './vite-plugin-mock-globalapi';
import { watchBotsPlugin } from './vite-plugin-watch-bots';
import { patchScriptsPlugin } from './vite-plugin-patch-scripts';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    patchScriptsPlugin(), // Patch scripts.ts to fix processScriptCache issue
    mockGlobalApiPlugin(), // MUST be first to intercept imports
    wasm(),
    topLevelAwait(),
    svelte({
      compilerOptions: {
        runes: true
      },
      // Exclude lucide-svelte from runes mode
      onwarn: (warning, handler) => {
        if (warning.filename?.includes('lucide-svelte')) {
          return;
        }
        handler(warning);
      }
    }),
    watchBotsPlugin(), // Watch save folder for changes
    {
      name: 'bot-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // GET /api/bots - List all bots
          if (req.url === '/api/bots' && req.method === 'GET') {
            try {
              const savePath = path.resolve(__dirname, 'save');
              
              if (!await fs.pathExists(savePath)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ bots: [] }));
                return;
              }

              const entries = await fs.readdir(savePath, { withFileTypes: true });
              const bots = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name)
                .sort();

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ bots }));
            } catch (error) {
              console.error('Error listing bots:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          } else if (req.url === '/api/bot/create' && req.method === 'POST') {
            try {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                const { botName } = JSON.parse(body);
                
                if (!botName || typeof botName !== 'string') {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid bot name' }));
                  return;
                }

                // Sanitize bot name
                const safeBotName = botName.trim().replace(/[<>:"/\\|?*]/g, '_');
                if (!safeBotName) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid bot name' }));
                  return;
                }

                const savePath = path.resolve(__dirname, 'save', safeBotName);
                const templatePath = path.resolve(__dirname, 'template', 'default');

                // Check if bot already exists
                if (await fs.pathExists(savePath)) {
                  res.statusCode = 409;
                  res.end(JSON.stringify({ error: 'Bot already exists' }));
                  return;
                }

                // Copy template to save folder
                await fs.copy(templatePath, savePath);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, botName: safeBotName }));
              });
            } catch (error) {
              console.error('Error creating bot:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  root: '.',
  base: './',
  resolve: {
    alias: {
      // Replace globalApi.svelte with our mock to break circular dependency
      // This MUST come before @src alias
      [path.resolve(__dirname, '../src/ts/globalApi.svelte.ts')]: path.resolve(__dirname, './ts/platform-shim.ts'),
      [path.resolve(__dirname, '../src/ts/globalApi.svelte')]: path.resolve(__dirname, './ts/platform-shim.ts'),
      
      // Direct access to src
      '@src': path.resolve(__dirname, '../src'),
      'src': path.resolve(__dirname, '../src')
    }
  },
  server: {
    host: '127.0.0.1',  // IPv4 localhost만 사용
    port: 3000,
    open: '/index.html',
    fs: {
      allow: ['..']
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    },
    exclude: ['lucide-svelte']
  }
});
