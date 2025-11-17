/**
 * Shared localStorage helpers to keep read/write logic in one place.
 * Handles SSR guards, JSON parsing, and consistent logging.
 */

const DEFAULT_PREFIX = '[localStorage]';

const isBrowser = typeof window !== 'undefined';

export function loadJSON<T>(key: string, fallback: T, prefix = DEFAULT_PREFIX): T {
  if (!isBrowser) return fallback;

  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch (error) {
    console.warn(`${prefix} Failed to load "${key}":`, error);
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T, prefix = DEFAULT_PREFIX) {
  if (!isBrowser) return;

  try {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
  } catch (error) {
    console.warn(`${prefix} Failed to save "${key}":`, error);
  }
}

export function removeKey(key: string, prefix = DEFAULT_PREFIX) {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`${prefix} Failed to remove "${key}":`, error);
  }
}
