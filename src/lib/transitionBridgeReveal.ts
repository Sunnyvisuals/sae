/** Courbe commune Intro → langues et Acte I → II (révélation liée au `timeupdate` de la WebM pont). */
const TRANSITION_BRIDGE_REVEAL_T0 = 0.06;
const TRANSITION_BRIDGE_REVEAL_T1 = 0.93;

export function transitionBridgeRevealFromTimeRatio(tRaw: number): number {
  const u =
    (tRaw - TRANSITION_BRIDGE_REVEAL_T0) /
    (TRANSITION_BRIDGE_REVEAL_T1 - TRANSITION_BRIDGE_REVEAL_T0);
  const c = Math.min(1, Math.max(0, u));
  return 1 - (1 - c) * (1 - c);
}

/** Fondu vidéo / UI comme le volet langue (`LANGUAGE_GATE_VIDEO_UI_CROSSFADE_MS`). */
export const TRANSITION_BRIDGE_VIDEO_CROSSFADE_MS = 720;

/** SFX fumée / sable en parallèle de la lecture du pont (`Intro.tsx`). */
export const TRANSITION_BRIDGE_SMOKE_SFX = `${import.meta.env.BASE_URL}sounds/smoke-transition-slow.wav`;

/**
 * Timing identique Intro : après la ligne du sous-titre, pause puis hold avant ouverture du pont.
 * Voir GSAP `.to({}, { duration: 0.95 }).to({}, { duration: holdBeforeGate }).call(openArrivalLanguageGate)` dans `Intro.tsx`.
 */
export const LANG_GATE_HOLD_AFTER_TIMELINE_S = 6.5;
export const LANG_GATE_TIMELINE_OVERLAP_S = 1.45;

/**
 * Après complétion de la carte mémoire (fin acte I) : court délai avant montage du pont WebM.
 * Trop long = impression « attente sur la carte » sans transi ; 1,5–2,5 s garde un battement lisible.
 */
export const ACT12_POST_MAP_COMPLETE_DELAY_MS = 1_700;

/**
 * Part du clip (0–1) après laquelle on monte l’acte II sous la WebM.
 * Plus bas = parchemin plus tôt sous le pont ; ~0,43 = léger recul pour un peu plus de pont carte+vidéo avant la queue sur l’acte II.
 */
export const ACT12_SWAP_TO_ACT2_RAW_RATIO = 0.00;

/**
 * Après montage du pont : délai avant `play()` (ms). 0 = la WebM bouge tout de suite (pas d’écran figé).
 */
export const ACT12_WEBM_PLAY_DELAY_MS = 0;
