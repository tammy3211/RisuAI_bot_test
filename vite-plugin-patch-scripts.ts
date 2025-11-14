import type { Plugin } from 'vite';

/**
 * Vite plugin to patch scripts.ts resetScriptCache function
 * to handle undefined processScriptCache
 */
export function patchScriptsPlugin(): Plugin {
  return {
    name: 'patch-scripts',
    enforce: 'pre',
    transform(code, id) {
      // Only patch scripts.ts
      if (id.includes('src/ts/process/scripts.ts') || id.includes('src\\ts\\process\\scripts.ts')) {
        console.log('🔧 [patch-scripts] Patching scripts.ts for safe resetScriptCache');
        console.log('🔧 [patch-scripts] File:', id);
        
        // Find and replace the exact resetScriptCache function
        const originalPattern = 'export function resetScriptCache(){\n    processScriptCache = new Map()\n}';
        const replacement = `export function resetScriptCache(){
    try {
        processScriptCache = new Map()
    } catch (e) {
        // processScriptCache not yet initialized, skip
    }
}`;
        
        if (code.includes(originalPattern)) {
          console.log('✅ [patch-scripts] Found exact match, patching...');
          const patched = code.replace(originalPattern, replacement);
          return {
            code: patched,
            map: null
          };
        }
        
        // Try with different whitespace
        const lines = code.split('\n');
        const resetCacheIndex = lines.findIndex(line => line.includes('export function resetScriptCache()'));
        
        if (resetCacheIndex !== -1) {
          console.log('✅ [patch-scripts] Found resetScriptCache at line', resetCacheIndex);
          // Replace the next line that contains processScriptCache = new Map()
          for (let i = resetCacheIndex; i < Math.min(resetCacheIndex + 5, lines.length); i++) {
            if (lines[i].includes('processScriptCache = new Map()')) {
              // Wrap it in try-catch
              const indent = lines[i].match(/^\s*/)?.[0] || '    ';
              lines[i] = `${indent}try {
${lines[i]}
${indent}} catch (e) {
${indent}    // processScriptCache not yet initialized
${indent}}`;
              const patched = lines.join('\n');
              console.log('✅ [patch-scripts] Successfully patched resetScriptCache');
              return {
                code: patched,
                map: null
              };
            }
          }
        }
        
        console.warn('⚠️ [patch-scripts] Could not find resetScriptCache to patch');
      }
      return null;
    }
  };
}
