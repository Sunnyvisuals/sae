import { INTRO_VIDEO_SRC } from "./act1IntroBridge";

let networkPrimed = false;

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
}
