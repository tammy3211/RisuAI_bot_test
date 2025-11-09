// Lorebook Module
// Manages lorebook entries with JSON + MD file structure

class LorebookModule {
    constructor(tester) {
        this.tester = tester;
        this.lorebookData = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('reload-lorebook')?.addEventListener('click', () => this.loadData());
        document.getElementById('export-lorebook')?.addEventListener('click', () => this.exportData());
    }

    async loadData() {
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
            
            this.renderList();
            this.tester.showMessage('로어북 데이터 로드 완료!', 'success');
        } catch (error) {
            console.error('Error loading lorebook:', error);
            this.tester.showMessage('로어북 로드 실패: ' + error.message, 'error');
        }
    }

    renderList() {
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
                    <button class="btn-small" onclick="risuTester.lorebookModule.viewEntry(${index})">전체 보기</button>
                    <button class="btn-small btn-secondary" onclick="risuTester.lorebookModule.editEntry(${index})">MD 편집</button>
                </div>
            `;
            container.appendChild(entryDiv);
        });
        
        console.log('Lorebook list rendered successfully');
    }

    viewEntry(index) {
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
                    <div class="md-content">${markdownToHTML(entry.mdContent || '')}</div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    editEntry(index) {
        const entry = this.lorebookData[index];
        this.tester.showMessage(`VSCode에서 save/name/lorebook/${entry.mdFile}.md 파일을 편집하세요`, 'info');
    }

    exportData() {
        // Merge JSON metadata with MD content
        const exportData = this.lorebookData.map(entry => ({
            ...entry,
            content: entry.mdContent || entry.content,
            mdFile: undefined,
            mdContent: undefined
        }));
        
        downloadFile('lorebook_export.json', JSON.stringify(exportData, null, 2));
        this.tester.showMessage('로어북 내보내기 완료!', 'success');
    }
}
