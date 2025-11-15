<script lang="ts">
  interface Props {
    onCollapse: () => void;
  }

  let { onCollapse }: Props = $props();
</script>

<div class="flex h-full flex-col bg-white">
  <!-- Header with collapse button -->
  <div class="flex items-center justify-between border-b-2 border-gray-300 bg-gray-100 px-4 py-3">
    <h2 class="text-lg font-bold text-gray-800">🎭 RisuAI Original Screen</h2>
    <button
      onclick={onCollapse}
      class="group rounded-lg bg-gray-300 p-2 transition-all hover:bg-gray-500"
      title="축소"
    >
      <svg 
        class="h-5 w-5 opacity-60 transition-opacity group-hover:opacity-100" 
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
      </svg>
    </button>
  </div>
  
  <!-- Content area -->
  <div class="flex-1 overflow-auto p-6">
    <div class="flex h-full items-center justify-center">
      <div class="rounded-xl border-4 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div class="mb-4 text-6xl">🚧</div>
        <h3 class="mb-2 text-xl font-bold text-gray-700">RisuAI Original Screen</h3>
        <p class="text-gray-500">여기에 원본 RisuAI 화면이 표시됩니다</p>
        <p class="mt-4 text-sm text-gray-400">준비 중...</p>
      </div>
    </div>
  </div>
</div>
