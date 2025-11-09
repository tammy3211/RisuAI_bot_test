// RisuAI Editor - Testing Tool for CBS, Lua Scripts, and Regex Triggers
// This provides a web-based interface to test character features before use

class RisuEditor {
    constructor() {
        this.currentTab = 'cbs';
        this.savePath = './save/';
        this.lorebookData = [];
        this.regexData = [];
        this.chatHistory = [];
        this.init();
    }

    init() {
        this.loadMDFiles();
        this.loadLorebookJSON();
        this.loadRegexJSON();
        this.setupEventListeners();
        this.loadSavedData();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Save buttons
        document.getElementById('save-cbs')?.addEventListener('click', () => this.saveCBS());
        document.getElementById('test-cbs')?.addEventListener('click', () => this.testCBS());
        
        document.getElementById('save-lua')?.addEventListener('click', () => this.saveLua());
        document.getElementById('test-lua')?.addEventListener('click', () => this.testLua());
        
        document.getElementById('save-regex')?.addEventListener('click', () => this.saveRegex());
        document.getElementById('test-regex')?.addEventListener('click', () => this.testRegex());

        // Chat test
        document.getElementById('send-message')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
        document.getElementById('export-chat')?.addEventListener('click', () => this.exportChat());
        
        // Lorebook management
        document.getElementById('reload-lorebook')?.addEventListener('click', () => this.loadLorebookJSON());
        document.getElementById('export-lorebook')?.addEventListener('click', () => this.exportLorebook());
        
        // Regex management
        document.getElementById('reload-regex')?.addEventListener('click', () => this.loadRegexJSON());
        document.getElementById('export-regex')?.addEventListener('click', () => this.exportRegexList());
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

    // CBS Functions
    async testCBS() {
        const input = document.getElementById('cbs-input').value;
        const testText = document.getElementById('cbs-test-text').value;
        const output = document.getElementById('cbs-output');
        
        try {
            // Simple CBS parser simulation
            let result = this.parseCBS(testText, input);
            output.value = result;
            this.showMessage('CBS 테스트 완료!', 'success');
        } catch (error) {
            output.value = `Error: ${error.message}`;
            this.showMessage('CBS 테스트 실패: ' + error.message, 'error');
        }
    }

    parseCBS(text, cbsScript) {
        // Basic CBS parsing - replace variables, conditionals, etc.
        let result = text;
        
        // Parse CBS commands in the script
        const cbsRegex = /\{\{([^}]+)\}\}/g;
        let match;
        
        while ((match = cbsRegex.exec(cbsScript)) !== null) {
            const command = match[1].trim();
            // Simple variable replacement for demo
            if (command.startsWith('set::')) {
                // Store variable
            } else if (command.startsWith('get::')) {
                // Get variable
            }
        }
        
        // Apply CBS to test text
        result = result.replace(cbsRegex, (match, cmd) => {
            return this.executeCBSCommand(cmd);
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

    async saveCBS() {
        const input = document.getElementById('cbs-input').value;
        try {
            await this.saveToFile('cbs_script.cbs', input);
            this.showMessage('CBS 스크립트 저장됨!', 'success');
        } catch (error) {
            this.showMessage('저장 실패: ' + error.message, 'error');
        }
    }

    // Lua Functions
    async testLua() {
        const input = document.getElementById('lua-input').value;
        const testText = document.getElementById('lua-test-text').value;
        const output = document.getElementById('lua-output');
        
        try {
            // Note: Actual Lua execution requires a Lua interpreter
            // This is a placeholder for demonstration
            output.value = `Lua 스크립트 테스트 (실행은 RisuAI에서만 가능):\n\n${input}\n\nTest Input: ${testText}`;
            this.showMessage('Lua 스크립트 표시 완료 (실행은 RisuAI에서 수행)', 'info');
        } catch (error) {
            output.value = `Error: ${error.message}`;
            this.showMessage('Lua 테스트 실패: ' + error.message, 'error');
        }
    }

    async saveLua() {
        const input = document.getElementById('lua-input').value;
        try {
            await this.saveToFile('lua_script.lua', input);
            this.showMessage('Lua 스크립트 저장됨!', 'success');
        } catch (error) {
            this.showMessage('저장 실패: ' + error.message, 'error');
        }
    }

    // Regex Functions
    async testRegex() {
        const pattern = document.getElementById('regex-pattern').value;
        const flags = document.getElementById('regex-flags').value;
        const testText = document.getElementById('regex-test-text').value;
        const replacement = document.getElementById('regex-replacement').value;
        const output = document.getElementById('regex-output');
        
        try {
            const regex = new RegExp(pattern, flags);
            const matches = testText.match(regex);
            const replaced = testText.replace(regex, replacement);
            
            output.value = `Matches:\n${matches ? matches.join('\n') : 'No matches'}\n\nReplaced Text:\n${replaced}`;
            this.showMessage('Regex 테스트 완료!', 'success');
        } catch (error) {
            output.value = `Error: ${error.message}`;
            this.showMessage('Regex 테스트 실패: ' + error.message, 'error');
        }
    }

    async saveRegex() {
        const pattern = document.getElementById('regex-pattern').value;
        const flags = document.getElementById('regex-flags').value;
        const replacement = document.getElementById('regex-replacement').value;
        const comment = document.getElementById('regex-comment').value;
        
        const regexData = {
            comment: comment,
            in: pattern,
            out: replacement,
            flags: flags,
            type: 'editinput'
        };
        
        try {
            await this.saveToFile('regex_trigger.json', JSON.stringify(regexData, null, 2));
            this.showMessage('Regex 트리거 저장됨!', 'success');
        } catch (error) {
            this.showMessage('저장 실패: ' + error.message, 'error');
        }
    }

    // MD File Viewers
    async viewLorebook() {
        await this.showMDFile('lorebook');
    }

    async viewDescription() {
        await this.showMDFile('description');
    }

    async viewFirstMessage() {
        await this.showMDFile('first_message');
    }

    async showMDFile(type) {
        const modal = document.getElementById('md-viewer-modal');
        const content = document.getElementById('md-viewer-content');
        const title = document.getElementById('md-viewer-title');
        
        let filePath, titleText;
        switch(type) {
            case 'lorebook':
                filePath = 'save/name/lorebook/lorebook.md';
                titleText = 'Lorebook';
                break;
            case 'description':
                filePath = 'save/name/desciption.md';
                titleText = 'Character Description';
                break;
            case 'first_message':
                filePath = 'save/name/first_mes.md';
                titleText = 'First Message';
                break;
        }
        
        title.textContent = titleText;
        
        try {
            const response = await fetch(filePath);
            const text = await response.text();
            
            // Convert markdown to HTML (basic conversion)
            content.innerHTML = this.markdownToHTML(text);
            modal.classList.remove('hidden');
        } catch (error) {
            content.innerHTML = `<p class="error">파일을 불러올 수 없습니다: ${error.message}</p>`;
            modal.classList.remove('hidden');
        }
    }

    markdownToHTML(markdown) {
        if (!markdown) return '<p class="help-text">내용 없음</p>';
        
        // Simple markdown conversion with better handling
        let html = markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>');
        
        return '<p>' + html + '</p>';
    }

    // File operations
    async saveToFile(filename, content) {
        // For browser environment, use localStorage
        const key = `risueditor_${filename}`;
        localStorage.setItem(key, content);
        
        // Also trigger download
        this.downloadFile(filename, content);
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadSavedData() {
        // Load from localStorage if available
        const cbsData = localStorage.getItem('risueditor_cbs_script.cbs');
        if (cbsData) {
            document.getElementById('cbs-input').value = cbsData;
        }
        
        const luaData = localStorage.getItem('risueditor_lua_script.lua');
        if (luaData) {
            document.getElementById('lua-input').value = luaData;
        }
    }

    async loadMDFiles() {
        // Auto-load MD file previews
        this.loadMDPreview('desciption.md', 'description-preview');
        this.loadMDPreview('first_mes.md', 'first-message-preview');
    }

    async loadMDPreview(filename, elementId) {
        try {
            const response = await fetch(`save/name/${filename}`);
            const text = await response.text();
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = text.substring(0, 200) + '...';
            }
        } catch (error) {
            console.log(`Could not load ${filename}`);
        }
    }

    // Lorebook JSON loading and processing
    async loadLorebookJSON() {
        try {
            const response = await fetch('save/name/lorebook/lorebook.json');
            this.lorebookData = await response.json();
            
            console.log('Loaded lorebook entries:', this.lorebookData.length);
            
            // Load MD content for each entry
            for (let entry of this.lorebookData) {
                const match = entry.content?.match(/\{(.+)\}/);
                if (match) {
                    const mdFile = match[1];
                    try {
                        const mdResponse = await fetch(`save/name/lorebook/${mdFile}.md`);
                        const mdContent = await mdResponse.text();
                        entry.mdContent = mdContent;
                        entry.mdFile = mdFile;
                        console.log(`Loaded ${mdFile}.md: ${mdContent.substring(0, 50)}...`);
                    } catch (error) {
                        console.error(`Could not load ${mdFile}.md:`, error);
                        entry.mdContent = '';
                    }
                } else {
                    console.warn('No placeholder found in content:', entry.content);
                }
            }
            
            this.renderLorebookList();
            this.showMessage('로어북 데이터 로드 완료!', 'success');
        } catch (error) {
            console.error('Error loading lorebook:', error);
            this.showMessage('로어북 로드 실패: ' + error.message, 'error');
        }
    }

    renderLorebookList() {
        const container = document.getElementById('lorebook-list');
        if (!container) {
            console.error('Lorebook list container not found!');
            return;
        }
        
        container.innerHTML = '';
        
        console.log('Rendering lorebook entries:', this.lorebookData.length);
        
        this.lorebookData.forEach((entry, index) => {
            console.log(`Entry ${index}:`, entry.key, 'mdContent length:', entry.mdContent?.length || 0);
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'lorebook-entry';
            
            const preview = entry.mdContent ? entry.mdContent.substring(0, 150) : '내용 없음';
            
            // selective가 true면 key, secondkey 둘 다 표시, false면 key만 표시
            let searchKeyDisplay = '';
            if (entry.selective) {
                searchKeyDisplay = `
                    <div><strong>검색어 (Key):</strong> ${entry.key}</div>
                    <div><strong>검색어2 (Second Key):</strong> ${entry.secondkey || '없음'}</div>
                `;
            } else {
                searchKeyDisplay = `
                    <div><strong>검색어 (Key):</strong> ${entry.key}</div>
                `;
            }
            
            entryDiv.innerHTML = `
                <div class="lorebook-header">
                    <h4>${entry.comment || entry.key}</h4>
                    <span class="badge ${entry.alwaysActive ? 'badge-active' : 'badge-selective'}">
                        ${entry.alwaysActive ? '항상 활성' : '선택적 활성'}
                    </span>
                </div>
                <div class="lorebook-details">
                    ${searchKeyDisplay}
                    <div><strong>우선순위:</strong> ${entry.insertorder}</div>
                    <div><strong>Selective 모드:</strong> ${entry.selective ? '예 (Second Key 사용)' : '아니오 (Key 사용)'}</div>
                    <div><strong>MD 파일:</strong> ${entry.mdFile || '없음'}</div>
                </div>
                <div class="lorebook-content">
                    <div class="label">내용 미리보기:</div>
                    <div class="content-preview">${preview}${entry.mdContent ? '...' : ''}</div>
                </div>
                <div class="toolbar">
                    <button class="btn-small" onclick="risuEditor.viewLorebookEntry(${index})">전체 보기</button>
                    <button class="btn-small btn-secondary" onclick="risuEditor.editLorebookEntry(${index})">MD 편집</button>
                </div>
            `;
            container.appendChild(entryDiv);
        });
        
        console.log('Lorebook list rendered successfully');
    }

    // Regex JSON loading and processing
    async loadRegexJSON() {
        try {
            const response = await fetch('save/name/regex/regex.json');
            this.regexData = await response.json();
            
            // Load MD content for each entry (out field contains {filename})
            for (let entry of this.regexData) {
                const match = entry.out?.match(/\{(.+)\}/);
                if (match) {
                    const mdFile = match[1];
                    try {
                        const mdResponse = await fetch(`save/name/regex/${mdFile}.md`);
                        const mdContent = await mdResponse.text();
                        entry.mdContent = mdContent;
                        entry.mdFile = mdFile;
                    } catch (error) {
                        console.log(`Could not load ${mdFile}.md`);
                        entry.mdContent = '';
                    }
                }
            }
            
            this.renderRegexList();
            this.showMessage('Regex 데이터 로드 완료!', 'success');
        } catch (error) {
            console.error('Error loading regex:', error);
            this.showMessage('Regex 로드 실패: ' + error.message, 'error');
        }
    }
    
    sanitizeFilename(comment) {
        // Convert Korean/special characters to safe filenames
        const map = {
            '이모티콘을 텍스트로 변환': 'emoticon_to_text',
            '행동 묘사 강조': 'action_emphasis',
            '특정 단어 필터링': 'profanity_filter',
            '시간 표현 정규화': 'time_normalization',
            '사용자 입력 자동 수정 - 이중 띄어쓰기': 'double_space_fix'
        };
        return map[comment] || comment.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    renderRegexList() {
        const container = document.getElementById('regex-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.regexData.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'regex-entry';
            entryDiv.innerHTML = `
                <div class="regex-header">
                    <h4>${entry.comment || 'Regex ' + (index + 1)}</h4>
                    <span class="badge badge-type">${entry.type}</span>
                </div>
                <div class="regex-details">
                    <div><strong>패턴 (in):</strong> <code>${entry.in}</code></div>
                    <div><strong>교체 (out):</strong> <code>${entry.out}</code></div>
                    ${entry.mdFile ? `<div><strong>실제 교체 내용:</strong> <code>${entry.mdContent || ''}</code></div>` : ''}
                    ${entry.mdFile ? `<div class="help-text">MD 파일: ${entry.mdFile}.md</div>` : ''}
                </div>
                <div class="toolbar">
                    <button class="btn-small" onclick="risuEditor.testRegexEntry(${index})">테스트</button>
                    ${entry.mdFile ? `<button class="btn-small btn-secondary" onclick="risuEditor.editRegexMD(${index})">MD 편집</button>` : ''}
                </div>
            `;
            container.appendChild(entryDiv);
        });
    }

    viewLorebookEntry(index) {
        const entry = this.lorebookData[index];
        const modal = document.getElementById('md-viewer-modal');
        const content = document.getElementById('md-viewer-content');
        const title = document.getElementById('md-viewer-title');
        
        // selective에 따라 사용되는 검색어 결정
        const activeSearchKey = entry.selective ? entry.secondkey : entry.key;
        
        title.textContent = `Lorebook: ${entry.comment || entry.key}`;
        content.innerHTML = `
            <div class="lorebook-detail-view">
                <div class="detail-section">
                    <h3>메타데이터</h3>
                    <table class="detail-table">
                        <tr><td>키 (Key)</td><td>${entry.key}</td></tr>
                        <tr><td>검색어2 (Second Key)</td><td>${entry.secondkey || '없음'}</td></tr>
                        <tr><td><strong>활성 검색어</strong></td><td><strong>${activeSearchKey}</strong></td></tr>
                        <tr><td>우선순위</td><td>${entry.insertorder}</td></tr>
                        <tr><td>항상 활성화</td><td>${entry.alwaysActive ? '예' : '아니오'}</td></tr>
                        <tr><td>Selective 모드</td><td>${entry.selective ? '예 (Second Key 사용)' : '아니오 (Key 사용)'}</td></tr>
                        <tr><td>정규식 사용</td><td>${entry.useRegex ? '예' : '아니오'}</td></tr>
                    </table>
                </div>
                <div class="detail-section">
                    <h3>내용 (${entry.mdFile}.md)</h3>
                    <div class="md-content">${this.markdownToHTML(entry.mdContent || '')}</div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    editLorebookEntry(index) {
        const entry = this.lorebookData[index];
        this.showMessage(`VSCode에서 save/name/lorebook/${entry.mdFile}.md 파일을 편집하세요`, 'info');
    }

    viewRegexDoc(index) {
        const entry = this.regexData[index];
        const modal = document.getElementById('md-viewer-modal');
        const content = document.getElementById('md-viewer-content');
        const title = document.getElementById('md-viewer-title');
        
        title.textContent = `Regex: ${entry.comment}`;
        content.innerHTML = `
            <div class="regex-detail-view">
                <div class="detail-section">
                    <h3>Regex 설정</h3>
                    <table class="detail-table">
                        <tr><td>설명</td><td>${entry.comment}</td></tr>
                        <tr><td>패턴</td><td><code>${entry.in}</code></td></tr>
                        <tr><td>교체</td><td><code>${entry.out}</code></td></tr>
                        <tr><td>타입</td><td>${entry.type}</td></tr>
                    </table>
                </div>
                <div class="detail-section">
                    <h3>문서 (${entry.mdFile}.md)</h3>
                    <div class="md-content">${this.markdownToHTML(entry.mdContent || '')}</div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    testRegexEntry(index) {
        const entry = this.regexData[index];
        
        // Switch to regex tab and populate fields
        this.switchTab('regex');
        
        document.getElementById('regex-pattern').value = entry.in;
        document.getElementById('regex-replacement').value = entry.out;
        document.getElementById('regex-comment').value = entry.comment;
        
        this.showMessage(`Regex "${entry.comment}" 로드됨. 테스트 텍스트를 입력하고 테스트하세요.`, 'info');
    }

    async exportLorebook() {
        // Merge JSON metadata with MD content
        const exportData = this.lorebookData.map(entry => ({
            ...entry,
            content: entry.mdContent || entry.content,
            mdFile: undefined,
            mdContent: undefined
        }));
        
        this.downloadFile('lorebook_export.json', JSON.stringify(exportData, null, 2));
        this.showMessage('로어북 내보내기 완료!', 'success');
    }

    async exportRegexList() {
        // Merge JSON metadata with MD content
        const exportData = this.regexData.map(entry => ({
            comment: entry.comment,
            in: entry.in,
            out: entry.mdContent || entry.out,  // Use actual MD content
            type: entry.type,
            ableFlag: entry.ableFlag || []
        }));
        
        this.downloadFile('regex_export.json', JSON.stringify(exportData, null, 2));
        this.showMessage('Regex 목록 내보내기 완료! (MD 내용이 out 필드에 병합됨)', 'success');
    }

    // Chat Test Functions
    sendMessage() {
        const role = document.getElementById('chat-role').value;
        const content = document.getElementById('chat-input').value.trim();
        
        if (!content) {
            this.showMessage('메시지를 입력하세요!', 'error');
            return;
        }
        
        const applyRegex = document.getElementById('apply-regex').checked;
        const applyCBS = document.getElementById('apply-cbs').checked;
        const showLorebook = document.getElementById('show-lorebook').checked;
        
        // Process message
        let processedContent = content;
        
        // Apply regex transformations
        if (applyRegex && this.regexData.length > 0) {
            processedContent = this.applyRegexToText(processedContent);
        }
        
        // Apply CBS processing
        if (applyCBS) {
            processedContent = this.parseCBS(processedContent, '');
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
        
        this.showMessage('메시지가 추가되었습니다!', 'success');
    }
    
    applyRegexToText(text) {
        let result = text;
        
        this.regexData.forEach(entry => {
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
        
        const activatedEntries = [];
        
        this.lorebookData.forEach(entry => {
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
            this.showMessage('대화 내역이 초기화되었습니다.', 'info');
        }
    }
    
    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            messages: this.chatHistory
        };
        
        this.downloadFile('chat_export.json', JSON.stringify(chatData, null, 2));
        this.showMessage('채팅 내역 내보내기 완료!', 'success');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.risuEditor = new RisuEditor();
    
    // Close modal handler
    document.getElementById('close-modal')?.addEventListener('click', () => {
        document.getElementById('md-viewer-modal').classList.add('hidden');
    });
});
