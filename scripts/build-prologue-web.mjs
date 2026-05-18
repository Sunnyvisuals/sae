/**
 * Version web du prologue (<100 Mo) pour Vercel Hobby.
 * Source : public/Prologue.mp4 (ou PROLOGUE_SOURCE / F:\Prologue.mp4 via assets:prologue).
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "public/Prologue.mp4");
const dest = resolve(root, "public/Prologue.web.mp4");
const targetMb = Number(process.env.PROLOGUE_WEB_TARGET_MB || "46");

if (!existsSync(src)) {
  console.error("[assets:prologue:web] Manque public/Prologue.mp4 — lance npm run assets:prologue");
  process.exit(1);
}

const head = readFileSync(src, "utf8").slice(0, 40);
if (head.startsWith("version https://git-lfs.github.com")) {
  console.error("[assets:prologue:web] Prologue.mp4 est un pointeur LFS — npm run lfs:pull");
  process.exit(1);
}

const probe = spawnSync(
  "ffprobe",
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    src,
  ],
  { encoding: "utf8" },
);
const durationSec = Number.parseFloat((probe.stdout || "").trim());
if (!Number.isFinite(durationSec) || durationSec <= 0) {
  console.error("[assets:prologue:web] ffprobe a échoué — installe ffmpeg.");
  process.exit(1);
}

const bytesPerSec = (targetMb * 1024 * 1024) / durationSec;
const videoKbps = Math.max(1200, Math.floor((bytesPerSec * 8) / 1000 * 0.92));

console.log(
  `[assets:prologue:web] Encodage ${durationSec.toFixed(1)}s → ~${targetMb} Mo (vidéo ~${(videoKbps / 1000).toFixed(1)} Mbps)…`,
);

const args = [
  "-y",
  "-i",
  src,
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-profile:v",
  "high",
  "-preset",
  "slow",
  "-movflags",
  "+faststart",
  "-b:v",
  `${videoKbps}k`,
  "-maxrate",
  `${Math.round(videoKbps * 1.15)}k`,
  "-bufsize",
  `${videoKbps * 2}k`,
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-ac",
  "2",
  dest,
];

const enc = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (enc.status !== 0) {
  console.error("[assets:prologue:web] ffmpeg a échoué.");
  process.exit(enc.status ?? 1);
}

const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
console.log(`[assets:prologue:web] Écrit public/Prologue.web.mp4 (${mb} Mo)`);

if (statSync(dest).size > 100 * 1024 * 1024) {
  console.warn(
    "[assets:prologue:web] Encore >100 Mo — baisse PROLOGUE_WEB_TARGET_MB=85 ou passe en Vercel Pro / CDN.",
  );
}
