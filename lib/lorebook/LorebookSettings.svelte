<script lang="ts">
  interface Props {
    recursiveScanning?: boolean;
    fullWordMatching?: boolean;
    scanDepth?: number;
    tokenBudget?: number;
    onSettingsChange: (settings: {
      recursiveScanning: boolean;
      fullWordMatching: boolean;
      scanDepth: number;
      tokenBudget: number;
    }) => void;
  }

  let {
    recursiveScanning = true,
    fullWordMatching = false,
    scanDepth = 5,
    tokenBudget = 800,
    onSettingsChange
  }: Props = $props();

  let localRecursive = $state(recursiveScanning);
  let localFullWord = $state(fullWordMatching);
  let localScanDepth = $state(scanDepth);
  let localTokenBudget = $state(tokenBudget);

  function updateSettings() {
    onSettingsChange({
      recursiveScanning: localRecursive,
      fullWordMatching: localFullWord,
      scanDepth: localScanDepth,
      tokenBudget: localTokenBudget
    });
  }

  // 값이 변경될 때마다 자동으로 업데이트
  $effect(() => {
    updateSettings();
  });
</script>

<div class="flex h-full flex-col gap-4 overflow-y-auto rounded-xl bg-gray-100/80 p-5">
  <div class="mb-2 border-b-2 border-gray-300 pb-2">
    <h3 class="text-lg font-semibold text-gray-700">⚙️ 로어북 설정</h3>
  </div>

  <div class="flex flex-col gap-4">
    <!-- 재귀 검색 토글 -->
    <div class="flex flex-col gap-2 rounded-lg border border-gray-300 bg-white p-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-800">🔄 재귀 검색</span>
          <span class="text-xs text-gray-500">활성화된 로어북 내용도 다시 검색합니다</span>
        </div>
        <label class="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            bind:checked={localRecursive}
            class="peer sr-only"
          />
          <div class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
        </label>
      </div>
    </div>

    <!-- 단어 단위 검색 토글 -->
    <div class="flex flex-col gap-2 rounded-lg border border-gray-300 bg-white p-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-800">📝 단어 단위 검색</span>
          <span class="text-xs text-gray-500">단어 경계를 고려하여 검색합니다</span>
        </div>
        <label class="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            bind:checked={localFullWord}
            class="peer sr-only"
          />
          <div class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
        </label>
      </div>
    </div>

    <!-- 검색 깊이 -->
    <div class="flex flex-col gap-2 rounded-lg border border-gray-300 bg-white p-4">
      <label for="scanDepth" class="font-semibold text-gray-800">📏 검색 깊이</label>
      <span class="text-xs text-gray-500">최근 몇 개의 메시지를 검색할지 설정합니다</span>
      <input
        id="scanDepth"
        type="number"
        min="1"
        max="100"
        bind:value={localScanDepth}
        class="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200/70"
      />
    </div>

    <!-- 최대 토큰 -->
    <div class="flex flex-col gap-2 rounded-lg border border-gray-300 bg-white p-4">
      <label for="tokenBudget" class="font-semibold text-gray-800">🎫 최대 토큰</label>
      <span class="text-xs text-gray-500">로어북에 할당할 최대 토큰 수입니다</span>
      <input
        id="tokenBudget"
        type="number"
        min="100"
        max="50000"
        step="100"
        bind:value={localTokenBudget}
        class="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200/70"
      />
    </div>

    <!-- 현재 설정 요약 -->
    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div class="mb-2 text-sm font-semibold text-blue-900">📋 현재 설정</div>
      <div class="space-y-1 text-xs text-blue-800">
        <div>재귀 검색: <span class="font-semibold">{localRecursive ? '활성화' : '비활성화'}</span></div>
        <div>단어 단위: <span class="font-semibold">{localFullWord ? '활성화' : '비활성화'}</span></div>
        <div>검색 깊이: <span class="font-semibold">{localScanDepth}개 메시지</span></div>
        <div>최대 토큰: <span class="font-semibold">{localTokenBudget.toLocaleString()}</span></div>
      </div>
    </div>
  </div>
</div>
