/** Portail curseur React : toujours dernier enfant du `body` (au-dessus des overlays intro). */
export function reparentCustomCursorPortalToBodyEnd() {
  const el = document.getElementById("__custom-cursor-root");
  if (el) document.body.appendChild(el);
}

/** @deprecated Alias historique — préférer `reparentCustomCursorPortalToBodyEnd`. */
export const reparentCursorPortalToBodyEnd = reparentCustomCursorPortalToBodyEnd;

export const HTML_CURSOR_IDLE_CLASS = "al-rihla-cursor-idle";

/** Relais iframe parchemin (acte II) → portail React `CustomCursor`. */
export const SENAC_POINTER_MOVE_EVT = "al-rihla:senac-pointer";

export type SenacPointerMoveDetail = {
  clientX: number;
  clientY: number;
  down?: boolean;
};

export function dispatchSenacPointerMove(detail: SenacPointerMoveDetail) {
  document.documentElement.classList.remove(HTML_CURSOR_IDLE_CLASS);
  window.dispatchEvent(
    new CustomEvent<SenacPointerMoveDetail>(SENAC_POINTER_MOVE_EVT, { detail }),
  );
}

export function ensureCustomCursorAwake() {
  document.documentElement.classList.remove(HTML_CURSOR_IDLE_CLASS);
  reparentCustomCursorPortalToBodyEnd();
}
