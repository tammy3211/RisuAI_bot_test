<script lang="ts">
  import { onMount } from 'svelte';
  import { editorState } from '../shared/editorState.svelte';
  import {
    simulateUserInputFlow,
    simulateAIResponseFlow,
    processDisplay,
    getCurrentChatData,
    clearCurrentChatMessages,
    type ChatParseResult
  } from '../../ts/ChatParser';
  import type { Message } from '../../ts/mockDatabase';

  // Chat state
  type DisplayMessage = Message & { displayText: string };
  let messages = $state<DisplayMessage[]>([]);
  let messageInput = $state('');
  let isProcessing = $state(false);
  let selectedRole = $state<'user' | 'char'>('user');
  let lastRenderedIndex = -1;
  let firstMessage = $state('');
  let firstMessageLoading = $state(false);

  // Chat parsing results for debugging
  let lastParseResult = $state<ChatParseResult | null>(null);

  async function hydrateMessages(fromStart = false) {
    if (fromStart) {
      messages = [];
      lastRenderedIndex = -1;
    }

    const chatData = getCurrentChatData();
    const rawFirstMessage = chatData.firstMessage;
    
    // Always update first message when hydrating
    firstMessage = rawFirstMessage;
    
    // Process display asynchronously in background
    if (rawFirstMessage) {
      firstMessageLoading = true;
      processDisplay(rawFirstMessage, -1)
        .then(processed => {
          firstMessage = processed;
          firstMessageLoading = false;
        })
        .catch(displayError => {
          console.error('[ChatScreen] Failed to build display text for first message:', displayError);
          firstMessageLoading = false;
        });
    } else {
      firstMessageLoading = false;
    }
    
    if (!chatData.messages || chatData.messages.length === 0) {
      messages = [];
      lastRenderedIndex = -1;
      return;
    }

    const startIndex = Math.max(0, lastRenderedIndex + 1);
    if (startIndex >= chatData.messages.length) {
      return;
    }

    for (let i = startIndex; i < chatData.messages.length; i++) {
      const base = chatData.messages[i];
      const sourceText = base?.data ?? '';
      let displayText = sourceText;
      try {
        displayText = await processDisplay(sourceText, i);
      } catch (displayError) {
        console.error('[ChatScreen] Failed to build display text:', displayError);
      }

      messages.push({
        ...base,
        displayText
      });
      lastRenderedIndex = i;
    }
  }

  // Track the current bot to detect changes
  let currentBotName = $state<string | null>(null);

  onMount(() => {
    currentBotName = editorState.selectedBot;
  });

  $effect(() => {
    const bot = editorState.selectedBot;
    
    // Only re-hydrate if the bot actually changed (not just a reactive update)
    if (bot !== currentBotName) {
      console.log('[ChatScreen] Bot changed from', currentBotName, 'to', bot);
      currentBotName = bot;
      
      if (!bot) {
        messages = [];
        lastRenderedIndex = -1;
        firstMessage = '';
        firstMessageLoading = false;
        return;
      }
      
      hydrateMessages(true).catch((error) => {
        console.error('[ChatScreen] Failed to hydrate messages on bot change:', error);
      });
    }
  });

  // Send message with role selection
  async function sendMessage() {
    if (!messageInput.trim() || isProcessing) return;

    // Check if bot is selected
    if (!editorState.selectedBot) {
      alert('먼저 봇을 선택해주세요! BotSettings 탭에서 봇을 선택한 후 사용하세요.');
      return;
    }

    isProcessing = true;
    const inputText = messageInput.trim();
    messageInput = '';

    try {
      if (selectedRole === 'user') {
        // User message flow - 입력만 처리, AI 응답 생성 없음
        console.log('[ChatScreen] Processing user message:', inputText);

        // Use ChatParser for user input processing only
        const parseResult = await simulateUserInputFlow(inputText);
        lastParseResult = parseResult;

        await hydrateMessages();

        console.log('[ChatScreen] User input result:', parseResult);

      } else {
        // Assistant message flow - AI 응답으로 처리
        console.log('[ChatScreen] Processing assistant message as AI response:', inputText);

        // Use ChatParser for AI response processing
        const parseResult = await simulateAIResponseFlow(inputText);
        lastParseResult = parseResult;

        await hydrateMessages();

        console.log('[ChatScreen] AI response result:', parseResult);
      }

    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);

      // Fallback: add message without processing
      messages.push({
        role: selectedRole,
        data: inputText,
        displayText: inputText,
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

  function clearMessages() {
    clearCurrentChatMessages();
    messages = [];
    lastParseResult = null;
    lastRenderedIndex = -1;
  }

  // Export refresh function for parent to trigger
  export function refresh() {
    console.log('[ChatScreen] refresh() called');
    hydrateMessages(true);
  }
</script>

<div class="flex flex-col h-full">
  <!-- Chat messages area -->
  <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
    <!-- First message display -->
    {#if firstMessage && editorState.selectedBot}
      <div class="flex justify-start">
        <div class="max-w-[80%] rounded-lg px-4 py-2 bg-white text-gray-800 border border-gray-200">
          <div class="text-xs opacity-70 mb-1">
            {editorState.botName || 'Assistant'}
            {#if firstMessageLoading}
              <span class="ml-1 text-blue-500">⏳</span>
            {/if}
          </div>
          <div class="whitespace-pre-wrap text-sm">
            {firstMessage}
          </div>
        </div>
      </div>
    {/if}

    {#if messages.length === 0}
      <div class="text-center text-gray-500 py-8">
        메시지를 입력하여 대화를 시작하세요!
      </div>
    {/if}

    {#each messages as message, i (i)}
      <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] rounded-lg px-4 py-2 {
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }">
          <div class="text-xs opacity-70 mb-1">
            {message.role === 'user' ? (editorState.userName || 'User') : (editorState.botName || 'Assistant')}
          </div>
          <div class="whitespace-pre-wrap text-sm">
            {message.displayText ?? message.data}
          </div>
          {#if message.time}
            <div class="text-xs opacity-50 mt-1">
              {new Date(message.time).toLocaleTimeString()}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Message input area -->
  <div class="border-t border-gray-200 p-4 bg-white">
    <!-- Bot selection warning -->
    {#if !editorState.selectedBot}
      <div class="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div class="text-sm text-yellow-800">
          ⚠️ 봇이 선택되지 않았습니다. <strong>BotSettings 탭</strong>에서 봇을 선택한 후 채팅을 시작하세요.
        </div>
      </div>
    {/if}

    <!-- Role selector -->
    <div class="flex items-center gap-2 mb-3">
      <span class="text-sm font-medium text-gray-700">역할:</span>
      <div class="flex gap-1">
        <button
          onclick={() => selectedRole = 'user'}
          class="px-3 py-1 rounded text-sm font-medium transition-colors {
            selectedRole === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }"
        >
          User
        </button>
        <button
          onclick={() => selectedRole = 'char'}
          class="px-3 py-1 rounded text-sm font-medium transition-colors {
            selectedRole === 'char'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }"
        >
          AI 응답
        </button>
      </div>
    </div>

    <!-- Message input -->
    <div class="flex gap-2">
      <textarea
        bind:value={messageInput}
        onkeydown={handleKeydown}
        placeholder="{!editorState.selectedBot ? '먼저 봇을 선택하세요' : '사용자 메시지 혹은 AI 응답을 입력하세요'}"
        class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none resize-none"
        rows="2"
        disabled={isProcessing || !editorState.selectedBot}
      ></textarea>

      <div class="flex flex-col gap-2">
        <button
          onclick={sendMessage}
          disabled={!messageInput.trim() || isProcessing || !editorState.selectedBot}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {#if isProcessing}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {:else}
            전송
          {/if}
        </button>

        <button
          onclick={clearMessages}
          class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium transition-colors hover:bg-red-600"
        >
          Clear
        </button>
      </div>
    </div>
    <div class="text-xs text-gray-500 my-[5px]">💡 Enter로 전송, Shift+Enter로 줄바꿈</div>

    <!-- Debug info -->
    {#if lastParseResult}
      <details class="mt-3">
        <summary class="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
          마지막 파싱 결과 보기
        </summary>
        <div class="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
          <div><strong>원본 입력:</strong> {lastParseResult.originalInput}</div>
          <div><strong>처리된 입력:</strong> {lastParseResult.processedInput}</div>
          <div><strong>AI 응답:</strong> {lastParseResult.aiResponse}</div>
          <div><strong>처리된 응답:</strong> {lastParseResult.processedResponse}</div>
          <div><strong>실행된 트리거:</strong> {lastParseResult.triggersExecuted.join(', ')}</div>
        </div>
      </details>
    {/if}
  </div>
</div>