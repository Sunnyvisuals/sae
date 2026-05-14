/** Courbe commune Intro → langues et Acte I → II (révélation liée au `timeupdate` de la WebM pont). */
export function transitionBridgeRevealFromTimeRatio(tRaw: number): number {
  const u =
    (tRaw - TRANSITION_BRIDGE_REVEAL_T0) /
    (TRANSITION_BRIDGE_REVEAL_T1 - TRANSITION_BRIDGE_REVEAL_T0);
  const c = Math.min(1, Math.max(0, u));
  return 1 - (1 - c) * (1 - c);
}

export const TRANSITION_BRIDGE_REVEAL_T0 = 0.06;
export const TRANSITION_BRIDGE_REVEAL_T1 = 0.93;

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

/** Secondes après la fin séquentielle titre/sous-titre avant ouverture du pont langue (= 0.95 + holdBeforeGate). */
export const ACT12_BRIDGE_PREFACE_DELAY_S =
  0.95 +
  Math.max(
    0,
    LANG_GATE_HOLD_AFTER_TIMELINE_S -
      Math.min(LANG_GATE_TIMELINE_OVERLAP_S, LANG_GATE_HOLD_AFTER_TIMELINE_S * 0.5),
  );

export const ACT12_BRIDGE_PREFACE_DELAY_MS = Math.round(ACT12_BRIDGE_PREFACE_DELAY_S * 1000);
