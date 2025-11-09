// Regex Module
// Manages regex triggers with JSON + MD file structure

class RegexModule {
    constructor(tester) {
        this.tester = tester;
        this.regexData = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('reload-regex')?.addEventListener('click', () => this.loadData());
        document.getElementById('export-regex')?.addEventListener('click', () => this.exportData());
        document.getElementById('test-regex')?.addEventListener('click', () => this.testRegex());
    }

    async loadData() {
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
            
            this.renderList();
            this.tester.showMessage('Regex 데이터 로드 완료!', 'success');
        } catch (error) {
            console.error('Error loading regex:', error);
            this.tester.showMessage('Regex 로드 실패: ' + error.message, 'error');
        }
    }

    renderList() {
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
                    <button class="btn-small" onclick="risuTester.regexModule.testEntry(${index})">테스트</button>
                    ${entry.mdFile ? `<button class="btn-small btn-secondary" onclick="risuTester.regexModule.editEntry(${index})">MD 편집</button>` : ''}
                </div>
            `;
            container.appendChild(entryDiv);
        });
    }

    testRegex() {
        const pattern = document.getElementById('regex-pattern').value;
        const testText = document.getElementById('regex-test-text').value;
        const replacement = document.getElementById('regex-replacement').value;
        const output = document.getElementById('regex-output');
        
        try {
            const regex = new RegExp(pattern, 'g');
            const matches = testText.match(regex);
            const replaced = testText.replace(regex, replacement);
            
            output.value = `Matches:\n${matches ? matches.join('\n') : 'No matches'}\n\nReplaced Text:\n${replaced}`;
            this.tester.showMessage('Regex 테스트 완료!', 'success');
        } catch (error) {
            output.value = `Error: ${error.message}`;
            this.tester.showMessage('Regex 테스트 실패: ' + error.message, 'error');
        }
    }

    testEntry(index) {
        const entry = this.regexData[index];
        
        // Switch to regex tab and populate fields
        this.tester.switchTab('regex');
        
        document.getElementById('regex-pattern').value = entry.in;
        document.getElementById('regex-replacement').value = entry.mdContent || entry.out;
        
        this.tester.showMessage(`Regex "${entry.comment}" 로드됨. 테스트 텍스트를 입력하고 테스트하세요.`, 'info');
    }

    editEntry(index) {
        const entry = this.regexData[index];
        this.tester.showMessage(`VSCode에서 save/name/regex/${entry.mdFile}.md 파일을 편집하세요`, 'info');
    }

    exportData() {
        // Merge JSON metadata with MD content
        const exportData = this.regexData.map(entry => ({
            comment: entry.comment,
            in: entry.in,
            out: entry.mdContent || entry.out,
            type: entry.type,
            ableFlag: entry.ableFlag || []
        }));
        
        downloadFile('regex_export.json', JSON.stringify(exportData, null, 2));
        this.tester.showMessage('Regex 목록 내보내기 완료! (MD 내용이 out 필드에 병합됨)', 'success');
    }
}
