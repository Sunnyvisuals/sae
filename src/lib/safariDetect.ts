/** Safari desktop / iOS (pas Chrome, Edge, Firefox, Opera). */
export function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (!/Safari/i.test(ua)) return false;
  return !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|Opera|OPiOS|SamsungBrowser/i.test(
    ua,
  );
}

/** Classe `html.is-safari` + gestes qui perturbent le scroll (pincement). */
export function initSafariCompat(): void {
  if (typeof document === "undefined" || !isSafariBrowser()) return;
  document.documentElement.classList.add("is-safari");

  document.addEventListener(
    "gesturestart",
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener(
    "gesturechange",
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false, capture: true },
  );
}
