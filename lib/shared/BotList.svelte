<script lang="ts">
  import { onMount } from 'svelte';
  import { loadAllBots } from './botLoader.svelte';
  import { editorState, saveEditorState } from './editorState.svelte';
  import { exportBotAsCharX } from './charExporter';

  interface Props {
    onSelectBot?: (botName: string) => void;
  }

  let { onSelectBot }: Props = $props();

  let botList = $state<string[]>([]);
  let loading = $state(false);
  let exportingBot = $state<string | null>(null);

  // Load bot list on mount (once)
  onMount(() => {
    loadBots();
  });

  async function loadBots() {
    loading = true;
    try {
      botList = await loadAllBots();
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      loading = false;
    }
  }

  function handleSelectBot(botName: string) {
    editorState.selectedBot = botName;
    editorState.botSource = 'saved';
    saveEditorState();
    
    if (onSelectBot) {
      onSelectBot(botName);
    }
  }

  async function handleExportCharX(botName: string, event: MouseEvent) {
    event.stopPropagation();
    exportingBot = botName;
    
    try {
      await exportBotAsCharX(botName);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      exportingBot = null;
    }
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
        <div class="relative">
          <button
            class={editorState.selectedBot === botName 
              ? "flex w-full items-center gap-3 rounded-lg border-2 border-blue-500 bg-blue-500 px-4 py-3 text-left font-medium text-white transition-transform duration-150 hover:scale-[0.98] focus:outline-none"
              : "flex w-full items-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-left font-medium text-gray-700 transition-transform duration-150 hover:border-blue-400 hover:scale-[0.98] focus:outline-none"
            }
            onclick={() => handleSelectBot(botName)}
          >
            <span class="text-xl">🤖</span>
            <span class="flex-1">{botName}</span>
          </button>
          
          <!-- CharX Download button -->
          <div class="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              onclick={(e) => handleExportCharX(botName, e)}
              disabled={exportingBot === botName}
              title="CharX 다운로드"
            >
              {#if exportingBot === botName}
                <span class="animate-spin text-sm">⏳</span>
              {:else}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
