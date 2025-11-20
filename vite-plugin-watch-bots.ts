import type { Plugin, ViteDevServer } from 'vite';

export function watchBotsPlugin(): Plugin {
  let server: ViteDevServer;
  let timer: NodeJS.Timeout;

  return {
    name: 'watch-bots',
    configureServer(_server) {
      server = _server;

      // save 폴더의 모든 파일 변경 감지
      server.watcher.add('save/**/*');

      server.watcher.on('change', (path) => {
        if (!path.includes('save')) return;

        console.log('🤖 [watch-bots] File changed:', path);

        // 디바운스: 200ms 동안 같은 이벤트가 여러 번 오면 마지막 것만 처리
        clearTimeout(timer);
        timer = setTimeout(() => {
          server.ws.send({
            type: 'custom',
            event: 'bots-updated',
            data: { path },
          });
        }, 200);
      });
    }
  };
}
