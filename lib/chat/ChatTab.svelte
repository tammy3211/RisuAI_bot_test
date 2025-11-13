<script lang="ts">
  import { editorState, saveEditorState } from '../shared/editorState.svelte';
  import { processRegexScripts } from '../../ts/regexProcessor';
  import BotSourceSelector from '../shared/BotSourceSelector.svelte';
  import { loadSelectedBotData } from '../shared/botLoader.svelte';
  
  // Message type matching RisuAI structure
  interface Message {
    role: 'user' | 'char';
    data: string;
    time?: number;
  }
  
  // Chat state
  let messages = $state<Message[]>([]);
  let messageInput = $state('');
  let isProcessing = $state(false);
  
  // Load regex scripts from editorState
  let regexScripts = $derived(editorState.regexScripts || []);
  
  // Generate mock AI response
  function generateMockResponse(userMessage: string): string {
    const responses = [
      `"${userMessage}"에 대해 흥미로운 질문이네요! 더 자세히 말씀해주시겠어요?`,
      `알겠습니다! "${userMessage}"라고 하셨군요. 제가 도와드릴 수 있어요.`,
      `오, "${userMessage}"요? 좋은 주제네요! 함께 이야기해봐요~`,
      `*고개를 끄덕이며* 네, "${userMessage}"에 대해 생각해봤어요.`,
      `흠... "${userMessage}"라... 재미있는 생각이에요! ^^`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  async function sendMessage() {
    if (!messageInput.trim() || isProcessing) return;
    
    isProcessing = true;
    const userInput = messageInput.trim();
    messageInput = '';
    
    try {
      // Step 1: editinput - Process user input
      let processedInput = userInput;
      if (regexScripts.length > 0) {
        console.log('[ChatTab] Processing editinput...');
        console.log('[ChatTab] Input text:', userInput);
        console.log('[ChatTab] Active regex scripts:', regexScripts.filter((s: any) => s.type === 'editinput'));
        processedInput = await processRegexScripts(regexScripts, userInput, 'editinput');
        console.log('[ChatTab] editinput result:', processedInput);
      } else {
        console.warn('[ChatTab] No regex scripts loaded!');
      }
      
      // Add user message
      messages.push({
        role: 'user',
        data: processedInput,
        time: Date.now()
      });
      
      // Step 2: Generate mock AI response
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const mockResponse = generateMockResponse(userInput);
      
      // Step 3: editoutput - Process AI response
      let processedOutput = mockResponse;
      if (regexScripts.length > 0) {
        console.log('[ChatTab] Processing editoutput...');
        console.log('[ChatTab] Output text:', mockResponse);
        console.log('[ChatTab] Active regex scripts:', regexScripts.filter((s: any) => s.type === 'editoutput'));
        processedOutput = await processRegexScripts(regexScripts, mockResponse, 'editoutput');
        console.log('[ChatTab] editoutput result:', processedOutput);
      }
      
      // Add AI message
      messages.push({
        role: 'char',
        data: processedOutput,
        time: Date.now()
      });
      
    } catch (error) {
      console.error('[ChatTab] Error in sendMessage:', error);
      messages.push({
        role: 'char',
        data: '죄송해요, 오류가 발생했어요. 다시 시도해주세요!',
        time: Date.now()
      });
    } finally {
      isProcessing = false;
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  
  // Render message with editdisplay (will be implemented in Phase 4)
  function renderMessage(message: Message): string {
    // For now, just return the raw data
    // In Phase 4, we'll add ParseMarkdown + risuChatParser
    return message.data;
  }
  
  function clearMessages() {
    messages = [];
  }

  // Custom variables management
  let customVars = $derived(editorState.customVars || {});

  function addCustomVar() {
    const key = prompt('변수 이름:');
    if (key && key.trim() && !editorState.customVars[key.trim()]) {
      editorState.addCustomVar(key.trim(), '');
      saveEditorState();
    }
  }

  function removeCustomVar(key: string) {
    editorState.removeCustomVar(key);
    saveEditorState();
  }

  function handleInput() {
    saveEditorState();
  }

  function handleCustomVarChange(key: string, value: string) {
    editorState.customVars[key] = value;
    saveEditorState();
  }

  async function handleLoadBot() {
    // Reload bot data, regex, and lorebook after selecting a saved bot
    console.log('[ChatTab] Loading bot data...');
    
    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      const botName = editorState.selectedBot;
      
      // Load bot description
      await loadSelectedBotData();
      
      // Load regex scripts dynamically
      try {
        const response = await fetch(`/save/${botName}/regex/regex.json`);
        if (response.ok) {
          const regexData = await response.json();
          editorState.regexScripts = regexData;
          saveEditorState();
          console.log('[ChatTab] Loaded regex scripts:', regexData.length);
        }
      } catch (err) {
        console.warn('[ChatTab] No regex scripts found for', botName);
        editorState.regexScripts = [];
      }
      
      // Load lorebook entries dynamically
      try {
        const response = await fetch(`/save/${botName}/lorebook/lorebook.json`);
        if (response.ok) {
          const lorebookData = await response.json();
          editorState.lorebookEntries = lorebookData;
          saveEditorState();
          console.log('[ChatTab] Loaded lorebook entries:', lorebookData.length);
        }
      } catch (err) {
        console.warn('[ChatTab] No lorebook found for', botName);
        editorState.lorebookEntries = [];
      }
      
      console.log('[ChatTab] Bot data loaded:', {
        bot: botName,
        regexCount: editorState.regexScripts?.length || 0,
        lorebookCount: editorState.lorebookEntries?.length || 0
      });
    }
  }
</script>

<div class="space-y-7">
  <div class="rounded-xl border-l-4 border-indigo-400 bg-gradient-to-r from-sky-100 to-purple-100 p-6">
    <h4 class="mb-4 text-xl font-semibold text-indigo-500">💬 채팅 테스트</h4>
    <ul class="space-y-2 text-sm leading-relaxed text-slate-700">
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>editinput → editoutput → editdisplay 플로우를 테스트합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>Regex, Lua, CBS 스크립트가 실시간으로 적용됩니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>가상 AI 응답으로 실제 대화 흐름을 시뮬레이션합니다</span>
      </li>
    </ul>
  </div>

  <!-- 2-column layout: Chat on left, Bot settings on right -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
    <!-- Left: Chat messages display -->
    <div class="flex h-[600px] flex-col rounded-xl border border-gray-300 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h5 class="text-lg font-semibold text-gray-800">대화 내역</h5>
        <button 
          onclick={clearMessages}
          class="rounded-md bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
        >
          Clear
        </button>
      </div>
    
    <div class="mb-4 flex-1 space-y-3 overflow-y-auto">
      {#if messages.length === 0}
        <div class="text-center text-sm text-gray-400 italic py-8">
          메시지를 입력하여 대화를 시작하세요!
        </div>
      {/if}
      
      {#each messages as message, i (i)}
        <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] rounded-lg px-4 py-2 {
            message.role === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-800'
          }">
            <div class="mb-1 text-xs opacity-70">
              {message.role === 'user' ? editorState.userName || 'User' : editorState.botName || 'Bot'}
            </div>
            <div class="whitespace-pre-wrap text-sm">
              {renderMessage(message)}
            </div>
            {#if message.time}
              <div class="mt-1 text-xs opacity-50">
                {new Date(message.time).toLocaleTimeString()}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Message input -->
    <div class="space-y-2">
      <div class="flex items-end gap-2">
        <textarea
          bind:value={messageInput}
          onkeydown={handleKeydown}
          placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
          class="flex-grow rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none resize-none"
          rows="2"
          disabled={isProcessing}
        ></textarea>
        <button
          onclick={sendMessage}
          disabled={!messageInput.trim() || isProcessing}
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {#if isProcessing}
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {:else}
            <!-- Send icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"></path>
              <path d="M22 2 11 13"></path>
            </svg>
          {/if}
        </button>
      </div>
      
      {#if isProcessing}
        <div class="text-xs text-gray-500 italic">
          Processing scripts...
        </div>
      {/if}
    </div>
  </div>

  <!-- Right: Bot settings -->
  <div class="space-y-6">
    <!-- Bot Source Selector -->
    <BotSourceSelector onLoadBot={handleLoadBot} />

    <!-- Bot Info -->
    <div class="rounded-xl bg-gray-100 p-6">
      <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">
        🤖 봇 정보
      </div>
      <div class="space-y-4">
        <div>
          <label for="bot-name" class="mb-1.5 block text-xs font-semibold text-slate-600">봇 이름:</label>
          <input
            id="bot-name"
            type="text"
            bind:value={editorState.botName}
            oninput={handleInput}
            class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:opacity-60"
            placeholder="TestBot"
            disabled={editorState.botSource === 'saved'}
          />
        </div>

        <div>
          <label for="bot-desc" class="mb-1.5 block text-xs font-semibold text-slate-600">설명 (Description):</label>
          <textarea
            id="bot-desc"
            bind:value={editorState.botDescription}
            oninput={handleInput}
            class="min-h-20 w-full resize-y rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:opacity-60"
            placeholder="봇 설명..."
            disabled={editorState.botSource === 'saved'}
          ></textarea>
        </div>
      </div>
      {#if editorState.botSource === 'saved'}
        <p class="pt-4 text-center text-sm italic text-slate-500">ℹ️ 저장된 봇을 선택한 경우 봇 정보는 수정할 수 없습니다.</p>
      {/if}
    </div>

    <!-- User Info -->
    <div class="rounded-xl bg-gray-100 p-6">
      <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">
        👤 사용자 정보
      </div>
      <div class="space-y-4">
        <div>
          <label for="user-name" class="mb-1.5 block text-xs font-semibold text-slate-600">이름:</label>
          <input
            id="user-name"
            type="text"
            bind:value={editorState.userName}
            oninput={handleInput}
            class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="User"
          />
        </div>

        <div>
          <label for="user-persona" class="mb-1.5 block text-xs font-semibold text-slate-600">페르소나 (User Description):</label>
          <textarea
            id="user-persona"
            bind:value={editorState.userPersona}
            oninput={handleInput}
            class="min-h-20 w-full resize-y rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="사용자의 성격, 특징, 배경..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Custom Variables -->
    <div class="rounded-xl bg-gray-100 p-6">
      <div class="mb-5 flex items-center justify-between border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">
        🔧 일반 변수
        <button
          class="rounded bg-indigo-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-600"
          onclick={addCustomVar}
        >
          + 추가
        </button>
      </div>
      <div class="flex flex-col gap-2.5">
        {#each Object.entries(customVars) as [key]}
          <div class="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white p-2.5">
            <div class="min-w-[100px] font-mono text-sm font-semibold text-indigo-500">{key}</div>
            <input
              type="text"
              bind:value={editorState.customVars[key]}
              oninput={() => handleCustomVarChange(key, editorState.customVars[key])}
              class="flex-1 rounded border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
              placeholder="값 입력..."
            />
            <button
              class="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-sm text-white transition hover:bg-rose-600"
              onclick={() => removeCustomVar(key)}
            >
              ×
            </button>
          </div>
        {/each}
        {#if Object.keys(customVars).length === 0}
          <p class="py-5 text-center text-sm italic text-slate-500">변수가 없습니다. + 버튼을 눌러 추가하세요.</p>
        {/if}
      </div>
    </div>
  </div>
  </div>
</div>
