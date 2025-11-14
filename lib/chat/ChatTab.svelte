<script lang="ts">
  import { editorState } from '../shared/editorState.svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import ChatScreen from './ChatScreen.svelte';
  import { loadSelectedBotData } from '../shared/botLoader.svelte';

  async function handleLoadBot() {
    // Reload bot data after selecting a saved bot
    console.log('[ChatTab] Loading bot data...');

    if (editorState.botSource === 'saved' && editorState.selectedBot) {
      await loadSelectedBotData();

      console.log('[ChatTab] Bot data loaded:', {
        bot: editorState.selectedBot,
        regexCount: editorState.regexScripts?.length || 0,
        lorebookCount: editorState.lorebookEntries?.length || 0
      });
    }
  }
</script>

<div class="space-y-7">
  <div class="rounded-xl border-l-4 border-indigo-400 bg-gradient-to-r from-sky-100 to-purple-100 p-6">
    <h4 class="mb-4 text-xl font-semibold text-indigo-500">💬 채팅 테스트 (ChatParser 사용)</h4>
    <ul class="space-y-2 text-sm leading-relaxed text-slate-700">
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>원본 RisuAI의 processScriptFull, runTrigger, runLuaEditTrigger 사용</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>User: 입력만 처리 (AI 응답 자동 생성 없음)</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>AI 응답: 사용자가 직접 입력하여 파싱 적용</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>Regex, Lua, CBS 스크립트가 실시간으로 적용</span>
      </li>
      <li class="flex gap-2">
        <span class="text-indigo-500">✓</span>
        <span>실제 채팅 데이터 구조(mockDB) 사용</span>
      </li>
    </ul>
  </div>

  <!-- 2-column layout: Chat on left, Bot settings on right -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
    <!-- Left: Chat Screen -->
    <div class="h-[700px] rounded-xl border border-gray-300 bg-white overflow-hidden">
      <ChatScreen />
    </div>

    <!-- Right: Bot settings -->
    <div class="space-y-6">
      <BotSettings onLoadBot={handleLoadBot} />
    </div>
  </div>
</div>
