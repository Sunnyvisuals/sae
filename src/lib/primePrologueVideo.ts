import { INTRO_VIDEO_SRC } from "./act1IntroBridge";

let networkPrimed = false;
let hiddenPrimeVideo: HTMLVideoElement | null = null;

/** Lance le téléchargement du prologue dès le chargement de l’app (avant le tuto). */
export function primePrologueVideoPreload(): void {
  if (networkPrimed || typeof document === "undefined") return;
  const href = INTRO_VIDEO_SRC?.trim();
  if (!href) return;

  networkPrimed = true;

  const selector = `link[rel="preload"][href="${CSS.escape(href)}"]`;
  if (!document.head.querySelector(selector)) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = href;
    link.type = "video/mp4";
    document.head.appendChild(link);
  }

  /** Buffer réel dans le cache média (plus fiable que `<link rel=preload>` seul). */
  if (!hiddenPrimeVideo) {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.style.cssText =
      "position:fixed;width:0;height:0;opacity:0;pointer-events:none;visibility:hidden";
    v.src = href;
    v.load();
    document.body.appendChild(v);
    hiddenPrimeVideo = v;
  }
}
