/**
 * Pont **vidéo d’intro ↔ Acte I** (carte inchangée : elle lit seulement ces données).
 *
 * Cinq vers de « Corps de mon pays » (Jean Sénac) : tirage pseudo-aléatoire
 * ({@link ACT1_PICKED_LINE_INDICES} dans `act1PoemCorpsPays.ts`), pas les cinq
 * premiers vers du poème. Resynchronise la VO de {@link INTRO_VIDEO_SRC} si besoin.
 */

export {
  ACT1_PHRASE_STRIP_STEPS_AR,
  ACT1_PHRASE_STRIP_STEPS_FR,
  ACT1_REVELATION_SEQUENCE,
  ACT1_PICKED_LINE_INDICES,
  ACT1_POEM_TITLE,
} from "./act1PoemCorpsPays";

import {
  ACT1_PHRASE_STRIP_STEPS_AR,
  ACT1_PHRASE_STRIP_STEPS_FR,
  ACT1_REVELATION_SEQUENCE,
} from "./act1PoemCorpsPays";
import { isIntroVideoHlsSrc } from "./introVideoMedia";

const introVideoBase = import.meta.env.BASE_URL.replace(/\/?$/, "/");

const envIntroVideoUrl = import.meta.env.VITE_INTRO_VIDEO_URL;
const introVideoUrlFromEnv =
  typeof envIntroVideoUrl === "string" ? envIntroVideoUrl.trim() : "";

const localPrologueMp4 = `${introVideoBase}Prologue.mp4`;

/**
 * Prod : `/Prologue.mp4` sur le même domaine (Vercel) — pas de CDN Bunny (403).
 * Dev : override `VITE_INTRO_VIDEO_URL` ou fichier local.
 */
export const INTRO_VIDEO_SRC = import.meta.env.PROD
  ? localPrologueMp4
  : introVideoUrlFromEnv && !isIntroVideoHlsSrc(introVideoUrlFromEnv)
    ? introVideoUrlFromEnv
    : introVideoUrlFromEnv || localPrologueMp4;

/** Même origine en prod — pas de crossOrigin. */
export const INTRO_VIDEO_CROSS_ORIGIN = Boolean(
  introVideoUrlFromEnv && /^https:\/\//i.test(introVideoUrlFromEnv),
);

/** Dev : strip et liste ordonnée restent synchrones. */
function assertAct1PhraseStripsOrdered(): void {
  if (import.meta.env.PROD) return;
  const check = (rows: readonly { word: string }[], label: string) => {
    if (rows.length !== ACT1_REVELATION_SEQUENCE.length) {
      console.warn(`[act1IntroBridge] ${label}: nombre d’étapes ≠ révélations.`);
      return;
    }
    for (let i = 0; i < ACT1_REVELATION_SEQUENCE.length; i++) {
      const expected = ACT1_REVELATION_SEQUENCE[i];
      const got = rows[i]?.word;
      if (got !== expected) {
        console.warn(`[act1IntroBridge] ${label}: à l’index ${i}, attendu "${expected}", reçu "${got}".`);
      }
    }
  };
  check(ACT1_PHRASE_STRIP_STEPS_FR, "FR");
  check(ACT1_PHRASE_STRIP_STEPS_AR, "AR");
}

assertAct1PhraseStripsOrdered();
