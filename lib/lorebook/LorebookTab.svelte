<script lang="ts">
  import BotList from './BotList.svelte';
  import LorebookList from './LorebookList.svelte';
  import LorebookSettings from './LorebookSettings.svelte';
  import LorebookDetail from './LorebookDetail.svelte';
  import { loadBotLorebook, type LorebookEntry } from './lorebookLoader.svelte';

  let selectedBot = $state('');
  let lorebooks = $state<LorebookEntry[]>([]);
  let selectedLorebook = $state<LorebookEntry | null>(null);
  let loading = $state(false);
  let viewMode = $state<'view' | 'test'>('view');
  let rightPanelTab = $state<'list' | 'settings'>('list');
  
  // localStorage에서 로어북 설정 로드
  function loadLorebookSettings() {
    try {
      const saved = localStorage.getItem('lorebookSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('[LorebookTab] Failed to load settings from localStorage:', error);
    }
    return {
      recursiveScanning: true,
      fullWordMatching: false,
      scanDepth: 5,
      tokenBudget: 800
    };
  }
  
  // 로어북 설정 상태
  let lorebookSettings = $state(loadLorebookSettings());

  async function handleSelectBot(botName: string) {
    selectedBot = botName;  // 봇 선택 상태 업데이트
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
    viewMode = 'view';  // 로어북 선택 시 보기 모드로 전환
  }

  function handleModeChange(mode: 'view' | 'test') {
    viewMode = mode;
  }
  
  function handleSettingsChange(settings: typeof lorebookSettings) {
    lorebookSettings = settings;
    // localStorage에 저장
    try {
      localStorage.setItem('lorebookSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('[LorebookTab] Failed to save settings to localStorage:', error);
    }
    console.log('[LorebookTab] Settings updated:', settings);
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
        lorebookSettings={lorebookSettings}
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

      <div class="relative flex-1 min-h-0 flex flex-col">
        <!-- 탭 전환 버튼 -->
        <div class="flex gap-2 mb-3">
          <button
            class={rightPanelTab === 'list'
              ? "flex-1 rounded-md border-2 border-blue-500 bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors focus:outline-none"
              : "flex-1 rounded-md border-2 border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-400 focus:outline-none"
            }
            onclick={() => rightPanelTab = 'list'}
          >
            📖 로어북 목록
          </button>
          <button
            class={rightPanelTab === 'settings'
              ? "flex-1 rounded-md border-2 border-blue-500 bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors focus:outline-none"
              : "flex-1 rounded-md border-2 border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-400 focus:outline-none"
            }
            onclick={() => rightPanelTab = 'settings'}
          >
            ⚙️ 로어북 설정
          </button>
        </div>

        {#if loading}
          <div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-100/95">
            <div class="text-3xl animate-spin">⏳</div>
            <div>로어북 로딩 중...</div>
          </div>
        {:else if rightPanelTab === 'list'}
          <LorebookList 
            lorebooks={lorebooks}
            bind:selectedLorebook={selectedLorebook}
            onSelectLorebook={handleSelectLorebook}
          />
        {:else}
          <LorebookSettings
            recursiveScanning={lorebookSettings.recursiveScanning}
            fullWordMatching={lorebookSettings.fullWordMatching}
            scanDepth={lorebookSettings.scanDepth}
            tokenBudget={lorebookSettings.tokenBudget}
            onSettingsChange={handleSettingsChange}
          />
        {/if}
      </div>
    </div>
  </div>
</div>
