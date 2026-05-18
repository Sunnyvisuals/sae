import prologueCdnJson from "../../config/prologue-cdn.json";

type PrologueCdnConfig = { url: string; hls?: string };
const prologueCdn = prologueCdnJson as PrologueCdnConfig;

/** URL prod Bunny Stream (MP4 direct, lecteur natif) — surchargeable via `VITE_INTRO_VIDEO_URL`. */
export const PROLOGUE_CDN_URL = prologueCdn.url.trim();

/** Fallback HLS si le MP4 échoue. */
export const PROLOGUE_CDN_HLS_URL =
  typeof prologueCdn.hls === "string" ? prologueCdn.hls.trim() : "";
