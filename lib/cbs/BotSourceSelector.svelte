<script lang="ts">
  interface Props {
    botSource: string;
    savedBots: string[];
    selectedBot: string;
    onLoadBot: () => void;
  }
  
  let { botSource = $bindable('custom'), savedBots = $bindable([]), selectedBot = $bindable(''), onLoadBot }: Props = $props();
</script>

<div class="rounded-xl bg-gray-100 p-6">
  <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">🤖 봇 정보 소스</div>
  <div class="mt-2.5 flex gap-5">
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <input type="radio" bind:group={botSource} value="custom" />
      <span>사용자 설정 (Database)</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <input type="radio" bind:group={botSource} value="saved" />
      <span>저장된 봇 선택</span>
    </label>
  </div>

  {#if botSource === 'saved'}
    <div class="mt-4">
      <label for="bot-select" class="mb-1.5 block text-xs font-semibold text-slate-600">저장된 봇:</label>
      <select
        id="bot-select"
        bind:value={selectedBot}
        class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">선택하세요...</option>
        {#each savedBots as bot}
          <option value={bot}>{bot}</option>
        {/each}
      </select>
    </div>
  {/if}

  <button
    class="mt-4 rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-600"
    onclick={onLoadBot}
  >
    📥 봇 정보 가져오기
  </button>
</div>
