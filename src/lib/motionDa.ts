/** Courbe DA commune — entrées texte lentes et douces. */
export const DA_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

/** Crossfade corps de texte (exit complet avant enter avec AnimatePresence wait). */
export const DA_TEXT_CROSSFADE = {
  exit: { reduced: 0.4, normal: 0.62 },
  enter: { reduced: 0.48, normal: 1.02 },
  enterDelay: { reduced: 0.06, normal: 0.12 },
} as const;

/** Changement d’étape tutoriel prologue (Immersion ↔ volume). */
export const DA_TUTORIAL_STEP = {
  exit: { reduced: 0.36, normal: 0.62 },
  enter: { reduced: 0.48, normal: 1.12 },
  enterDelay: { reduced: 0.1, normal: 0.2 },
  exitY: -8,
  enterY: 12,
} as const;

/** Première apparition du tuto après chargement. */
export const DA_TUTORIAL_SHELL = {
  delay: { reduced: 0.08, normal: 0.28 },
  duration: { reduced: 0.45, normal: 1.55 },
  scrim: { reduced: 0.38, normal: 1.45 },
  headerDelay: { reduced: 0.16, normal: 0.72 },
  bodyDelay: { reduced: 0.22, normal: 0.95 },
  bodyDuration: { reduced: 0.42, normal: 1.28 },
  bodyY: 16,
  handoffReleaseMs: { reduced: 560, normal: 2280 },
} as const;

/** Étape I → II (volume) — aligné sur le corps central. */
export const DA_VOLUME_STEP = {
  delay: { reduced: 0.14, normal: 0.62 },
  duration: { reduced: 0.4, normal: 1.15 },
  enterY: 14,
} as const;

/** Plein écran inline → coin (prologue tuto). */
export const DA_FULLSCREEN_HANDOFF = {
  exit: { reduced: 0.38, normal: 0.58 },
  exitY: 8,
  cornerEnter: { reduced: 0.22, normal: 0.55 },
  cornerEnterDelay: { reduced: 0.04, normal: 0.1 },
} as const;

export function daPick<T extends Record<"reduced" | "normal", number>>(
  reduced: boolean,
  pair: T
): number {
  return reduced ? pair.reduced : pair.normal;
}
