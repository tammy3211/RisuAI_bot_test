<script lang="ts">
  interface Props {
    userName: string;
    botName: string;
    botDescription: string;
    userPersona: string;
    customVars: {[key: string]: string};
  }
  
  let { userName = $bindable('User'), botName = $bindable('TestBot'), botDescription = $bindable(''), userPersona = $bindable(''), customVars = $bindable({}) }: Props = $props();
  
  function addCustomVar() {
    const key = prompt('변수 이름:');
    if (key && !customVars[key]) {
      customVars[key] = '';
      customVars = customVars;
    }
  }
  
  function removeCustomVar(key: string) {
    delete customVars[key];
    customVars = customVars;
  }
</script>

<div class="flex flex-col space-y-5">
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
          bind:value={userName}
          class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="User"
        />
      </div>

      <div>
        <label for="user-persona" class="mb-1.5 block text-xs font-semibold text-slate-600">페르소나 (User Description):</label>
        <textarea
          id="user-persona"
          bind:value={userPersona}
          class="min-h-20 w-full resize-y rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="사용자의 성격, 특징, 배경..."
        ></textarea>
      </div>
    </div>
  </div>

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
          bind:value={botName}
          class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="TestBot"
        />
      </div>

      <div>
        <label for="bot-desc" class="mb-1.5 block text-xs font-semibold text-slate-600">설명 (Description):</label>
        <textarea
          id="bot-desc"
          bind:value={botDescription}
          class="min-h-20 w-full resize-y rounded-md border-2 border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="봇 설명..."
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
      {#each Object.entries(customVars) as [key]}
        <div class="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white p-2.5">
          <div class="min-w-[100px] font-mono text-sm font-semibold text-indigo-500">{key}</div>
          <input
            type="text"
            bind:value={customVars[key]}
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
      {#if Object.keys(customVars).length === 0}
        <p class="py-5 text-center text-sm italic text-slate-500">변수가 없습니다. + 버튼을 눌러 추가하세요.</p>
      {/if}
    </div>
  </div>
</div>
