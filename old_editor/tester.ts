// RisuAI Character Tester - Main Controller (TypeScript)
// Manages tabs and coordinates between different modules

import { CBSModule } from './js/cbs';

class RisuTester {
    private currentTab: string = 'chat';
    private chatModule: any = null;
    private lorebookModule: any = null;
    private regexModule: any = null;
    private cbsModule: CBSModule | null = null;

    constructor() {
        this.init();
    }

    async init() {
        // Initialize CBS module with TypeScript
        this.cbsModule = new CBSModule(this);
        
        // Initialize other modules (still using JS for now)
        // @ts-ignore - These are loaded from separate JS files
        if (typeof ChatModule !== 'undefined') {
            // @ts-ignore
            this.chatModule = new ChatModule(this);
        }
        // @ts-ignore
        if (typeof LorebookModule !== 'undefined') {
            // @ts-ignore
            this.lorebookModule = new LorebookModule(this);
            await this.lorebookModule.loadData();
        }
        // @ts-ignore
        if (typeof RegexModule !== 'undefined') {
            // @ts-ignore
            this.regexModule = new RegexModule(this);
            await this.regexModule.loadData();
        }
        
        // Setup UI
        this.setupEventListeners();
        this.switchTab('chat');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tab = target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Close modal
        document.getElementById('close-modal')?.addEventListener('click', () => {
            document.getElementById('md-viewer-modal')?.classList.add('hidden');
        });
    }

    switchTab(tabName: string) {
        this.currentTab = tabName;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`)?.classList.remove('hidden');
        
        // Update button states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }

    showMessage(message: string, type: 'info' | 'success' | 'error' = 'info') {
        const messageDiv = document.getElementById('message-display');
        if (!messageDiv) return;
        
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }

    getLorebookData() {
        return this.lorebookModule?.lorebookData || [];
    }

    getRegexData() {
        return this.regexModule?.regexData || [];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    (window as any).risuTester = new RisuTester();
});
