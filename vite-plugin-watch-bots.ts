import type { Plugin, ViteDevServer } from 'vite';

export function watchBotsPlugin(): Plugin {
  let server: ViteDevServer;

  return {
    name: 'watch-bots',
    configureServer(_server) {
      server = _server;

      // save 폴더의 모든 파일 변경 감지
      server.watcher.add('save/**/*');

      server.watcher.on('change', (path) => {
        // save 폴더 내 모든 파일 변경 시 리로드
        if (path.includes('save')) {
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
