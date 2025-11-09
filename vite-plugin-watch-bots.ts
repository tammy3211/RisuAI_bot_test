import type { Plugin, ViteDevServer } from 'vite';

export function watchBotsPlugin(): Plugin {
  let server: ViteDevServer;

  return {
    name: 'watch-bots',
    configureServer(_server) {
      server = _server;

      // save 폴더의 파일 변경 감지
      server.watcher.add('save/**/*.md');

      server.watcher.on('change', (path) => {
        if (path.includes('save') && path.endsWith('description.md')) {
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
