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

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!dismissedRef.current) setVisible(true);
    }, DELAY_MS);

    const onWheel = () => dismiss();
    const onTouch = () => dismiss();

    window.addEventListener('wheel',     onWheel, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('wheel',     onWheel);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nudge-indicator"
          aria-hidden
          className={
            'pointer-events-none fixed z-[199] flex flex-col items-center gap-[0.65rem] ' +
            'left-1/2 -translate-x-1/2 ' +
            /* Aligné avec Act II parchemin : même décalage du bas de fenêtre */
            'bottom-[max(3rem,calc(env(safe-area-inset-bottom)+2.25rem))]'
          }
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Souris + molette seule piste d’action : défiler = zoom (pas de loupe = pas d’ambiguïté recherche) */}
          <motion.svg
            width="48"
            height="52"
            viewBox="0 0 44 48"
            fill="none"
            className="drop-shadow-[0_0_16px_rgba(197,160,89,0.55)]"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          >
            <path
              d="M22 4c-5.5 0-10 4-10 9.2V28c0 5.2 4.5 9.2 10 9.2s10-4 10-9.2V13.2C32 8 27.5 4 22 4Z"
              stroke="rgba(229,206,154,0.78)"
              strokeWidth="1.45"
            />
            {/* molette : bande claire qui se déplace */}
            <motion.rect
              x="19"
              y="14"
              width="6"
              height="7"
              rx="1.2"
              fill="rgba(234,215,164,0.98)"
              animate={{ y: [14, 18, 14] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: [0.45, 0, 0.55, 1], repeatDelay: 0.1 }}
            />
            {/* flèches : défiler haut / bas */}
            <path
              d="M22 1.2l-3.2 3.2 1.2 1.1 2-2 2 2 1.2-1.1L22 1.2Z"
              fill="rgba(229,206,154,0.82)"
            />
            <path
              d="M22 40l3.2-3.2-1.2-1.1-2 2-2-2-1.2 1.1L22 40Z"
              fill="rgba(229,206,154,0.82)"
            />
            {/* séparation douce doigt / bords */}
            <line x1="12" y1="22" x2="32" y2="22" stroke="rgba(197,160,89,0.22)" strokeWidth="0.65" />
          </motion.svg>

          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[rgba(241,223,168,0.92)] [text-shadow:0_0_20px_rgba(197,160,89,0.35),0_1px_14px_rgba(0,0,0,0.92)] sm:text-[10px] sm:tracking-[0.32em]">
            {copy.scrollNudge}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
