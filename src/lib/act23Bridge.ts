/**
 * Pont **Acte II → III** : déposer une vidéo avec piste audio sous `public/transitions/`
 * (ex. `trans2-alpha-act23.webm` + `.mp4`). Repli : transition alpha puis prologue MP4 (son + image).
 */
const prefix = (() => {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
})();

export const ACT23_BRIDGE_WEBM = `${prefix}transitions/trans2-alpha-act23.webm`;
export const ACT23_BRIDGE_WEBM_LEGACY = `${prefix}transitions/trans2-alpha.webm`;
export const ACT23_BRIDGE_MP4 = `${prefix}transitions/trans2-alpha-act23.mp4`;
export const ACT23_BRIDGE_MP4_LEGACY = `${prefix}transitions/trans2-alpha.mp4`;
/** Repli audible / visible (même fichier que le prologue). */
export const ACT23_BRIDGE_MP4_FALLBACK = `${prefix}al-rihla.mp4`;

let act23VideoPrefetched = false;

export function prefetchAct23BridgeVideo(): void {
  if (typeof document === "undefined" || act23VideoPrefetched) return;
  act23VideoPrefetched = true;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = ACT23_BRIDGE_WEBM_LEGACY;
  link.as = "video";
  document.head.appendChild(link);
}
