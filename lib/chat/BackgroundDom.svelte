<script lang="ts">
  import { editorState } from '../shared/editorState.svelte';

  let backgroundHTML = $derived(editorState.currentBot?.data?.backgroundHTML);
  let moduleBackgroundEmbedding = $state(''); // TODO: 모듈 임베딩 지원
  let currentChar = $derived(editorState.currentBot?.data);
  let reloadPointer = $state(0);
</script>

{#if backgroundHTML || moduleBackgroundEmbedding}
  {#if currentChar}
    {#key reloadPointer}
      <div class="absolute left-0 top-0 h-full w-full pointer-events-none">
        {#await import('../../../src/ts/parser.svelte').then(async ({ ParseMarkdown, risuChatParser }) => {
          const parsed = risuChatParser((backgroundHTML || '') + '\n' + (moduleBackgroundEmbedding || ''), { chara: currentChar });
          return await ParseMarkdown(parsed, currentChar, 'back');
        })}
          <!-- Loading -->
        {:then md}
          {@html md}
        {:catch error}
          <!-- Error rendering background -->
          <div class="text-red-500 text-xs p-2">Background render error</div>
        {/await}
      </div>
    {/key}
  {/if}
{/if}
