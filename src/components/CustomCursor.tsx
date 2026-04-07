'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const IDLE_MS = 5000;

/**
 * Curseur DA Al-Rihla : losange filaire (comme les CTA), pas de rond.
 * Se cache après 5 s sans mouvement de la souris.
 */
export default function CustomCursor() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isPointer, setIsPointer] = useState(false);
  const [isAwake, setIsAwake] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spring = { damping: 34, stiffness: 440, mass: 0.32 };
  const cursorX = useSpring(mouseX, spring);
  const cursorY = useSpring(mouseY, spring);

  useEffect(() => {
    const scheduleIdle = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setIsAwake(true);
      idleTimerRef.current = setTimeout(() => setIsAwake(false), IDLE_MS);
    };

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const el = e.target as HTMLElement;
      const interactive =
        window.getComputedStyle(el).cursor === 'pointer' ||
        el.tagName === 'BUTTON' ||
        el.tagName === 'A' ||
        !!el.closest('button, a, [role="button"], input, textarea, select, label');

      setIsPointer(!!interactive);
      scheduleIdle();
    };

    scheduleIdle();
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{ opacity: isAwake ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Lueur losange — très douce, pas circulaire */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm bg-solar-gold/20 blur-xl"
        animate={{
          width: isPointer ? 48 : 40,
          height: isPointer ? 48 : 40,
          opacity: isPointer ? 0.55 : 0.35,
        }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      />

      {/* Losange principal — trait fin, même vocabulaire que l’UI */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-solar-gold/70 bg-black/10 backdrop-blur-[1px]"
        animate={{
          width: isPointer ? 26 : 20,
          height: isPointer ? 26 : 20,
          borderColor: isPointer ? 'rgba(197, 160, 89, 0.95)' : 'rgba(197, 160, 89, 0.5)',
          boxShadow: isPointer
            ? '0 0 22px rgba(197,160,89,0.35), inset 0 0 12px rgba(197,160,89,0.08)'
            : '0 0 14px rgba(197,160,89,0.2)',
        }}
        transition={{ type: 'spring', damping: 22, stiffness: 360 }}
      />

      {/* Croix minimale au centre — précision sans pastille ronde */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          className="absolute left-1/2 top-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 bg-solar-gold/80"
          animate={{ opacity: isPointer ? 1 : 0.55, scaleX: isPointer ? 1.15 : 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 400 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-solar-gold/80"
          animate={{ opacity: isPointer ? 1 : 0.55, scaleY: isPointer ? 1.15 : 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 400 }}
        />
      </div>
    </motion.div>
  );
}
