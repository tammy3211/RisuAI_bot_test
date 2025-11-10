<script lang="ts">
  import LorebookTester from './LorebookTester.svelte';
  import type { LorebookEntry } from './lorebookLoader.svelte';

  interface Props {
    lorebook: LorebookEntry | null;
    allLorebooks: LorebookEntry[];
    viewMode: 'view' | 'test';
    onModeChange: (mode: 'view' | 'test') => void;
  }

  let { lorebook, allLorebooks, viewMode, onModeChange }: Props = $props();

  // 폴더 정보를 찾는 함수
  function findFolderInfo(folderKey: string): LorebookEntry | null {
    if (!folderKey) return null;
    return allLorebooks.find(lb => lb.mode === 'folder' && lb.key === folderKey) || null;
  }

  // 현재 로어북이 속한 폴더 정보
  let parentFolder = $derived(
    lorebook?.folder ? findFolderInfo(lorebook.folder) : null
  );
</script>

<div class="flex h-full flex-col gap-4 overflow-y-auto rounded-xl bg-gray-100/80 p-5">
  <!-- 모드 전환 버튼 -->
  <div class="flex gap-3 rounded-lg border border-gray-300 bg-white p-3 shadow-sm">
    <button 
      class={viewMode === 'view'
        ? "flex-1 rounded-md border-2 border-blue-500 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 focus:outline-none"
        : "flex-1 rounded-md border-2 border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-150 hover:border-blue-400 focus:outline-none"
      }
      onclick={() => onModeChange('view')}
    >
      📖 로어북 보기
    </button>
    <button 
      class={viewMode === 'test'
        ? "flex-1 rounded-md border-2 border-blue-500 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 focus:outline-none"
        : "flex-1 rounded-md border-2 border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-150 hover:border-blue-400 focus:outline-none"
      }
      onclick={() => onModeChange('test')}
    >
      🧪 로어북 테스트
    </button>
  </div>

  {#if viewMode === 'test'}
    <!-- 테스트 모드 -->
    <LorebookTester 
      lorebooks={allLorebooks}
      selectedLorebook={lorebook}
    />
  {:else if !lorebook}
    <!-- 빈 상태 -->
    <div class="flex h-full flex-col items-center justify-center text-gray-500">
      <div class="mb-4 text-4xl opacity-50">📚</div>
      <div class="text-lg">로어북을 선택하세요</div>
    </div>
  {:else}
    <div class="flex flex-col gap-5">
      <div class="border-b-2 border-gray-300 pb-4">
        <h2 class="flex items-center gap-3 text-2xl font-semibold text-gray-800">
          {#if lorebook.mode === 'folder'}
            📁
          {:else if lorebook.alwaysActive}
            🔆
          {:else}
            📄
          {/if}
          {lorebook.comment || '이름 없음'}
        </h2>
        {#if lorebook.mode !== 'folder'}
        <div class="mt-3 flex flex-wrap gap-2">
        <span
            class="inline-flex items-center rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-600"
            class:bg-amber-400={lorebook.alwaysActive}
            class:text-gray-900={lorebook.alwaysActive}
          >
            {lorebook.alwaysActive ? '항상 활성' : '선택적 활성'}
          </span>
          {#if lorebook.selective}
          <span class="inline-flex items-center rounded-md bg-cyan-500 px-2 py-1 text-xs font-semibold text-white">Selective 모드</span>
          {/if}
          {#if lorebook.useRegex}
          <span class="inline-flex items-center rounded-md bg-purple-600 px-2 py-1 text-xs font-semibold text-white">정규식</span>
          {/if}
        </div>
        {/if}
      </div>

      {#if !lorebook.alwaysActive && lorebook.mode !== 'folder'}
        <div class="rounded-lg border border-gray-300 bg-white p-5">
          <h3 class="mb-3 text-base font-semibold text-gray-700">🔍 검색 설정</h3>
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">주 검색어 (Key):</span>
              <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.key}</span>
            </div>
            {#if lorebook.secondkey}
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">보조 검색어 (Second Key):</span>
                <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.secondkey}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <div class="rounded-lg border border-gray-300 bg-white p-5">
        <h3 class="mb-3 text-base font-semibold text-gray-700">⚙️ 설정</h3>
        <div class="flex flex-col gap-3">
          {#if parentFolder}
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">📁 폴더:</span>
              <span class="rounded-md border border-amber-300 bg-amber-100 px-3 py-2 font-mono text-sm font-semibold text-amber-800">
                {parentFolder.comment || parentFolder.key}
              </span>
            </div>
          {/if}
          {#if lorebook.mode !== 'folder'}
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">삽입 순서:</span>
            <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.insertorder}</span>
          </div>
          {/if}
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">모드:</span>
            <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.mode}</span>
          </div>
          {#if lorebook.mode === 'folder'}
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">폴더 키:</span>
              <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.key}</span>
            </div>
          {/if}
          {#if lorebook.activationPercent !== undefined}
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">활성화 확률:</span>
              <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.activationPercent}%</span>
            </div>
          {/if}
          {#if lorebook.extentions?.risu_case_sensitive !== undefined}
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">대소문자 구분:</span>
              <span class="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{lorebook.extentions.risu_case_sensitive ? '예' : '아니오'}</span>
            </div>
          {/if}
        </div>
      </div>

      {#if lorebook.mode !== 'folder'}
        <div class="rounded-lg border border-gray-300 bg-white p-5">
          <h3 class="mb-3 text-base font-semibold text-gray-700">📝 내용</h3>
          {#if lorebook.mdFile}
            <div class="mb-3 rounded-md bg-blue-100 p-3 text-sm text-blue-800">
              📄 Markdown 파일: <code class="rounded bg-white px-2 py-0.5 font-mono">{lorebook.mdFile}.md</code>
            </div>
          {/if}
          <div class="overflow-hidden rounded-lg border border-gray-300 bg-white">
            {#if lorebook.mdContent}
              <pre class="max-h-[50vh] overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed text-gray-800">{lorebook.mdContent}</pre>
            {:else}
              <pre class="max-h-[50vh] overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed text-gray-800">{lorebook.content}</pre>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
