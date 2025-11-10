<script lang="ts">
  import type { LorebookEntry } from './lorebookLoader.svelte';
  import { runLorebookPrompt, type LorebookPromptResult } from './lorebookRunner';

  interface Props {
    lorebooks: LorebookEntry[];
    selectedLorebook: LorebookEntry | null;
  }

  let { lorebooks, selectedLorebook }: Props = $props();

  const SAMPLE_TEXT = `{{user}}: 세계관에 대해 알려줘.
{{assistant}}: 나이트 시티는 어떻습니까?
{{user}}: 주인공의 과거가 궁금해.`;

  let conversationText = $state(SAMPLE_TEXT);
  let isTesting = $state(false);
  let activatedResults = $state<LorebookPromptResult['actives']>([]);
  let matchLog = $state<LorebookPromptResult['matchLog']>([]);
  let errorMessage = $state('');

  async function runMatch() {
    isTesting = true;
    errorMessage = '';
    activatedResults = [];
    matchLog = [];

    try {
      const result = await runLorebookPrompt(lorebooks, conversationText, selectedLorebook);
      activatedResults = result.actives;
      matchLog = result.matchLog;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      isTesting = false;
    }
  }
</script>

<div class="flex h-full flex-col gap-5">
  <div class="flex flex-col gap-3 rounded-xl border border-gray-300 bg-white p-5 shadow-sm">
    <label for="conversation" class="text-sm font-semibold text-gray-700">🧪 테스트 대화 텍스트</label>
    <textarea
      id="conversation"
      class="min-h-[180px] w-full resize-y rounded-lg border-2 border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-800 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200/70"
      bind:value={conversationText}
      rows="8"
    ></textarea>
    <button
      class="ml-auto inline-flex items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
      onclick={runMatch}
      disabled={isTesting}
    >
      {isTesting ? '⏳ 매칭 중...' : '▶ 로어북 매칭 실행'}
    </button>
    {#if errorMessage}
      <div class="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">⚠️ {errorMessage}</div>
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
    <div class="flex flex-col gap-3 rounded-xl border border-gray-300 bg-white p-5 shadow-sm">
      <h4 class="text-base font-semibold text-gray-700">📋 활성화된 로어북</h4>
      {#if activatedResults.length === 0}
        <p class="text-sm text-gray-500">활성화된 로어북이 없습니다.</p>
      {:else}
        {#each activatedResults as result}
          <div class="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-semibold text-gray-800">{result.source}</span>
              {#if typeof result.role === 'string'}
                <span class="inline-flex items-center rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">{result.role}</span>
              {/if}
            </div>
            <pre class="whitespace-pre-wrap rounded-lg border border-gray-300 bg-white p-3 font-mono text-xs leading-relaxed text-gray-800">{result.prompt}</pre>
          </div>
        {/each}
      {/if}
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-gray-300 bg-white p-5 shadow-sm">
      <h4 class="text-base font-semibold text-gray-700">🔍 매칭 로그</h4>
      {#if matchLog.length === 0}
        <p class="text-sm text-gray-500">매칭된 검색어가 없습니다.</p>
      {:else}
        <ul class="flex list-none flex-col gap-2 p-0">
          {#each matchLog as log}
            <li class="flex items-center gap-3 text-sm text-gray-600">
              <code class="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-800">{log.activated}</code>
              <span>→ {log.source}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
