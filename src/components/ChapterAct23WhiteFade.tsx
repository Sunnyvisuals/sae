"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const FADE_IN_S = 0.88;
const FADE_OUT_S = 0.92;
/** Filet si `onAnimationComplete` ne part pas (navigation / StrictMode). */
const SAFETY_MS = Math.ceil((FADE_IN_S + FADE_OUT_S + 0.35) * 1000);
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  open: boolean;
  /** Plein blanc : bascule vers l’acte III sous le voile. */
  onSwapPhase: () => void;
  /** Fin du fondu sortant : retrait du calque. */
  onComplete: () => void;
};

/** Acte II → III : fondu au blanc (sans vidéo), en continuité du voile du parchemin. */
export default function ChapterAct23WhiteFade({ open, onSwapPhase, onComplete }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion === true;
  const swappedRef = useRef(false);
  const finishedRef = useRef(false);
  const onSwapPhaseRef = useRef(onSwapPhase);
  const onCompleteRef = useRef(onComplete);
  onSwapPhaseRef.current = onSwapPhase;
  onCompleteRef.current = onComplete;
  const [phase, setPhase] = useState<"in" | "out">("in");

  const finishBridge = useRef(() => {
    if (finishedRef.current) return;
    if (!swappedRef.current) {
      swappedRef.current = true;
      onSwapPhaseRef.current();
    }
    finishedRef.current = true;
    onCompleteRef.current();
  });

  useLayoutEffect(() => {
    if (!open || !reduced) return;
    swappedRef.current = true;
    finishedRef.current = true;
    onSwapPhaseRef.current();
    onCompleteRef.current();
  }, [open, reduced]);

  useEffect(() => {
    if (!open || reduced) return;
    swappedRef.current = false;
    finishedRef.current = false;
    setPhase("in");
    const t = window.setTimeout(() => finishBridge.current(), SAFETY_MS);
    return () => window.clearTimeout(t);
  }, [open, reduced]);

  if (!open || reduced) return null;

  return (
    <motion.div
      key={phase}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[380] min-h-[100dvh] bg-[#faf8f4]"
      initial={{ opacity: phase === "in" ? 0 : 1 }}
      animate={{ opacity: phase === "in" ? 1 : 0 }}
      transition={{ duration: phase === "in" ? FADE_IN_S : FADE_OUT_S, ease: EASE }}
      onAnimationComplete={() => {
        if (finishedRef.current) return;
        if (phase === "in") {
          if (!swappedRef.current) {
            swappedRef.current = true;
            onSwapPhaseRef.current();
          }
          setPhase("out");
          return;
        }
        finishBridge.current();
      }}
    />
  );
}
