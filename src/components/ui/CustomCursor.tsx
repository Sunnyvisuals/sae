import { useEffect, useState, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useCursorStore } from '../../hooks/useCursorContext';

/**
 * Au-dessus du fluide WebGL, intro, menu pause (z~560), overlays.
 * Max 32-bit évite de perdre contre d’autres calques `fixed` / portails.
 */
const CURSOR_ROOT_Z = 2147483647;

/** Dernier enfant du `body` = au-dessus des autres couches `fixed` même z-index (ordre de peinture). */
function reparentCursorPortalToBodyEnd() {
  const el = document.getElementById('__custom-cursor-root');
  if (el?.parentElement === document.body) {
    document.body.appendChild(el);
  }
}

export default function CustomCursor({
  /** Menu pause / vidéo intro : on remonte le portail pour qu’il ne soit pas masqué par le dialogue. */
  overlayOpen = false,
}: {
  overlayOpen?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const mode = useCursorStore((s) => s.mode);
  const label = useCursorStore((s) => s.label);
  const ambient = useCursorStore((s) => s.ambient);
  const night = ambient === 'midnight';
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);

  /** Overlays modaux + générique crédits (iframe GPU) : ressorts un peu plus secs → moins de « gel » / jitter. */
  const leadSpring = useMemo(
    () =>
      overlayOpen
        ? { damping: 40, stiffness: 420, mass: 0.45 }
        : { damping: 28, stiffness: 300, mass: 0.5 },
    [overlayOpen]
  );
  const haloSpring = useMemo(
    () =>
      overlayOpen
        ? { damping: 52, stiffness: 198, mass: 0.7 }
        : { damping: 40, stiffness: 120, mass: 0.8 },
    [overlayOpen]
  );

  const sx = useSpring(mx, leadSpring);
  const sy = useSpring(my, leadSpring);
  const tx = useSpring(mx, haloSpring);
  const ty = useSpring(my, haloSpring);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = '__custom-cursor-root';
    let el = document.getElementById(id) as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    el.style.setProperty('position', 'fixed');
    el.style.setProperty('inset', '0');
    el.style.setProperty('pointer-events', 'none');
    el.style.setProperty('z-index', String(CURSOR_ROOT_Z));
    reparentCursorPortalToBodyEnd();
    setPortalHost(el);
  }, []);

  useLayoutEffect(() => {
    reparentCursorPortalToBodyEnd();
    if (!overlayOpen) return;
    const af = window.requestAnimationFrame(() => reparentCursorPortalToBodyEnd());
    const to = window.setTimeout(reparentCursorPortalToBodyEnd, 132);
    return () => {
      window.cancelAnimationFrame(af);
      window.clearTimeout(to);
    };
  }, [portalHost, overlayOpen]);

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
      style={{ zIndex: 1, transform: 'translateZ(0)' }}
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
          width: isHalo ? 128 : isFeather ? 78 : 56,
          height: isHalo ? 128 : isFeather ? 78 : 56,
          opacity: isHalo ? 0.22 : isFeather ? 0.14 : 0.18,
          background: isHalo
            ? night
              ? 'radial-gradient(circle, rgba(139,213,255,0.88) 0%, transparent 78%)'
              : 'radial-gradient(circle, rgba(197,160,89,0.9) 0%, transparent 78%)'
            : isFeather
              ? night
                ? 'radial-gradient(circle, rgba(220,238,255,0.75) 0%, transparent 78%)'
                : 'radial-gradient(circle, rgba(253,248,238,0.7) 0%, transparent 78%)'
              : night
                ? 'radial-gradient(circle, rgba(100,185,235,0.7) 0%, transparent 78%)'
                : 'radial-gradient(circle, rgba(197,160,89,0.65) 0%, transparent 78%)',
        }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Losange + « queue » - alignés sur index.css ; indispensables dès que `cursor-none` (iframe Acte II, Intro…). */}
      {!isFeather && !isDrag && (
        <motion.div
          className="pointer-events-none fixed will-change-transform"
          style={{
            x: sx,
            y: sy,
            translateX: '-50%',
            translateY: '-50%',
            zIndex: 4,
          }}
          animate={{
            opacity: isHalo ? 0.82 : 0.96,
            scale: isHalo ? 1.05 : 1,
          }}
          transition={{ duration: 0.35 }}
          aria-hidden
        >
          <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
            <polygon
              points="11,1 21,11 11,21 1,11"
              fill={night ? 'rgba(90,168,255,0.14)' : 'rgba(197,160,89,0.14)'}
              stroke={night ? '#cce8ff' : '#e8d5a4'}
              strokeWidth="1.35"
            />
            <circle cx="11" cy="11" r="1.65" fill={night ? '#cce8ff' : '#e8d5a4'} />
            <line
              x1="11"
              y1="22"
              x2="11"
              y2="28"
              stroke={night ? '#8bd5ff' : '#c5a059'}
              strokeWidth={1}
              strokeOpacity={0.85}
              strokeLinecap="round"
            />
            <polyline
              points="8,25 11,29 14,25"
              stroke={night ? '#8bd5ff' : '#c5a059'}
              strokeWidth={1}
              strokeOpacity={0.85}
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </motion.div>
      )}

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={night ? 'rgba(226,246,255,0.9)' : 'rgba(253,248,238,0.9)'} strokeWidth="1.5">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={night ? 'rgba(139,213,255,0.92)' : 'rgba(197,160,89,0.9)'} strokeWidth="1.5">
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
          className={
            night
              ? 'pointer-events-none fixed text-[9px] uppercase tracking-[0.4em] text-sky-200/85 will-change-transform'
              : 'pointer-events-none fixed text-[9px] uppercase tracking-[0.4em] text-solar-gold/80 will-change-transform'
          }
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

  if (!mounted || typeof document === 'undefined' || !portalHost) return null;
  return createPortal(tree, portalHost);
}
