"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

/** Distance de molette / touch équivalente pour atteindre 100 %. */
const SCROLL_BUDGET = 980;
const COMPLETE_HOLD_MS = 520;

type Props = {
  active: boolean;
  reduceMotion: boolean;
  scrollCue: string;
  loadingLabel: string;
  continueLabel: string;
  onComplete: () => void;
};

export default function Act3ConstellationScrollLoad({
  active,
  reduceMotion,
  scrollCue,
  loadingLabel,
  continueLabel,
  onComplete,
}: Props) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const touchYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      progressRef.current = 0;
      completedRef.current = false;
      touchYRef.current = null;
      setProgress(0);
      return;
    }
    if (reduceMotion) return;

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      progressRef.current = 1;
      setProgress(1);
      window.setTimeout(onComplete, COMPLETE_HOLD_MS);
    };

    const addDelta = (dy: number) => {
      if (completedRef.current || dy <= 0) return;
      const next = Math.min(1, progressRef.current + dy / SCROLL_BUDGET);
      progressRef.current = next;
      setProgress(next);
      if (next >= 1) finish();
    };

    const onWheel = (e: WheelEvent) => {
      if (completedRef.current) return;
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      e.preventDefault();
      addDelta(Math.abs(e.deltaY) * 0.88);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (completedRef.current || touchYRef.current == null) return;
      const y = e.touches[0]?.clientY;
      if (y == null) return;
      const dy = touchYRef.current - y;
      touchYRef.current = y;
      if (dy > 0) addDelta(dy * 1.15);
    };

    const onKey = (e: KeyboardEvent) => {
      if (completedRef.current || e.repeat) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      e.preventDefault();
      finish();
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [active, reduceMotion, onComplete]);

  if (!active) return null;

  if (reduceMotion) {
    return (
      <button type="button" onClick={onComplete} className="da-act3-continue mt-1">
        {continueLabel}
      </button>
    );
  }

  const pct = Math.min(100, Math.round(progress * 100));
  const loading = progress > 0.04;

  return (
    <motion.div
      className="mt-1 flex w-full max-w-[min(100%,20rem)] flex-col items-center gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        aria-hidden
        className="opacity-80"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      >
        <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="rgba(197, 160, 89, 0.68)"
            strokeWidth="1.35"
            d="M14 17.5 L22 25 L30 17.5"
          />
        </svg>
      </motion.div>

      <p className="da-act3-micro m-0 text-center">{scrollCue}</p>

      <div
        className="da-act3-scroll-load-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={loadingLabel}
      >
        <div
          className="da-act3-scroll-load-fill"
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden
        />
        <motion.div
          className="da-act3-scroll-load-shimmer"
          aria-hidden
          animate={{ opacity: loading ? [0.35, 0.75, 0.35] : 0 }}
          transition={{
            duration: 1.8,
            repeat: loading && progress < 1 ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      </div>

      <p
        className={
          "da-act3-scroll-load-status m-0 min-h-[1.1em] tabular-nums " +
          (loading ? "text-solar-gold/62" : "text-transparent")
        }
        aria-live="polite"
      >
        {loading ? (
          <>
            {loadingLabel}
            {progress < 1 ? <span className="ml-1.5 opacity-70">{pct}%</span> : null}
          </>
        ) : (
          <span className="sr-only">{scrollCue}</span>
        )}
      </p>
    </motion.div>
  );
}
