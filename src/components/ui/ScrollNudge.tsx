'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppCopy } from '../../hooks/useAppCopy';

const DELAY_MS = 5000;

export default function ScrollNudge() {
  const copy = useAppCopy();
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollYRef = useRef(0);
  const lastTouchYRef = useRef<number | null>(null);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!dismissedRef.current) setVisible(true);
    }, DELAY_MS);

    /** Masqué dès que l’utilisateur fait défiler vers le bas (action attendue). */
    const onWheel = (e: WheelEvent) => {
      if (dismissedRef.current) return;
      if (e.deltaY > 0.5) dismiss();
    };

    const onScroll = () => {
      if (dismissedRef.current) return;
      const y = window.scrollY;
      if (y > lastScrollYRef.current + 1) dismiss();
      lastScrollYRef.current = y;
    };

    const onTouchStart = (e: TouchEvent) => {
      lastTouchYRef.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (dismissedRef.current || lastTouchYRef.current == null) return;
      const y = e.touches[0]?.clientY;
      if (y == null) return;
      const dy = y - lastTouchYRef.current;
      lastTouchYRef.current = y;
      if (dy < -4) dismiss();
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useEffect(() => {
    if (visible) lastScrollYRef.current = window.scrollY;
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nudge-indicator"
          aria-hidden
          className={
            'pointer-events-none fixed z-[199] flex flex-col items-center gap-4 ' +
            'left-1/2 -translate-x-1/2 ' +
            /* Aligné avec Act II parchemin : même décalage du bas de fenêtre */
            'bottom-[max(3rem,calc(env(safe-area-inset-bottom)+2.25rem))]'
          }
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Chevron vers le bas — invite au défilement descendant. */}
          <motion.svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              stroke="rgba(197, 160, 89, 0.68)"
              strokeWidth="1.35"
              d="M14 17.5 L22 25 L30 17.5"
              animate={{ opacity: [0.55, 0.95, 0.55] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
            />
          </motion.svg>

          <p className="da-hint-micro">{copy.scrollNudge}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
