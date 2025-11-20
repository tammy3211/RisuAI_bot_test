<script lang="ts">
  import { onMount } from 'svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import { editorState } from '../shared/editorState.svelte';
  import { processRegexScripts } from '../../ts/regexProcessor';
  import RegexItem from './RegexItem.svelte';
  import RegexTester from './RegexTester.svelte';
  import { loadAllBots } from '../shared/botLoader.svelte';
  import { botService } from '../shared/botService';
  import { loadJSON, saveJSON } from '../shared/localStorage.svelte';

  interface CustomScript {
    comment: string;
    in: string;
    out: string;
    outFile?: string;
    type: string;
    flag?: string;
    ableFlag?: boolean;
  }

  const REGEX_STORAGE_KEY = 'risuai-regex-list';

  let testInput = $state('');
  let testOutput = $state('');
  let testMode = $state<'editinput' | 'editoutput' | 'editprocess' | 'editdisplay'>('editinput');
  let executionTime = $state<number | null>(null);

  let regexList = $state<Array<CustomScript & { id: string }>>([]);
  let isLoadingRegex = $state(false);
  let lastLoadedKey = '';
  let isExpanded = $state(false);
  let currentIndex = $state(0);

  onMount(async () => {
    await loadAllBots();
    await loadRegexData();
  });

  function getRegexStorage(): Record<string, CustomScript[]> {
    return loadJSON<Record<string, CustomScript[]>>(REGEX_STORAGE_KEY, {}, '[RegexTab]');
  }

  function getRegexStorageKey() {
    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      return `saved:${editorState.selectedBot}`;
    }
    return 'custom';
  }

  function loadRegexFromStorage(): CustomScript[] | null {
    const storage = getRegexStorage();
    const key = getRegexStorageKey();
    return storage[key] ?? null;
  }

  function persistRegexToStorage(list: Array<CustomScript & { id: string }>) {
    if (isLoadingRegex) return;
    const storage = getRegexStorage();
    const key = getRegexStorageKey();
    storage[key] = list.map(({ id, ...rest }) => ({
      ...rest,
      out: rest.out ?? '',
      flag: rest.flag ?? 'g',
      ableFlag: rest.ableFlag ?? true
    }));
    saveJSON(REGEX_STORAGE_KEY, storage, '[RegexTab]');
  }

  async function loadRegexData(forceFromDisk = false) {
    const key = getRegexStorageKey();
    lastLoadedKey = key;
    isLoadingRegex = true;
    try {
      const storageData = !forceFromDisk ? loadRegexFromStorage() : null;
      if (storageData && Array.isArray(storageData)) {
        regexList = storageData.map((script, idx) => ({
          comment: script.comment ?? '',
          in: script.in ?? '',
          out: script.out ?? '',
          outFile: script.outFile,
          type: script.type ?? 'editinput',
          flag: script.flag ?? 'g',
          ableFlag: script.ableFlag ?? true,
          id: `${idx}-${Date.now()}`
        }));
        return;
      }

      if (editorState.botSource !== 'saved' || !editorState.selectedBot) {
        regexList = [];
        return;
      }

      const botName = editorState.selectedBot;
      const resolvedScripts = await botService.loadRegexScripts(botName);
      
      // Add IDs to each script
      regexList = resolvedScripts.map((script, idx) => ({
        ...script,
        id: `${idx}-${Date.now()}`
      }));
    } catch (err) {
      console.error('Failed to load regex data:', err);
      regexList = [];
    } finally {
      isLoadingRegex = false;
    }
  }

  function addRegex() {
    const newRegex = {
      id: Date.now().toString(),
      comment: `New Regex ${regexList.length + 1}`,
      in: '',
      out: '',
      outFile: `regex-${Date.now()}.md`,
      type: testMode,
      flag: 'g',
      ableFlag: true
    };

    regexList = [...regexList, newRegex];
  }

  async function resetRegexList() {
    await loadRegexData(true);
  }

  function removeRegex(id: string) {
    regexList = regexList.filter(r => r.id !== id);
  }

  async function applyRegex() {
    const startTime = performance.now();
    let timeoutId: number | null = null;
    let didTimeout = false;

    try {
      const scripts = regexList.map(({ id, outFile, ...script }) => script);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          didTimeout = true;
          reject(new Error('Regex processing exceeded 10 seconds timeout'));
        }, 10000); // 10 seconds
      });

      // Race between processing and timeout
      const processingPromise = processRegexScripts(scripts, testInput, testMode);
      const result = await Promise.race([processingPromise, timeoutPromise]);
      
      const endTime = performance.now();
      executionTime = (endTime - startTime) / 1000; // Convert to seconds
      
      testOutput = result as string;
    } catch (err) {
      const endTime = performance.now();
      executionTime = (endTime - startTime) / 1000;
      
      console.error('Regex error:', err);
      if (didTimeout) {
        testOutput = `Error: Regex processing timed out (exceeded 10 seconds)`;
      } else {
        testOutput = `Error: ${err}`;
      }
    } finally {
      // Clear the timeout if it hasn't fired
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  async function loadBotData() {
    await loadRegexData();
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
    if (!isExpanded && regexList.length > 0) {
      currentIndex = 0;
    }
  }

  function goToPrevious() {
    if (regexList.length === 0) return;
    currentIndex = (currentIndex - 1 + regexList.length) % regexList.length;
  }

  function goToNext() {
    if (regexList.length === 0) return;
    currentIndex = (currentIndex + 1) % regexList.length;
  }

  $effect(() => {
    editorState.botSource;
    editorState.selectedBot;
    if (isLoadingRegex) {
      return;
    }

    const key = getRegexStorageKey();
    if (key !== lastLoadedKey) {
      void loadRegexData();
    }
  });

  $effect(() => {
    JSON.stringify(regexList);
    if (isLoadingRegex) {
      return;
    }

    persistRegexToStorage(regexList);
  });
</script>

<div class="space-y-7">
  <div class="rounded-xl border-l-4 border-indigo-400 bg-gradient-to-r from-sky-100 to-purple-100 p-6">
    <h4 class="mb-4 text-xl font-semibold text-indigo-500">🔧 정규식 스크립트 (Regex)</h4>
    <ul class="space-y-2 text-sm leading-relaxed text-slate-700">
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>정규식 패턴을 사용하여 채팅 입력/출력/프롬프트/화면 표시를 자동으로 변환합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>editinput(입력 전처리), editoutput(출력 후처리) 등 4가지 타입으로 적용 시점을 제어합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>복잡한 치환 내용은 Markdown 파일로 분리하여 관리하고, CBS 문법도 사용 가능합니다</span>
      </li>
    </ul>
  </div>

  <div class="grid grid-cols-[1fr_400px] gap-8 max-lg:grid-cols-1">
    <div class="min-w-0 space-y-6">
      <div class="flex flex-col rounded-xl bg-gray-100 p-6 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div class="text-lg font-semibold text-slate-700">Regex List ({regexList.length})</div>
          <div class="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <button
              class="rounded-md bg-slate-600 px-3 py-2 text-white transition hover:-translate-y-0.5"
              onclick={toggleExpand}
            >
              {isExpanded ? '▼ 접기' : '▶ 펼치기'}
            </button>
            <button
              class="rounded-md bg-slate-200 px-3 py-2 text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              onclick={resetRegexList}
              disabled={isLoadingRegex}
            >
              Reset
            </button>
            <button
              class="rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-white transition hover:-translate-y-0.5"
              onclick={addRegex}
            >
              + 추가
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          {#if isExpanded}
            {#each regexList as regex, index (regex.id)}
              <RegexItem
                bind:regex={regexList[index]}
                {testMode}
                onRemove={() => removeRegex(regex.id)}
              />
            {:else}
              <p class="py-5 text-center text-sm italic text-slate-500">
                정규식이 없습니다. '+ 추가'를 사용하여 새 정규식을 정의하세요.
              </p>
            {/each}
          {:else if regexList.length > 0}
            <RegexItem
              bind:regex={regexList[currentIndex]}
              {testMode}
              onRemove={() => removeRegex(regexList[currentIndex].id)}
            />
          {:else}
            <p class="py-5 text-center text-sm italic text-slate-500">
              정규식이 없습니다. '+ 추가'를 사용하여 새 정규식을 정의하세요.
            </p>
          {/if}
        </div>

        {#if !isExpanded && regexList.length > 0}
          <div class="mt-4 flex items-center justify-center gap-3 border-t-2 border-slate-200 pt-4">
            <button
              class="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              onclick={goToPrevious}
            >
              ◀ Prev
            </button>
            <span class="text-sm font-semibold text-slate-600">{currentIndex + 1} / {regexList.length}</span>
            <button
              class="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              onclick={goToNext}
            >
              Next ▶
            </button>
          </div>
        {/if}
      </div>

      <RegexTester
        bind:testInput={testInput}
        bind:testMode={testMode}
        {testOutput}
        {executionTime}
        onApply={applyRegex}
      />
    </div>

    <div class="min-w-0">
      <BotSettings onLoadBot={loadBotData} />
    </div>
  </div>
</div>
