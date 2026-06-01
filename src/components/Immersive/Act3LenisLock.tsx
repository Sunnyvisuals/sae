"use client";

import { useLenis } from "lenis/react";

/** Acte III : scène plein écran sans scroll document (évite décalage des `fixed` sous Lenis / Safari). */
export default function Act3LenisLock() {
  useLenis((lenis) => {
    if (!lenis) return;
    lenis.stop();
    lenis.scrollTo(0, { immediate: true });
    return () => {
      lenis.start();
    };
  }, []);

  return null;
}
