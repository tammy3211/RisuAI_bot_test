<script lang="ts">
  import { editorState } from '../shared/editorState.svelte';
  import BackgroundDom from '../../../src/lib/ChatScreens/BackgroundDom.svelte';
  import { getCurrentChatData, updateMessage, deleteMessage, simulateUserInputFlow, simulateAIResponseFlow } from '../../ts/ChatParser';

  interface Props {
    onCollapse: () => void;
    onRefresh?: () => void;
  }

  let { onCollapse, onRefresh }: Props = $props();

  // Settings for Classic theme
  let classicMaxWidth = $state(true);
  let bgImg = $state('');
  
  // Chat data
  let chatData = $derived(getCurrentChatData());
  let messages = $derived(chatData?.messages ?? []);
  let rawFirstMessage = $derived(chatData?.firstMessage ?? '');
  let currentCharacter = $derived(chatData?.character ?? null);
  
  // Load state
  let loadPages = $state(30);
  
  // Edit/Delete state
  let editingIndices = $state<Set<number>>(new Set());
  let editingTexts = $state<Map<number, string>>(new Map());
  
  // Input state
  let messageInput = $state('');
  let selectedRole = $state<'user' | 'char'>('user');
  let isProcessing = $state(false);
  let inputHeight = $state('44px');
  let inputEle: HTMLTextAreaElement | null = $state(null);
  
  // First message rendering
  let renderedFirstMessage = $state('');
  let firstMessageLoading = $state(false);
  
  // Rendered messages
  let renderedMessages = $state<Array<{
    original: any;
    html: string;
    role: string;
    idx: number;
  }>>([]);

  let visibleMessages = $derived.by(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const start = Math.max(0, messages.length - loadPages);
    return messages.slice(start).map((msg, idx) => ({
      ...msg,
      idx: start + idx
    }));
  });

  // Render first message
  $effect(() => {
    console.log('[RisuAIoriginScreen] rawFirstMessage:', rawFirstMessage);
    console.log('[RisuAIoriginScreen] currentCharacter:', currentCharacter);
    
    if (!rawFirstMessage || rawFirstMessage.trim() === '') {
      renderedFirstMessage = '';
      firstMessageLoading = false;
      return;
    }

    firstMessageLoading = true;
    (async () => {
      try {
        const { ParseMarkdown } = await import('../../../src/ts/parser.svelte');
        const html = await ParseMarkdown(rawFirstMessage, currentCharacter, 'normal', -1, {
          firstmsg: true,
          chatRole: 'char',
        });
        renderedFirstMessage = html;
        console.log('[RisuAIoriginScreen] Rendered first message:', html);
      } catch (error) {
        console.error('[RisuAIoriginScreen] Failed to render first message:', error);
        renderedFirstMessage = rawFirstMessage;
      } finally {
        firstMessageLoading = false;
      }
    })();
  });

  // Render messages
  $effect(() => {
    if (!visibleMessages || visibleMessages.length === 0) {
      renderedMessages = [];
      return;
    }

    console.log('[RisuAIoriginScreen] Rendering', visibleMessages.length, 'messages');

    (async () => {
      const { ParseMarkdown } = await import('../../../src/ts/parser.svelte');
      const rendered = [];
      
      for (const msg of visibleMessages) {
        try {
          const html = await ParseMarkdown(msg.data ?? '', currentCharacter, 'normal', msg.idx, {
            firstmsg: false,
            chatRole: msg.role,
          });

          rendered.push({
            original: msg,
            html: html,
            role: msg.role ?? 'char',
            idx: msg.idx
          });
        } catch (error) {
          console.error('[RisuAIoriginScreen] Render error:', error);
          rendered.push({
            original: msg,
            html: msg.data ?? '',
            role: msg.role ?? 'char',
            idx: msg.idx
          });
        }
      }
      renderedMessages = rendered;
      console.log('[RisuAIoriginScreen] Rendered messages:', rendered);
    })();
  });

  // Sync backgroundHTML to DBState
  let DBStateLoaded = $state(false);
  let backgroundHTMLSynced = $state(false);
  
  $effect(() => {
    // getCurrentCharacter에서 backgroundHTML 가져오기
    const character = chatData?.character;
    const backgroundHTML = character?.backgroundHTML || '';
    
    console.log('[RisuAIoriginScreen] Character:', character);
    console.log('[RisuAIoriginScreen] backgroundHTML from character:', backgroundHTML);
    
    if (!DBStateLoaded) {
      import('../../../src/ts/stores.svelte').then(({ DBState, selectedCharID, selIdState }) => {
        DBStateLoaded = true;
        console.log('[RisuAIoriginScreen] DBState loaded');
        console.log('[RisuAIoriginScreen] selectedCharID:', selectedCharID);
        console.log('[RisuAIoriginScreen] selIdState:', selIdState);
        console.log('[RisuAIoriginScreen] DBState.db.characters:', DBState.db?.characters);
        
        if (DBState.db?.characters?.[0] && backgroundHTML) {
          DBState.db.characters[0].backgroundHTML = backgroundHTML;
          backgroundHTMLSynced = true;
          console.log('[RisuAIoriginScreen] Initial sync of backgroundHTML to DBState:', backgroundHTML);
        }
      }).catch(err => {
        console.error('[RisuAIoriginScreen] Failed to load DBState:', err);
      });
    } else if (backgroundHTML && !backgroundHTMLSynced) {
      import('../../../src/ts/stores.svelte').then(({ DBState }) => {
        if (DBState.db?.characters?.[0]) {
          DBState.db.characters[0].backgroundHTML = backgroundHTML;
          backgroundHTMLSynced = true;
          console.log('[RisuAIoriginScreen] Synced backgroundHTML to DBState:', backgroundHTML);
        }
      }).catch(err => {
        console.error('[RisuAIoriginScreen] Failed to sync backgroundHTML:', err);
      });
    }
  });

  function onScroll(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    
    const scrolled = target.scrollHeight - target.clientHeight + target.scrollTop;
    if (scrolled < 100 && messages.length > loadPages) {
      loadPages += 15;
    }
  }
  
  // Edit message functions
  function startEdit(index: number) {
    const allMessages = chatData?.messages ?? [];
    if (index < 0 || index >= allMessages.length) {
      console.error('[RisuAIoriginScreen] Invalid message index:', index);
      return;
    }
    editingIndices.add(index);
    editingIndices = new Set(editingIndices); // trigger reactivity with new Set
    editingTexts.set(index, allMessages[index].data);
    editingTexts = new Map(editingTexts); // trigger reactivity with new Map
  }

  function cancelEdit(index: number) {
    editingIndices.delete(index);
    editingIndices = new Set(editingIndices); // trigger reactivity with new Set
    editingTexts.delete(index);
    editingTexts = new Map(editingTexts); // trigger reactivity with new Map
  }

  async function saveEdit(index: number) {
    const text = editingTexts.get(index);
    if (!text || !text.trim()) return;

    try {
      await updateMessage(index, text.trim());
      // Remove from editing state
      editingIndices.delete(index);
      editingIndices = new Set(editingIndices); // trigger reactivity with new Set
      editingTexts.delete(index);
      editingTexts = new Map(editingTexts); // trigger reactivity with new Map
      
      // Notify parent ChatScreen to refresh
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('[RisuAIoriginScreen] Failed to update message:', error);
    }
  }

  // Delete message function
  async function executeDelete(index: number) {
    try {
      deleteMessage(index);
      // Remove from editing state if it was being edited
      if (editingIndices.has(index)) {
        editingIndices.delete(index);
        editingIndices = new Set(editingIndices); // trigger reactivity with new Set
        editingTexts.delete(index);
        editingTexts = new Map(editingTexts); // trigger reactivity with new Map
      }
      
      // Notify parent ChatScreen to refresh
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('[RisuAIoriginScreen] Failed to delete message:', error);
    }
  }
  
  // Send message function
  async function send() {
    if (!messageInput.trim() || isProcessing) return;
    
    isProcessing = true;
    const inputText = messageInput.trim();
    messageInput = '';
    updateInputSize();
    
    try {
      if (selectedRole === 'user') {
        await simulateUserInputFlow(inputText);
      } else {
        await simulateAIResponseFlow(inputText);
      }
      
      // Notify parent to refresh
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('[RisuAIoriginScreen] Failed to send message:', error);
    } finally {
      isProcessing = false;
    }
  }
  
  // Update input height
  function updateInputSize() {
    if (inputEle) {
      inputEle.style.height = '0';
      inputHeight = `${inputEle.scrollHeight}px`;
      inputEle.style.height = inputHeight;
    }
  }
  
  $effect(() => {
    updateInputSize();
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onCollapse();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Full screen overlay with classic RisuAI theme structure -->
<main class="flex bg-bgcolor w-full h-full max-w-100vw text-textcolor fixed inset-0 z-50 flex-col">
  <!-- Header with collapse button -->
  <div class="flex items-center justify-between border-b border-selected bg-darkbg px-4 py-3 relative z-20">
    <h2 class="text-lg font-semibold text-textcolor">RisuAI Preview Screen</h2>
    <button
      onclick={onCollapse}
      class="group rounded-lg bg-darkbutton p-2 text-textcolor transition-colors hover:bg-selected"
      title="Close"
      aria-label="Close"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>

  <!-- Classic Theme Container -->
  <div class="flex-1 min-w-0 relative justify-center flex overflow-hidden">
    <!-- backgroundDOM -->
    <div class="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
      <BackgroundDom />
    </div>
    
    <!-- Content layer -->
    <div 
      style={bgImg} 
      class="h-full w-full {classicMaxWidth ? 'max-w-6xl' : ''} relative z-10 flex flex-col"
    >
      <!-- Chat messages area (scrollable) -->
      <div class="flex-1 overflow-y-auto relative default-chat-screen" onscroll={onScroll}>
        <div class="flex flex-col-reverse risu-chat">
          <!-- Input Area (inside chat container, at bottom) -->
          <div class="mt-2 mb-2 flex items-stretch w-full flex-shrink-0">
            <!-- Role selector -->
            <select
              bind:value={selectedRole}
              class="ml-4 mr-2 rounded-md border border-darkborderc bg-darkbutton text-textcolor px-3 py-2 text-sm font-semibold transition-all focus:border-textcolor focus:outline-none"
              style:height={inputHeight}
              disabled={isProcessing}
            >
              <option value="user">👤 User</option>
              <option value="char">🤖 AI</option>
            </select>
            
            <textarea 
              bind:value={messageInput}
              bind:this={inputEle}
              class="peer text-input-area focus:border-textcolor transition-colors outline-none text-textcolor p-2 min-w-0 border border-r-0 bg-transparent rounded-md rounded-r-none input-text text-xl flex-grow border-darkborderc resize-none overflow-y-hidden overflow-x-hidden max-w-full"
              placeholder={isProcessing ? 'Processing...' : 'Type a message...'}
              disabled={isProcessing}
              style:height={inputHeight}
              onkeydown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                  send();
                  e.preventDefault();
                }
              }}
              oninput={() => updateInputSize()}
            ></textarea>
            
            {#if isProcessing}
              <button
                class="flex justify-center border-y border-darkborderc items-center text-gray-100 p-3 peer-focus:border-textcolor transition-colors"
                style:height={inputHeight}
                disabled
              >
                <div class="loadmove chat-process-stage-1"></div>
              </button>
            {:else}
              <button
                onclick={send}
                class="flex justify-center border-y border-darkborderc items-center text-gray-100 p-3 peer-focus:border-textcolor hover:bg-blue-500 transition-colors button-icon-send"
                style:height={inputHeight}
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(90deg);">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            {/if}
            
            <button
              class="peer-focus:border-textcolor mr-2 flex border-y border-r border-darkborderc justify-center items-center text-gray-100 p-3 rounded-r-md hover:bg-blue-500 transition-colors"
              style:height={inputHeight}
              disabled
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
          {#if renderedMessages.length > 0}
            {#each [...renderedMessages].reverse() as msg (msg.original.chatId ?? `${msg.idx}-${msg.original.time ?? msg.idx}`)}
              <div class="chat-message-container risu-chat px-4">
                <div class="text-textcolor mt-1 ml-4 mr-4 mb-1 p-2 bg-transparent flex-grow border-transparent flex items-start max-w-full">
                  <!-- RISUICON: Avatar -->
                  <div class="flex-shrink-0 shadow-lg bg-textcolor2 rounded-md flex items-center justify-center text-textcolor" 
                       style="height: 3.5rem; width: 3.5rem; min-width: 3.5rem;">
                    {#if msg.role === 'user'}
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    {:else}
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3z"/>
                      </svg>
                    {/if}
                  </div>
                  
                  <!-- Message content section -->
                  <span class="flex flex-col ml-4 w-full max-w-full min-w-0">
                    {#if editingIndices.has(msg.idx)}
                      <!-- 편집 모드 -->
                      <div class="flex flex-col gap-2 w-full">
                        <div class="flex items-center justify-between chat-width mb-2">
                          <span class="text-xl text-textcolor">
                            {msg.role === 'user' ? (editorState.userName || 'User') : (editorState.botName || 'Assistant')}
                          </span>
                        </div>
                        
                        <textarea
                          value={editingTexts.get(msg.idx) || ''}
                          oninput={(e) => {
                            const target = e.currentTarget as HTMLTextAreaElement;
                            editingTexts.set(msg.idx, target.value);
                            editingTexts = editingTexts; // trigger reactivity
                          }}
                          class="message-edit-area flex-grow h-96 overflow-y-auto bg-darkbutton text-textcolor p-3 mb-2 resize-none rounded-md border border-darkborderc focus:border-textcolor transition-colors outline-none"
                          onkeydown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              e.preventDefault();
                              saveEdit(msg.idx);
                            }
                          }}
                        ></textarea>
                        
                        <div class="flex gap-2">
                          <button
                            class="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                            onclick={() => saveEdit(msg.idx)}
                          >
                            ✓ 저장 (Ctrl+Enter)
                          </button>
                          <button
                            class="flex-1 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                            onclick={() => cancelEdit(msg.idx)}
                          >
                            × 취소
                          </button>
                          <button
                            class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                            onclick={() => {
                              executeDelete(msg.idx);
                              cancelEdit(msg.idx);
                            }}
                            title="삭제"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    {:else}
                      <!-- 일반 모드 -->
                      <div class="flex items-center justify-between chat-width">
                        <!-- Name -->
                        <span class="text-xl text-textcolor">
                          {msg.role === 'user' ? (editorState.userName || 'User') : (editorState.botName || 'Assistant')}
                        </span>
                        
                        <!-- RISUBUTTONS: Edit and Delete buttons -->
                        <div class="flex items-center justify-end text-textcolor2">
                          <button 
                            class="ml-2 hover:text-blue-500 transition-colors button-icon-edit" 
                            onclick={() => startEdit(msg.idx)}
                            title="Edit"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button 
                            class="ml-2 hover:text-red-500 transition-colors button-icon-remove" 
                            onclick={() => executeDelete(msg.idx)}
                            title="Delete"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <!-- RISUTEXTBOX: Message content -->
                      <span class="text chat-width chattext prose minw-0 prose-invert mt-2">
                        {@html msg.html}
                      </span>
                    {/if}
                  </span>
                </div>
              </div>
            {/each}
          {/if}

          <!-- First Message -->
          {#if messages.length <= loadPages && rawFirstMessage}
            <div class="chat-message-container risu-chat px-4">
              <div class="text-textcolor mt-1 ml-4 mr-4 mb-1 p-2 bg-transparent flex-grow border-transparent flex items-start max-w-full">
                <!-- RISUICON: Bot Avatar -->
                <div class="flex-shrink-0 shadow-lg bg-textcolor2 rounded-md flex items-center justify-center text-textcolor" 
                     style="height: 3.5rem; width: 3.5rem; min-width: 3.5rem;">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3z"/>
                  </svg>
                </div>
                
                <!-- First Message content -->
                <span class="flex flex-col ml-4 w-full max-w-full min-w-0">
                  <div class="flex items-center justify-between chat-width">
                    <span class="text-xl text-textcolor">
                      {editorState.botName || 'Assistant'}
                    </span>
                  </div>
                  
                  <!-- RISUTEXTBOX: First message -->
                  {#if firstMessageLoading}
                    <div class="text-textcolor2 italic mt-2">Loading first message...</div>
                  {:else}
                    <span class="text chat-width chattext prose minw-0 prose-invert mt-2">
                      {@html renderedFirstMessage}
                    </span>
                  {/if}
                </span>
              </div>
            </div>
          {/if}
          
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .default-chat-screen {
    scrollbar-width: thin;
    scrollbar-color: var(--risu-theme-borderc) transparent;
  }

  .default-chat-screen::-webkit-scrollbar {
    width: 8px;
  }

  .default-chat-screen::-webkit-scrollbar-track {
    background: transparent;
  }

  .default-chat-screen::-webkit-scrollbar-thumb {
    background-color: var(--risu-theme-borderc);
    border-radius: 4px;
  }

  /* Chat process loading stages */
  .chat-process-stage-1 {
    border-top: 0.4rem solid #60a5fa;
    border-left: 0.4rem solid #60a5fa;
  }

  .chat-process-stage-2 {
    border-top: 0.4rem solid #db2777;
    border-left: 0.4rem solid #db2777;
  }

  .chat-process-stage-3 {
    border-top: 0.4rem solid #34d399;
    border-left: 0.4rem solid #34d399;
  }

  .chat-process-stage-4 {
    border-top: 0.4rem solid #8b5cf6;
    border-left: 0.4rem solid #8b5cf6;
  }

  .autoload {
    border-top: 0.4rem solid #10b981;
    border-left: 0.4rem solid #10b981;
  }
  
  /* Loading animation */
  .loadmove {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 0.4rem solid transparent;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>


