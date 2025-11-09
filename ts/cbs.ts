// CBS Module - Direct integration with original RisuAI CBS
// This module automatically imports all dependencies from the original project

// Import directly from the original CBS module - all dependencies are auto-imported!
import { 
    registerCBS, 
    defaultCBSRegisterArg, 
    type CBSRegisterArg 
} from '../../src/ts/cbs';

// Import the real CBS parser
import { risuChatParser } from '../../src/ts/parser.svelte';

import type { RisuTester } from './types';

export class CBSModule {
    private tester: RisuTester;
    private testVariables: Map<string, string> = new Map();

    constructor(tester: RisuTester) {
        this.tester = tester;
        this.initializeCBS();
        this.setupEventListeners();
    }

    private initializeCBS() {
        // Create custom CBS register arguments for testing
        const testRegisterArg: CBSRegisterArg = {
            ...defaultCBSRegisterArg,
            
            // Override functions for testing environment
            getUserName: () => {
                return (document.getElementById('test-username') as HTMLInputElement)?.value || 'TestUser';
            },
            
            getDatabase: () => {
                // Return mock database for testing
                return {
                    characters: [{
                        name: (document.getElementById('test-charname') as HTMLInputElement)?.value || 'TestBot',
                        desc: 'Test character description',
                    }],
                    username: (document.getElementById('test-username') as HTMLInputElement)?.value || 'TestUser'
                } as any;
            },
            
            getPersonaPrompt: () => {
                return (document.getElementById('test-persona') as HTMLTextAreaElement)?.value || 'I am a test persona';
            },
            
            risuChatParser: (text: string) => {
                // Use the real parser when called
                return risuChatParser(text, {
                    chatID: 0,
                    db: this.getMockDatabase(),
                    chara: this.getMockCharacter(),
                    rmVar: false,
                    var: Object.fromEntries(this.testVariables),
                    cbsConditions: {
                        triggerId: null,
                        conditions: []
                    },
                    recursiveCount: 0
                } as any);
            },
            
            getChatVar: (key: string) => {
                return this.testVariables.get(key) || '';
            },
            
            setChatVar: (key: string, value: string) => {
                this.testVariables.set(key, value);
            },
            
            getGlobalChatVar: (key: string) => {
                return this.testVariables.get('global_' + key) || '';
            },
            
            calcString: (expression: string) => {
                try {
                    // Safe evaluation for testing
                    return Function('"use strict"; return (' + expression + ')')();
                } catch {
                    return 0;
                }
            },
            
            dateTimeFormat: (_format: string, timestamp?: number) => {
                const date = timestamp ? new Date(timestamp * 1000) : new Date();
                return date.toLocaleString();
            },
            
            getModules: () => [],
            getModuleLorebooks: () => [],
            pickHashRand: () => Math.random(),
            getSelectedCharID: () => 0,
            callInternalFunction: () => '',
            isTauri: false,
            isNodeServer: false,
            isMobile: false,
            appVer: '1.0.0-tester',
            getModelInfo: () => ({
                id: 'test-model',
                name: 'Test Model',
                shortName: 'Test',
                internalID: 'test',
                format: 0,
                provider: 0,
                tokenizer: 0
            } as any)
        };

        // Register CBS with custom functions
        registerCBS(testRegisterArg);
        console.log('✅ CBS initialized with original module (auto-imported all dependencies)');
    }

    private setupEventListeners() {
        document.getElementById('test-cbs')?.addEventListener('click', () => this.testCBS());
        document.getElementById('clear-cbs')?.addEventListener('click', () => this.clearCBS());
    }

    private testCBS() {
        console.log('🧪 Testing CBS...');
        const testText = (document.getElementById('cbs-test-text') as HTMLTextAreaElement)?.value || '';
        const output = document.getElementById('cbs-output') as HTMLTextAreaElement;
        
        if (!output) {
            console.error('❌ Output element not found');
            return;
        }

        console.log('📝 Input text:', testText);

        try {
            // Use the real CBS parser
            const result = risuChatParser(testText, {
                chatID: 0,
                db: this.getMockDatabase(),
                chara: this.getMockCharacter(),
                rmVar: false,
                var: Object.fromEntries(this.testVariables),
                cbsConditions: {
                    triggerId: null,
                    conditions: []
                },
                recursiveCount: 0
            } as any);
            
            console.log('✅ CBS result:', result);
            output.value = result;
            this.tester.showMessage('CBS 테스트 완료!', 'success');
        } catch (error: any) {
            console.error('❌ CBS test error:', error);
            output.value = `Error: ${error.message}\n\nStack: ${error.stack}`;
            this.tester.showMessage('CBS 테스트 실패: ' + error.message, 'error');
        }
    }

    private getMockDatabase(): any {
        return {
            characters: [this.getMockCharacter()],
            username: (document.getElementById('test-username') as HTMLInputElement)?.value || 'TestUser',
            personaPrompt: (document.getElementById('test-persona') as HTMLTextAreaElement)?.value || 'I am a test persona'
        };
    }

    private getMockCharacter(): any {
        return {
            name: (document.getElementById('test-charname') as HTMLInputElement)?.value || 'TestBot',
            desc: 'Test character description',
            firstMessage: 'Hello!',
            alternateGreetings: [],
            personality: 'Friendly',
            scenario: 'Testing',
            exampleMessage: '',
            creatorNotes: ''
        };
    }

    private clearCBS() {
        const testInput = document.getElementById('cbs-test-text') as HTMLTextAreaElement;
        const output = document.getElementById('cbs-output') as HTMLTextAreaElement;
        
        if (testInput) testInput.value = '';
        if (output) output.value = '';
        
        this.testVariables.clear();
        this.tester.showMessage('CBS 입력/출력이 초기화되었습니다', 'success');
    }

    // Public method to test CBS parsing
    public testParse(text: string): string {
        try {
            return risuChatParser(text, {
                chatID: 0,
                db: this.getMockDatabase(),
                chara: this.getMockCharacter(),
                rmVar: false,
                var: Object.fromEntries(this.testVariables),
                cbsConditions: {
                    triggerId: null,
                    conditions: []
                },
                recursiveCount: 0
            } as any);
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }

    // Public method to get/set variables for testing
    public getVar(key: string): string {
        return this.testVariables.get(key) || '';
    }

    public setVar(key: string, value: string): void {
        this.testVariables.set(key, value);
    }

    public getAllVars(): Map<string, string> {
        return new Map(this.testVariables);
    }
}

// Re-export for convenience
export { registerCBS, defaultCBSRegisterArg, type CBSRegisterArg };
