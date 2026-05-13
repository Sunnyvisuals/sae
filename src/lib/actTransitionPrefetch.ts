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

/** Chunk lazy `AlgeriaMap` — à précharger pendant l’intro pour un passage acte I sans attente. */
export function prefetchAct1MapChunk(): Promise<unknown> {
  return import("../components/Immersive/AlgeriaMap");
}

/** Chunk lazy `Act2` — à précharger pendant la carte pour un iframe qui s’ouvre plus vite. */
export function prefetchAct2ShellChunk(): Promise<unknown> {
  return import("../components/Immersive/Act2");
}

let parcheminDocumentPrefetched = false;

/** `<link rel=prefetch>` sur la page parchemin (même URL que l’iframe acte II). */
export function prefetchParcheminSenacDocument(): void {
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
