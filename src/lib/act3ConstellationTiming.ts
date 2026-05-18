/** Easing partagé acte III (scroll-mode-choice). */
export const ACT3_EASE = [0.22, 1, 0.36, 1] as const;

/** Multiplicateur global — plus lent qu’avant ; au-delà de ~2,2 l’UI peut sembler figée. */
const S = import.meta.env.DEV ? 1.4 : 2.05;

export function act3Sec(baseSec: number, reducedMotion: boolean): number {
  return reducedMotion ? Math.max(0.12, baseSec * 0.14) : baseSec * S;
}

export function act3Ms(baseMs: number, reducedMotion: boolean): number {
  return reducedMotion ? Math.max(100, Math.round(baseMs * 0.14)) : Math.round(baseMs * S);
}

export function act3Fade(reducedMotion: boolean, baseDurationSec = 1.1) {
  return { duration: act3Sec(baseDurationSec, reducedMotion), ease: ACT3_EASE };
}

export function act3FadeDelayed(
  reducedMotion: boolean,
  delayBaseSec: number,
  baseDurationSec = 1.1,
) {
  return {
    duration: act3Sec(baseDurationSec, reducedMotion),
    delay: reducedMotion ? 0 : delayBaseSec * S,
    ease: ACT3_EASE,
  };
}

/** Intro — une phrase à la fois. */
export const ACT3_INTRO_LINE2_MS = act3Ms(2200, false);
export const ACT3_INTRO_LINE3_MS = act3Ms(5000, false);
export const ACT3_INTRO_TO_SELECT_MS = act3Ms(7800, false);
export const ACT3_INTRO_TO_SELECT_REDUCED_MS = act3Ms(6200, true);

/** Outro → crédits. */
export const ACT3_OUTRO_LINE2_MS = act3Ms(1500, false);
export const ACT3_OUTRO_LINE3_MS = act3Ms(4500, false);
export const ACT3_OUTRO_TO_CREDITS_MS = act3Ms(6800, false);
export const ACT3_OUTRO_TO_CREDITS_REDUCED_MS = act3Ms(1800, true);

/** GSAP — mots flottants (révélation + dérive, plus lent que le reste de l’acte). */
const WORD_M = import.meta.env.DEV ? 1.55 : 2.3;

export const ACT3_WORD_REVEAL_EACH_SEC = 1.12 * WORD_M;
/** Pause entre deux mots (timeline chaînée). */
export const ACT3_WORD_REVEAL_GAP_SEC = 0.28 * WORD_M;
export const ACT3_WORD_APPEAR_DELAY = 0.55 * WORD_M;
export const ACT3_WORD_DRIFT_SCALE = WORD_M;
/** @deprecated Utiliser la timeline chaînée ; conservé pour imports externes éventuels. */
export const ACT3_WORD_APPEAR_DURATION = ACT3_WORD_REVEAL_EACH_SEC;
export const ACT3_WORD_APPEAR_STAGGER = ACT3_WORD_REVEAL_EACH_SEC;
export const ACT3_WORD_OTHERS_FADE = 0.9 * S;
export const ACT3_WORD_RISE_DURATION = 1.15 * S;
export const ACT3_WORD_RISE_FALL_DURATION = 2 * S;
export const ACT3_STAR_GEM_DURATION = 0.55 * S;
export const ACT3_CONFIRM_FORM_DELAY_MS = act3Ms(200, false);
export const ACT3_PICK_FALLBACK_MS = act3Ms(2600, false);

/** Scroll chargement constellation. */
export const ACT3_SCROLL_BUDGET = Math.round(980 * S);
export const ACT3_SCROLL_COMPLETE_HOLD_MS = act3Ms(520, false);

/** Focus caméra « Voir mon étoile » : zoom in → pause → zoom out. */
export const ACT3_STAR_FOCUS_ZOOM_IN_MS = act3Ms(1500, false);
export const ACT3_STAR_FOCUS_HOLD_MS = act3Ms(2600, false);
export const ACT3_STAR_FOCUS_ZOOM_OUT_MS = act3Ms(1650, false);

/** Apparition d’une comète (canvas). */
export const ACT3_COMET_APPEAR_MS = act3Ms(1280, false);
export const ACT3_COMET_APPEAR_STAGGER_MS = act3Ms(88, false);
export const ACT3_COMET_APPEAR_LEAD_MS = act3Ms(280, false);

/** Révélation du ciel (canvas) — couvre le décalage + la dernière comète. */
export function act3SkyRevealDurationMs(starCount: number, reducedMotion: boolean): number {
  if (reducedMotion) return act3Ms(320, true);
  const n = Math.max(1, starCount);
  const total =
    ACT3_COMET_APPEAR_LEAD_MS +
    (n - 1) * ACT3_COMET_APPEAR_STAGGER_MS +
    ACT3_COMET_APPEAR_MS +
    180;
  return Math.min(7200, total);
}

/** Fondu acte III ↔ crédits (App + overlay). */
export const ACT3_SCENE_EXIT_FADE_SEC = 2.85 * S;
export const ACT3_SCENE_ENTER_FADE_SEC = 0.9 * S;
export const ACT3_CREDITS_CROSSFADE_SEC = 2.85 * S;
