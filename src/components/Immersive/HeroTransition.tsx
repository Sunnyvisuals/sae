import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';

interface Props {
  active: boolean;
  onDone: () => void;
}

/**
 * Transition cinématique après la vidéo :
 * un masque circulaire s'ouvre depuis le centre (iris reveal),
 * puis une vague de sable dorée balaie l'écran vers le haut.
 */
export default function HeroTransition({ active, onDone }: Props) {
  const maskRef  = useRef<SVGCircleElement>(null);
  const waveRef  = useRef<HTMLDivElement>(null);
  const rootRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const tl = gsap.timeline({ onComplete: onDone });

    // 1. Iris reveal - cercle SVG clip-path s'agrandit
    tl.fromTo(
      maskRef.current,
      { attr: { r: 0 } },
      { attr: { r: 200 }, duration: 1.6, ease: 'power3.inOut' }
    );

    // 2. Vague de sable monte
    tl.fromTo(
      waveRef.current,
      { yPercent: 100 },
      { yPercent: -100, duration: 1.2, ease: 'power2.inOut' },
      '-=0.4'
    );

    // 3. Fade out du conteneur entier
    tl.to(rootRef.current, { opacity: 0, duration: 0.5 }, '-=0.3');

    return () => { tl.kill(); };
  }, [active, onDone]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          ref={rootRef}
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 1 }}
        >
          {/* SVG mask iris */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <clipPath id="iris-clip" clipPathUnits="objectBoundingBox">
                <circle ref={maskRef} cx="0.5" cy="0.5" r="0" />
              </clipPath>
            </defs>
            <rect
              width="100%" height="100%"
              fill="rgba(10,8,6,0.95)"
              clipPath="url(#iris-clip)"
              style={{ clipPath: 'none' }}
            />
          </svg>

          {/* Fond sombre initial */}
          <div className="absolute inset-0 bg-[#0a0806]" />

          {/* Vague sable */}
          <div
            ref={waveRef}
            className="absolute inset-x-0 bottom-0 h-[110%]"
            style={{
              background: 'linear-gradient(to top, #c5a059 0%, #e8d5a4 40%, #0a0806 100%)',
              transform: 'translateY(100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
