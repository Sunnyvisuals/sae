/** Easing et durées — apparition des comètes (canvas acte III). */

export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function easeOutExpo(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
}

/** Léger dépassement puis retour (halo / noyau). */
export function easeOutBack(t: number, overshoot = 0.9): number {
  const x = Math.min(1, Math.max(0, t));
  const c = overshoot + 1;
  return 1 + c * (x - 1) ** 3 + overshoot * (x - 1) ** 2;
}

export function cometCoreScale(progress: number): number {
  if (progress >= 1) return 1;
  if (progress <= 0) return 0;
  return 0.12 + easeOutBack(progress, 0.75) * 0.88;
}

export function cometGlowScale(progress: number): number {
  if (progress >= 1) return 1;
  if (progress <= 0) return 0;
  const bloom = progress < 0.55 ? easeOutExpo(progress / 0.55) : 1;
  const settle = progress < 0.55 ? 1 : 1 - (progress - 0.55) * 0.22;
  return bloom * (1.35 + (1 - settle) * 0.45) * settle;
}

export function cometAlpha(progress: number): number {
  if (progress >= 1) return 1;
  if (progress <= 0) return 0;
  return easeOutCubic(Math.min(1, progress * 1.15));
}

/** Angle de traînée d’entrée (stable par id). */
export function cometTrailAngleRad(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 360) * (Math.PI / 180);
}
