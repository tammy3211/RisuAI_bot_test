// RisuAI Character Tester - Svelte Entry Point
// Setup global variables to prevent circular dependency issues

console.log('🔧 Setting up environment...');

// CRITICAL: Monkey-patch to break circular dependency
// globalApi.svelte.ts imports util.ts, which imports globalApi.svelte.ts
// We define isTauri in the module cache before either file loads

const moduleCache: any = {};
moduleCache['./globalApi.svelte'] = {
  isTauri: false,
  isNodeServer: false,
  isMobile: false,
  googleBuild: false
};

// Make these available globally as well
Object.assign(window, moduleCache['./globalApi.svelte']);

console.log('🔧 Pre-initialized:', moduleCache['./globalApi.svelte']);

// Import polyfill to setup safeStructuredClone
import '../src/ts/polyfill';

console.log('✅ Polyfill loaded, safeStructuredClone:', typeof (globalThis as any).safeStructuredClone);

// Now safe to import App
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;

