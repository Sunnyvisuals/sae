/**
 * Après `vite build` : copie Prologue.web.mp4 → dist/Prologue.mp4 (dev local sans CDN).
 * Ignoré si VITE_INTRO_VIDEO_URL est défini (prod sur CDN).
 */
import { copyFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webSrc = resolve(root, "public/Prologue.web.mp4");
const distDir = resolve(root, "dist");

function isLfsPointer(path) {
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf8").slice(0, 40).startsWith("version https://git-lfs.github.com");
}

export function viteCopyProloguePlugin() {
  return {
    name: "al-rihla-copy-prologue",
    apply: "build",
    closeBundle() {
      const skipForCdn =
        process.env.VERCEL !== "1" && process.env.VITE_INTRO_VIDEO_URL?.trim();
      if (skipForCdn) {
        console.log("[prologue] VITE_INTRO_VIDEO_URL → pas de copie locale dans dist/");
        return;
      }

      if (!existsSync(webSrc) || isLfsPointer(webSrc)) {
        throw new Error(
          "[prologue] public/Prologue.web.mp4 manquant — npm run assets:prologue:web ou définis VITE_INTRO_VIDEO_URL",
        );
      }
      const bytes = statSync(webSrc).size;
      if (bytes < 5 * 1024 * 1024) {
        throw new Error(`[prologue] Prologue.web.mp4 invalide (${bytes} octets)`);
      }

      const destMp4 = resolve(distDir, "Prologue.mp4");
      const destWeb = resolve(distDir, "Prologue.web.mp4");
      copyFileSync(webSrc, destMp4);
      copyFileSync(webSrc, destWeb);
      console.log(
        `[prologue] dist : Prologue.mp4 (${(bytes / (1024 * 1024)).toFixed(1)} Mo)`,
      );
    },
  };
}
