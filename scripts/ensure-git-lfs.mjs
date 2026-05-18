/**
 * Active les hooks Git LFS après clone / npm install.
 * Sans LFS, public/Prologue.mp4 reste un petit fichier texte (pointeur) au lieu de la vidéo.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prologue = resolve(root, "public/Prologue.mp4");

function run(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function hasGitRepo() {
  try {
    run("git rev-parse --git-dir");
    return true;
  } catch {
    return false;
  }
}

if (!hasGitRepo()) process.exit(0);

try {
  run("git lfs version");
} catch {
  console.warn(
    "[git-lfs] Git LFS n’est pas installé. Télécharge-le : https://git-lfs.github.com\n" +
      "         Sans LFS, Prologue.mp4 (~340 Mo) ne sera pas la vraie vidéo après un clone.",
  );
  process.exit(0);
}

try {
  run("git lfs install");
} catch (e) {
  console.warn("[git-lfs] git lfs install a échoué :", e?.message ?? e);
  process.exit(0);
}

if (existsSync(prologue)) {
  const head = readFileSync(prologue, "utf8").slice(0, 40);
  const isPointer = head.startsWith("version https://git-lfs.github.com");
  const mb = statSync(prologue).size / (1024 * 1024);
  if (isPointer && mb < 1) {
    console.warn(
      "[git-lfs] public/Prologue.mp4 est un pointeur LFS (pas encore la vidéo). Lance : git lfs pull",
    );
  }
}

try {
  const tracked = run("git lfs ls-files");
  if (tracked) console.log("[git-lfs] Fichiers suivis :\n" + tracked.split("\n").map((l) => "  " + l).join("\n"));
} catch {
  /* ignore */
}
