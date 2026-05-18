/**
 * Vérifie la vidéo prologue avant build.
 * Prod Vercel : VITE_INTRO_VIDEO_URL ou config/prologue-cdn.json (Bunny Stream).
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["public/Prologue.web.mp4", "public/Prologue.mp4"];
const onVercel = process.env.VERCEL === "1";

const PROLOGUE_CDN_FALLBACK =
  "https://vz-b0e81311-954.b-cdn.net/5cdd6a54-5491-4bba-b34b-e6ed79c32de4/play_1080p.mp4";

function readPrologueCdnFromVercelJson() {
  const path = resolve(root, "vercel.json");
  if (!existsSync(path)) return "";
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return (
      data.env?.VITE_INTRO_VIDEO_URL?.trim() ||
      data.build?.env?.VITE_INTRO_VIDEO_URL?.trim() ||
      ""
    );
  } catch {
    return "";
  }
}

function validateCdnUrl(envUrl) {
  if (!/^https:\/\//i.test(envUrl)) {
    console.error("[prologue] VITE_INTRO_VIDEO_URL doit être une URL HTTPS absolue.");
    process.exit(1);
  }
  if (/player\.mediadelivery\.net/i.test(envUrl)) {
    console.error(
      "[prologue] URL lecteur Bunny invalide pour le site.\n" +
        "  Utilise la playlist HLS (.m3u8) ou le MP4 direct (vz-….b-cdn.net/…/play_1080p.mp4),\n" +
        "  pas https://player.mediadelivery.net/play/…",
    );
    process.exit(1);
  }
  const kind = /\.m3u8(\?|$)/i.test(envUrl) ? "HLS" : "MP4/direct";
  console.log(`[prologue] CDN OK (${kind}) : ${envUrl}`);
  process.exit(0);
}

const envUrl =
  process.env.VITE_INTRO_VIDEO_URL?.trim() ||
  (onVercel ? readPrologueCdnFromVercelJson() || PROLOGUE_CDN_FALLBACK : "");

if (envUrl) {
  validateCdnUrl(envUrl);
}

if (onVercel) {
  console.error(
    "[prologue] Sur Vercel, configure VITE_INTRO_VIDEO_URL ou config/prologue-cdn.json.\n" +
      "  Vercel → Environment Variables → redeploy",
  );
  process.exit(1);
}

const file = candidates.find((rel) => {
  const p = resolve(root, rel);
  if (!existsSync(p)) return false;
  const head = readFileSync(p, "utf8").slice(0, 40);
  if (head.startsWith("version https://git-lfs.github.com")) return false;
  return statSync(p).size > 5 * 1024 * 1024;
});

if (!file) {
  console.error(
    "[prologue] Aucune vidéo locale.\n" +
      "  → npm run assets:prologue  (copie F:\\Prologue.mp4)\n" +
      "  → npm run lfs:pull  (si pointeur LFS)\n" +
      "  → ou VITE_INTRO_VIDEO_URL pour la prod",
  );
  process.exit(1);
}

const mb = (statSync(resolve(root, file)).size / (1024 * 1024)).toFixed(1);
console.log(`[prologue] OK local : ${file} (${mb} Mo)`);
