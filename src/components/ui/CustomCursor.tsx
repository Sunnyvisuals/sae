import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useCursorStore } from '../../hooks/useCursorContext';

/** Z-index max pratique — au-dessus de tout overlay / Lenis / PoetryGame */
const CURSOR_ROOT_Z = 2147483647;

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const { mode, label } = useCursorStore();
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { damping: 28, stiffness: 300, mass: 0.5 });
  const sy = useSpring(my, { damping: 28, stiffness: 300, mass: 0.5 });
  const tx = useSpring(mx, { damping: 40, stiffness: 120, mass: 0.8 });
  const ty = useSpring(my, { damping: 40, stiffness: 120, mass: 0.8 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const move = (e: PointerEvent) => {
    mx.set(e.clientX);
    my.set(e.clientY);
  };

  useEffect(() => {
    window.addEventListener('pointermove', move, { passive: true, capture: true });
    return () => window.removeEventListener('pointermove', move, { capture: true });
  }, [mx, my]);

  const isHalo = mode === 'halo';
  const isFeather = mode === 'feather';
  const isDrag = mode === 'drag';

  const tree = (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: CURSOR_ROOT_Z, isolation: 'isolate' }}
      aria-hidden
    >
      <motion.div
        className="pointer-events-none fixed rounded-full will-change-transform"
        style={{
          x: tx,
          y: ty,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 1,
        }}
        animate={{
          width: isHalo ? 80 : isFeather ? 60 : 44,
          height: isHalo ? 80 : isFeather ? 60 : 44,
          opacity: isHalo ? 0.24 : isFeather ? 0.14 : 0.18,
          background: isHalo
            ? 'radial-gradient(circle, rgba(197,160,89,0.9) 0%, transparent 70%)'
            : isFeather
              ? 'radial-gradient(circle, rgba(253,248,238,0.7) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(197,160,89,0.65) 0%, transparent 70%)',
        }}
        transition={{ duration: 0.3 }}
      />

      {(isFeather || isDrag) && (
        <motion.div
          className="pointer-events-none fixed flex items-center justify-center will-change-transform"
          style={{
            x: sx,
            y: sy,
            translateX: '-50%',
            translateY: '-50%',
            zIndex: 2,
          }}
          animate={{
            width: isFeather ? 10 : 48,
            height: isFeather ? 10 : 48,
            borderRadius: isDrag ? '4px' : '50%',
            rotate: isFeather ? 45 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {isFeather ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(253,248,238,0.9)" strokeWidth="1.5">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(197,160,89,0.9)" strokeWidth="1.5">
              <polyline points="5 9 2 12 5 15" />
              <polyline points="9 5 12 2 15 5" />
              <polyline points="15 19 12 22 9 19" />
              <polyline points="19 9 22 12 19 15" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          )}
        </motion.div>
      )}

      {label && (
        <motion.div
          className="pointer-events-none fixed text-[9px] uppercase tracking-[0.4em] text-solar-gold/80 will-change-transform"
          style={{ x: sx, y: sy, translateX: '12px', translateY: '12px', zIndex: 3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {label}
        </motion.div>
      )}
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(tree, document.body);
}
