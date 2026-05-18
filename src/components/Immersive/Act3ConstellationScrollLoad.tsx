"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  ACT3_SCROLL_BUDGET,
  ACT3_SCROLL_COMPLETE_HOLD_MS,
} from "../../lib/act3ConstellationTiming";

type Props = {
  active: boolean;
  reduceMotion: boolean;
  scrollCue: string;
  continueLabel: string;
  viewMyStarLabel?: string | null;
  onViewMyStar?: () => void;
  onComplete: () => void;
};

/** Bouton « Voir mon étoile » — fixé en bas. */
function Act3ViewMyStarBottom({
  label,
  onClick,
  visible,
}: {
  label: string;
  onClick: () => void;
  visible: boolean;
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalRoot(document.body);
  }, []);

  if (!visible || !portalRoot) return null;

  return createPortal(
    <motion.button
      type="button"
      onClick={onClick}
      className="da-act3-view-star pointer-events-auto fixed left-1/2 z-[520] -translate-x-1/2 cursor-pointer"
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      aria-label={label}
    >
      {label}
    </motion.button>,
    portalRoot,
  );
}

/** Barre, % et consignes — fixés en haut de page. */
function Act3TopScrollChrome({
  progress,
  scrollCue,
}: {
  progress: number;
  scrollCue: string;
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const p = Math.min(1, Math.max(0, progress));
  const pct = Math.round(p * 100);

  useLayoutEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useLayoutEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    el.style.transform = `scaleX(${p})`;
  }, [p]);

  const chrome = (
    <motion.div
      className="pointer-events-none fixed inset-x-0 z-[480] flex flex-col items-center"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative h-[2px] w-full shrink-0">
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-[1px]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`${pct}%`}
        >
          <motion.div
            className="absolute inset-0 rounded-[1px] bg-[rgba(0,8,20,0.32)] shadow-[inset_0_1px_0_rgba(255,252,245,0.06),0_0_18px_rgba(0,0,0,0.45)]"
            aria-hidden
          />
          <motion.div
            ref={fillRef}
            className="absolute left-0 top-0 h-full w-full origin-left rounded-[1px] will-change-transform"
            style={{
              transform: "scaleX(0)",
              background:
                "linear-gradient(90deg, rgba(197,160,89,0.35) 0%, rgba(232,212,164,0.92) 55%, rgba(197,160,89,0.55) 100%)",
              boxShadow: "0 0 14px rgba(197, 160, 89, 0.28)",
            }}
            aria-hidden
          />
        </motion.div>
      </div>
      <p className="da-act3-scroll-load-pct m-0 mt-4 shrink-0" aria-hidden>
        {pct}
      </p>

      <motion.div
        className="da-act3-scroll-load-cue mt-3 flex w-full max-w-[min(100%,36rem)] flex-col items-center gap-3 px-4 pb-3 pt-1"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        aria-live="polite"
      >
        <p className="da-act3-scroll-load-cue-line m-0 w-full text-center">{scrollCue}</p>
      </motion.div>
    </motion.div>
  );

  if (!portalRoot) return null;
  return createPortal(chrome, portalRoot);
}

export default function Act3ConstellationScrollLoad({
  active,
  reduceMotion,
  scrollCue,
  continueLabel,
  viewMyStarLabel,
  onViewMyStar,
  onComplete,
}: Props) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const pendingCompleteRef = useRef(false);
  const completeTimeoutRef = useRef<number | null>(null);
  const touchYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      progressRef.current = 0;
      completedRef.current = false;
      pendingCompleteRef.current = false;
      touchYRef.current = null;
      if (completeTimeoutRef.current != null) {
        window.clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
      setProgress(0);
      return;
    }
    if (reduceMotion) return;

    const clearCompleteTimer = () => {
      if (completeTimeoutRef.current != null) {
        window.clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };

    const finish = () => {
      if (completedRef.current || pendingCompleteRef.current) return;
      pendingCompleteRef.current = true;
      progressRef.current = 1;
      setProgress(1);
      clearCompleteTimer();
      completeTimeoutRef.current = window.setTimeout(() => {
        completedRef.current = true;
        onComplete();
      }, ACT3_SCROLL_COMPLETE_HOLD_MS);
    };

    /** + = charge (scroll vers le haut), − = décharge (vers le bas). */
    const applyScrollDelta = (signedDy: number) => {
      if (completedRef.current || signedDy === 0) return;

      const next = Math.min(
        1,
        Math.max(0, progressRef.current + signedDy / ACT3_SCROLL_BUDGET),
      );

      if (next < 1 && pendingCompleteRef.current) {
        pendingCompleteRef.current = false;
        clearCompleteTimer();
      }

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
      /* deltaY > 0 = vers le bas → décharge ; deltaY < 0 = vers le haut → charge */
      applyScrollDelta(-e.deltaY * 0.88);
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
      applyScrollDelta(dy * 1.15);
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
      clearCompleteTimer();
    };
  }, [active, reduceMotion, onComplete]);

  if (!active) return null;

  const showViewMyStar = Boolean(viewMyStarLabel && onViewMyStar);

  if (reduceMotion) {
    return (
      <>
        <Act3ViewMyStarBottom
          visible={showViewMyStar}
          label={viewMyStarLabel ?? ""}
          onClick={onViewMyStar ?? (() => {})}
        />
        <button type="button" onClick={onComplete} className="da-act3-continue mt-1">
          {continueLabel}
        </button>
      </>
    );
  }

  return (
    <>
      <Act3TopScrollChrome progress={progress} scrollCue={scrollCue} />
      <Act3ViewMyStarBottom
        visible={showViewMyStar}
        label={viewMyStarLabel ?? ""}
        onClick={onViewMyStar ?? (() => {})}
      />
    </>
  );
}
