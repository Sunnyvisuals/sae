/**
 * Fond « nuit constellation » partagé entre l’écriture acte III et le gate mot final
 * (particules fixes, halos radiaux, voile conique).
 */

export const ACT3_FIXED_STARFIELD_BG = Array.from({ length: 44 }, (_, i) => {
  const x = 5 + (((i * 53) >>> 1) % 90);
  const y = 4 + (((i * 97 + 19) >>> 1) % 88);
  const warm = i % 5 === 0;
  const op = warm ? 0.2 + (i % 3) * 0.07 : 0.26 + (i % 5) * 0.05;
  const c = warm ? `rgba(232,212,164,${op})` : `rgba(139,213,255,${op})`;
  return `radial-gradient(${1.2}px circle at ${x}% ${y}%, ${c}, transparent)`;
}).join(",");

export const ACT3_SKY_RADIAL_CSS =
  "radial-gradient(ellipse 88% 65% at 18% 12%, rgba(90,168,255,0.14), transparent 52%), radial-gradient(ellipse 70% 50% at 88% 28%, rgba(197,160,89,0.08), transparent 58%), radial-gradient(ellipse 75% 55% at 50% 110%, rgba(6,14,38,0.55), transparent 62%), radial-gradient(ellipse 80% 60% at 50% 18%, rgba(6,14,38,0.72), transparent 68%)";

export const ACT3_SKY_CONIC_CSS =
  "repeating-conic-gradient(from 0deg at 68% 42%, transparent 0deg, rgba(139,213,255,0.06) 2deg, transparent 5deg)";

/** Halos radiaux « oxyde / braises » (alternance lente avec le bleu sur le gate finale). */
export const ACT3_SKY_RADIAL_WARM_CSS =
  "radial-gradient(ellipse 88% 65% at 78% 22%, rgba(255,152,88,0.13), transparent 54%), radial-gradient(ellipse 72% 52% at 14% 68%, rgba(197,100,48,0.09), transparent 58%), radial-gradient(ellipse 75% 55% at 50% 110%, rgba(48,18,8,0.48), transparent 62%), radial-gradient(ellipse 82% 58% at 50% 16%, rgba(52,20,10,0.62), transparent 68%)";

export const ACT3_SKY_CONIC_WARM_CSS =
  "repeating-conic-gradient(from 0deg at 32% 58%, transparent 0deg, rgba(255,160,96,0.065) 2deg, transparent 5deg)";

/** Constellation chaude (même grille que la nuit bleue, teintes sable / braise). */
export const ACT3_FIXED_STARFIELD_WARM_BG = Array.from({ length: 44 }, (_, i) => {
  const x = 5 + (((i * 53) >>> 1) % 90);
  const y = 4 + (((i * 97 + 19) >>> 1) % 88);
  const ember = i % 4 !== 0;
  const op = ember ? 0.17 + (i % 3) * 0.065 : 0.2 + (i % 5) * 0.045;
  const c = ember ? `rgba(255,186,128,${op})` : `rgba(197,140,72,${op})`;
  return `radial-gradient(${1.2}px circle at ${x}% ${y}%, ${c}, transparent)`;
}).join(",");

/** Grain très léger (particules « poussière ») par-dessus les calques non canvas. */
export const ACT3_DUST_GRAIN_CSS =
  "radial-gradient(circle at 20% 30%, rgba(255,252,245,0.04) 0, transparent 0.5px), radial-gradient(circle at 78% 62%, rgba(139,213,255,0.05) 0, transparent 0.45px), radial-gradient(circle at 44% 88%, rgba(197,160,89,0.035) 0, transparent 0.4px)";
export const ACT3_DUST_GRAIN_SIZE = "120px 140px, 100px 110px, 90px 95px";

export const ACT3_DUST_GRAIN_WARM_CSS =
  "radial-gradient(circle at 24% 34%, rgba(255,244,230,0.038) 0, transparent 0.5px), radial-gradient(circle at 72% 58%, rgba(255,150,96,0.048) 0, transparent 0.45px), radial-gradient(circle at 48% 86%, rgba(197,120,64,0.04) 0, transparent 0.4px)";

/** Gate finale : cycle bleu ↔ oxyde ; chaque palier ≈ 10 s de transition douce. */
export const ACT3_FINALE_DA_WARM_CYCLE_SEC = 20;
