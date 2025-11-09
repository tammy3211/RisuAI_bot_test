<script lang="ts">
  import { onMount } from 'svelte';
  import { editorState, saveEditorState } from './editorState.svelte';
  import { loadAllBots, loadSelectedBotData } from '../../ts/botLoader.svelte';
  
  interface Props {
    onLoadBot?: () => void;
  }
  
  let { onLoadBot }: Props = $props();
  
  // 초기 로드 (한 번만 실행)
  onMount(async () => {
    console.log('[BotSourceSelector] onMount called');
    await loadAllBots();
    
    // localStorage에서 로드된 상태가 'saved' 모드이고 selectedBot이 있으면 자동 로드
    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      console.log('[BotSourceSelector] Auto-loading saved bot:', editorState.selectedBot);
      await loadSelectedBotData();
    }
  });
  
  // botSource 변경 시 저장
  function handleBotSourceChange() {
    console.log('[BotSourceSelector] botSource changed to:', editorState.botSource);
    saveEditorState();
  }
  
  // selectedBot 변경 시 자동으로 봇 데이터 로드
  async function handleSelectedBotChange() {
    console.log('[BotSourceSelector] selectedBot changed to:', editorState.selectedBot);
    await loadSelectedBotData();
    // 추가 콜백이 있으면 실행
    if (onLoadBot) {
      onLoadBot();
    }
  }
</script>

<div class="section">
  <div class="section-title">🤖 봇 정보 소스</div>
  <div class="bot-source-select">
    <label class="radio-label">
      <input type="radio" bind:group={editorState.botSource} value="saved" onchange={handleBotSourceChange} />
      <span>저장된 봇 선택</span>
    </label>
    <label class="radio-label">
      <input type="radio" bind:group={editorState.botSource} value="custom" onchange={handleBotSourceChange} />
      <span>사용자 설정 (Database)</span>
    </label>
  </div>

  {#if editorState.botSource === 'saved'}
    <div class="input-group">
      <label for="bot-select" class="label">저장된 봇:</label>
      <select id="bot-select" bind:value={editorState.selectedBot} onchange={handleSelectedBotChange} class="select-input">
        <option value="">선택하세요...</option>
        {#each editorState.savedBots as bot}
          <option value={bot}>{bot}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style>
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

  .bot-source-select {
    display: flex;
    gap: 20px;
    margin-top: 10px;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  .radio-label input[type="radio"] {
    cursor: pointer;
  }

  .input-group {
    margin-top: 15px;
  }

  .label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #495057;
    margin-bottom: 6px;
  }

  .select-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .select-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
</style>
