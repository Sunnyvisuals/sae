import { useSyncExternalStore } from "react";

function subscribeMq(query: string, onStoreChange: () => void): () => void {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

/**
 * SSR-safe (`false` tant que pas d’hydratation) ; lecture synchrone au premier paint client -
 * évite un tour `useEffect` où `SplashCursor` ne montait pas / restait désactivé.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribeMq(query, cb),
    () => window.matchMedia(query).matches,
    () => false
  );
}
