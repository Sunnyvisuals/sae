/**
 * Vérifie que le prologue n’est pas un pointeur LFS avant build (Vercel sert ~134 o sinon).
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["public/Prologue.web.mp4", "public/Prologue.mp4"];
const envUrl = process.env.VITE_INTRO_VIDEO_URL?.trim();

if (envUrl) {
  console.log(`[prologue] VITE_INTRO_VIDEO_URL défini → pas de fichier local requis (${envUrl})`);
  process.exit(0);
}

const file = candidates.find((rel) => {
  const p = resolve(root, rel);
  if (!existsSync(p)) return false;
  const head = readFileSync(p, "utf8").slice(0, 40);
  if (head.startsWith("version https://git-lfs.github.com")) return false;
  return statSync(p).size > 5 * 1024 * 1024;
});

if (!file) {
  const any = candidates.find((rel) => existsSync(resolve(root, rel)));
  if (any) {
    const p = resolve(root, any);
    const head = readFileSync(p, "utf8").slice(0, 40);
    if (head.startsWith("version https://git-lfs.github.com")) {
      console.error(
        "[prologue] public/Prologue.mp4 est un pointeur Git LFS (pas la vidéo).\n" +
          "  → Vercel : activer Git LFS (Pro) OU npm run assets:prologue:web puis commit Prologue.web.mp4\n" +
          "  → Ou définir VITE_INTRO_VIDEO_URL (CDN) dans les variables Vercel.",
      );
      process.exit(1);
    }
  }
  console.error(
    "[prologue] Aucune vidéo prologue utilisable.\n" +
      "  → npm run assets:prologue puis npm run assets:prologue:web\n" +
      "  → ou VITE_INTRO_VIDEO_URL sur un hébergeur externe.",
  );
  process.exit(1);
}

const mb = (statSync(resolve(root, file)).size / (1024 * 1024)).toFixed(1);
const vercel = process.env.VERCEL === "1";
const hobbyMaxMb = 100;

if (vercel && file.endsWith("Prologue.mp4") && statSync(resolve(root, file)).size > hobbyMaxMb * 1024 * 1024) {
  console.error(
    `[prologue] ${file} (${mb} Mo) dépasse la limite Vercel Hobby (~${hobbyMaxMb} Mo/fichier).\n` +
      "  → npm run assets:prologue:web et commit public/Prologue.web.mp4\n" +
      "  → ou VITE_INTRO_VIDEO_URL (CDN).",
  );
  process.exit(1);
}

console.log(`[prologue] OK : ${file} (${mb} Mo)`);
