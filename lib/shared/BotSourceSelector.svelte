<script lang="ts">
  import { onMount } from 'svelte';
  import { editorState, saveEditorState } from './editorState.svelte';
  import { loadAllBots, loadSelectedBotData } from './botLoader.svelte';
  
  interface Props {
    onLoadBot?: () => void;
  }
  
  let { onLoadBot }: Props = $props();
  
  // 초기 로드 (한 번만 실행)
  onMount(async () => {
    await loadAllBots();

    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      await loadSelectedBotData();
      onLoadBot?.();
    }
  });
  
  // botSource 변경 시 저장
  async function handleBotSourceChange() {
    if (editorState.botSource === 'saved') {
      if (editorState.selectedBot) {
        await loadSelectedBotData();
      }
    } else {
      editorState.selectedBot = '';
      editorState.botName = '';
      editorState.botDescription = '';
    }

    saveEditorState();

    if (onLoadBot) {
      onLoadBot();
    }
  }
  
  // selectedBot 변경 시 자동으로 봇 데이터 로드
  async function handleSelectedBotChange() {
    if (!editorState.selectedBot) {
      editorState.botName = '';
      editorState.botDescription = '';
      saveEditorState();
    } else {
      await loadSelectedBotData();
    }

    if (onLoadBot) {
      onLoadBot();
    }
  }
</script>

<div class="rounded-xl bg-gray-100 p-6">
  <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">🤖 봇 정보 소스</div>
  <div class="mt-2.5 flex gap-5">
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <input type="radio" bind:group={editorState.botSource} value="saved" onchange={handleBotSourceChange} />
      <span>저장된 봇 선택</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <input type="radio" bind:group={editorState.botSource} value="custom" onchange={handleBotSourceChange} />
      <span>사용자 설정 (Database)</span>
    </label>
  </div>

  {#if editorState.botSource === 'saved'}
    <div class="mt-4">
      <label for="bot-select" class="mb-1.5 block text-xs font-semibold text-slate-600">저장된 봇:</label>
      <select
        id="bot-select"
        bind:value={editorState.selectedBot}
        onchange={handleSelectedBotChange}
        class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">선택하세요...</option>
        {#each editorState.savedBots as bot}
          <option value={bot}>{bot}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>
