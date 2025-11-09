// Mock implementations for RisuAI dependencies
// This file provides all the dependencies needed by src/ts/cbs.ts

import type { Database, character, loreBook } from '../../src/ts/storage/database.svelte';
import type { CbsConditions } from '../../src/ts/parser.svelte';
import type { RisuModule } from '../../src/ts/process/modules';
import type { LLMModel } from '../../src/ts/model/modellist';

// Mock Svelte stores
export const mockStore = {
    subscribe: (callback: any) => {
        callback(null);
        return () => {};
    }
};

export const CurrentTriggerIdStore = mockStore;

// Mock svelte/store
export const get = (_store: any) => null;

// Export all mocks
export const mocks = {
    'svelte/store': { get },
    '../../src/ts/stores.svelte': { CurrentTriggerIdStore },
    './stores.svelte': { CurrentTriggerIdStore }
};

// Type exports for convenience
export type {
    Database,
    character,
    loreBook,
    CbsConditions,
    RisuModule,
    LLMModel
};
