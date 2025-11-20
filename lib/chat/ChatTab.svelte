<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { editorState } from '../shared/editorState.svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import ChatScreen from './ChatScreen.svelte';
  import { loadSelectedBotData } from '../shared/botLoader.svelte';
  import { botService } from '../shared/botService';

  let chatScreenRef: any;
  let unsubscribe: (() => void) | null = null;

  async function handleLoadBot() {
    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      await loadSelectedBotData();

      console.log('[ChatTab] Bot loaded:', editorState.selectedBot);

      // Refresh ChatScreen and load from localStorage
      if (chatScreenRef?.loadFromStorage) {
        chatScreenRef.loadFromStorage();
      }
      
      // WebSocket 파일 감지 설정
      setupFileWatcher();
    }
  }

  function setupFileWatcher() {
    // 이전 구독 해제
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (editorState.selectedBot) {
      console.log('[ChatTab] Setting up file watcher for:', editorState.selectedBot);
      unsubscribe = botService.watchBot(editorState.selectedBot, async (event) => {
        console.log('[ChatTab] File changed:', event);
        
        // 봇 데이터 다시 로드
        await loadSelectedBotData();
        
        // ChatScreen 리프레시
        if (chatScreenRef?.loadFromStorage) {
          chatScreenRef.loadFromStorage();
        }
      });
    }
  }

  // Load bot data on mount if already selected (e.g., after page refresh)
  onMount(() => {
    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      handleLoadBot();
    }
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });
</script>

<div class="space-y-7">
  <div class="rounded-xl border-l-4 border-indigo-400 bg-gradient-to-r from-sky-100 to-purple-100 p-6">
    <h4 class="mb-4 text-xl font-semibold text-indigo-500">💬 채팅 테스트</h4>
    <ul class="space-y-2 text-sm leading-relaxed text-slate-700">
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>실제 RisuAI 채팅 파서를 사용하여 봇과의 대화를 시뮬레이션합니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>Regex, Lua, CBS 스크립트가 실시간으로 메시지에 적용됩니다</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>사용자 메시지와 AI 응답을 직접 입력하여 파싱 결과를 확인할 수 있습니다</span>
      </li>
    </ul>
  </div>

  <!-- 2-column layout: Chat on left, Bot settings on right -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
    <!-- Left: Chat Screen -->
    <div class="h-[1000px] rounded-xl border border-gray-300 bg-white overflow-hidden">
      <ChatScreen bind:this={chatScreenRef} />
    </div>

    <!-- Right: Bot settings -->
    <div class="space-y-6">
      <BotSettings onLoadBot={handleLoadBot} useBotList={true} />
    </div>
  </div>
</div>
