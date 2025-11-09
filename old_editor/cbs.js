// CBS Module
// ChatBot Script parser and tester

class CBSModule {
    constructor(tester) {
        this.tester = tester;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('test-cbs')?.addEventListener('click', () => this.testCBS());
    }

    testCBS() {
        const testText = document.getElementById('cbs-test-text').value;
        const output = document.getElementById('cbs-output');
        
        try {
            let result = this.parseCBS(testText);
            output.value = result;
            this.tester.showMessage('CBS 테스트 완료!', 'success');
        } catch (error) {
            output.value = `Error: ${error.message}`;
            this.tester.showMessage('CBS 테스트 실패: ' + error.message, 'error');
        }
    }

    parseCBS(text) {
        let result = text;
        
        // Parse CBS variables
        const cbsRegex = /\{\{([^}]+)\}\}/g;
        
        result = result.replace(cbsRegex, (match, cmd) => {
            return this.executeCBSCommand(cmd.trim());
        });
        
        return result;
    }

    executeCBSCommand(command) {
        // Simplified CBS command execution
        const parts = command.split('::');
        const cmd = parts[0].toLowerCase();
        
        switch(cmd) {
            case 'user':
                return 'TestUser';
            case 'char':
            case 'bot':
                return 'TestBot';
            case 'time':
                return new Date().toLocaleTimeString();
            case 'date':
                return new Date().toLocaleDateString();
            default:
                return `{{${command}}}`;
        }
    }
}
