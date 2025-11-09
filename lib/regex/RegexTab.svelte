<script lang="ts">
  import { onMount } from 'svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import { editorState, saveEditorState } from '../shared/editorState.svelte';
  
  onMount(async () => {
    await loadSavedBots();
  });
  
  async function loadSavedBots() {
    try {
      const savePath = './save';
      const response = await fetch(savePath);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));
      
      const folders = links
        .map(link => link.getAttribute('href'))
        .filter(href => href && href.endsWith('/') && href !== '../')
        .map(href => href!.replace('/', ''));
      
      if (folders.length > 0) {
        editorState.savedBots = folders;
      } else {
        editorState.savedBots = ['name'];
      }
    } catch (err) {
      console.error('Failed to load saved bots:', err);
      editorState.savedBots = ['name'];
    }
  }
  
  async function loadBotData() {
    console.log('[RegexTab] loadBotData called - using shared botLoader');
    // botLoader.svelte.ts에서 이미 처리했으므로 여기서는 추가 작업 불필요
  }
</script>

<div class="regex-tab">
  <div class="info-panel">
    <h4>🔧 Regex Trigger 관리</h4>
    <ul>
      <li>정규표현식을 사용하여 텍스트를 자동으로 변환합니다</li>
      <li>입력 전처리(editinput) 또는 출력 후처리(editoutput)에 사용됩니다</li>
      <li>MD 파일에 실제 교체 내용을 저장합니다</li>
    </ul>
  </div>

  <div class="regex-container">
    <!-- Left Panel: Regex Test -->
    <div class="regex-left">
      <div class="section">
        <div class="section-title">Regex 테스트</div>
        <p class="loading-text">Regex 기능 준비 중...</p>
      </div>
    </div>

    <!-- Right Panel: Settings -->
    <div class="regex-right">
      <BotSettings onLoadBot={loadBotData} />
    </div>
  </div>
</div>

<style>
  .regex-tab {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .info-panel {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 30px;
    border-left: 5px solid #667eea;
  }

  .info-panel h4 {
    font-size: 1.3em;
    color: #667eea;
    margin-bottom: 15px;
  }

  .info-panel ul {
    list-style: none;
    padding-left: 0;
  }

  .info-panel li {
    padding: 8px 0;
    padding-left: 25px;
    position: relative;
    line-height: 1.6;
  }

  .info-panel li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
  }

  .regex-container {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 30px;
  }

  .section {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 1.2em;
    font-weight: 600;
    color: #495057;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #dee2e6;
  }

  .loading-text {
    color: #6c757d;
    font-style: italic;
    padding: 20px;
    text-align: center;
  }

  @media (max-width: 1024px) {
    .regex-container {
      grid-template-columns: 1fr;
    }
  }
</style>
