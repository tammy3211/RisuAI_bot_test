<script lang="ts">
  import { onMount } from 'svelte';
  import CBSParser from './CBSParser.svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import { editorState, saveEditorState } from '../shared/editorState.svelte';
  
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
      // Runtime 값 설정
      const { 
        setRuntimeUserName, 
        setRuntimePersonaPrompt, 
        setRuntimeBotName,
        setRuntimeBotDescription,
        setRuntimeChatVars,
        getUserName, 
        getPersonaPrompt, 
        getChatVar,
        getDatabase 
      } = await import('../../ts/platform-shim');
      
      setRuntimeUserName(editorState.userName);
      setRuntimePersonaPrompt(editorState.userPersona);
      setRuntimeBotName(editorState.botName);
      setRuntimeBotDescription(editorState.botDescription);
      setRuntimeChatVars(editorState.customVars);  // customVars를 채팅 변수로 설정
      
      console.log('[CBS Debug] Runtime values set:', { 
        userName: editorState.userName, 
        userPersona: editorState.userPersona,
        botName: editorState.botName,
        botDescription: editorState.botDescription,
        customVars: editorState.customVars,
        getUserName: getUserName(), 
        getPersonaPrompt: getPersonaPrompt(),
        testChatVar: getChatVar('test_var')
      });
      
      // database.svelte.ts에 mock database 주입
      const { setDatabase } = await import('../../../src/ts/storage/database.svelte');
      const mockDb = getDatabase();
      setDatabase(mockDb);
      
      // selectedCharID를 0으로 설정 (첫 번째 캐릭터)
      const { selectedCharID } = await import('../../../src/ts/stores.svelte');
      selectedCharID.set(0);
      
      console.log('[CBS Debug] Database and selectedCharID set');
      console.log('[CBS Debug] Chat scriptstate:', mockDb.characters?.[0]?.chats?.[0]?.scriptstate);
      
      // 에디터용 파서 래퍼 사용
      const { getEditorParser } = await import('../../ts/parser-wrapper');
      const risuChatParser = await getEditorParser();
      
      // 캐릭터 객체 생성 ({{description}}, {{personality}} 등을 위해)
      const mockCharacter = {
        type: 'character',
        name: editorState.botName,
        nickname: '',
        desc: editorState.botDescription,        // {{description}}이 읽는 필드
        personality: '',             // {{personality}}는 비워둠
        scenario: '',
        exampleMessage: '',
        firstMessage: '',
        chaId: 'test-char',
        customscript: [],
        emotionImages: [],
        additionalAssets: [],
      } as any;
      
      console.log('[CBS Debug] mockCharacter created:', {
        name: mockCharacter.name,
        desc: mockCharacter.desc,
        editorStateBotName: editorState.botName,
        editorStateBotDescription: editorState.botDescription
      });
      console.log('[CBS Debug] Parsing CBS input:', cbsInput);
      
      cbsOutput = risuChatParser(cbsInput, {
        consistantChar: false,
        chara: mockCharacter,
        var: undefined,  // tempvar는 내부에서 관리됨
      });
      
      console.log('[CBS Debug] Parse result:', cbsOutput);
    } catch (err: any) {
      cbsError = err.toString();
      console.error('CBS Parse Error:', err);
    }
  }
</script>

<div class="cbs-tab">
  <div class="info-panel">
    <h4>📝 CBS (ChatBot Script)</h4>
    <ul>
      <li>RisuAI의 템플릿 언어로, 동적 텍스트 생성을 가능하게 합니다</li>
      <li>변수, 조건문, 함수 등을 사용할 수 있습니다</li>
      <li>예: <code>{'{{user}}'}</code>, <code>{'{{char}}'}</code>, <code>{'{{time}}'}</code></li>
      <li>실제 RisuAI의 CBS 파서를 사용하여 테스트합니다</li>
    </ul>
  </div>

  <div class="cbs-container">
    <!-- Left Panel -->
    <div class="cbs-left">
      <CBSParser 
        bind:cbsInput 
        bind:cbsOutput 
        bind:cbsError 
        onParse={parseCBS}
      />
    </div>

    <!-- Right Panel -->
    <div class="cbs-right">
      <BotSettings onLoadBot={loadBotData} />
    </div>
  </div>
</div>

<style>
  .cbs-tab {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .info-panel {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 30px;
    border-left: 5px solid #667eea;
  }

  .info-panel h4 {
    font-size: 1.3em;
    color: #667eea;
    margin-bottom: 15px;
  }

  .info-panel ul {
    list-style: none;
    padding-left: 0;
  }

  .info-panel li {
    padding: 8px 0;
    padding-left: 25px;
    position: relative;
    line-height: 1.6;
  }

  .info-panel li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
  }

  code {
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    color: #d63384;
  }

  .cbs-container {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 20px;
  }

  .cbs-left {
    min-width: 0;
  }

  .cbs-right {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    .cbs-container {
      grid-template-columns: 1fr;
    }
  }
</style>
