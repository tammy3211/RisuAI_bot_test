<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { editorState } from '../shared/editorState.svelte';
  import Modal from '../UI/Modal.svelte';
  import RisuAIoriginScreen from './RisuAIoriginScreen.svelte';
  import {
    simulateUserInputFlow,
    simulateAIResponseFlow,
    processDisplay,
    getCurrentChatData,
    clearCurrentChatMessages,
    updateMessage,
    deleteMessage,
    loadChatFromLocalStorage
  } from '../../ts/ChatParser';
  import type { Message } from '../../ts/mockDatabase';
  import { loadSelectedBotData } from '../shared/botLoader.svelte';

  // Chat state
  type DisplayMessage = Message & { displayText: string };
  let messages = $state<DisplayMessage[]>([]);
  let messageInput = $state('');
  let isProcessing = $state(false);
  let selectedRole = $state<'user' | 'char'>('user');
  let lastRenderedIndex = -1;
  let firstMessage = $state('');
  let firstMessageLoading = $state(false);
  
  // Edit/Delete state
  let editingIndex = $state<number | null>(null);
  let editingText = $state('');
  let showClearConfirm = $state(false);
  
  // Expand/Collapse state
  let isExpanded = $state(false);

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

  // ChatTab에서 호출할 수 있는 메서드
  export function loadFromStorage() {
    console.log('[ChatScreen] loadFromStorage called');
    
    // localStorage에서 로드 시도
    const loaded = loadChatFromLocalStorage();
    if (loaded) {
      console.log('[ChatScreen] Chat restored from localStorage');
      // 로드 성공 시 메시지 표시
      hydrateMessages(false).catch((error) => {
        console.error('[ChatScreen] Failed to hydrate restored messages:', error);
      });
    } else {
      console.log('[ChatScreen] No saved chat to restore, showing first message');
      // 로드 실패 시 첫 메시지만 표시
      hydrateMessages(true).catch((error) => {
        console.error('[ChatScreen] Failed to hydrate first message:', error);
      });
    }
  }

  $effect(() => {
    const bot = editorState.selectedBot;
    
    // 봇이 변경되었을 때만 초기화
    if (bot !== currentBotName && currentBotName !== null) {
      currentBotName = bot;
      
      if (!bot) {
        messages = [];
        lastRenderedIndex = -1;
        firstMessage = '';
        firstMessageLoading = false;
      } else {
        // 봇 변경 시 초기화
        hydrateMessages(true).catch((error) => {
          console.error('[ChatScreen] Failed to hydrate messages:', error);
        });
      }
    } else if (currentBotName === null && bot) {
      currentBotName = bot;
    }
  });

  onMount(() => {
    // HMR 이벤트 리스너: 파일 변경 시 봇 데이터 리로드 후 화면 갱신
    if (import.meta.hot) {
      const handleBotsUpdated = async (payload: any) => {
        console.log('🤖 [ChatScreen HMR] Bot data updated, reloading...', payload.data.path);
        
        // 현재 선택된 봇이 있으면 데이터 리로드
        if (editorState.botSource === 'saved' && editorState.selectedBot) {
          // 봇 데이터 리로드
          await loadSelectedBotData();
          
          // 화면 강제 갱신 (첫 메시지 포함)
          await hydrateMessages(true);
          
          console.log('✅ [ChatScreen HMR] Screen refreshed with new data');
        }
      };

      import.meta.hot.on('bots-updated', handleBotsUpdated);

      onDestroy(() => {
        import.meta.hot?.off('bots-updated', handleBotsUpdated);
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
        await simulateUserInputFlow(inputText);
        await hydrateMessages();

      } else {
        // Assistant message flow - AI 응답으로 처리
        await simulateAIResponseFlow(inputText);
        await hydrateMessages();
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
    showClearConfirm = true;
  }

  function confirmClear() {
    clearCurrentChatMessages();
    messages = [];
    lastRenderedIndex = -1;
    showClearConfirm = false;
  }

  function cancelClear() {
    showClearConfirm = false;
  }

  // Edit message
  function startEdit(index: number) {
    editingIndex = index;
    editingText = messages[index].data;
  }

  function cancelEdit() {
    editingIndex = null;
    editingText = '';
  }

  async function saveEdit() {
    if (editingIndex === null || !editingText.trim()) return;

    try {
      await updateMessage(editingIndex, editingText.trim());
      await hydrateMessages(true);
      editingIndex = null;
      editingText = '';
    } catch (error) {
      console.error('[ChatScreen] Failed to update message:', error);
    }
  }

  // Delete message
  async function executeDelete(index: number) {
    try {
      deleteMessage(index);
      await hydrateMessages(true);
      if (editingIndex === index) {
        editingIndex = null;
        editingText = '';
      }
    } catch (error) {
      console.error('[ChatScreen] Failed to delete message:', error);
    }
  }

  // Export refresh function for parent to trigger
  export function refresh() {
    hydrateMessages(true);
  }
</script>

{#if isExpanded}
  <!-- Expanded View (RisuAI Original Screen) -->
  <div class="fixed inset-0 z-50">
    <RisuAIoriginScreen 
      onCollapse={() => isExpanded = false}
      onRefresh={() => hydrateMessages(true)}
    />
  </div>
{:else}
  <!-- Normal View -->
  <div class="flex flex-col h-full relative">
    <!-- Expand button (top-right) -->
     
    <button
      onclick={() => isExpanded = true}
      class="group absolute top-4 right-4 z-10 rounded-lg bg-blue-500 bg-opacity-50 p-2 shadow-md transition-all hover:bg-blue-450 hover:bg-opacity-80 hover:shadow-lg"
      title="확장"
      disabled={!editorState.selectedBot}
    >
      <svg 
        class="h-5 w-5 opacity-60 transition-opacity group-hover:opacity-100" 
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
      </svg>
    </button>
    
    <!-- Chat messages area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 rounded-lg">
    <!-- First message display -->
    {#if firstMessage && editorState.selectedBot}
      <div class="flex justify-start">
        <div class="max-w-[80%] rounded-2xl rounded-tl-sm bg-white text-gray-800 border border-gray-200 px-4 py-2 shadow-sm">
          <div class="mb-1 flex items-center gap-1 text-xs font-semibold opacity-70">
            <span>🤖 {editorState.botName || 'Assistant'}</span>
            <span class="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">첫 메시지</span>
            {#if firstMessageLoading}
              <span class="ml-1 text-blue-500">⏳</span>
            {/if}
          </div>
          <div class="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {firstMessage}
          </div>
        </div>
      </div>
    {/if}

    {#if messages.length === 0}
      <div class="flex items-center justify-center text-gray-400 py-[30px]">
        <div class="text-center">
          <div>메시지를 입력하여 대화를 시작하세요!</div>
        </div>
      </div>
    {/if}

    {#each messages as message, i (i)}
      <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] rounded-2xl {
          message.role === 'user'
            ? 'rounded-tr-sm bg-blue-500 text-white'
            : 'rounded-tl-sm bg-white text-gray-800 border border-gray-200'
        } px-4 py-2 shadow-sm">
          {#if editingIndex === i}
            <!-- 편집 모드 -->
            <div class="flex flex-col gap-2">
              <textarea
                bind:value={editingText}
                class="min-h-[60px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                onkeydown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  } else if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
              ></textarea>
              <div class="flex gap-2">
                <button
                  class="flex-1 rounded-md bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
                  onclick={saveEdit}
                >
                  ✓ 저장
                </button>
                <button
                  class="flex-1 rounded-md bg-gray-400 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-500"
                  onclick={cancelEdit}
                >
                  × 취소
                </button>
                <button
                  class="rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 flex items-center justify-center"
                  onclick={() => {
                    executeDelete(i);
                    cancelEdit();
                  }}
                  title="삭제"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          {:else}
            <!-- 일반 모드 -->
            <div class="group relative">
              <div class="mb-1 flex items-center gap-1 text-xs font-semibold opacity-70">
                <span>{message.role === 'user' ? '👤 ' + (editorState.userName || 'User') : '🤖 ' + (editorState.botName || 'Assistant')}</span>
                <button
                  class="ml-1 rounded p-0.5 text-xs opacity-0 transition-all group-hover:opacity-100"
                  onclick={() => startEdit(i)}
                  title="수정"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
              <div class="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.displayText ?? message.data}
              </div>
              {#if message.time}
                <div class="text-xs opacity-50 mt-1">
                  {new Date(message.time).toLocaleTimeString()}
                </div>
              {/if}
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
          ⚠️ 봇이 선택되지 않았습니다. <strong>봇 목록</strong>에서 봇을 선택한 후 채팅을 시작하세요.
        </div>
      </div>
    {/if}

    <!-- Message input -->
    <div class="flex flex-col gap-2 rounded-lg border-2 border-gray-300 bg-white p-3 shadow-sm">
      <div class="flex gap-2">
        <select
          bind:value={selectedRole}
          class="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-all focus:border-blue-500 focus:outline-none"
          disabled={isProcessing || !editorState.selectedBot}
        >
          <option value="user">👤 User</option>
          <option value="char">🤖 AI 응답</option>
        </select>
        <button
          onclick={sendMessage}
          disabled={!messageInput.trim() || isProcessing || !editorState.selectedBot}
          class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isProcessing}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {:else}
            ➤ 전송
          {/if}
        </button>
        <button
          onclick={clearMessages}
          class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
        >
          Clear
        </button>
      </div>
      
      <textarea
        bind:value={messageInput}
        onkeydown={handleKeydown}
        placeholder="{!editorState.selectedBot ? '먼저 봇을 선택하세요' : '메시지를 입력하세요...'}"
        class="min-h-[80px] w-full resize-y rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none"
        disabled={isProcessing || !editorState.selectedBot}
      ></textarea>
      
      <div class="text-xs text-gray-500">💡 Enter로 전송, Shift+Enter로 줄바꿈</div>
    </div>
  </div>
  </div>
{/if}

<!-- Clear Confirmation Modal -->
<Modal
  alertMode={true}
  isOpen={showClearConfirm}
  title="채팅 초기화"
  alertMessage="초기화를 선택하면 모든 메시지를 삭제합니다. 계속하시겠습니까?"
  alertType="warning"
  showCancel={true}
  confirmLabel="초기화"
  cancelLabel="취소"
  onConfirm={confirmClear}
  onCancel={cancelClear}
  onClose={cancelClear}
/>