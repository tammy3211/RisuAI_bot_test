<script lang="ts">
  import CBSParser from './CBSParser.svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  //import { editorState } from '../shared/editorState.svelte';
  import { loadSelectedBotData } from '../shared/botLoader.svelte';
  
  // CBS states (CBS 탭 전용)
  let cbsInput = $state('');
  let cbsOutput = $state('');
  let cbsError = $state('');
  
  async function handleLoadBot() {
    console.log('[CBSTab] Loading bot data...');
    await loadSelectedBotData();
  }
  
  async function parseCBS() {
    cbsError = '';
    cbsOutput = '';
    
    try {
      const { prepareMockCharacter } = await import('../../ts/mockDatabase');
      const mockChar = await prepareMockCharacter([]);

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
        <span>RisuAI의 템플릿 언어로, 동적 텍스트 생성을 가능하게 합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>변수, 조건문, 함수 등을 사용할 수 있습니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>
          예: <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-pink-500">{'{{user}}'}</code>,
          <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-pink-500">{'{{char}}'}</code>,
          <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-pink-500">{'{{time}}'}</code>
        </span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>실제 RisuAI의 CBS 파서를 사용하여 테스트합니다</span>
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
