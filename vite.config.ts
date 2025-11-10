import { defineConfig } from "vite";
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from "path";
import { mockGlobalApiPlugin } from './vite-plugin-mock-globalapi';
import { watchBotsPlugin } from './vite-plugin-watch-bots';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    mockGlobalApiPlugin(), // MUST be first to intercept imports
    wasm(),
    topLevelAwait(),
    svelte(),
    watchBotsPlugin() // Watch save folder for changes
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
    }
  }
});
