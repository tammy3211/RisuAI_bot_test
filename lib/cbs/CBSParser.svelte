<script lang="ts">
  interface Props {
    cbsInput: string;
    cbsOutput: string;
    cbsError: string;
    onParse: () => void;
  }
  
  let { cbsInput = $bindable(''), cbsOutput = $bindable(''), cbsError = $bindable(''), onParse }: Props = $props();
  
  const examples = [
    { label: '기본 변수', code: '안녕하세요, {{user}}님! 저는 {{char}}입니다.' },
    { label: '봇 설명', code: '캐릭터 설명:\n{{description}}' },
    { label: '사용자 페르소나', code: '사용자 정보:\n{{persona}}' },
    { label: '시간/날짜', code: '현재 시간: {{time}}\n날짜: {{date}}' },
    { label: '일반 변수 (getvar)', code: '테스트 변수 값: {{getvar::test_var}}' },
    { label: 'Temp 변수', code: '{{settempvar::my_var::안녕하세요}}\nTemp 변수: {{tempvar::my_var}}' },
    { label: '조건문', code: '{{#when::{{random::1::2}}==1}}\n✅ 행운입니다!\n{{:else}}\n❌ 다음 기회에...\n{{/when}}' },
    { label: '복합 예제', code: '{{user}}님, {{char}}과의 대화를 시작합니다.\n사용자 페르소나: {{persona}}\n\n일반 변수: {{getvar::test_var}}\n\n{{#when::{{random::1::3}}==1}}\n기분이 좋네요!\n{{:else}}\n평범한 하루입니다.\n{{/when}}' }
  ];
</script>

<div class="flex flex-col space-y-5">
  <div class="rounded-xl bg-gray-100 p-6">
    <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">📝 Input (CBS Script)</div>
    <textarea
      class="min-h-[200px] w-full resize-y rounded-lg border-2 border-slate-200 bg-white px-4 py-3.5 font-mono text-sm leading-relaxed text-slate-600 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      bind:value={cbsInput}
      placeholder="CBS 스크립트를 입력하세요... 예: Hello {'{{user}}'}, my name is {'{{char}}'}!"
    ></textarea>
    <button
      class="mt-3 w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
      onclick={onParse}
    >
      ▶️ 파싱 실행
    </button>
  </div>
  
  <div class="rounded-xl bg-gray-100 p-6">
    <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">✨ Result (Parsed Output)</div>
    {#if cbsError}
      <div class="rounded-lg border-2 border-rose-500 bg-rose-50 px-4 py-3.5 text-rose-600">
        <strong>❌ Error:</strong>
        <pre class="mt-2 overflow-x-auto rounded bg-white px-3 py-2 text-sm">{cbsError}</pre>
      </div>
    {:else}
      <div class="min-h-[100px] whitespace-pre-wrap break-words rounded-lg border-2 border-emerald-500 bg-white px-4 py-3.5 font-mono text-sm leading-relaxed text-slate-600">
        {cbsOutput || '파싱 버튼을 눌러 결과를 확인하세요...'}
      </div>
    {/if}
  </div>
  
  <div class="rounded-xl bg-gray-100 p-6">
    <div class="mb-5 border-b-2 border-slate-200 pb-2.5 text-lg font-semibold text-slate-600">💡 CBS 예제</div>
    <div class="flex flex-wrap gap-2.5">
      {#each examples as example}
        <button
          class="rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          onclick={() => cbsInput = example.code}
        >
          {example.label}
        </button>
      {/each}
    </div>
  </div>
</div>
