import { useEffect, useState } from "react";

type DocWithFs = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type ElWithFs = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

export function isFullscreenApiSupported(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as ElWithFs;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function getDocumentFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const d = document as DocWithFs;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

export async function requestDocumentFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as ElWithFs;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function exitDocumentFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  const d = document as DocWithFs;
  if (!getDocumentFullscreenElement()) return;
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
  } catch {
    /* ignore */
  }
}

/** Hook : état plein écran du document (préfixes WebKit). */
export function useDocumentFullscreenActive(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(!!getDocumentFullscreenElement());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as EventListener);
    };
  }, []);

  return active;
}
