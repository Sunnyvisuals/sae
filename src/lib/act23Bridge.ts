/**
 * Pont **Acte II → III** : déposer une vidéo avec piste audio sous `public/transitions/`.
 * Si les fichiers dédiés manquent, le lecteur retombe sur `trans2-alpha.webm` (souvent muet).
 */
const prefix = (() => {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
})();

export const ACT23_BRIDGE_MP4 = `${prefix}transitions/trans2-alpha.webm`;
export const ACT23_BRIDGE_WEBM = `${prefix}transitions/trans2-alpha.webm`;
export const ACT23_BRIDGE_FALLBACK_WEBM = `${prefix}transitions/trans2-alpha.webm`;

let act23VideoPrefetched = false;

export function prefetchAct23BridgeVideo(): void {
  if (typeof document === "undefined" || act23VideoPrefetched) return;
  act23VideoPrefetched = true;
  for (const href of [ACT23_BRIDGE_MP4, ACT23_BRIDGE_WEBM, ACT23_BRIDGE_FALLBACK_WEBM]) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "video";
    document.head.appendChild(link);
  }
}
