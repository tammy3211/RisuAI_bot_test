<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import BotList from '../shared/BotList.svelte';
  import LorebookList from './LorebookList.svelte';
  import LorebookSettings from './LorebookSettings.svelte';
  import LorebookDetail from './LorebookDetail.svelte';
  import type { LorebookEntry } from '../../ts/mockDatabase';
  import { botService } from '../shared/botService';
  import { loadJSON, saveJSON } from '../shared/localStorage.svelte';
  import { editorState } from '../shared/editorState.svelte';

  let selectedBot = $state('');
  let lorebooks = $state<LorebookEntry[]>([]);
  let selectedLorebook = $state<LorebookEntry | null>(null);
  let loading = $state(false);
  let viewMode = $state<'view' | 'test'>('view');
  let rightPanelTab = $state<'list' | 'settings'>('list');
  let unsubscribe: (() => void) | null = null;
  let reloadDebounceTimer: number | null = null;
  
  // localStorage에서 로어북 설정 로드
  function loadLorebookSettings() {
    return loadJSON('lorebookSettings', {
      recursiveScanning: true,
      fullWordMatching: false,
      scanDepth: 5,
      tokenBudget: 800
    }, '[LorebookTab]');
  }
  
  // 로어북 설정 상태
  let lorebookSettings = $state(loadLorebookSettings());

  // 마운트 시 이미 선택된 봇이 있으면 로어북 로드
  onMount(() => {
    if (editorState.selectedBot && editorState.botSource === 'saved') {
      selectedBot = editorState.selectedBot;
      handleSelectBot(editorState.selectedBot);
    }
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (reloadDebounceTimer !== null) {
      clearTimeout(reloadDebounceTimer);
      reloadDebounceTimer = null;
    }
  });

  async function handleSelectBot(botName: string) {
    selectedBot = botName;  // 봇 선택 상태 업데이트
    loading = true;
    selectedLorebook = null;
    
    // 이전 구독 해제
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    
    try {
      lorebooks = await botService.loadLorebook(botName);
      
      // WebSocket 파일 감지 설정
      console.log('[LorebookTab] Setting up file watcher for:', botName);
      unsubscribe = botService.watchBot(botName, async (event) => {
        console.log('[LorebookTab] File changed:', event);
        
        // 디바운싱: 짧은 시간 내 여러 이벤트를 하나로 합침
        if (reloadDebounceTimer !== null) {
          clearTimeout(reloadDebounceTimer);
        }
        
        reloadDebounceTimer = window.setTimeout(async () => {
          console.log('[LorebookTab] Debounced reload triggered');
          // 파일 저장이 완료될 시간을 주기 위해 약간의 지연
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 로어북 데이터 다시 로드
          try {
            const newLorebooks = await botService.loadLorebook(botName);
            lorebooks = newLorebooks;
            console.log('[LorebookTab] Lorebooks reloaded successfully, count:', newLorebooks.length);
            
            // 현재 선택된 로어북을 새 배열에서 찾아 업데이트
            if (selectedLorebook) {
              const updatedLorebook = newLorebooks.find(
                lb => lb.key === selectedLorebook!.key
              );
              if (updatedLorebook) {
                console.log('[LorebookTab] Updating selectedLorebook:', updatedLorebook.comment);
                selectedLorebook = updatedLorebook;
              } else {
                console.log('[LorebookTab] Selected lorebook not found in new data, clearing selection');
                selectedLorebook = null;
              }
            }
          } catch (error) {
            console.error('[LorebookTab] Failed to reload lorebooks:', error);
          }
          
          reloadDebounceTimer = null;
        }, 200); // 200ms 디바운스
      });
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
    saveJSON('lorebookSettings', settings, '[LorebookTab]');
    console.log('[LorebookTab] Settings updated:', settings);
  }
</script>

<div class="h-full w-full space-y-5 bg-white p-5">
  <div class="rounded-xl border-l-4 border-indigo-400 bg-gradient-to-r from-sky-100 to-purple-100 p-6">
    <h4 class="mb-4 text-xl font-semibold text-indigo-500">📚 로어북 (Lorebook)</h4>
    <ul class="space-y-2 text-sm leading-relaxed text-slate-700">
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>대화에 특정 키워드가 등장하면 자동으로 관련 정보를 프롬프트에 삽입합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>폴더 구조로 로어북을 체계적으로 관리하고, 조건부 활성화를 설정할 수 있습니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>테스터 모드에서 실제 대화 흐름에 따라 어떤 로어북이 활성화되는지 확인 가능</span>
      </li>
    </ul>
  </div>

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
