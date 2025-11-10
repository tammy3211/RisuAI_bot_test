<script lang="ts">
  import { onMount } from 'svelte';
  import CBSParser from './CBSParser.svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import { editorState } from '../shared/editorState.svelte';
  
  // CBS states (CBS 탭 전용)
  let cbsInput = $state('');
  let cbsOutput = $state('');
  let cbsError = $state('');
  
  onMount(async () => {
    await loadSavedBots();
  });
  
  async function loadSavedBots() {
    try {
      // ./save 폴더의 하위 폴더 목록을 가져옴
      const savePath = './save';
      const response = await fetch(savePath);
      const html = await response.text();
      
      // HTML에서 폴더 링크 파싱 (간단한 방법)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));
      
      const folders = links
        .map(link => link.getAttribute('href'))
        .filter(href => href && href.endsWith('/') && href !== '../')
        .map(href => href!.replace('/', ''));
      
      if (folders.length > 0) {
        editorState.savedBots = folders;
      } else {
        // Fallback: 알려진 폴더 사용
        editorState.savedBots = ['name'];
      }
    } catch (err) {
      console.error('Failed to load saved bots:', err);
      // Fallback
      editorState.savedBots = ['name'];
    }
  }
  
  async function loadBotData() {
    console.log('[CBSTab] loadBotData called - using shared botLoader');
    // botLoader.svelte.ts에서 이미 처리했으므로 여기서는 추가 작업 불필요
    // 필요하다면 CBS 전용 로직만 추가
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
    <div class="min-w-0">
      <BotSettings onLoadBot={loadBotData} />
    </div>
  </div>
</div>
