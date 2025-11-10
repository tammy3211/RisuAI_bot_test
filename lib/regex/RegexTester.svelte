<script lang="ts">
  interface Props {
    testInput: string;
    testOutput: string;
    testMode: string;
    executionTime: number | null;
    onApply: () => void;
  }

  let { 
    testInput = $bindable(), 
    testOutput, 
    testMode = $bindable(),
    executionTime,
    onApply 
  }: Props = $props();
</script>

<div class="rounded-xl bg-gray-100 p-6 shadow-sm">
  <div class="mb-5 flex items-center justify-between border-b-2 border-slate-200 pb-2.5">
    <div class="text-lg font-semibold text-slate-600">테스트 (RisuAI processScript 사용)</div>
    {#if executionTime !== null}
      <div class="rounded-lg border-2 px-3 py-1.5 text-sm font-bold shadow-sm {executionTime > 10 ? 'border-red-400 bg-red-50 text-red-700' : 'border-emerald-400 bg-emerald-50 text-emerald-700'}">
        {(executionTime * 1000).toFixed(2)} ms
      </div>
    {/if}
  </div>

  <div class="mb-4">
    <label for="test-mode" class="mb-2 block text-sm font-semibold text-slate-600">테스트 모드:</label>
    <select
      id="test-mode"
      class="w-full rounded-md border-2 border-slate-200 px-3 py-2.5 font-semibold transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      bind:value={testMode}
    >
      <option value="editinput">📥 EditInput (입력 전처리)</option>
      <option value="editoutput">📤 EditOutput (출력 후처리)</option>
      <option value="editprocess">⚙️ EditProcess (프로세스 처리)</option>
      <option value="editdisplay">🖥️ EditDisplay (디스플레이 처리)</option>
    </select>
  </div>

  <div class="mb-4">
    <label for="test-input" class="mb-2 block text-sm font-semibold text-slate-600">입력 텍스트:</label>
    <textarea 
      id="test-input"
      class="min-h-[120px] w-full resize-y rounded-md border-2 border-slate-200 px-3 py-3 font-mono text-sm leading-relaxed transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      bind:value={testInput}
      placeholder="테스트할 텍스트를 입력하세요..."
    ></textarea>
  </div>

  <button
    class="mb-4 w-full rounded-md bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg"
    onclick={onApply}
  >
    ▶ Regex 적용 ({testMode})
  </button>

  <div>
    <label for="test-output" class="mb-2 block text-sm font-semibold text-slate-600">출력 결과:</label>
    <textarea 
      id="test-output"
      class="min-h-[120px] w-full resize-y rounded-md border-2 border-slate-200 bg-slate-100 px-3 py-3 font-mono text-sm leading-relaxed text-slate-700"
      value={testOutput}
      readonly
      placeholder="적용 결과가 여기에 표시됩니다..."
    ></textarea>
  </div>
</div>
