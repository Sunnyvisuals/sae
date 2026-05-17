'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import SplashCursor from './SplashCursor';
import DesertDustParticles from './DesertDustParticles';
import { useCursorPrefsStore } from '../stores/cursorPrefsStore';
import ShootingStars from './ShootingStars';
import { runWhenIdle } from '../lib/actTransitionPrefetch';
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
  /** Moins de grains DOM (DesertDust) - carte acte I ; intro inchangée si omis */
  compactDust?: boolean;
  /** Acte I : le SplashCursor principal (App) suffit - évite une 2ᵉ sim WebGL en fond. */
  suppressBackgroundFluid?: boolean;
};

export default function AuroraMeshBackground({
  className = '',
  fillContainer = false,
  hideShootingStars = false,
  compactDust = false,
  suppressBackgroundFluid = false,
}: AuroraProps) {
  const fluidCursor = useCursorPrefsStore((s) => s.experience === 'fluid');
  const [dustReady, setDustReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return runWhenIdle(() => setDustReady(true), 4500);
  }, []);
  const target = useRef({ x: 0.5, y: 0.5 });
  const current = useRef({ x: 0.5, y: 0.5 });
  const rafId = useRef(0);
  /** Position en % du viewport — mise à jour via transform (évite le CLS Lighthouse). */
  const haloX = useRef(50);
  const haloY = useRef(50);
  const haloSlowX = useRef(50);
  const haloSlowY = useRef(55);

  const applyHaloTransforms = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const mx = haloX.current;
    const my = haloY.current;
    const mxSlow = haloSlowX.current;
    const mySlow = haloSlowY.current;
    const normX = mx / 100;
    el.style.setProperty('--hue-shift', `${(normX * 5 - 2.5).toFixed(2)}`);
    el.style.setProperty(
      '--halo-tx',
      `translate(calc(${mx} * 1vw - 50vw), calc(${my} * 1vh - 50vh))`,
    );
    el.style.setProperty(
      '--halo-tx-slow',
      `translate(calc(${mxSlow} * 1vw - 50vw), calc(${mySlow} * 1vh - 50vh))`,
    );
    el.style.setProperty(
      '--halo-tx-mirror',
      `translate(calc(${100 - mx} * 1vw - 50vw), calc(${100 - my} * 1vh - 50vh))`,
    );
  }, []);

  useLayoutEffect(() => {
    applyHaloTransforms();
  }, [applyHaloTransforms]);

  useEffect(() => {
    const lerp = 0.045;
    const converge = 0.00035;

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;

      if (Math.hypot(dx, dy) < converge) {
        current.current.x = target.current.x;
        current.current.y = target.current.y;
        haloX.current = current.current.x * 100;
        haloY.current = current.current.y * 100;
        haloSlowX.current = (current.current.x * 0.65 + 0.175) * 100;
        haloSlowY.current = (current.current.y * 0.55 + 0.225) * 100;
        applyHaloTransforms();
        rafId.current = 0;
        return;
      }

      current.current.x += dx * lerp;
      current.current.y += dy * lerp;
      haloX.current = current.current.x * 100;
      haloY.current = current.current.y * 100;
      haloSlowX.current = (current.current.x * 0.65 + 0.175) * 100;
      haloSlowY.current = (current.current.y * 0.55 + 0.225) * 100;
      applyHaloTransforms();

      rafId.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      if (document.visibilityState === 'hidden') return;
      target.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      if (rafId.current === 0) {
        rafId.current = requestAnimationFrame(tick);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [applyHaloTransforms]);

  const pos = fillContainer ? 'absolute inset-0' : 'fixed inset-0';

  return (
    <div
      ref={rootRef}
      className={`${pos} overflow-hidden pointer-events-none ${className}`}
      style={
        {
          '--hue-shift': '0',
          '--halo-tx': 'translate(0, 0)',
          '--halo-tx-slow': 'translate(0, 0)',
          '--halo-tx-mirror': 'translate(0, 0)',
        } as CSSProperties
      }
    >
      {/* Base : nuit de sable / terre (proche solar-brown) */}
      <div className="absolute inset-0 bg-[#120e0a]" />

      {/* WebGL smoke : même simulation que le fluide curseur, calé sur le scroll Lenis · visible sous les halos. */}
      {fluidCursor && !suppressBackgroundFluid && (
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
      )}

      {/* Halo « soleil bas » / sable doré qui suit le curseur */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(135vmin,1400px)] w-[min(135vmin,1400px)] rounded-full blur-[72px] sm:blur-[100px] opacity-[0.88] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 42% 38%, rgba(213, 175, 110, 0.55) 0%, rgba(197, 160, 89, 0.38) 28%, rgba(140, 95, 48, 0.22) 52%, transparent 74%)',
          transform: 'var(--halo-tx)',
        }}
      />

      {/* Ocre / terre cuite - chaleur maghrébine */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(115vmin,1200px)] w-[min(115vmin,1200px)] rounded-full blur-[88px] sm:blur-[120px] opacity-[0.82] will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 52% 48%, rgba(155, 72, 42, 0.62) 0%, rgba(95, 42, 28, 0.45) 40%, rgba(45, 28, 18, 0.35) 58%, transparent 78%)',
          transform: 'var(--halo-tx-slow)',
        }}
      />

      {/* Contre-jour : ombre chaude + reflet crème (souvenir de dune) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(95vmin,1000px)] w-[min(95vmin,1000px)] rounded-full blur-[96px] sm:blur-[130px] opacity-[0.48] will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(253, 250, 246, 0.12) 0%, rgba(245, 235, 215, 0.08) 35%, rgba(60, 42, 28, 0.18) 62%, transparent 72%)',
          transform: 'var(--halo-tx-mirror)',
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

      {dustReady ? <DesertDustParticles compact={compactDust} /> : null}
      {!hideShootingStars && <ShootingStars />}
    </div>
  );
}
