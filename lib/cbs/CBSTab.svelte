<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import CBSParser from './CBSParser.svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import { editorState } from '../shared/editorState.svelte';
  import { loadSelectedBotData } from '../shared/botLoader.svelte';
  import { botService } from '../shared/botService';
  
  // CBS states (CBS 탭 전용)
  let cbsInput = $state('');
  let cbsOutput = $state('');
  let cbsError = $state('');
  let unsubscribe: (() => void) | null = null;
  
  async function handleLoadBot() {
    console.log('[CBSTab] Loading bot data...');
    await loadSelectedBotData();
    
    // WebSocket 파일 감지 설정
    setupFileWatcher();
  }
  
  function setupFileWatcher() {
    // 이전 구독 해제
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (editorState.selectedBot && editorState.botSource === 'saved') {
      console.log('[CBSTab] Setting up file watcher for:', editorState.selectedBot);
      unsubscribe = botService.watchBot(editorState.selectedBot, async (event) => {
        console.log('[CBSTab] File changed:', event);
        
        // 봇 데이터 다시 로드
        await loadSelectedBotData();
        
        // CBS 출력이 있었다면 자동으로 다시 파싱
        if (cbsInput.trim() && cbsOutput) {
          console.log('[CBSTab] Re-parsing CBS after file change');
          await parseCBS();
        }
      });
    }
  }
  
  // 마운트 시 봇이 선택되어 있으면 파일 감지 설정
  onMount(() => {
    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      setupFileWatcher();
    }
  });
  
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });
  
  async function parseCBS() {
    cbsError = '';
    cbsOutput = '';
    
    try {
      // Load all bot data
      const botData = await loadSelectedBotData();
      
      const { prepareMockCharacter } = await import('../../ts/mockDatabase');
      const mockChar = await prepareMockCharacter(botData);

      const { getEditorParser } = await import('../../ts/parser-wrapper');
      const risuChatParser = await getEditorParser();

      cbsOutput = risuChatParser(cbsInput, {
        consistantChar: false,
        chara: mockChar,
        var: undefined,
      });
    } catch (err: any) {
      cbsError = err.toString();
      console.error('CBS Parse Error:', err);
    }
  }
</script>

<div class="space-y-7">
  <div class="rounded-xl border-l-4 border-indigo-400 bg-gradient-to-r from-sky-100 to-purple-100 p-6">
    <h4 class="mb-4 text-xl font-semibold text-indigo-500">📝 CBS (ChatBot Script)</h4>
    <ul class="space-y-2 text-sm leading-relaxed text-slate-700">
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>RisuAI의 템플릿 언어로 <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-pink-500">{'{{user}}'}</code>, <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-pink-500">{'{{char}}'}</code> 등의 변수와 조건문을 사용합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>description, first_mes, lorebook 등 거의 모든 텍스트 필드에서 동적 내용 생성이 가능합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>실제 봇 데이터를 기반으로 CBS 문법을 테스트하고 결과를 즉시 확인할 수 있습니다</span>
      </li>
    </ul>
  </div>

  <div class="grid grid-cols-[1fr_400px] gap-5 max-lg:grid-cols-1">
    <!-- Left Panel -->
    <div class="min-w-0">
      <CBSParser 
        bind:cbsInput 
        bind:cbsOutput 
        bind:cbsError 
        onParse={parseCBS}
      />
    </div>

    <!-- Right Panel -->
    <div class="min-w-0 space-y-5">
      <BotSettings onLoadBot={handleLoadBot} />
    </div>
  </div>
</div>
