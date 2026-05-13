const WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.webm`;
const MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.mp4`;

function browserLikelyPlaysWebm(): boolean {
  if (typeof document === "undefined") return true;
  const v = document.createElement("video");
  const c =
    v.canPlayType('video/webm; codecs="vp09.00.10.08"') ||
    v.canPlayType("video/webm");
  return c === "probably" || c === "maybe";
}

/** Attend `canplaythrough` sur une URL (buffer prêt pour enchaîner la lecture). */
function waitCanPlayThrough(src: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(tid);
      v.removeAttribute("src");
      v.load();
      resolve(ok);
    };
    const tid = window.setTimeout(() => settle(false), timeoutMs);
    v.addEventListener("canplaythrough", () => settle(true), { once: true });
    v.addEventListener("error", () => settle(false), { once: true });
    v.src = src;
    v.load();
  });
}

/**
 * Précharge la transition Acte I → II **avant** d’afficher le pont (Acte I reste visible).
 * WebM d’abord si le navigateur l’annonce, sinon MP4.
 */
export async function prefetchAct12BridgeVideo(): Promise<void> {
  if (typeof document === "undefined") return;
  if (browserLikelyPlaysWebm()) {
    const ok = await waitCanPlayThrough(WEBM, 12000);
    if (ok) return;
  }
  await waitCanPlayThrough(MP4, 12000);
}
