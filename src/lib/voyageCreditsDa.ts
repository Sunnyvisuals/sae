/**
 * Fond générique de fin - aligné `.voyage-credits` / `scroll-mode-choice` (parchemin-senac.css).
 */

import {
  ACT3_DUST_GRAIN_SIZE,
  ACT3_DUST_GRAIN_WARM_CSS,
  ACT3_FIXED_STARFIELD_WARM_BG,
  ACT3_SKY_CONIC_WARM_CSS,
  ACT3_SKY_RADIAL_WARM_CSS,
  ACT3_DUST_GRAIN_CSS,
  ACT3_FIXED_STARFIELD_BG,
  ACT3_SKY_CONIC_CSS,
  ACT3_SKY_RADIAL_CSS,
} from './act3NightSky';

/** Socle chaud « mode lecture » (#050508 + or). */
const VOYAGE_CREDITS_BASE_BG =
  'radial-gradient(ellipse 82% 58% at 50% 32%, rgba(197, 160, 89, 0.04) 0%, transparent 54%), ' +
  'linear-gradient(180deg, rgba(7, 5, 3, 0.985) 0%, rgba(5, 3, 2, 0.996) 42%, rgba(2, 1, 0, 1) 100%)';

/** Calque `.voyage-credits::before`. */
const VOYAGE_CREDITS_HALO_OVERLAY =
  'radial-gradient(ellipse 94% 72% at 50% 0%, rgba(255, 252, 245, 0.04), transparent 52%), ' +
  'radial-gradient(ellipse 58% 36% at 50% 82%, rgba(197, 160, 89, 0.06), transparent 70%)';

/** `.voyage-credits-vignette`. */
export const VOYAGE_CREDITS_VIGNETTE =
  'radial-gradient(ellipse 72% 55% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.55) 100%), ' +
  'radial-gradient(circle at 50% 100%, rgba(8, 5, 2, 0.82), transparent 52%)';

export const voyageCreditsDaWarm = {
  starfield: ACT3_FIXED_STARFIELD_WARM_BG,
  skyRadial: ACT3_SKY_RADIAL_WARM_CSS,
  skyConic: ACT3_SKY_CONIC_WARM_CSS,
  dustGrain: ACT3_DUST_GRAIN_WARM_CSS,
} as const;

export const voyageCreditsDaFinale = {
  starfield: ACT3_FIXED_STARFIELD_BG,
  skyRadial: ACT3_SKY_RADIAL_CSS,
  skyConic: ACT3_SKY_CONIC_CSS,
  dustGrain: ACT3_DUST_GRAIN_CSS,
} as const;

/** Socle nuit (fin de parcours / acte III). */
export const VOYAGE_CREDITS_BASE_BG_NIGHT =
  'radial-gradient(ellipse 82% 58% at 50% 28%, rgba(90, 168, 255, 0.055) 0%, transparent 54%), ' +
  'linear-gradient(180deg, rgba(5, 8, 18, 0.99) 0%, rgba(3, 5, 14, 0.996) 42%, rgba(1, 2, 10, 1) 100%)';

const VOYAGE_CREDITS_HALO_OVERLAY_NIGHT =
  'radial-gradient(ellipse 94% 72% at 50% 0%, rgba(180, 210, 255, 0.05), transparent 52%), ' +
  'radial-gradient(ellipse 58% 36% at 50% 82%, rgba(90, 140, 220, 0.07), transparent 70%)';

function smoothstep01(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** 0 = chaud (désert) … 1 = nuit bleue - suit le défilement du générique. */
export function creditsImmersionFromProgress(
  progress: number,
  fromAct3Finale: boolean,
): number {
  const p = smoothstep01(progress);
  if (fromAct3Finale) {
    return 0.68 + p * 0.3;
  }
  return 0.1 + p * 0.82;
}

/** Équivalent parchemin `hn * 0.42 + fn * 0.58` pour fumée / teintes. */
export function creditsHeroFriseFromImmersion(immersion: number): {
  heroT: number;
  friseT: number;
} {
  const imm = Math.min(1, Math.max(0, immersion));
  const friseT = smoothstep01(imm);
  const heroT = smoothstep01(1 - imm);
  return { heroT, friseT };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Couleur de fond racine du dialog (entre #050508 et bleu nuit). */
export function creditsRootBgColor(immersion: number): string {
  const t = smoothstep01(immersion);
  const r = Math.round(lerp(5, 3, t));
  const g = Math.round(lerp(5, 6, t));
  const b = Math.round(lerp(8, 16, t));
  return `rgb(${r}, ${g}, ${b})`;
}

export function blendCreditsBaseBg(immersion: number): string {
  const t = smoothstep01(immersion);
  if (t <= 0.001) return VOYAGE_CREDITS_BASE_BG;
  if (t >= 0.999) return VOYAGE_CREDITS_BASE_BG_NIGHT;
  const gold = lerp(0.04, 0.055, t);
  const blue = lerp(197, 90, t);
  const g2 = lerp(160, 168, t);
  const b2 = lerp(89, 255, t);
  const top = `radial-gradient(ellipse 82% 58% at 50% ${lerp(32, 28, t)}%, rgba(${Math.round(blue)}, ${Math.round(g2)}, ${Math.round(b2)}, ${gold}) 0%, transparent 54%)`;
  const r1 = Math.round(lerp(7, 5, t));
  const g1 = Math.round(lerp(5, 8, t));
  const b1 = Math.round(lerp(3, 18, t));
  const r2 = Math.round(lerp(5, 3, t));
  const g2b = Math.round(lerp(3, 5, t));
  const b2b = Math.round(lerp(2, 14, t));
  const r3 = Math.round(lerp(2, 1, t));
  const g3 = Math.round(lerp(1, 2, t));
  const b3 = Math.round(lerp(0, 10, t));
  const body = `linear-gradient(180deg, rgba(${r1}, ${g1}, ${b1}, ${lerp(0.985, 0.99, t)}) 0%, rgba(${r2}, ${g2b}, ${b2b}, ${lerp(0.996, 0.996, t)}) 42%, rgba(${r3}, ${g3}, ${b3}, 1) 100%)`;
  return `${top}, ${body}`;
}

export function blendCreditsHaloOverlay(immersion: number): string {
  const t = smoothstep01(immersion);
  if (t <= 0.001) return VOYAGE_CREDITS_HALO_OVERLAY;
  if (t >= 0.999) return VOYAGE_CREDITS_HALO_OVERLAY_NIGHT;
  const topHi = Math.round(lerp(255, 180, t));
  const topMid = Math.round(lerp(252, 210, t));
  const topLo = Math.round(lerp(245, 255, t));
  const goldR = Math.round(lerp(197, 90, t));
  const goldG = Math.round(lerp(160, 140, t));
  const goldB = Math.round(lerp(89, 220, t));
  const goldA = lerp(0.06, 0.07, t);
  return (
    `radial-gradient(ellipse 94% 72% at 50% 0%, rgba(${topHi}, ${topMid}, ${topLo}, ${lerp(0.04, 0.05, t)}), transparent 52%), ` +
    `radial-gradient(ellipse 58% 36% at 50% 82%, rgba(${goldR}, ${goldG}, ${goldB}, ${goldA}), transparent 70%)`
  );
}

/** Filtre vidéo floutée : ambre → nuit. */
export function creditsVideoFilter(immersion: number, reducedMotion: boolean): string {
  const t = smoothstep01(immersion);
  const blur = reducedMotion ? 14 : lerp(22, 24, t);
  const bright = lerp(0.28, 0.21, t);
  const sat = lerp(0.85, 0.7, t);
  const hue = t > 0.35 ? ` hue-rotate(${lerp(0, -8, (t - 0.35) / 0.65)}deg)` : '';
  return `blur(${blur}px) brightness(${bright}) saturate(${sat})${hue}`;
}
