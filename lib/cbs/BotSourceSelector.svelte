<script lang="ts">
  interface Props {
    botSource: string;
    savedBots: string[];
    selectedBot: string;
    onLoadBot: () => void;
  }
  
  let { botSource = $bindable('custom'), savedBots = $bindable([]), selectedBot = $bindable(''), onLoadBot }: Props = $props();
</script>

<div class="section">
  <div class="section-title">🤖 봇 정보 소스</div>
  <div class="bot-source-select">
    <label class="radio-label">
      <input type="radio" bind:group={botSource} value="custom" />
      <span>사용자 설정 (Database)</span>
    </label>
    <label class="radio-label">
      <input type="radio" bind:group={botSource} value="saved" />
      <span>저장된 봇 선택</span>
    </label>
  </div>

  {#if botSource === 'saved'}
    <div class="input-group">
      <label for="bot-select" class="label">저장된 봇:</label>
      <select id="bot-select" bind:value={selectedBot} class="select-input">
        <option value="">선택하세요...</option>
        {#each savedBots as bot}
          <option value={bot}>{bot}</option>
        {/each}
      </select>
    </div>
  {/if}

  <button class="btn btn-primary" onclick={onLoadBot}>
    📥 봇 정보 가져오기
  </button>
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

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-top: 15px;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover {
    background: #5568d3;
    transform: translateY(-1px);
  }
</style>
