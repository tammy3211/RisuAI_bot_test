// Chat Test Module (TypeScript)
// Handles chat message testing with lorebook, regex, and CBS integration

import type { ChatMessage, RisuTester, LorebookEntry } from './types';
import { downloadFile } from './utils';

export class ChatModule {
    private tester: RisuTester;
    private chatHistory: ChatMessage[] = [];

    constructor(tester: RisuTester) {
        this.tester = tester;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.getElementById('send-message')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
        document.getElementById('export-chat')?.addEventListener('click', () => this.exportChat());
    }

    private sendMessage(): void {
        const roleSelect = document.getElementById('chat-role') as HTMLSelectElement;
        const contentInput = document.getElementById('chat-input') as HTMLTextAreaElement;
        
        if (!roleSelect || !contentInput) return;
        
        const role = roleSelect.value as 'user' | 'assistant' | 'system';
        const content = contentInput.value.trim();
        
        if (!content) {
            this.tester.showMessage('메시지를 입력하세요!', 'error');
            return;
        }
        
        const applyRegex = (document.getElementById('apply-regex') as HTMLInputElement)?.checked ?? false;
        const applyCBS = (document.getElementById('apply-cbs') as HTMLInputElement)?.checked ?? false;
        const showLorebook = (document.getElementById('show-lorebook') as HTMLInputElement)?.checked ?? false;
        
        // Process message
        let processedContent = content;
        
        // Apply regex transformations
        if (applyRegex) {
            processedContent = this.applyRegex(processedContent);
        }
        
        // Apply CBS processing
        if (applyCBS) {
            // CBS module will be available on window.risuTester
            const cbsModule = (window as any).risuTester?.cbsModule;
            if (cbsModule) {
                processedContent = cbsModule.parseCBS(processedContent);
            }
        }
        
        // Add to chat history
        const message: ChatMessage = {
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
        contentInput.value = '';
        
        this.tester.showMessage('메시지가 추가되었습니다!', 'success');
    }

    private applyRegex(text: string): string {
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

    private checkActiveLorebook(text: string): void {
        const container = document.getElementById('active-lorebook');
        if (!container) return;
        
        container.innerHTML = '';
        
        const lorebookData = this.tester.getLorebookData();
        const activatedEntries: LorebookEntry[] = [];
        
        lorebookData.forEach(entry => {
            if (entry.alwaysActive) {
                activatedEntries.push(entry);
                return;
            }
            
            // Check if keywords match
            const searchKey = entry.selective ? entry.secondkey : entry.key;
            if (!searchKey) return;
            
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

    private renderChat(): void {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.chatHistory.forEach((msg) => {
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

    private clearChat(): void {
        if (confirm('모든 대화 내역을 삭제하시겠습니까?')) {
            this.chatHistory = [];
            this.renderChat();
            
            const container = document.getElementById('active-lorebook');
            if (container) {
                container.innerHTML = '<p class="help-text">메시지를 추가하면 활성화된 로어북 항목이 여기 표시됩니다.</p>';
            }
            
            this.tester.showMessage('대화 내역이 삭제되었습니다', 'info');
        }
    }

    private exportChat(): void {
        const exportData = {
            messages: this.chatHistory,
            exportDate: new Date().toISOString()
        };
        
        downloadFile('chat_export.json', JSON.stringify(exportData, null, 2));
        this.tester.showMessage('대화 내역 내보내기 완료!', 'success');
    }
}
