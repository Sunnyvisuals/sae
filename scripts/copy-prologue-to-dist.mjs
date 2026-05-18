/**
 * Après `vite build` : garantit dist/Prologue.mp4 depuis Prologue.web.mp4
 * (évite qu’un pointeur LFS de public/Prologue.mp4 écrase la copie du plugin).
 */
import { copyFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webSrc = resolve(root, "public/Prologue.web.mp4");
const distMp4 = resolve(root, "dist/Prologue.mp4");

function isLfsPointer(path) {
  if (!existsSync(path)) return true;
  return readFileSync(path, "utf8").slice(0, 40).startsWith("version https://git-lfs.github.com");
}

if (process.env.VITE_INTRO_VIDEO_URL?.trim() && process.env.VERCEL !== "1") {
  process.exit(0);
}

if (!existsSync(webSrc) || isLfsPointer(webSrc)) {
  console.error("[prologue] postbuild : Prologue.web.mp4 manquant ou pointeur LFS");
  process.exit(1);
}

const bytes = statSync(webSrc).size;
if (bytes < 5 * 1024 * 1024) {
  console.error(`[prologue] postbuild : fichier trop petit (${bytes} o)`);
  process.exit(1);
}

copyFileSync(webSrc, distMp4);
console.log(`[prologue] postbuild : Prologue.mp4 (${(bytes / (1024 * 1024)).toFixed(1)} Mo)`);
