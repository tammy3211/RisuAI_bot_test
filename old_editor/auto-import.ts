// Auto-import wrapper for RisuAI modules
// This provides a Node.js-like experience for importing dependencies

// Re-export everything from the original CBS module
export { 
    registerCBS, 
    defaultCBSRegisterArg,
    type CBSRegisterArg 
} from '../../src/ts/cbs';

// Import all dependencies that cbs.ts needs
import type { Database, character, loreBook } from '../../src/ts/storage/database.svelte';
import type { CbsConditions } from '../../src/ts/parser.svelte';
import type { RisuModule } from '../../src/ts/process/modules';
import type { LLMModel } from '../../src/ts/model/modellist';

// Create a dependency injection container
export class DependencyContainer {
    private static instance: DependencyContainer;
    private mocks: Map<string, any> = new Map();

    private constructor() {
        this.setupDefaultMocks();
    }

    static getInstance(): DependencyContainer {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }

    private setupDefaultMocks() {
        // Mock svelte/store
        this.mocks.set('svelte/store', {
            get: (_store: any) => null,
            writable: (value: any) => ({
                subscribe: (callback: any) => {
                    callback(value);
                    return () => {};
                },
                set: () => {},
                update: () => {}
            })
        });

        // Mock CurrentTriggerIdStore
        this.mocks.set('CurrentTriggerIdStore', {
            subscribe: (callback: any) => {
                callback(null);
                return () => {};
            }
        });
    }

    getMock(name: string): any {
        return this.mocks.get(name);
    }

    setMock(name: string, value: any): void {
        this.mocks.set(name, value);
    }
}

// Initialize dependency container
export const deps = DependencyContainer.getInstance();

// Export types for convenience
export type {
    Database,
    character,
    loreBook,
    CbsConditions,
    RisuModule,
    LLMModel
};
