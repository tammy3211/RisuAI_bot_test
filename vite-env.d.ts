/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly glob: <T = any>(pattern: string, options?: {
    as?: 'raw' | 'url';
    eager?: boolean;
  }) => Record<string, T>;
  readonly hot?: {
    accept: (cb?: (mod: any) => void) => void;
    dispose: (cb: (data: any) => void) => void;
    decline: () => void;
    invalidate: () => void;
    on: (event: string, cb: (...args: any[]) => void) => void;
  };
}
