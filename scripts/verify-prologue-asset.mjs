/**
 * Vérifie la vidéo prologue avant build.
 * Prod Vercel : VITE_INTRO_VIDEO_URL (CDN) obligatoire — pas de gros MP4 dans le déploiement.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["public/Prologue.web.mp4", "public/Prologue.mp4"];
const envUrl = process.env.VITE_INTRO_VIDEO_URL?.trim();
const onVercel = process.env.VERCEL === "1";

if (envUrl) {
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

if (onVercel) {
  console.error(
    "[prologue] Sur Vercel, définis VITE_INTRO_VIDEO_URL (playlist .m3u8 Bunny Stream ou MP4 CDN).\n" +
      "  Ex. https://vz-….b-cdn.net/{video-id}/playlist.m3u8\n" +
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
