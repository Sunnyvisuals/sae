/** Portail curseur React : toujours dernier enfant du `body` (au-dessus des overlays intro). */
export function reparentCustomCursorPortalToBodyEnd() {
  const el = document.getElementById("__custom-cursor-root");
  if (el) document.body.appendChild(el);
}

/** @deprecated Alias historique — préférer `reparentCustomCursorPortalToBodyEnd`. */
export const reparentCursorPortalToBodyEnd = reparentCustomCursorPortalToBodyEnd;

export const HTML_CURSOR_IDLE_CLASS = "al-rihla-cursor-idle";

export function ensureCustomCursorAwake() {
  document.documentElement.classList.remove(HTML_CURSOR_IDLE_CLASS);
  reparentCustomCursorPortalToBodyEnd();
}
