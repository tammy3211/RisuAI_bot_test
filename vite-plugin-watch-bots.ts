import type { Plugin, ViteDevServer } from 'vite';

export function watchBotsPlugin(): Plugin {
  let server: ViteDevServer;

  return {
    name: 'watch-bots',
    configureServer(_server) {
      server = _server;

      // save 폴더의 파일 변경 감지
      server.watcher.add('save/**/*.md');
      server.watcher.add('save/**/lorebook/*.json');

      server.watcher.on('change', (path) => {
        // description.md 또는 lorebook 폴더의 파일 변경 시 리로드
        const shouldReload = 
          (path.includes('save') && path.endsWith('description.md')) ||
          (path.includes('save') && path.includes('lorebook') && (path.endsWith('.json') || path.endsWith('.md')));

        if (shouldReload) {
          console.log('🔄 [watch-bots] File changed:', path);
          console.log('🔄 [watch-bots] Triggering full page reload...');
          
          // 전체 페이지 리로드 트리거
          server.ws.send({
            type: 'full-reload',
            path: '*'
          });
        }
      });
    }
  };
}
