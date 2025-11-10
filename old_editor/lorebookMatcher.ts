import type { LorebookEntry } from './lorebookLoader.svelte';

export interface LorebookMatchResult {
  activated: Array<{
    entry: LorebookEntry;
    matchedKeys: string[];
  }>;
  matchLog: Array<{
    key: string;
    entry: string;
  }>;
}

/**
 * Simple lorebook matcher: checks if provided text contains lorebook keys.
 * Falls back to substring matching when regex flag is not enabled.
 */
export function matchLorebooks(
  lorebooks: LorebookEntry[],
  text: string
): LorebookMatchResult {
  const normalized = text.toLowerCase();
  const activated: LorebookMatchResult['activated'] = [];
  const matchLog: LorebookMatchResult['matchLog'] = [];

  for (const entry of lorebooks) {
    if (!entry || entry.mode === 'folder') {
      continue;
    }

    const matchedKeys: string[] = [];

    // Always active entries activate regardless of search keys.
    if (entry.alwaysActive) {
      activated.push({ entry, matchedKeys });
      continue;
    }

    const keys = splitKeys(entry.key);
    const secondaryKeys = entry.selective ? splitKeys(entry.secondkey ?? '') : [];

    const allKeys = [...keys, ...secondaryKeys];

    for (const key of allKeys) {
      if (!key) continue;

      if (entry.useRegex && key.startsWith('/')) {
        const { pattern, flags } = extractRegex(key);
        if (!pattern) continue;

        try {
          const regex = new RegExp(pattern, flags);
          if (regex.test(text)) {
            matchedKeys.push(key);
            matchLog.push({ key, entry: entry.comment || entry.key });
          }
        } catch (error) {
          console.warn('[LorebookTester] Invalid regex:', key, error);
        }
      } else {
        if (normalized.includes(key.toLowerCase())) {
          matchedKeys.push(key);
          matchLog.push({ key, entry: entry.comment || entry.key });
        }
      }
    }

    if (matchedKeys.length > 0) {
      activated.push({ entry, matchedKeys });
    }
  }

  return { activated, matchLog };
}

function splitKeys(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function extractRegex(raw: string): { pattern: string | null; flags: string } {
  const lastSlash = raw.lastIndexOf('/');
  if (raw[0] !== '/' || lastSlash <= 0) {
    return { pattern: null, flags: '' };
  }

  const pattern = raw.slice(1, lastSlash);
  const flags = raw.slice(lastSlash + 1);
  return { pattern, flags };
}
