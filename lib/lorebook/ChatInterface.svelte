<script lang="ts">
  import { processRegexScripts } from '../../ts/regexProcessor';

  interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isFirstMessage?: boolean;
  }

  interface Props {
    onMessagesChange: (messages: Message[]) => void;
    firstMessage?: string;
    regexScripts?: Array<{ comment: string; in: string; out: string; type: string; flag?: string; ableFlag?: boolean }>;
  }

  let { onMessagesChange, firstMessage = 'Hello!', regexScripts = [] }: Props = $props();

  // 정규식 처리된 메시지 내용을 캐시
  let processedContents = $state<Map<string, string>>(new Map());
  
  // regexScripts가 변경되면 캐시 무효화
  let lastRegexScriptsCount = $state(regexScripts.length);
  $effect(() => {
    if (regexScripts.length !== lastRegexScriptsCount) {
      console.log('[ChatInterface] regexScripts changed, clearing cache');
      lastRegexScriptsCount = regexScripts.length;
      processedContents = new Map();
    }
  });

  // props 변경 추적
  $effect(() => {
    console.log('[ChatInterface] Props updated:', {
      firstMessage: firstMessage.substring(0, 50),
      regexScriptsCount: regexScripts.length
    });
  });

  // 초기 메시지 (first_mes는 항상 맨 위)
  let messages = $state<Message[]>([
    { id: 'first-message', role: 'assistant', content: firstMessage, isFirstMessage: true },
    { id: crypto.randomUUID(), role: 'user', content: '세계관에 대해 알려줘.' },
    { id: crypto.randomUUID(), role: 'assistant', content: '나이트 시티는 어떻습니까?' },
    { id: crypto.randomUUID(), role: 'user', content: '주인공의 과거가 궁금해.' }
  ]);

  let newMessageRole = $state<'user' | 'assistant'>('user');
  let newMessageContent = $state('');
  let editingId = $state<string | null>(null);
  let editingContent = $state('');
  let initialized = $state(false);

  // firstMessage가 변경되면 첫 메시지 업데이트
  $effect(() => {
    const firstMsg = messages.find(m => m.isFirstMessage);
    if (firstMsg && firstMsg.content !== firstMessage) {
      console.log('[ChatInterface] firstMessage changed, updating from:', firstMsg.content.substring(0, 30), 'to:', firstMessage.substring(0, 30));
      messages = messages.map(m => 
        m.isFirstMessage ? { ...m, content: firstMessage } : m
      );
    }
  });

  // 초기 메시지 전달 (한 번만)
  $effect(() => {
    if (!initialized) {
      initialized = true;
      notifyChange();
    }
  });

  function addMessage() {
    if (!newMessageContent.trim()) return;

    const message: Message = {
      id: crypto.randomUUID(),
      role: newMessageRole,
      content: newMessageContent.trim()
    };

    messages = [...messages, message];
    newMessageContent = '';
    notifyChange();
  }

  function deleteMessage(id: string) {
    // first message는 삭제 불가
    messages = messages.filter(m => m.id !== id && !m.isFirstMessage);
    notifyChange();
  }

  function startEdit(message: Message) {
    // first message는 수정 불가
    if (message.isFirstMessage) return;
    editingId = message.id;
    editingContent = message.content;
  }

  function cancelEdit() {
    editingId = null;
    editingContent = '';
  }

  function saveEdit() {
    if (editingId && editingContent.trim()) {
      messages = messages.map(m =>
        m.id === editingId ? { ...m, content: editingContent.trim() } : m
      );
      editingId = null;
      editingContent = '';
      notifyChange();
    }
  }

  function notifyChange() {
    onMessagesChange(messages);
  }

  // 메시지 내용에 정규식 적용
  async function getProcessedContent(message: Message): Promise<string> {
    const cacheKey = `${message.id}-${message.content}`;
    
    // 캐시에 있으면 반환
    if (processedContents.has(cacheKey)) {
      return processedContents.get(cacheKey)!;
    }

    // editprocess 정규식 적용
    try {
      const processed = await processRegexScripts(regexScripts, message.content, 'editprocess');
      processedContents.set(cacheKey, processed);
      return processed;
    } catch (error) {
      console.error('[ChatInterface] Failed to process regex:', error);
      return message.content;
    }
  }

  // 정규식이 변경되면 캐시 초기화
  $effect(() => {
    regexScripts;
    processedContents.clear();
  });
</script>

<div class="flex h-full flex-col gap-3">
  <!-- 메시지 목록 -->
  <div class="flex-1 overflow-y-auto rounded-lg border-2 border-gray-300 bg-gray-50 p-4">
    {#if messages.length === 0}
      <div class="flex h-full items-center justify-center text-gray-400">
        <div class="text-center">
          <div class="mb-2 text-4xl">💬</div>
          <div>메시지를 추가하세요</div>
        </div>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each messages as message}
          <div
            class={message.role === 'user'
              ? 'flex justify-end'
              : 'flex justify-start'}
          >
            <div
              class={message.role === 'user'
                ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-500 px-4 py-2 text-white shadow-sm'
                : 'max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-gray-800 shadow-sm border border-gray-200'}
            >
              {#if editingId === message.id}
                <!-- 편집 모드 -->
                <div class="flex flex-col gap-2">
                  <textarea
                    bind:value={editingContent}
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
                      class="rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                      onclick={() => {
                        deleteMessage(message.id);
                        cancelEdit();
                      }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              {:else}
                <!-- 일반 모드 -->
                <div class="group relative">
                  <div class="mb-1 flex items-center gap-1 text-xs font-semibold opacity-70">
                    <span>{message.role === 'user' ? '👤 User' : '🤖 Assistant'}</span>
                    {#if message.isFirstMessage}
                      <span class="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">첫 메시지</span>
                    {:else}
                      <button
                        class="ml-1 rounded p-0.5 text-xs opacity-0 transition-all group-hover:opacity-100"
                        onclick={() => startEdit(message)}
                        title="수정"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                    {/if}
                  </div>
                  <div class="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {#await getProcessedContent(message)}
                      {message.content}
                    {:then processed}
                      {processed}
                    {:catch}
                      {message.content}
                    {/await}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- 새 메시지 입력 -->
  <div class="flex flex-col gap-2 rounded-lg border border-gray-300 bg-white p-3 shadow-sm">
    <div class="flex gap-2">
      <select
        bind:value={newMessageRole}
        class="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-all focus:border-blue-500 focus:outline-none"
      >
        <option value="user">👤 User</option>
        <option value="assistant">🤖 Assistant</option>
      </select>
      <button
        class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={addMessage}
        disabled={!newMessageContent.trim()}
      >
        ➤ 전송
      </button>
    </div>
    <textarea
      bind:value={newMessageContent}
      placeholder="메시지를 입력하세요..."
      class="min-h-[80px] w-full resize-y rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none"
      onkeydown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          addMessage();
        }
      }}
    ></textarea>
    <div class="text-xs text-gray-500">
      💡 Enter로 전송, Shift+Enter로 줄바꿈
    </div>
  </div>
</div>
