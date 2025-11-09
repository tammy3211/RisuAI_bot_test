// Mock for globalApi.svelte.ts
// Provides standalone implementations without circular dependencies

// Basic platform detection
export const isTauri = false;
export const isNodeServer = false;
export const isMobile = false;
export const googleBuild = false;

// Mock storage
export class AutoStorage {
    private storage = new Map<string, any>();

    async getItem(key: string): Promise<any> {
        const val = this.storage.get(key);
        return val !== undefined ? val : null;
    }

    async setItem(key: string, value: any): Promise<void> {
        this.storage.set(key, value);
    }

    async removeItem(key: string): Promise<void> {
        this.storage.delete(key);
    }

    async clear(): Promise<void> {
        this.storage.clear();
    }
}

export const forageStorage = new AutoStorage();

// Mock functions that might be needed
export const globalFetch = fetch;

export const textifyReadableStream = async (stream: ReadableStream): Promise<string> => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
    }
    
    return result;
};

export const fetchNative = fetch;

export const addFetchLog = () => {};

export const downloadFile = async () => {};

export const saveAsset = async () => {};

export const loadAsset = async () => null;

export const readImage = async () => null;

export const openURL = async () => {};

export const checkCharOrder = () => {};

export const requiresFullEncoderReload = () => {};

export class AppendableBuffer {
    private buffers: Uint8Array[] = [];
    
    append(data: Uint8Array) {
        this.buffers.push(data);
    }
    
    toBuffer(): Uint8Array {
        const totalLength = this.buffers.reduce((sum, buf) => sum + buf.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of this.buffers) {
            result.set(buf, offset);
            offset += buf.length;
        }
        return result;
    }
}

export class VirtualWriter {
    write(_data: Uint8Array) {}
    close() {}
}

export class LocalWriter {
    write(_data: Uint8Array) {}
    close() {}
}

export class BlankWriter {
    write(_data: Uint8Array) {}
    close() {}
}

export const getFileSrc = (path: string) => path;

export const getUnpargeables = () => [];

// Export all for compatibility
export default {
    isTauri,
    isNodeServer,
    isMobile,
    googleBuild,
    forageStorage,
    AutoStorage,
    globalFetch,
    textifyReadableStream,
    fetchNative,
    addFetchLog,
    downloadFile,
    saveAsset,
    loadAsset,
    readImage,
    openURL,
    checkCharOrder,
    requiresFullEncoderReload,
    AppendableBuffer,
    VirtualWriter,
    LocalWriter,
    BlankWriter,
    getFileSrc,
    getUnpargeables
};
