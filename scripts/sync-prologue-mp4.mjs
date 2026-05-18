/**
 * Copie F:\Prologue.mp4 (ou PROLOGUE_SOURCE) vers public/Prologue.mp4 pour le build Vite.
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(root, "public/Prologue.mp4");
const sources = [
  process.env.PROLOGUE_SOURCE,
  "F:/Prologue.mp4",
  "f:/Prologue.mp4",
].filter(Boolean);

const src = sources.find((p) => existsSync(p));
if (!src) {
  if (existsSync(dest)) {
    const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
    console.log(`[assets:prologue] Déjà présent : public/Prologue.mp4 (${mb} Mo)`);
    process.exit(0);
  }
  console.error(
    "[assets:prologue] Aucune source trouvée. Place Prologue.mp4 dans public/ ou définis PROLOGUE_SOURCE.",
  );
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
console.log(`[assets:prologue] Copié ${src} → public/Prologue.mp4 (${mb} Mo)`);
