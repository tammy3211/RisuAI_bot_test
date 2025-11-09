<script lang="ts">
  interface Props {
    userName: string;
    botName: string;
    botDescription: string;
    userPersona: string;
    customVars: {[key: string]: string};
  }
  
  let { userName = $bindable('User'), botName = $bindable('TestBot'), botDescription = $bindable(''), userPersona = $bindable(''), customVars = $bindable({}) }: Props = $props();
  
  function addCustomVar() {
    const key = prompt('변수 이름:');
    if (key && !customVars[key]) {
      customVars[key] = '';
      customVars = customVars;
    }
  }
  
  function removeCustomVar(key: string) {
    delete customVars[key];
    customVars = customVars;
  }
</script>

<div class="settings-panel">
  <div class="section">
    <div class="section-title">👤 사용자 정보</div>
    <div class="input-group">
      <label for="user-name" class="label">이름:</label>
      <input id="user-name" type="text" bind:value={userName} class="text-input" placeholder="User" />
    </div>
    
    <div class="input-group">
      <label for="user-persona" class="label">페르소나 (User Description):</label>
      <textarea id="user-persona" bind:value={userPersona} class="small-textarea" placeholder="사용자의 성격, 특징, 배경..."></textarea>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🤖 봇 정보</div>
    <div class="input-group">
      <label for="bot-name" class="label">봇 이름:</label>
      <input id="bot-name" type="text" bind:value={botName} class="text-input" placeholder="TestBot" />
    </div>
    
    <div class="input-group">
      <label for="bot-desc" class="label">설명 (Description):</label>
      <textarea id="bot-desc" bind:value={botDescription} class="small-textarea" placeholder="봇 설명..."></textarea>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      🔧 일반 변수
      <button class="btn-small" onclick={addCustomVar}>+ 추가</button>
    </div>
    <div class="vars-list">
      {#each Object.entries(customVars) as [key]}
        <div class="var-item">
          <div class="var-key">{key}</div>
          <input 
            type="text" 
            bind:value={customVars[key]} 
            class="var-input" 
            placeholder="값 입력..."
          />
          <button class="btn-remove" onclick={() => removeCustomVar(key)}>×</button>
        </div>
      {/each}
      {#if Object.keys(customVars).length === 0}
        <p class="help-text">변수가 없습니다. + 버튼을 눌러 추가하세요.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 0;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .input-group {
    margin-bottom: 15px;
  }

  .label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #495057;
    margin-bottom: 6px;
  }

  .text-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .text-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .small-textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.3s ease;
  }

  .small-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .btn-small {
    padding: 4px 10px;
    border: none;
    background: #667eea;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .btn-small:hover {
    background: #5568d3;
  }

  .vars-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .var-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #dee2e6;
  }

  .var-key {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    font-weight: 600;
    color: #667eea;
    min-width: 100px;
  }

  .var-input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 13px;
  }

  .var-input:focus {
    outline: none;
    border-color: #667eea;
  }

  .btn-remove {
    width: 24px;
    height: 24px;
    border: none;
    background: #dc3545;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-remove:hover {
    background: #c82333;
  }

  .help-text {
    color: #6c757d;
    font-size: 13px;
    font-style: italic;
    text-align: center;
    padding: 20px;
  }
</style>
