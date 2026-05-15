/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
        renderButton: (element: HTMLElement | null, options: { theme?: string; size?: string; width?: number }) => void;
        prompt: () => void;
      };
    };
  };
}
