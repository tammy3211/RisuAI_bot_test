<script lang="ts">
  import type { LorebookEntry } from './lorebookLoader.svelte';

  interface Props {
    lorebooks: LorebookEntry[];
    selectedLorebook: LorebookEntry | null;
    onSelectLorebook: (lorebook: LorebookEntry) => void;
  }

  let { lorebooks, selectedLorebook = $bindable(), onSelectLorebook }: Props = $props();
</script>

<div class="flex h-full flex-col rounded-xl bg-gray-100/80 p-5">
  <div class="mb-4 flex items-center justify-between border-b-2 border-gray-300 pb-2">
    <h3 class="text-lg font-semibold text-gray-700">📖 로어북 목록</h3>
    <span class="rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white">{lorebooks.length}개</span>
  </div>

  {#if lorebooks.length === 0}
    <div class="py-10 text-center text-gray-500">
      로어북이 없습니다
    </div>
  {:else}
    <div class="flex max-h-96 flex-col gap-2 overflow-y-auto">
      {#each lorebooks as lorebook}
        <button
          class={selectedLorebook === lorebook
            ? "flex flex-col gap-2 rounded-lg border-2 border-blue-500 bg-blue-50 p-4 text-left transition-shadow duration-150 hover:shadow-md focus:outline-none"
            : "flex flex-col gap-2 rounded-lg border-2 border-gray-300 bg-white p-4 text-left transition-shadow duration-150 hover:border-blue-400 hover:shadow-md focus:outline-none"
          }
          onclick={() => onSelectLorebook(lorebook)}
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">
              {#if lorebook.mode === 'folder'}
                📁
              {:else if lorebook.alwaysActive}
                🔆
              {:else}
                📄
              {/if}
            </span>
            <span class="flex-1 font-semibold text-gray-800">{lorebook.comment || '이름 없음'}</span>
          </div>

          {#if lorebook.mode !== 'folder'}
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                class="inline-flex items-center rounded-md bg-gray-200 px-2 py-1 text-gray-600"
                class:bg-amber-400={lorebook.alwaysActive}
                class:text-gray-900={lorebook.alwaysActive}
              >
                {lorebook.alwaysActive ? '항상 활성' : '선택적'}
              </span>
              {#if lorebook.selective}
                <span class="inline-flex items-center rounded-md bg-cyan-500 px-2 py-1 text-white">Selective</span>
              {/if}
              <span class="rounded-md bg-gray-100 px-2 py-1 text-gray-500">순서: {lorebook.insertorder}</span>
            </div>
          {/if}

          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span class="font-semibold">Key:</span>
            <span class="flex-1 truncate">{lorebook.key.substring(0, 50)}{lorebook.key.length > 50 ? '...' : ''}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
