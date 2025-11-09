import type { Plugin } from 'vite';
import path from 'path';

export function mockGlobalApiPlugin(): Plugin {
  const mockPath = path.resolve(__dirname, './ts/platform-shim.ts').replace(/\\/g, '/');
  
  return {
    name: 'mock-globalapi',
    enforce: 'pre',
    
    resolveId(source, importer) {
      // Intercept any import of globalApi.svelte
      if (source.includes('globalApi.svelte')) {
        console.log(`🔄 Redirecting ${source} → platform-shim.ts`);
        return mockPath;
      }
      
      // Handle relative imports from util.ts
      if (importer && source === './globalApi.svelte') {
        console.log(`🔄 Redirecting relative import from ${importer} → platform-shim.ts`);
        return mockPath;
      }
      
      return null;
    },
    
    load(id) {
      // If somehow the original globalApi is loaded, replace it
      if (id.includes('globalApi.svelte.ts') && !id.includes('platform-shim')) {
        console.log(`⚠️ Intercepted direct load of globalApi.svelte.ts`);
        return null; // Let Vite handle it normally, but the resolveId should have caught it
      }
      return null;
    }
  };
}
