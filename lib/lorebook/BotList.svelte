<script lang="ts">
  import { loadAvailableBots } from './lorebookLoader.svelte';

  interface Props {
    selectedBot: string;
    onSelectBot: (botName: string) => void;
  }

  let { selectedBot = $bindable(), onSelectBot }: Props = $props();

  let botList = $state<string[]>([]);
  let loading = $state(false);

  // Load bot list on mount
  $effect(() => {
    loadBots();
  });

  async function loadBots() {
    loading = true;
    try {
      botList = await loadAvailableBots();
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      loading = false;
    }
  }

  function handleSelectBot(botName: string) {
    selectedBot = botName;
    onSelectBot(botName);
  }
</script>

<div class="flex h-full flex-col rounded-xl bg-gray-100/80 p-5">
  <div class="mb-4 flex items-center justify-between border-b-2 border-gray-300 pb-2">
    <h3 class="text-lg font-semibold text-gray-700">📚 봇 목록</h3>
    <button
      class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-lg transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
      onclick={loadBots}
      disabled={loading}
    >
      {loading ? '⏳' : '🔄'}
    </button>
  </div>

  {#if loading}
    <div class="py-10 text-center text-gray-500">로딩 중...</div>
  {:else if botList.length === 0}
    <div class="py-10 text-center text-gray-500">봇을 찾을 수 없습니다</div>
  {:else}
    <div class="flex max-h-[calc(100vh-200px)] flex-col gap-2 overflow-y-auto">
      {#each botList as botName}
        <button
          class={selectedBot === botName 
            ? "flex items-center gap-3 rounded-lg border-2 border-blue-500 bg-blue-500 px-4 py-3 text-left font-medium text-white transition-transform duration-150 hover:scale-[0.98] focus:outline-none"
            : "flex items-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-left font-medium text-gray-700 transition-transform duration-150 hover:border-blue-400 hover:scale-[0.98] focus:outline-none"
          }
          onclick={() => handleSelectBot(botName)}
        >
          <span class="text-xl">🤖</span>
          <span class="flex-1">{botName}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
