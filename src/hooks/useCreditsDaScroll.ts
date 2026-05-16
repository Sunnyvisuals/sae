'use client';

import { useEffect, useState, type MutableRefObject } from 'react';
import { creditsImmersionFromProgress } from '../lib/voyageCreditsDa';

/** Immersion 0→1 mise à jour pendant le défilement GSAP des crédits. */
export function useCreditsDaScroll(
  active: boolean,
  fromAct3Finale: boolean,
  creditsProgressRef: MutableRefObject<number>,
): number {
  const [immersion, setImmersion] = useState(() =>
    creditsImmersionFromProgress(0, fromAct3Finale),
  );

  useEffect(() => {
    if (!active) {
      setImmersion(creditsImmersionFromProgress(0, fromAct3Finale));
      return;
    }
    let raf = 0;
    let last = -1;
    const tick = () => {
      const next = creditsImmersionFromProgress(
        creditsProgressRef.current,
        fromAct3Finale,
      );
      if (Math.abs(next - last) > 0.0025) {
        last = next;
        setImmersion(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, fromAct3Finale, creditsProgressRef]);

  return immersion;
}
