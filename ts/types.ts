// Type definitions for RisuAI Editor

export interface LorebookEntry {
    key: string;
    secondkey?: string;
    comment?: string;
    content?: string;
    order: number;
    insertorder: number;
    alwaysActive: boolean;
    selective: boolean;
    useRegex?: boolean;
    mdContent?: string;
    mdFile?: string;
}

export interface RegexEntry {
    comment?: string;
    in: string;
    out: string;
    type: string;
    ableFlag?: string[];
    mdContent?: string;
    mdFile?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    originalContent: string;
    timestamp: string;
}

export type MessageType = 'info' | 'success' | 'error';

export interface RisuTester {
    showMessage(message: string, type?: MessageType): void;
    getLorebookData(): LorebookEntry[];
    getRegexData(): RegexEntry[];
    switchTab(tabName: string): void;
}
