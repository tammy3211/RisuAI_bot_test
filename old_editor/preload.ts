// Preload necessary polyfills and global functions before loading main app
console.log('🔧 Loading polyfills...');

// Import the polyfill which sets up globalThis.safeStructuredClone
import 'src/ts/polyfill';

console.log('✅ Polyfills loaded');
console.log('🔧 safeStructuredClone available:', typeof (globalThis as any).safeStructuredClone);

// Now load the main application
console.log('📜 Loading main application...');
import('./main');
