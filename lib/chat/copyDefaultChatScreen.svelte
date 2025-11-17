<script lang="ts">
  import { getCurrentChatData } from '../../ts/ChatParser';
  import { editorState } from '../shared/editorState.svelte';

  const READONLY_HINT = '원본 화면 미리보기 모드 (읽기 전용)';

  let messageInput = $state('');
  let messageInputTranslate = $state('');
  let openMenu = $state(false);
  let toggleStickers = $state(false);
  let loadPages = $state(30);
  const MAX_LOAD = 200;

  let chatData = $derived(getCurrentChatData());
  let currentBot = $derived(editorState.currentBot);
  let messages = $derived(chatData?.messages ?? []);

  // 렌더링된 메시지를 저장하는 상태
  let renderedMessages = $state<Array<{
    original: any;
    html: string;
    role: string;
  }>>([]);

  let visibleMessages = $derived.by(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const start = Math.max(0, messages.length - loadPages);
    return messages.slice(start);
  });

  // 메시지가 변경될 때마다 렌더링
  $effect(() => {
    if (!visibleMessages || visibleMessages.length === 0) {
      renderedMessages = [];
      return;
    }

    // 비동기 렌더링
    (async () => {
      const rendered = [];
      for (const msg of visibleMessages) {
        try {
          // ParseMarkdown 동적 import
          const { ParseMarkdown } = await import('../../../src/ts/parser.svelte');
          
          // 메시지 렌더링
          const html = await ParseMarkdown(msg.data ?? '', null, 'normal', -1, {
            firstmsg: false,
            chatRole: msg.role,
          });

          rendered.push({
            original: msg,
            html: html,
            role: msg.role ?? 'char'
          });
        } catch (error) {
          console.error('[copyDefaultChatScreen] Render error:', error);
          rendered.push({
            original: msg,
            html: msg.data ?? '',
            role: msg.role ?? 'char'
          });
        }
      }
      renderedMessages = rendered;
    })();
  });

  function preventAction(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
  }

  function onScroll(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;

    const threshold = target.scrollHeight - target.clientHeight + target.scrollTop;
    if (threshold < 120 && loadPages < MAX_LOAD) {
      loadPages = Math.min(MAX_LOAD, loadPages + 15);
    }
  }
</script>

<div class="default-chat-screen flex h-full w-full flex-col bg-transparent text-textcolor">
  <div
    class="relative flex-1 overflow-y-auto"
    onscroll={onScroll}
    role="region"
    aria-label="RisuAI chat preview"
  >
    <div class="flex h-full flex-col-reverse gap-4 px-4 pb-4 pt-6">
      {#if renderedMessages.length > 0}
        {#each [...renderedMessages].reverse() as msg, idx (msg.original.chatId ?? `${idx}-${msg.original.time ?? idx}`)}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div
              class={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div class="mb-1 text-xs font-semibold opacity-70">
                {msg.role === 'user' ? editorState.username ?? 'You' : currentBot?.data?.name ?? 'Bot'}
              </div>
              <!-- ParseMarkdown로 렌더링된 HTML을 표시 -->
              <div class="whitespace-pre-wrap leading-relaxed chattext prose">
                {@html msg.html}
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="flex h-full items-center justify-center text-center text-textcolor2">
          <div>
            <div class="text-5xl">💬</div>
            <p class="mt-3 text-lg font-semibold">채팅 내역 없음</p>
            <p class="text-sm opacity-80">원본 화면 미리보기에서 첫 메시지를 기다리는 중...</p>
          </div>
        </div>
      {/if}
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bgcolor to-transparent"></div>
  </div>

  <div class="border-t border-darkborderc bg-bgcolor/80 backdrop-blur">
    <div class="flex items-stretch gap-2 px-4 py-3">
      <button
        class={`flex h-12 w-12 items-center justify-center rounded-md border border-darkborderc ${
          toggleStickers ? 'bg-green-500/20 text-green-400' : 'bg-darkbg text-textcolor'
        }`}
        title={READONLY_HINT}
        onclick={() => (toggleStickers = !toggleStickers)}
        type="button"
      >
        😊
      </button>

      <textarea
        class="min-h-[48px] flex-1 resize-none rounded-md border border-darkborderc bg-transparent px-3 py-2 text-lg outline-none"
        bind:value={messageInput}
        disabled
        placeholder={READONLY_HINT}
        title={READONLY_HINT}
      ></textarea>

      <div class="flex items-center gap-1">
        <button class="readonly-btn" title={READONLY_HINT} onclick={preventAction} type="button">
          ➤
        </button>
        <button class="readonly-btn" title={READONLY_HINT} onclick={() => (openMenu = !openMenu)} type="button">
          ☰
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 px-4 pb-3">
      <textarea
        class="flex-1 resize-none rounded-md border border-dashed border-darkborderc/70 bg-transparent px-3 py-2 text-base text-textcolor/80 outline-none"
        bind:value={messageInputTranslate}
        disabled
        placeholder="자동 번역 입력 (읽기 전용)"
        title={READONLY_HINT}
      ></textarea>
      <button class="readonly-btn" title={READONLY_HINT} onclick={preventAction} type="button">
        ↻
      </button>
    </div>
  </div>

  {#if toggleStickers}
    <div class="border-t border-darkborderc bg-darkbg/80 px-4 py-3 text-sm text-textcolor">
      <p class="mb-2 font-semibold">스티커 패널</p>
      <p class="text-textcolor2">읽기 전용 미리보기에서는 스티커를 전송할 수 없습니다.</p>
    </div>
  {/if}

  {#if openMenu}
    <div class="absolute inset-x-0 bottom-24 flex justify-end px-4">
      <div class="w-64 rounded-lg border border-darkborderc bg-darkbg p-4 text-sm shadow-xl">
        <p class="mb-3 font-semibold text-textcolor">메뉴 (읽기 전용)</p>
        <div class="space-y-2 text-textcolor2">
          <button class="readonly-menu" onclick={preventAction}>
            ↩ <span>자동 문장 제안</span>
          </button>
          <button class="readonly-menu" onclick={preventAction}>
            📷 <span>스크린샷</span>
          </button>
          <button class="readonly-menu" onclick={preventAction}>
            ↻ <span>리롤</span>
          </button>
        </div>
        <p class="mt-4 text-xs text-textcolor2">원본 UI를 참고하기 위한 더미 메뉴입니다.</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .readonly-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.375rem;
    border: 1px solid var(--darkborderc, #2d2b38);
    background: var(--darkbg, #15131f);
    color: var(--textcolor, #f5f5ff);
    transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
  }

  .readonly-menu {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    border-radius: 0.5rem;
    border: 1px dashed var(--darkborderc, #2d2b38);
    padding: 0.5rem 0.75rem;
    text-align: left;
    color: var(--textcolor2, #b5b1c4);
    transition: border-color 120ms ease, color 120ms ease;
  }

  .readonly-menu:hover {
    border-color: var(--textcolor, #f5f5ff);
    color: var(--textcolor, #f5f5ff);
  }

  /* 채팅 메시지 내부 스타일 (RisuAI 원본과 동일) */
  :global(.chattext p) {
    color: var(--FontColorStandard, inherit);
    margin: 0.5em 0;
  }

  :global(.chattext em) {
    font-style: italic;
    color: var(--FontColorItalic, inherit);
  }

  :global(.chattext strong) {
    font-weight: bold;
    color: var(--FontColorBold, inherit);
  }

  :global(.chattext code) {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }

  :global(.chattext pre) {
    background-color: var(--risu-theme-bgcolor, #1a1825);
    padding: 0.5rem;
    overflow-x: auto;
    border-radius: 4px;
  }

  :global(.chattext img) {
    max-width: 100%;
    border-radius: 8px;
  }

  :global(.chattext a) {
    color: #60a5fa;
    text-decoration: underline;
  }
</style>
