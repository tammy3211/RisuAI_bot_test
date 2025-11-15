<script lang="ts">
  import { editorState, saveEditorState } from './editorState.svelte';
  import BotSourceSelector from './BotSourceSelector.svelte';
  import Modal from '../UI/Modal.svelte';
  
  interface Props {
    onLoadBot?: () => void;
  }
  
  let { onLoadBot }: Props = $props();
  
  let showAddVarModal = $state(false);
  let newVarName = $state('');
  let showDuplicateError = $state(false);
  
  function addCustomVar() {
    showAddVarModal = true;
    newVarName = '';
    showDuplicateError = false;
  }
  
  function confirmAddVar() {
    const key = newVarName.trim();
    if (!key) return;
    
    if (key in editorState.customVars) {
      showDuplicateError = true;
      return;
    }
    
    editorState.addCustomVar(key, '');
    showAddVarModal = false;
    newVarName = '';
    showDuplicateError = false;
  }
  
  function cancelAddVar() {
    showAddVarModal = false;
    newVarName = '';
    showDuplicateError = false;
  }
  
  function removeCustomVar(key: string) {
    editorState.removeCustomVar(key);
  }
  
  // 입력 변경 시 저장
  function handleInput() {
    saveEditorState();
  }
  
  // customVars 값 변경 시 저장
  function handleCustomVarChange(key: string, value: string) {
    editorState.customVars[key] = value;
    saveEditorState();
  }
</script>

<div class="flex flex-col space-y-5">
  <!-- 봇 정보 소스 - 맨 위로 이동 -->
  <BotSourceSelector onLoadBot={onLoadBot} />

  <div class="rounded-xl bg-gray-100 p-6">
    <div class="mb-5 flex items-center justify-between border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">
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

  <div class="rounded-xl bg-gray-100 p-6">
    <div class="mb-5 flex items-center justify-between border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">
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
      {#each Object.entries(editorState.customVars) as [key]}
        <div class="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white p-2.5">
          <div class="min-w-[100px] font-mono text-sm font-semibold text-indigo-500">{key}</div>
          <input 
            type="text" 
            value={editorState.customVars[key]}
            oninput={(e) => handleCustomVarChange(key, (e.target as HTMLInputElement).value)}
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
      {#if Object.keys(editorState.customVars).length === 0}
        <p class="py-3 text-center text-sm italic text-slate-500">변수가 없습니다. + 버튼을 눌러 추가하세요.</p>
      {/if}
    </div>
  </div>
</div>

<!-- 변수 추가 모달 -->
<Modal
  isOpen={showAddVarModal}
  title="새 변수 추가"
  onClose={cancelAddVar}
  actions={[
    {
      label: '취소',
      onClick: cancelAddVar,
      variant: 'secondary'
    },
    {
      label: '추가',
      onClick: confirmAddVar,
      variant: 'primary',
      disabled: !newVarName.trim()
    }
  ]}
>
  {#snippet children()}
    <label for="new-var-name" class="mb-1.5 block text-xs font-semibold text-slate-600">변수 이름:</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      id="new-var-name"
      type="text"
      bind:value={newVarName}
      oninput={() => showDuplicateError = false}
      onkeydown={(e) => e.key === 'Enter' && confirmAddVar()}
      class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      placeholder="예: myVariable"
      autofocus
    />
    {#if showDuplicateError}
      <p class="mt-1.5 text-xs text-rose-500">⚠️ 이미 존재하는 변수명입니다. 다른 이름을 입력해주세요.</p>
    {/if}
  {/snippet}
</Modal>
