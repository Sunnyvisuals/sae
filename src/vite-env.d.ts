/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** URL absolue du prologue (CDN) ; sinon `public/Prologue.web.mp4` (~34 Mo, faststart). */
  readonly VITE_INTRO_VIDEO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
