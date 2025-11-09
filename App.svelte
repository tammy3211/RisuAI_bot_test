<script lang="ts">
  import { onMount } from 'svelte';
  import ChatTab from './lib/chat/ChatTab.svelte';
  import LorebookTab from './lib/lorebook/LorebookTab.svelte';
  import RegexTab from './lib/regex/RegexTab.svelte';
  import CBSTab from './lib/cbs/CBSTab.svelte';
  
  let error = $state('');
  let modules = $state<any>(null);
  let activeTab = $state('chat');
  
  const tabs = [
    { id: 'chat', icon: '💬', label: '채팅 테스트' },
    { id: 'lorebook', icon: '📚', label: 'Lorebook' },
    { id: 'regex', icon: '🔧', label: 'Regex' },
    { id: 'cbs', icon: '📝', label: 'CBS' }
  ];
  
  onMount(async () => {
    console.log('🚀 App.svelte onMount called');
    
    try {
      console.log('📦 Importing modules...');
      const { CBSModule } = await import('./ts/cbs');
      const { ChatModule } = await import('./ts/chat');
      const { LorebookModule } = await import('./ts/lorebook');
      const { RegexModule } = await import('./ts/regex');
      console.log('✅ Modules imported successfully');
      
      modules = { CBSModule, ChatModule, LorebookModule, RegexModule };
    } catch (err: any) {
      console.error('❌ Error importing modules:', err);
      error = err.toString() + '\n\n' + err.stack;
    }
  });
  
  function switchTab(tabId: string) {
    activeTab = tabId;
    console.log('Tab switched to:', tabId);
  }
</script>

<div class="app-container">
  <!-- Header -->
  <div class="header">
    <h1>🤖 RisuAI Character Tester</h1>
    <p>로어북, CBS, Regex 테스트 도구</p>
  </div>
  
  <!-- Error Display -->
  {#if error}
    <div class="error-panel">
      <h3>❌ Error:</h3>
      <pre>{error}</pre>
    </div>
  {/if}
  
  <!-- Tab Navigation -->
  <div class="tabs">
    {#each tabs as tab}
      <button 
        class="tab-button" 
        class:active={activeTab === tab.id}
        onclick={() => switchTab(tab.id)}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </div>
  
  <!-- Tab Content -->
  <div class="tab-container">
    <!-- Chat Tab -->
    {#if activeTab === 'chat'}
      <ChatTab />
    {/if}
    
    <!-- Lorebook Tab -->
    {#if activeTab === 'lorebook'}
      <LorebookTab />
    {/if}
    
    <!-- Regex Tab -->
    {#if activeTab === 'regex'}
      <RegexTab />
    {/if}
    
    <!-- CBS Tab -->
    {#if activeTab === 'cbs'}
      <CBSTab />
    {/if}
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>✅ Modules loaded: {modules ? 'Yes' : 'Loading...'} | Active Tab: {activeTab}</p>
  </div>
</div>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
  }

  .app-container {
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px;
    text-align: center;
  }

  .header h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
  }

  .header p {
    font-size: 1.1em;
    opacity: 0.9;
  }

  .error-panel {
    background: #ffebee;
    padding: 20px;
    margin: 20px;
    border-radius: 8px;
    color: #d32f2f;
  }

  .error-panel pre {
    background: white;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    margin-top: 10px;
  }

  /* Tabs */
  .tabs {
    display: flex;
    background: #f8f9fa;
    border-bottom: 3px solid #dee2e6;
    overflow-x: auto;
  }

  .tab-button {
    flex: 1;
    min-width: 150px;
    padding: 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1em;
    color: #6c757d;
    border-bottom: 3px solid transparent;
  }

  .tab-button:hover {
    background: #e9ecef;
  }

  .tab-button.active {
    color: #667eea;
    background: white;
    border-bottom-color: #667eea;
    font-weight: 600;
  }

  .tab-icon {
    font-size: 1.5em;
  }

  /* Tab Content */
  .tab-container {
    padding: 30px;
    min-height: 500px;
  }

  /* Footer */
  .footer {
    background: #f8f9fa;
    padding: 20px;
    text-align: center;
    color: #6c757d;
    border-top: 1px solid #dee2e6;
  }
</style>

