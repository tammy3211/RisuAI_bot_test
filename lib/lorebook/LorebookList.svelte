<script lang="ts">
  import type { LorebookEntry } from '../../ts/mockDatabase';

  interface Props {
    lorebooks: LorebookEntry[];
    selectedLorebook: LorebookEntry | null;
    onSelectLorebook: (lorebook: LorebookEntry) => void;
  }

  let { lorebooks, selectedLorebook = $bindable(), onSelectLorebook }: Props = $props();

  // 폴더별로 그룹화된 로어북과 최상위 로어북
  let groupedLorebooks = $derived.by(() => {
    const folders = new Map<string, LorebookEntry[]>();
    const topLevel: LorebookEntry[] = [];

    // 먼저 모든 폴더를 찾아서 맵 초기화
    lorebooks.forEach(lorebook => {
      if (lorebook.mode === 'folder') {
        topLevel.push(lorebook);
        folders.set(lorebook.key, []); // key를 사용 (예: "\uf000folder:world_info")
      }
    });

    // 각 로어북을 폴더에 할당하거나 최상위에 배치
    lorebooks.forEach(lorebook => {
      if (lorebook.mode !== 'folder') {
        if (lorebook.folder && folders.has(lorebook.folder)) {
          // 폴더에 속한 로어북
          folders.get(lorebook.folder)!.push(lorebook);
        } else {
          // 최상위 로어북 (폴더가 없거나 폴더를 찾을 수 없음)
          topLevel.push(lorebook);
        }
      }
    });

    return { folders, topLevel };
  });

  // 각 폴더의 펼침/접힘 상태 (key 기반)
  let expandedFolders = $state<Set<string>>(new Set());

  function toggleFolder(folderKey: string) {
    if (expandedFolders.has(folderKey)) {
      expandedFolders.delete(folderKey);
    } else {
      expandedFolders.add(folderKey);
    }
    expandedFolders = new Set(expandedFolders);
  }

  function expandAll() {
    const allFolders = new Set<string>();
    lorebooks.forEach(lorebook => {
      if (lorebook.mode === 'folder') {
        allFolders.add(lorebook.key);
      }
    });
    expandedFolders = allFolders;
  }

  function collapseAll() {
    expandedFolders = new Set();
  }

</script>

<div class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
  <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
    <div>
      <p class="text-sm font-semibold text-slate-900">로어북 트리</p>
      <p class="text-xs text-slate-500">폴더를 펼쳐 항목을 선택하세요</p>
    </div>
    <div class="flex items-center gap-2">
      <button
        class="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
        onclick={expandAll}
        title="모두 펼치기"
      >
        ▼ 모두 펼치기
      </button>
      <button
        class="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
        onclick={collapseAll}
        title="모두 접기"
      >
        ▲ 모두 접기
      </button>
      <span class="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white">{lorebooks.length}</span>
    </div>
  </header>

  {#if lorebooks.length === 0}
    <div class="flex flex-1 items-center justify-center text-sm text-slate-400 m-[12px]">
      로어북이 없습니다
    </div>
  {:else}
    <nav class="flex-1 overflow-y-auto px-4 py-3 text-sm">
      <ul class="space-y-1">
        {#each groupedLorebooks.topLevel as lorebook, idx}
          {#if lorebook.mode === 'folder'}
            <li class="rounded-xl bg-slate-50/80 ring-1 ring-inset ring-slate-200">
              <button
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
                onclick={() => toggleFolder(lorebook.key)}
              >
                <span
                  class="text-[11px] text-slate-500 transition-transform"
                  style="transform: rotate({expandedFolders.has(lorebook.key) ? '90deg' : '0deg'})"
                >
                  ▶
                </span>
                <span
                  class="cursor-pointer rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 transition hover:bg-amber-300/80"
                  onclick={(e) => {
                    e.stopPropagation();
                    onSelectLorebook(lorebook);
                  }}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectLorebook(lorebook);
                    }
                  }}
                  title="폴더 세부사항 보기"
                >
                  Folder
                </span>
                <span class="flex-1 truncate font-medium">{lorebook.comment || '이름 없는 폴더'}</span>
                <span class="rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {groupedLorebooks.folders.get(lorebook.key)?.length || 0}
                </span>
              </button>

              {#if expandedFolders.has(lorebook.key)}
                <ul class="border-t border-dashed border-slate-200/80 px-3 py-2">
                  {#each groupedLorebooks.folders.get(lorebook.key) || [] as childLorebook, idx}
                    <li>
                      <button
                        class={`flex w-full flex-col gap-1 rounded-lg px-2.5 py-1.5 text-left transition ${selectedLorebook === childLorebook ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-100'}`}
                        onclick={() => onSelectLorebook(childLorebook)}
                      >
                        <div class="flex items-center gap-2 text-[13px]">
                          <span class="text-xs">{childLorebook.alwaysActive ? '🔆' : '📄'}</span>
                          <span class="flex-1 truncate font-medium text-slate-800">{childLorebook.comment || '이름 없음'}</span>
                        </div>
                        <div class="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                          <span class={childLorebook.alwaysActive ? 'text-amber-600 font-semibold' : ''}>
                            {childLorebook.alwaysActive ? 'Always' : 'Trigger'}
                          </span>
                          {#if childLorebook.selective}
                            <span class="rounded bg-cyan-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">Selective</span>
                          {/if}
                          <span class="font-mono text-slate-400">#{childLorebook.insertorder}</span>
                        </div>
                        <p class="truncate text-[11px] font-mono text-slate-500">
                          {childLorebook.key.substring(0, 45)}{childLorebook.key.length > 45 ? '...' : ''}
                        </p>
                      </button>
                    </li>
                    {#if idx < (groupedLorebooks.folders.get(lorebook.key) || []).length - 1}
                      <li class="py-0.5">
                        <div class="border-t border-dashed border-slate-300/50"></div>
                      </li>
                    {/if}
                  {/each}
                </ul>
              {/if}
            </li>
          {:else}
            <li>
              <button
                class={`flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left transition ${selectedLorebook === lorebook ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-100'}`}
                onclick={() => onSelectLorebook(lorebook)}
              >
                <div class="flex items-center gap-2 text-[13px]">
                  <span>{lorebook.alwaysActive ? '🔆' : '📄'}</span>
                  <span class="flex-1 truncate font-semibold text-slate-900">{lorebook.comment || '이름 없음'}</span>
                </div>
                <div class="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                  <span class={lorebook.alwaysActive ? 'text-amber-600 font-semibold' : ''}>
                    {lorebook.alwaysActive ? 'Always Active' : 'Trigger'}
                  </span>
                  {#if lorebook.selective}
                    <span class="rounded bg-cyan-500/90 px-2 py-0.5 font-semibold text-white">Selective</span>
                  {/if}
                  <span class="font-mono text-slate-400">Order {lorebook.insertorder}</span>
                </div>
                <p class="truncate text-[11px] font-mono text-slate-500">
                  {lorebook.key.substring(0, 50)}{lorebook.key.length > 50 ? '...' : ''}
                </p>
              </button>
            </li>
          {/if}
          {#if idx < groupedLorebooks.topLevel.length - 1}
            <li class="py-1">
              <div class="border-t border-dashed border-slate-300"></div>
            </li>
          {/if}
        {/each}
      </ul>
    </nav>
  {/if}
</div>
