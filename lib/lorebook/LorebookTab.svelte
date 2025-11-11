<script lang="ts">
  import BotList from './BotList.svelte';
  import LorebookList from './LorebookList.svelte';
  import LorebookDetail from './LorebookDetail.svelte';
  import { loadBotLorebook, type LorebookEntry } from './lorebookLoader.svelte';

  let selectedBot = $state('');
  let lorebooks = $state<LorebookEntry[]>([]);
  let selectedLorebook = $state<LorebookEntry | null>(null);
  let loading = $state(false);
  let viewMode = $state<'view' | 'test'>('view');

  async function handleSelectBot(botName: string) {
    loading = true;
    selectedLorebook = null;
    
    try {
      lorebooks = await loadBotLorebook(botName);
    } catch (error) {
      console.error('Failed to load lorebooks:', error);
      lorebooks = [];
    } finally {
      loading = false;
    }
  }

  function handleSelectLorebook(lorebook: LorebookEntry) {
    selectedLorebook = lorebook;
  }

  function handleModeChange(mode: 'view' | 'test') {
    viewMode = mode;
  }
</script>

<div class="h-full w-full space-y-5 bg-white p-5">
  <div class="grid h-full grid-cols-[1fr_400px] gap-5 max-[1200px]:grid-cols-[1fr_350px] max-[900px]:grid-cols-1 max-[900px]:grid-rows-[1fr_auto]">
    <!-- 왼쪽: 로어북 상세 -->
    <div class="flex min-h-0 flex-col overflow-hidden">
      <LorebookDetail 
        lorebook={selectedLorebook} 
        allLorebooks={lorebooks}
        viewMode={viewMode}
        onModeChange={handleModeChange}
        selectedBot={selectedBot}
      />
    </div>

    <!-- 오른쪽: 봇 목록 + 로어북 리스트 -->
    <div class="flex min-h-0 flex-col gap-5 max-[900px]:max-h-[500px]">
      <div class="shrink-0">
        <BotList 
          bind:selectedBot={selectedBot}
          onSelectBot={handleSelectBot}
        />
      </div>

      <div class="relative flex-1 min-h-0">
        {#if loading}
          <div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-100/95">
            <div class="text-3xl animate-spin">⏳</div>
            <div>로어북 로딩 중...</div>
          </div>
        {:else}
          <LorebookList 
            lorebooks={lorebooks}
            bind:selectedLorebook={selectedLorebook}
            onSelectLorebook={handleSelectLorebook}
          />
        {/if}
      </div>
    </div>
  </div>
</div>
