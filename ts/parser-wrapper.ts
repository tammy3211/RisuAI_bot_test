/**
 * 에디터 환경용 CBS 파서 래퍼
 */

export async function getEditorParser() {
  // parser.svelte.ts를 임포트
  const parserModule = await import('../../src/ts/parser.svelte');
  
  console.log('[Editor Parser] Parser loaded');
  
  return parserModule.risuChatParser;
}
