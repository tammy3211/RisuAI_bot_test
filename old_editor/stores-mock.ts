// Mock for stores.svelte
// Provides mock Svelte stores for standalone testing

import { writable } from './svelte-store-mock';

// Mock all stores from stores.svelte
export const selectedCharID = writable(0);
export const MobileGUI = writable(false);
export const botMakerMode = writable(false);
export const loadedStore = writable(false);
export const DBState = writable(null);
export const LoadingStatusState = writable('');
export const CurrentTriggerIdStore = writable(null);
export const HideIconStore = writable(new Set());
export const moduleBackgroundEmbedding = writable('');
export const ReloadGUIPointer = writable(0);

// Add any other stores that might be needed
export const CharEmotion = writable({});
export const SideBarStore = writable('');
export const BottomBarStore = writable('');

// Export default object for compatibility
export default {
    selectedCharID,
    MobileGUI,
    botMakerMode,
    loadedStore,
    DBState,
    LoadingStatusState,
    CurrentTriggerIdStore,
    HideIconStore,
    moduleBackgroundEmbedding,
    ReloadGUIPointer,
    CharEmotion,
    SideBarStore,
    BottomBarStore
};
