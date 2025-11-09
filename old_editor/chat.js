// Chat Test Module
// Handles chat message testing with lorebook, regex, and CBS integration

class ChatModule {
    constructor(tester) {
        this.tester = tester;
        this.chatHistory = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('send-message')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
        document.getElementById('export-chat')?.addEventListener('click', () => this.exportChat());
    }

    sendMessage() {
        const role = document.getElementById('chat-role').value;
        const content = document.getElementById('chat-input').value.trim();
        
        if (!content) {
            this.tester.showMessage('메시지를 입력하세요!', 'error');
            return;
        }
        
        const applyRegex = document.getElementById('apply-regex').checked;
        const applyCBS = document.getElementById('apply-cbs').checked;
        const showLorebook = document.getElementById('show-lorebook').checked;
        
        // Process message
        let processedContent = content;
        
        // Apply regex transformations
        if (applyRegex) {
            processedContent = this.applyRegex(processedContent);
        }
        
        // Apply CBS processing
        if (applyCBS) {
            processedContent = this.tester.cbsModule.parseCBS(processedContent);
        }
        
        // Add to chat history
        const message = {
            role: role,
            content: processedContent,
            originalContent: content,
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.push(message);
        
        // Render chat
        this.renderChat();
        
        // Check and display active lorebook entries
        if (showLorebook) {
            this.checkActiveLorebook(content);
        }
        
        // Clear input
        document.getElementById('chat-input').value = '';
        
        this.tester.showMessage('메시지가 추가되었습니다!', 'success');
    }

    applyRegex(text) {
        let result = text;
        const regexData = this.tester.getRegexData();
        
        regexData.forEach(entry => {
            try {
                const regex = new RegExp(entry.in, 'g');
                const replacement = entry.mdContent || entry.out;
                result = result.replace(regex, replacement);
            } catch (error) {
                console.error('Regex application error:', error);
            }
        });
        
        return result;
    }

    checkActiveLorebook(text) {
        const container = document.getElementById('active-lorebook');
        container.innerHTML = '';
        
        const lorebookData = this.tester.getLorebookData();
        const activatedEntries = [];
        
        lorebookData.forEach(entry => {
            if (entry.alwaysActive) {
                activatedEntries.push(entry);
                return;
            }
            
            // Check if keywords match
            const searchKey = entry.selective ? entry.secondkey : entry.key;
            const keywords = searchKey.split(',').map(k => k.trim().toLowerCase());
            const textLower = text.toLowerCase();
            
            const matched = keywords.some(keyword => textLower.includes(keyword));
            
            if (matched) {
                activatedEntries.push(entry);
            }
        });
        
        if (activatedEntries.length === 0) {
            container.innerHTML = '<p class="help-text">활성화된 로어북 항목이 없습니다.</p>';
            return;
        }
        
        // Sort by priority
        activatedEntries.sort((a, b) => b.insertorder - a.insertorder);
        
        activatedEntries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'lorebook-active-item';
            entryDiv.innerHTML = `
                <div><strong>${entry.comment || entry.key}</strong> (우선순위: ${entry.insertorder})</div>
                <div style="font-size: 0.9em; color: #6c757d; margin-top: 5px;">
                    ${entry.mdContent ? entry.mdContent.substring(0, 100) + '...' : '내용 없음'}
                </div>
            `;
            container.appendChild(entryDiv);
        });
    }

    renderChat() {
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        
        this.chatHistory.forEach((msg, index) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.role}`;
            msgDiv.innerHTML = `
                <div class="message-role">${msg.role}</div>
                <div class="message-content">${msg.content}</div>
                ${msg.content !== msg.originalContent ? `<div class="help-text" style="margin-top: 5px;">원본: ${msg.originalContent}</div>` : ''}
            `;
            container.appendChild(msgDiv);
        });
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    clearChat() {
        if (confirm('모든 대화 내역을 삭제하시겠습니까?')) {
            this.chatHistory = [];
            const container = document.getElementById('chat-messages');
            container.innerHTML = `
                <div class="chat-message system">
                    <div class="message-role">System</div>
                    <div class="message-content">채팅 테스트를 시작합니다. 메시지를 추가해보세요!</div>
                </div>
            `;
            document.getElementById('active-lorebook').innerHTML = '<p class="help-text">메시지를 추가하면 활성화된 로어북 항목이 여기 표시됩니다.</p>';
            this.tester.showMessage('대화 내역이 초기화되었습니다.', 'info');
        }
    }

    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            messages: this.chatHistory
        };
        
        downloadFile('chat_export.json', JSON.stringify(chatData, null, 2));
        this.tester.showMessage('채팅 내역 내보내기 완료!', 'success');
    }
}
