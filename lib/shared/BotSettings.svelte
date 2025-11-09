<script lang="ts">
  import { editorState, saveEditorState } from './editorState.svelte';
  import BotSourceSelector from './BotSourceSelector.svelte';
  
  interface Props {
    onLoadBot?: () => void;
  }
  
  let { onLoadBot }: Props = $props();
  
  function addCustomVar() {
    const key = prompt('변수 이름:');
    if (key && !editorState.customVars[key]) {
      editorState.addCustomVar(key, '');
    }
  }
  
  function removeCustomVar(key: string) {
    editorState.removeCustomVar(key);
  }
  
  // 입력 변경 시 저장
  function handleInput() {
    console.log('[BotSettings] handleInput called');
    console.trace('[BotSettings] handleInput stack trace');
    saveEditorState();
  }
  
  // customVars 값 변경 시 저장
  function handleCustomVarChange(key: string, value: string) {
    editorState.customVars[key] = value;
    saveEditorState();
  }
</script>

<div class="settings-panel">
  <!-- 봇 정보 소스 - 맨 위로 이동 -->
  <BotSourceSelector onLoadBot={onLoadBot} />

  <div class="section">
    <div class="section-title">🤖 봇 정보</div>
    <div class="input-group">
      <label for="bot-name" class="label">봇 이름:</label>
      <input 
        id="bot-name" 
        type="text" 
        bind:value={editorState.botName} 
        oninput={handleInput} 
        class="text-input" 
        placeholder="TestBot"
        disabled={editorState.botSource === 'saved'}
      />
    </div>
    
    <div class="input-group">
      <label for="bot-desc" class="label">설명 (Description):</label>
      <textarea 
        id="bot-desc" 
        bind:value={editorState.botDescription} 
        oninput={handleInput} 
        class="small-textarea" 
        placeholder="봇 설명..."
        disabled={editorState.botSource === 'saved'}
      ></textarea>
    </div>
    {#if editorState.botSource === 'saved'}
      <p class="help-text">ℹ️ 저장된 봇을 선택한 경우 봇 정보는 수정할 수 없습니다.</p>
    {/if}
  </div>

  <div class="section">
    <div class="section-title">👤 사용자 정보</div>
    <div class="input-group">
      <label for="user-name" class="label">이름:</label>
      <input id="user-name" type="text" bind:value={editorState.userName} oninput={handleInput} class="text-input" placeholder="User" />
    </div>
    
    <div class="input-group">
      <label for="user-persona" class="label">페르소나 (User Description):</label>
      <textarea id="user-persona" bind:value={editorState.userPersona} oninput={handleInput} class="small-textarea" placeholder="사용자의 성격, 특징, 배경..."></textarea>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      🔧 일반 변수
      <button class="btn-small" onclick={addCustomVar}>+ 추가</button>
    </div>
    <div class="vars-list">
      {#each Object.entries(editorState.customVars) as [key]}
        <div class="var-item">
          <div class="var-key">{key}</div>
          <input 
            type="text" 
            value={editorState.customVars[key]}
            oninput={(e) => handleCustomVarChange(key, (e.target as HTMLInputElement).value)}
            class="var-input" 
            placeholder="값 입력..."
          />
          <button class="btn-remove" onclick={() => removeCustomVar(key)}>×</button>
        </div>
      {/each}
      {#if Object.keys(editorState.customVars).length === 0}
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
    box-sizing: border-box;
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

  .text-input:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .small-textarea {
    width: 100%;
    box-sizing: border-box;
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

  .small-textarea:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
    opacity: 0.6;
  }  .small-textarea:focus {
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
    padding: 10px;
    padding-bottom: 0;
  }
</style>
