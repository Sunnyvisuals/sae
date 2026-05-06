'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react';

const REPEL_RADIUS_FAR = 168;
const REPEL_RADIUS_NEAR = 138;
const MAX_PUSH_FAR = 34;
const MAX_PUSH_NEAR = 46;

function parsePct(s: string): number {
  return parseFloat(s.replace('%', '')) || 0;
}

/** Répulsion : les grains fuient le curseur (chute quadratique avec la distance) */
function repelOffset(
  leftPct: number,
  topPct: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  radius: number,
  maxPush: number
): { x: number; y: number } {
  const px = (leftPct / 100) * w;
  const py = (topPct / 100) * h;
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > radius || dist < 0.5) return { x: 0, y: 0 };
  const t = 1 - dist / radius;
  const falloff = t * t;
  const f = falloff * maxPush;
  return { x: (-dx / dist) * f, y: (-dy / dist) * f };
}

export default function DesertDustParticles({ compact = false }: { compact?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const [dims, setDims] = useState({ w: 1, h: 1 });
  const cursorRef = useRef({ x: -9999, y: -9999 });
  const [cursor, setCursor] = useState({ x: -9999, y: -9999 });
  const rafMove = useRef(0);

  useEffect(() => {
    const upd = () =>
      setDims({ w: window.innerWidth, h: window.innerHeight });
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      cursorRef.current = { x, y };
      mx.set(x / window.innerWidth);
      my.set(y / window.innerHeight);
      if (rafMove.current) return;
      rafMove.current = requestAnimationFrame(() => {
        rafMove.current = 0;
        setCursor({ ...cursorRef.current });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafMove.current);
    };
  }, [mx, my]);

  const smx = useSpring(mx, { stiffness: 52, damping: 24, mass: 0.45 });
  const smy = useSpring(my, { stiffness: 52, damping: 24, mass: 0.45 });

  const parallaxX = useTransform(smx, [0, 1], [22, -22]);
  const parallaxY = useTransform(smy, [0, 1], [16, -16]);

  const layers = useMemo(() => {
    const rnd = (i: number, salt: number) => {
      const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    type Mote = {
      id: string;
      left: string;
      top: string;
      size: number;
      duration: number;
      delay: number;
      variant: number;
      isGlow: boolean;
      glow: number;
      blurPx: number;
      bg: string;
      layer: 'far' | 'near';
    };

    const palette = [
      'rgba(245, 245, 220, 0.75)',
      'rgba(210, 180, 140, 0.7)',
      'rgba(255, 248, 220, 0.62)',
      'rgba(230, 210, 175, 0.72)',
      'rgba(220, 185, 120, 0.78)',
      'rgba(197, 160, 89, 0.72)',
      'rgba(253, 248, 238, 0.55)',
    ];

    const items: Mote[] = [];

    const pushBatch = (count: number, layer: 'far' | 'near', idPrefix: string) => {
      for (let i = 0; i < count; i++) {
        const r0 = rnd(i, 0);
        const r1 = rnd(i, 1);
        const r2 = rnd(i, 2);
        const r3 = rnd(i, 3);
        const r4 = rnd(i, 4);
        const r5 = rnd(i, 5);
        const t = Math.pow(r0, 0.55);
        const left = `${(0.08 + t * 0.88) * 100}%`;
        const top = `${(0.06 + r1 * 0.88) * 100}%`;
        const isFar = layer === 'far';
        const size = isFar ? 0.85 + r2 * 2.6 : 1.1 + r2 * 3.2;
        const blurPx = isFar ? 0.65 + r3 * 1.9 : 0.12 + r4 * 0.45;
        const duration = isFar ? 12 + r3 * 20 : 7 + r2 * 13;
        const delay = -(r0 + r1) * 32;
        const variant = (i % 12) + 1;
        const isGlow = r5 > 0.82;
        const glow = 0.8 + r3 * 2.2;
        const bg = palette[i % palette.length]!;

        items.push({
          id: `${idPrefix}-${i}`,
          left,
          top,
          size,
          duration,
          delay,
          variant,
          isGlow,
          glow,
          blurPx,
          bg,
          layer,
        });
      }
    };

    /* Densité poussière — mode compact sur carte acte I (~ −23 % de nodes DOM, même rendu global). */
    const far = compact ? 88 : 115;
    const near = compact ? 62 : 82;
    pushBatch(far, 'far', 'f');
    pushBatch(near, 'near', 'n');

    return items;
  }, [compact]);

  const repelOffsets = useMemo(() => {
    const { w, h } = dims;
    const { x: cx, y: cy } = cursor;
    if (cx < -9000 || w < 2) {
      return layers.map(() => ({ x: 0, y: 0 }));
    }

    return layers.map((m) => {
      const leftPct = parsePct(m.left);
      const topPct = parsePct(m.top);
      const radius = m.layer === 'far' ? REPEL_RADIUS_FAR : REPEL_RADIUS_NEAR;
      const maxPush = m.layer === 'far' ? MAX_PUSH_FAR : MAX_PUSH_NEAR;
      return repelOffset(leftPct, topPct, cx, cy, w, h, radius, maxPush);
    });
  }, [cursor, dims, layers]);

  const useRepel = prefersReducedMotion !== true;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-[2]"
      aria-hidden
      style={{
        mixBlendMode: 'screen',
        opacity: 0.92,
        maskImage:
          'radial-gradient(ellipse 85% 80% at 50% 46%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,1) 62%, black 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 85% 80% at 50% 46%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,1) 62%, black 100%)',
      }}
    >
      <motion.div
        className="absolute inset-[-11%]"
        style={
          prefersReducedMotion === true
            ? undefined
            : { x: parallaxX, y: parallaxY }
        }
      >
        <motion.div
          className="absolute inset-0"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  rotate: [0, 0.35, -0.25, 0],
                  scale: [1, 1.012, 1.008, 1],
                }
          }
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        >
          {layers.map((m, i) => {
            const off = useRepel ? repelOffsets[i]! : { x: 0, y: 0 };
            return (
              <span
                key={m.id}
                className="absolute will-change-transform"
                style={{
                  left: m.left,
                  top: m.top,
                  transform: `translate3d(${off.x}px, ${off.y}px, 0)`,
                  transition: useRepel
                    ? 'transform 0.16s cubic-bezier(0.25, 0.85, 0.35, 1)'
                    : undefined,
                }}
              >
                <span
                  className={`block rounded-full desert-mote-anim-${m.variant}`}
                  style={{
                    width: m.size,
                    height: m.size,
                    background: m.bg,
                    boxShadow: m.isGlow
                      ? `0 0 ${m.glow}px rgba(230, 200, 150, 0.4), 0 0 ${m.glow * 1.4}px rgba(197, 160, 89, 0.15)`
                      : undefined,
                    filter: `blur(${m.blurPx}px)`,
                    animationDuration: `${m.duration}s`,
                    animationDelay: `${m.delay}s`,
                    opacity: m.layer === 'far' ? 0.95 : 1,
                  }}
                />
              </span>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
