/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.jpeg" {
  const source: string;
  export default source;
}

declare module "*.PNG" {
  const source: string;
  export default source;
}

declare module "*.png" {
  const source: string;
  export default source;
}
