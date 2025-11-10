// RisuAI processScript wrapper with mock dependencies
import { setupDatabaseMocks, prepareMockCharacter } from './mockDatabase';

let mockSetupPromise: Promise<void> | null = null;

async function setupMockEnvironment() {
  if (!mockSetupPromise) {
    mockSetupPromise = (async () => {
      await setupDatabaseMocks();
      try {
        // Try to ensure pluginV2 is properly initialized
        const { pluginV2 } = await import('../../src/ts/plugins/plugins');
        if (!pluginV2.editinput) pluginV2.editinput = new Set();
        if (!pluginV2.editoutput) pluginV2.editoutput = new Set();
        if (!pluginV2.editprocess) pluginV2.editprocess = new Set();
        if (!pluginV2.editdisplay) pluginV2.editdisplay = new Set();
      } catch (e) {
        console.warn('Could not setup pluginV2 mock environment:', e);
      }
    })();
  }
  await mockSetupPromise;
}

export async function processRegexScripts(
  scripts: Array<{ comment: string; in: string; out: string; type: string; flag?: string; ableFlag?: boolean }>,
  text: string,
  mode: 'editinput' | 'editoutput' | 'editprocess' | 'editdisplay'
): Promise<string> {
  // Setup mock environment
  await setupMockEnvironment();
  
  try {
    // Dynamic import to avoid initialization issues
    const { processScript } = await import('../../src/ts/process/scripts');
    const mockChar = await prepareMockCharacter(scripts);
    return await processScript(mockChar, text, mode, {});
  } catch (error) {
    console.error('Failed to load RisuAI processScript, using fallback:', error);
    
    // Fallback: 직접 구현
    let result = text;
    const activeRegexes = scripts.filter(r => r.type === mode);
    
    for (const regex of activeRegexes) {
      if (!regex.in) continue;
      
      try {
        let flag = 'g';
        if (regex.ableFlag && regex.flag) {
          flag = regex.flag;
        }
        
        // unsupported flags 제거
        flag = flag.trim().replace(/[^dgimsuvy]/g, '');
        // 중복 제거
        flag = flag.split('').filter((v, i, a) => a.indexOf(v) === i).join('');
        if (flag.length === 0) {
          flag = 'u';
        }
        
        const re = new RegExp(regex.in, flag);
        let outScript = regex.out.replace(/\$n/g, "\n");
        result = result.replace(re, outScript);
      } catch (err) {
        console.error(`Regex error in "${regex.comment}":`, err);
      }
    }
    
    return result;
  }
}
