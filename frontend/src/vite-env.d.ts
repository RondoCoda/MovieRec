/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string; // "true" (default) | "false"
  readonly VITE_API_BASE?: string; // default "/api"
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
