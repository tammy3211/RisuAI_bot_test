<script lang="ts">
  import { editorState } from '../shared/editorState.svelte';
  import CopyDefaultChatScreen from './copyDefaultChatScreen.svelte';
  import BackgroundDom from '../../../src/lib/ChatScreens/BackgroundDom.svelte';

  // Settings for Standard Risu theme (기본 테마)
  let classicMaxWidth = $state(true);
  let bgImg = $state('');
  
  // External styles (원본 RisuAI의 externalStyles)
  let textScreenColor = $state('');
  let textBorder = $state(false);
  let textScreenRounded = $state(false);
  let textScreenBorderColor = $state('');
  
  let externalStyles = $derived(
    `background: ${textScreenColor ? textScreenColor + '80' : 'rgba(0,0,0,0.8)'};` +
    (textBorder ? 'text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;' : '') +
    (textScreenRounded ? 'border-radius: 2rem; padding: 1rem;' : '') +
    (textScreenBorderColor ? `border: 0.3rem solid ${textScreenBorderColor};` : '')
  );
</script>

<!-- Standard Risu Theme (기본 테마) -->
<div class="relative flex h-full min-w-0 flex-grow justify-center">
  <BackgroundDom />
  
  <div 
    style={bgImg} 
    class="h-full w-full {classicMaxWidth ? 'max-w-6xl' : ''}"
  >
    <CopyDefaultChatScreen 
      customStyle={bgImg.length > 2 ? externalStyles : ''}
    />
  </div>
</div>


