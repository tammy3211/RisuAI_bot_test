// Lorebook loader utilities
// Loads bot list and lorebook data independently

import { loadNestedMarkdownFiles } from '../../ts/botLoader.svelte';

export interface LorebookEntry {
  key: string;
  secondkey: string;
  insertorder: number;
  comment: string;
  content: string;
  mode: 'multiple' | 'constant' | 'normal' | 'child' | 'folder';
  alwaysActive: boolean;
  selective: boolean;
  extentions?: {
    risu_case_sensitive: boolean;
  };
  activationPercent?: number;
  useRegex?: boolean;
  bookVersion?: number;
  id?: string;
  folder?: string;
  mdContent?: string;
  mdFile?: string;
}

export interface BotData {
  name: string;
  description: string;
  lorebooks: LorebookEntry[];
}

// Load all available bots from save directory
export async function loadAvailableBots(): Promise<string[]> {
  try {
    const modules = import.meta.glob('/save/*/description.md', { eager: false, query: '?raw', import: 'default' });
    const botNames: string[] = [];
    
    for (const path in modules) {
      const match = path.match(/\/save\/([^/]+)\/description\.md/);
      if (match && match[1] !== 'test') {
        botNames.push(match[1]);
      }
    }
    
    return botNames.sort();
  } catch (error) {
    console.error('Failed to load bot list:', error);
    return [];
  }
}

// Load lorebook for a specific bot
export async function loadBotLorebook(botName: string): Promise<LorebookEntry[]> {
  try {
    const lorebookPath = `/save/${botName}/lorebook/lorebook.json`;
    const response = await fetch(lorebookPath + '?t=' + Date.now());
    
    if (!response.ok) {
      console.warn(`No lorebook found for bot: ${botName}`);
      return [];
    }
    
    const lorebooks: LorebookEntry[] = await response.json();
    
    // Build a map of all MD files in content/ directory
    const contentFiles = await loadNestedMarkdownFiles(botName, 'content');
    
    // Load MD content for each lorebook entry
    for (const entry of lorebooks) {
      const match = entry.content?.match(/^\{(.+?)\}$/);
      if (match) {
        const mdFileName = match[1];
        
        // Find matching MD file in content map
        if (contentFiles.has(mdFileName)) {
          entry.mdContent = contentFiles.get(mdFileName);
          entry.mdFile = mdFileName;
        } else {
          console.warn(`MD file not found in content/: ${mdFileName}`);
          entry.mdContent = '';
          entry.mdFile = mdFileName;
        }
      }
    }
    
    return lorebooks;
  } catch (error) {
    console.error(`Failed to load lorebook for ${botName}:`, error);
    return [];
  }
}

// Load bot description
export async function loadBotDescription(botName: string): Promise<string> {
  try {
    const descPath = `/save/${botName}/description.md`;
    const response = await fetch(descPath + '?t=' + Date.now());
    
    if (!response.ok) {
      return '';
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Failed to load description for ${botName}:`, error);
    return '';
  }
}
