// CBS Module - TypeScript version with real CBS integration
import { registerCBS, defaultCBSRegisterArg, type CBSRegisterArg } from '../../src/ts/cbs';

export class CBSModule {
    private tester: any;
    private cbsRegistered: boolean = false;
    private testVariables: Map<string, string> = new Map();

    constructor(tester: any) {
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
                return (document.getElementById('test-persona') as HTMLInputElement)?.value || 'I am a test persona';
            },
            
            risuChatParser: (text: string) => {
                // Simple parser for testing
                return this.parseCBS(text);
            },
            
            getChatVar: (key: string) => {
                return this.testVariables.get(key) || '';
            },
            
            setChatVar: (key: string, value: string) => {
                this.testVariables.set(key, value);
            },
            
            getGlobalChatVar: (key: string) => {
                return localStorage.getItem(`cbs_var_${key}`) || '';
            },
            
            calcString: (str: string) => {
                try {
                    return eval(str);
                } catch {
                    return 0;
                }
            },
            
            dateTimeFormat: (format: string, timestamp?: number) => {
                const date = timestamp ? new Date(timestamp * 1000) : new Date();
                return date.toLocaleString();
            },
            
            getModules: () => [],
            getModuleLorebooks: () => [],
            pickHashRand: (seed: number, hash: string) => Math.random(),
            getSelectedCharID: () => 0,
            callInternalFunction: (args: string[]) => '',
            
            isTauri: false,
            isNodeServer: false,
            isMobile: false,
            appVer: '1.0.0-test',
            
            getModelInfo: (model: string) => ({
                id: 'test',
                name: 'Test Model',
                shortName: 'Test',
                internalID: 'test',
                format: 0,
                provider: 0,
                tokenizer: 0
            } as any)
        };

        // Register CBS with test arguments
        registerCBS(testRegisterArg);
        this.cbsRegistered = true;
    }

    private setupEventListeners() {
        document.getElementById('test-cbs')?.addEventListener('click', () => this.testCBS());
        document.getElementById('clear-cbs')?.addEventListener('click', () => this.clearCBS());
    }

    private testCBS() {
        const testText = (document.getElementById('cbs-test-text') as HTMLTextAreaElement)?.value || '';
        const output = document.getElementById('cbs-output') as HTMLTextAreaElement;
        
        if (!output) return;

        try {
            const result = this.parseCBS(testText);
            output.value = result;
            this.tester.showMessage('CBS 테스트 완료!', 'success');
        } catch (error: any) {
            output.value = `Error: ${error.message}`;
            this.tester.showMessage('CBS 테스트 실패: ' + error.message, 'error');
        }
    }

    private clearCBS() {
        const testInput = document.getElementById('cbs-test-text') as HTMLTextAreaElement;
        const output = document.getElementById('cbs-output') as HTMLTextAreaElement;
        
        if (testInput) testInput.value = '';
        if (output) output.value = '';
        
        this.testVariables.clear();
        this.tester.showMessage('CBS 초기화됨', 'info');
    }

    public parseCBS(text: string): string {
        // Use the real CBS parser through risuChatParser
        // The registerCBS should have set up all the parsing functions
        let result = text;
        
        // This is a simplified version - the real parsing happens through registerCBS
        // For full functionality, we need to call the actual parser registered by registerCBS
        const cbsRegex = /\{\{([^}]+)\}\}/g;
        
        result = result.replace(cbsRegex, (match, cmd) => {
            try {
                return this.executeCBSCommand(cmd.trim());
            } catch (e) {
                return match; // Return original if parsing fails
            }
        });
        
        return result;
    }

    private executeCBSCommand(command: string): string {
        // This will be handled by the registered CBS functions
        // For now, return a placeholder
        const parts = command.split('::');
        const cmd = parts[0].toLowerCase();
        
        switch(cmd) {
            case 'user':
                return (document.getElementById('test-username') as HTMLInputElement)?.value || 'TestUser';
            case 'char':
            case 'bot':
                return (document.getElementById('test-charname') as HTMLInputElement)?.value || 'TestBot';
            case 'time':
                return new Date().toLocaleTimeString();
            case 'date':
                return new Date().toLocaleDateString();
            case 'random':
                return Math.random().toString();
            default:
                return `{{${command}}}`;
        }
    }
}
