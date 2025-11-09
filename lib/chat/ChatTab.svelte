<script lang="ts">
  import { onMount } from 'svelte';
  import BotSettings from '../shared/BotSettings.svelte';
  import { editorState, saveEditorState } from '../shared/editorState.svelte';
  
  // 로컬 상태 (채팅 관련)
  let messages = $state<Array<{role: 'system'|'user'|'assistant', content: string}>>([
    { role: 'system', content: '채팅 테스트를 시작합니다. 메시지를 추가해보세요!' }
  ]);
  let newMessage = $state('');
  let newRole = $state<'user'|'assistant'>('user');
  
  onMount(async () => {
    await loadSavedBots();
  });
  
  async function loadSavedBots() {
    try {
      const savePath = './save';
      const response = await fetch(savePath);
      const html = await response.text();
      
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
        editorState.savedBots = ['name'];
      }
    } catch (err) {
      console.error('Failed to load saved bots:', err);
      editorState.savedBots = ['name'];
    }
  }
  
  async function loadBotData() {
    console.log('[ChatTab] loadBotData called - using shared botLoader');
    // botLoader.svelte.ts에서 이미 처리했으므로 여기서는 추가 작업 불필요
  }
  
  function addMessage() {
    if (newMessage.trim()) {
      messages.push({ role: newRole, content: newMessage });
      messages = messages;
      newMessage = '';
    }
  }
  
  function clearMessages() {
    messages = [{ role: 'system', content: '채팅 테스트를 시작합니다. 메시지를 추가해보세요!' }];
  }
</script>

<div class="chat-tab">
  <div class="info-panel">
    <h4>💬 채팅 테스트</h4>
    <ul>
      <li>로어북, CBS, Regex 등이 실제 채팅에서 어떻게 작동하는지 테스트합니다</li>
      <li>User 또는 Assistant 역할을 선택해서 메시지를 추가할 수 있습니다</li>
      <li>로어북 항목이 자동으로 삽입되는지 확인할 수 있습니다</li>
    </ul>
  </div>

  <div class="chat-container">
    <!-- Left Panel: Chat Messages -->
    <div class="chat-left">
      <div class="section">
        <div class="section-title">💬 채팅 내역</div>
        <div class="chat-messages">
          {#each messages as msg}
            <div class="chat-message {msg.role}">
              <div class="message-role">{msg.role}</div>
              <div class="message-content">{msg.content}</div>
            </div>
          {/each}
        </div>
        
        <div class="message-input">
          <select bind:value={newRole} class="role-select">
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
          </select>
          <input 
            type="text" 
            bind:value={newMessage} 
            placeholder="메시지 입력..."
            class="text-input"
            onkeydown={(e) => e.key === 'Enter' && addMessage()}
          />
          <button class="btn btn-success" onclick={addMessage}>전송</button>
          <button class="btn btn-secondary" onclick={clearMessages}>초기화</button>
        </div>
      </div>
    </div>

    <!-- Right Panel: Settings -->
    <div class="chat-right">
      <BotSettings onLoadBot={loadBotData} />
    </div>
  </div>
</div>

<style>
  .chat-tab {
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

  .chat-container {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 30px;
  }

  .section {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 1.2em;
    font-weight: 600;
    color: #495057;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #dee2e6;
  }

  .chat-messages {
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 15px;
  }

  .chat-message {
    margin-bottom: 15px;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  }

  .chat-message.system {
    background: #e3f2fd;
    border-left-color: #2196f3;
  }

  .chat-message.user {
    background: #f1f8e9;
    border-left-color: #8bc34a;
  }

  .chat-message.assistant {
    background: #fff3e0;
    border-left-color: #ff9800;
  }

  .message-role {
    font-weight: 600;
    color: #667eea;
    margin-bottom: 8px;
    font-size: 0.9em;
    text-transform: uppercase;
  }

  .message-content {
    color: #495057;
    line-height: 1.6;
  }

  .message-input {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .role-select {
    padding: 10px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
    min-width: 120px;
  }

  .text-input {
    flex: 1;
    padding: 10px 12px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
  }

  .text-input:focus {
    outline: none;
    border-color: #667eea;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-success {
    background: #28a745;
    color: white;
  }

  .btn-success:hover {
    background: #218838;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }

  @media (max-width: 1024px) {
    .chat-container {
      grid-template-columns: 1fr;
    }
  }
</style>
