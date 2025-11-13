<script lang="ts">
  import type { LorebookEntry } from './lorebookLoader.svelte';
  import { runLorebookPrompt, type LorebookPromptResult } from './lorebookRunner';
  import { generatePromptPreview, type PromptPreviewResult } from './promptPreview';
  import ChatInterface from './ChatInterface.svelte';

  interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }

  interface Props {
    lorebooks: LorebookEntry[];
    selectedLorebook: LorebookEntry | null;
    botName: string;
    lorebookSettings: {
      recursiveScanning: boolean;
      fullWordMatching: boolean;
      scanDepth: number;
      tokenBudget: number;
    };
  }

  let { lorebooks, botName, lorebookSettings }: Props = $props();

  let messages = $state<Message[]>([]);
  let conversationText = $state('');
  let isTesting = $state(false);
  let activatedResults = $state<LorebookPromptResult['actives']>([]);
  let matchLog = $state<LorebookPromptResult['matchLog']>([]);
  let errorMessage = $state('');
  let showPromptPreview = $state(false);
  let promptPreviewData = $state<PromptPreviewResult | null>(null);
  let isGeneratingPreview = $state(false);
  let firstMessage = $state('Hello!');
  let regexScripts = $state<Array<{ comment: string; in: string; out: string; type: string; flag?: string; ableFlag?: boolean }>>([]);

  // first_mes.md와 정규식 스크립트 로드
  $effect(() => {
    if (botName) {
      loadFirstMessage();
      loadRegexScripts();
    }
  });

  async function loadFirstMessage() {
    try {
      const firstMesPath = `/save/${botName}/first_mes.md`;
      const response = await fetch(firstMesPath + '?t=' + Date.now());
      if (response.ok) {
        firstMessage = await response.text();
      }
    } catch (error) {
      console.warn('[LorebookTester] Failed to load first_mes.md:', error);
    }
  }

  async function loadRegexScripts() {
    try {
      const regexPath = `/save/${botName}/regex.json`;
      const response = await fetch(regexPath + '?t=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        regexScripts = Array.isArray(data) ? data : [];
        console.log('[LorebookTester] Loaded regex scripts:', regexScripts.length);
      } else {
        regexScripts = [];
      }
    } catch (error) {
      console.warn('[LorebookTester] Failed to load regex.json:', error);
      regexScripts = [];
    }
  }

  function handleMessagesChange(newMessages: Message[]) {
    messages = newMessages;
    // 메시지를 텍스트 형식으로 변환 (첫 메시지 제외, first_mes.md로 처리됨)
    conversationText = messages
      .filter(m => !m.isFirstMessage)
      .map(m => `{{${m.role}}}: ${m.content}`)
      .join('\n');
  }

  async function runMatch() {
    isTesting = true;
    errorMessage = '';
    activatedResults = [];
    matchLog = [];

    try {
      const result = await runLorebookPrompt(lorebooks, conversationText, lorebookSettings);
      activatedResults = result.actives;
      matchLog = result.matchLog;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      isTesting = false;
    }
  }

  async function previewPrompt() {
    isGeneratingPreview = true;
    errorMessage = '';
    promptPreviewData = null; // 이전 데이터 초기화

    try {
      console.log('[LorebookTester] Starting preview generation...');
      const result = await generatePromptPreview(lorebooks, conversationText, botName, lorebookSettings, regexScripts);
      console.log('[LorebookTester] Preview result:', result);
      console.log('[LorebookTester] Messages count:', result.messages?.length);
      console.log('[LorebookTester] Full prompt length:', result.fullPrompt?.length);
      
      // 데이터를 먼저 설정하고
      promptPreviewData = result;
      console.log('[LorebookTester] Data assigned to promptPreviewData');
      
      // 다음 틱에서 모달 표시
      await new Promise(resolve => setTimeout(resolve, 0));
      showPromptPreview = true;
      console.log('[LorebookTester] Modal shown');
    } catch (error) {
      console.error('[LorebookTester] Preview error:', error);
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      isGeneratingPreview = false;
    }
  }
</script>

<div class="flex h-full flex-col gap-5">
  <div class="flex flex-col gap-3 rounded-xl border border-gray-300 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-700">💬 테스트 대화</span>
      <span class="text-xs text-gray-500">{messages.length}개 메시지</span>
    </div>
    <div class="min-h-[300px]">
      <ChatInterface 
        onMessagesChange={handleMessagesChange}
        firstMessage={firstMessage}
        regexScripts={regexScripts}
      />
    </div>
    <div class="flex gap-2">
      <button
        class="flex-1 inline-flex items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
        onclick={runMatch}
        disabled={isTesting}
      >
        {isTesting ? '⏳ 매칭 중...' : '▶ 로어북 매칭 실행'}
      </button>
      <button
        class="flex-1 inline-flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
        onclick={previewPrompt}
        disabled={isGeneratingPreview}
      >
        {isGeneratingPreview ? '⏳ 생성 중...' : '👁️ 프롬프트 미리보기'}
      </button>
    </div>
    {#if errorMessage}
      <div class="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">⚠️ {errorMessage}</div>
    {/if}
  </div>

  {#if showPromptPreview}
    <!-- 프롬프트 미리보기 모달 -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onclick={(e) => {
      if (e.target === e.currentTarget) showPromptPreview = false;
    }}>
      <div class="flex max-h-[80vh] w-full max-w-4xl flex-col gap-4 rounded-xl border border-gray-300 bg-white p-6 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <h3 class="text-xl font-bold text-gray-800">📝 프롬프트 미리보기</h3>
            <p class="text-xs text-gray-500">리스의 기본 템플릿을 기준으로 생성된 프롬프트입니다. 실제 동작과 다를 수 있습니다.</p>
          </div>
          <button
            class="rounded-md px-3 py-1 text-2xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onclick={() => showPromptPreview = false}
          >
            ×
          </button>
        </div>
        <div class="flex-1 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
          {#if promptPreviewData && promptPreviewData.fullPrompt}
            <!-- Role별 메시지 박스 표시 -->
            <div class="flex flex-col gap-3">
              {#each promptPreviewData.messages as msg}
                {@const roleColors = {
                  system: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-500' },
                  user: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-500' },
                  assistant: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-500' },
                  function: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-500' },
                }}
                {@const colors = roleColors[msg.role] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-500' }}
                
                <div class="rounded-lg border-2 {colors.border} {colors.bg} p-4">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="inline-flex items-center rounded-full {colors.badge} px-3 py-1 text-xs font-bold uppercase text-white">
                      {msg.role}
                    </span>
                    {#if msg.source}
                      <span class="rounded border px-2 py-0.5 text-xs {colors.text} {colors.border}">{msg.source}</span>
                    {/if}
                  </div>
                  <pre class="whitespace-pre-wrap font-mono text-sm leading-relaxed {colors.text}">{msg.content}</pre>
                </div>
              {/each}
            </div>
          {:else if promptPreviewData}
            <div class="text-gray-700">
              <p class="mb-2">데이터가 있으나 fullPrompt가 비어있습니다.</p>
              <p class="text-xs">Messages: {promptPreviewData.messages?.length || 0}</p>
              <pre class="mt-2 text-xs">{JSON.stringify(promptPreviewData, null, 2)}</pre>
            </div>
          {:else}
            <p class="text-gray-500">프롬프트를 생성하는 중...</p>
          {/if}
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
            onclick={() => {
              if (promptPreviewData) {
                // 메시지들을 텍스트로 변환하여 복사
                const textToCopy = promptPreviewData.messages.map(msg => 
                  `[${msg.role.toUpperCase()}]\n${msg.content}`
                ).join('\n\n---\n\n');
                navigator.clipboard.writeText(textToCopy);
                alert('프롬프트가 클립보드에 복사되었습니다!');
              }
            }}
            disabled={!promptPreviewData}
          >
            📋 복사
          </button>
          <button
            class="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            onclick={() => showPromptPreview = false}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  {/if}

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
