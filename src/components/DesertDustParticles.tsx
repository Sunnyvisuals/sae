'use client';

import { useMemo } from 'react';

/** Poussière / grains très fins — rappel désert, DA or & sable chaud */
export default function DesertDustParticles() {
  const motes = useMemo(() => {
    const rnd = (i: number, salt: number) => {
      const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 72 }, (_, i) => {
      const r0 = rnd(i, 0);
      const r1 = rnd(i, 1);
      const r2 = rnd(i, 2);
      const r3 = rnd(i, 3);
      const r4 = rnd(i, 4);
      const isGlow = r4 > 0.88;
      return {
        id: i,
        left: `${r0 * 100}%`,
        top: `${r1 * 100}%`,
        size: 0.5 + r2 * 1.75,
        duration: 16 + r3 * 32,
        delay: -(r0 + r1) * 28,
        variant: (i % 3) + 1,
        isGlow,
        glow: 0.6 + r3 * 1.4,
      };
    });
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-[2] mix-blend-soft-light opacity-[0.72]"
      aria-hidden
    >
      {motes.map((m) => (
        <span
          key={m.id}
          className={`absolute rounded-full desert-mote-anim-${m.variant}`}
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            background:
              m.variant === 1
                ? 'rgba(230, 205, 155, 0.42)'
                : m.variant === 2
                  ? 'rgba(197, 160, 89, 0.38)'
                  : 'rgba(253, 248, 238, 0.22)',
            boxShadow: m.isGlow
              ? `0 0 ${m.glow}px rgba(213, 175, 110, 0.35), 0 0 ${m.glow * 1.5}px rgba(197, 160, 89, 0.12)`
              : undefined,
            filter: m.isGlow ? 'blur(0.35px)' : 'blur(0.2px)',
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
