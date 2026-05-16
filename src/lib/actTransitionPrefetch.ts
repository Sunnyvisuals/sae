import { prefetchAct12BridgeVideo } from "./act12BridgePrefetch";
import { prefetchAct23BridgeVideo } from "./act23Bridge";
import { PARCHEMIN_STATIC_QUERY } from "./parcheminAssetVersion";

/** Lance une tâche basse priorité ; annulable au démontage / changement de phase. */
export function runWhenIdle(task: () => void, timeoutMs = 2800): () => void {
  if (typeof window === "undefined") {
    task();
    return () => {};
  }
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(() => task(), { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const tid = window.setTimeout(task, 700);
  return () => window.clearTimeout(tid);
}

/** Chunk lazy `AlgeriaMap` - à précharger pendant l’intro pour un passage acte I sans attente. */
function prefetchAct1MapChunk(): Promise<unknown> {
  return import("../components/Immersive/AlgeriaMap");
}

/**
 * Premier geste sur la page : déclenche le préchargement du chunk carte tout de suite
 * (Lighthouse navigation ne simule pas d’interaction → pas de téléchargement prématuré du chunk).
 */
export function attachAct1MapPrefetchOnFirstUserGesture(): () => void {
  if (typeof window === "undefined") return () => {};
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    void prefetchAct1MapChunk();
    window.removeEventListener("pointerdown", fire, true);
    window.removeEventListener("keydown", fire, true);
  };
  window.addEventListener("pointerdown", fire, { passive: true, capture: true });
  window.addEventListener("keydown", fire, { capture: true });
  return () => {
    done = true;
    window.removeEventListener("pointerdown", fire, true);
    window.removeEventListener("keydown", fire, true);
  };
}

/**
 * File d’attente après `load` + léger délai : évite de rivaliser avec FCP/LCP et le thread principal
 * au tout premier chargement (même rendu final ; les joueurs interactifs sont couverts par le geste ci-dessus).
 */
export function scheduleIdleAct1MapPrefetchAfterLoad(): () => void {
  if (typeof window === "undefined") return () => {};
  let cancelIdle: (() => void) | undefined;
  let settleTimer = 0;
  let cancelled = false;

  const arm = () => {
    if (cancelled) return;
    cancelIdle = runWhenIdle(() => {
      void prefetchAct1MapChunk();
    }, 9200);
  };

  const onLoad = () => {
    if (cancelled) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(arm, 420);
  };

  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });

  return () => {
    cancelled = true;
    window.clearTimeout(settleTimer);
    window.removeEventListener("load", onLoad);
    cancelIdle?.();
  };
}

/** Chunk lazy `Act2` - à précharger pendant la carte pour un iframe qui s’ouvre plus vite. */
function prefetchAct2ShellChunk(): Promise<unknown> {
  return import("../components/Immersive/Act2");
}

let parcheminDocumentPrefetched = false;

/** `<link rel=prefetch>` sur la page parchemin (même URL que l’iframe acte II). */
function prefetchParcheminSenacDocument(): void {
  if (typeof document === "undefined" || parcheminDocumentPrefetched) return;
  parcheminDocumentPrefetched = true;
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const href = `${prefix}parchemin-senac.html?${PARCHEMIN_STATIC_QUERY}`;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  link.as = "document";
  document.head.appendChild(link);
}

/**
 * Pendant l’acte I : prépare acte II (bundle + HTML parchemin + vidéo de pont).
 * Idempotent grâce aux gardes internes / promesses partagées.
 */
export function prefetchAct2TransitionAssets(): void {
  void prefetchAct2ShellChunk();
  prefetchParcheminSenacDocument();
  void prefetchAct12BridgeVideo();
  prefetchAct23BridgeVideo();
}
