// RisuAI Character Tester - Main Controller
// Manages tabs and coordinates between different modules

class RisuTester {
    constructor() {
        this.currentTab = 'chat';
        this.chatModule = null;
        this.lorebookModule = null;
        this.regexModule = null;
        this.cbsModule = null;
        this.init();
    }

    async init() {
        // Initialize modules
        this.chatModule = new ChatModule(this);
        this.lorebookModule = new LorebookModule(this);
        this.regexModule = new RegexModule(this);
        this.cbsModule = new CBSModule(this);
        
        // Load data
        await this.lorebookModule.loadData();
        await this.regexModule.loadData();
        
        // Setup UI
        this.setupEventListeners();
        this.switchTab('chat');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Close modal
        document.getElementById('close-modal')?.addEventListener('click', () => {
            document.getElementById('md-viewer-modal').classList.add('hidden');
        });
    }

    switchTab(tabName) {
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

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('message-display');
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
    window.risuTester = new RisuTester();
});
