'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import SplashCursor from './SplashCursor';
import DesertDustParticles from './DesertDustParticles';
import ShootingStars from './ShootingStars';

/**
 * Fond mesh interactif - désert / Maghreb / oriental (sable, ocre, or chaud).
 * CSS variables + RAF à la demande (pas de boucle tant que la cible n'évolue pas).
 */
type AuroraProps = {
  className?: string;
  /** true = `absolute inset-0` (pile dans le parent), false = `fixed` plein écran */
  fillContainer?: boolean;
  /** Désactive les étoiles filantes (ex. acte I carte) */
  hideShootingStars?: boolean;
};

export default function AuroraMeshBackground({
  className = '',
  fillContainer = false,
  hideShootingStars = false,
}: AuroraProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0.5, y: 0.5 });
  const current = useRef({ x: 0.5, y: 0.5 });
  const rafId = useRef(0);

  useEffect(() => {
    const lerp = 0.045;
    const converge = 0.00035;

    const applyStyles = (x: number, y: number) => {
      const el = rootRef.current;
      if (!el) return;
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      el.style.setProperty('--mx-slow', `${(x * 0.65 + 0.175) * 100}%`);
      el.style.setProperty('--my-slow', `${(y * 0.55 + 0.225) * 100}%`);
      el.style.setProperty('--hue-shift', `${x * 5 - 2.5}`);
    };

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;

      if (Math.hypot(dx, dy) < converge) {
        current.current.x = target.current.x;
        current.current.y = target.current.y;
        applyStyles(current.current.x, current.current.y);
        rafId.current = 0;
        return;
      }

      current.current.x += dx * lerp;
      current.current.y += dy * lerp;
      applyStyles(current.current.x, current.current.y);

      rafId.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      target.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      if (rafId.current === 0) {
        rafId.current = requestAnimationFrame(tick);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const pos = fillContainer ? 'absolute inset-0' : 'fixed inset-0';

  return (
    <div
      ref={rootRef}
      className={`${pos} overflow-hidden pointer-events-none ${className}`}
      style={
        {
          '--mx': '50%',
          '--my': '50%',
          '--mx-slow': '50%',
          '--my-slow': '50%',
          '--hue-shift': '0',
        } as CSSProperties
      }
    >
      {/* Base : nuit de sable / terre (proche solar-brown) */}
      <div className="absolute inset-0 bg-[#120e0a]" />

      {/* WebGL smoke : même simulation que le fluide curseur, calé sur le scroll Lenis · visible sous les halos. */}
      <SplashCursor
        layer="background"
        fillContainer
        zIndex={1}
        SIM_RESOLUTION={88}
        DYE_RESOLUTION={320}
        DENSITY_DISSIPATION={4.2}
        VELOCITY_DISSIPATION={4.4}
        CURL={14}
        SPLAT_RADIUS={0.086}
        SPLAT_FORCE={7400}
        scrollImpulse={1.35}
        syncPaletteFromAmbient
        COLOR_UPDATE_SPEED={6}
        ambientOpacity={0.53}
      />

      {/* Halo « soleil bas » / sable doré qui suit le curseur */}
      <div
        className="absolute w-[min(135vmin,1400px)] h-[min(135vmin,1400px)] rounded-full -translate-x-1/2 -translate-y-1/2 blur-[72px] sm:blur-[100px] opacity-[0.88]"
        style={{
          left: 'var(--mx)',
          top: 'var(--my)',
          background:
            'radial-gradient(circle at 42% 38%, rgba(213, 175, 110, 0.55) 0%, rgba(197, 160, 89, 0.38) 28%, rgba(140, 95, 48, 0.22) 52%, transparent 74%)',
        }}
      />

      {/* Ocre / terre cuite - chaleur maghrébine */}
      <div
        className="absolute w-[min(115vmin,1200px)] h-[min(115vmin,1200px)] rounded-full -translate-x-1/2 -translate-y-1/2 blur-[88px] sm:blur-[120px] opacity-[0.82]"
        style={{
          left: 'var(--mx-slow)',
          top: 'var(--my-slow)',
          background:
            'radial-gradient(circle at 52% 48%, rgba(155, 72, 42, 0.62) 0%, rgba(95, 42, 28, 0.45) 40%, rgba(45, 28, 18, 0.35) 58%, transparent 78%)',
        }}
      />

      {/* Contre-jour : ombre chaude + reflet crème (souvenir de dune) */}
      <div
        className="absolute w-[min(95vmin,1000px)] h-[min(95vmin,1000px)] rounded-full -translate-x-1/2 -translate-y-1/2 blur-[96px] sm:blur-[130px] opacity-[0.48]"
        style={{
          left: 'calc(100% - var(--mx))',
          top: 'calc(100% - var(--my))',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(253, 250, 246, 0.12) 0%, rgba(245, 235, 215, 0.08) 35%, rgba(60, 42, 28, 0.18) 62%, transparent 72%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          background:
            'linear-gradient(118deg, rgba(20, 14, 10, 0.92) 0%, transparent 45%, rgba(55, 32, 22, 0.42) 100%)',
          filter: 'hue-rotate(calc(var(--hue-shift) * 1deg)) saturate(1.08)',
        }}
      />

      <DesertDustParticles />
      {!hideShootingStars && <ShootingStars />}

      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
          backgroundSize: '200px',
        }}
      />
    </div>
  );
}
