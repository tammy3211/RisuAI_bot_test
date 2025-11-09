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

<div class="parser-panel">
  <div class="section">
    <div class="section-title">📝 Input (CBS Script)</div>
    <textarea 
      class="cbs-textarea"
      bind:value={cbsInput}
      placeholder="CBS 스크립트를 입력하세요... 예: Hello {'{{user}}'}, my name is {'{{char}}'}!"
    ></textarea>
    <button class="btn btn-success" onclick={onParse}>
      ▶️ 파싱 실행
    </button>
  </div>
  
  <div class="section">
    <div class="section-title">✨ Result (Parsed Output)</div>
    {#if cbsError}
      <div class="error-box">
        <strong>❌ Error:</strong>
        <pre>{cbsError}</pre>
      </div>
    {:else}
      <div class="output-box">
        {cbsOutput || '파싱 버튼을 눌러 결과를 확인하세요...'}
      </div>
    {/if}
  </div>
  
  <div class="section">
    <div class="section-title">💡 CBS 예제</div>
    <div class="example-buttons">
      {#each examples as example}
        <button class="example-btn" onclick={() => cbsInput = example.code}>
          {example.label}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .parser-panel {
    display: flex;
    flex-direction: column;
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

  .cbs-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 200px;
    padding: 15px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.6;
    resize: vertical;
    background: white;
    color: #495057;
    transition: border-color 0.3s ease;
  }

  .cbs-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-top: 10px;
    width: 100%;
  }

  .btn-success {
    background: #28a745;
    color: white;
  }

  .btn-success:hover {
    background: #218838;
    transform: translateY(-1px);
  }

  .output-box {
    background: white;
    padding: 15px;
    border-radius: 8px;
    border: 2px solid #28a745;
    min-height: 100px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #495057;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .error-box {
    background: #fff5f5;
    padding: 15px;
    border-radius: 8px;
    border: 2px solid #dc3545;
    color: #dc3545;
  }

  .error-box pre {
    margin-top: 10px;
    background: white;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }

  .example-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .example-btn {
    padding: 10px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .example-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .example-btn:active {
    transform: translateY(0);
  }
</style>
