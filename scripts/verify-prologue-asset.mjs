/**
 * Vérifie la vidéo prologue avant build.
 * Prod Vercel : public/Prologue.web.mp4 (copié dans dist/) — pas de CDN externe.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["public/Prologue.web.mp4", "public/Prologue.mp4"];
const onVercel = process.env.VERCEL === "1";

function findLocalPrologue() {
  return candidates.find((rel) => {
    const p = resolve(root, rel);
    if (!existsSync(p)) return false;
    const head = readFileSync(p, "utf8").slice(0, 40);
    if (head.startsWith("version https://git-lfs.github.com")) return false;
    return statSync(p).size > 5 * 1024 * 1024;
  });
}

const envUrl =
  onVercel ? "" : (process.env.VITE_INTRO_VIDEO_URL?.trim() ?? "");

if (envUrl) {
  if (!/^https:\/\//i.test(envUrl)) {
    console.error("[prologue] VITE_INTRO_VIDEO_URL doit être une URL HTTPS absolue.");
    process.exit(1);
  }
  if (/player\.mediadelivery\.net/i.test(envUrl)) {
    console.error(
      "[prologue] URL lecteur Bunny invalide — utilise un MP4 direct ou laisse vide pour /Prologue.mp4",
    );
    process.exit(1);
  }
  console.log(`[prologue] CDN dev : ${envUrl}`);
  process.exit(0);
}

const file = findLocalPrologue();

if (!file) {
  console.error(
    "[prologue] Aucune vidéo locale.\n" +
      "  → npm run assets:prologue:web  (encode ~81 Mo)\n" +
      "  → npm run lfs:pull  (si pointeur LFS)\n" +
      (onVercel
        ? "  → commit public/Prologue.web.mp4 (Git LFS) pour le déploiement Vercel"
        : ""),
  );
  process.exit(1);
}

const mb = (statSync(resolve(root, file)).size / (1024 * 1024)).toFixed(1);
console.log(`[prologue] OK ${onVercel ? "Vercel" : "local"} : ${file} (${mb} Mo) → /Prologue.web.mp4`);
