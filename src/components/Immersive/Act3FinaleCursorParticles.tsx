"use client";

import { useCallback, useEffect, useRef } from "react";

type Particle = {
  rx: number;
  ry: number;
  amp: number;
  s: number;
  a: number;
  warm: boolean;
  /** Phases / vitesses pour dérive de fond (même sans mouvement de souris). */
  phaseX: number;
  phaseY: number;
  wx: number;
  wy: number;
  drift: number;
};

type Props = {
  reducedMotion: boolean;
  className?: string;
};

function rnd(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function Act3FinaleCursorParticles({ reducedMotion, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const particlesRef = useRef<Particle[]>([]);

  const initParticles = useCallback((w: number, h: number) => {
    const area = w * h;
    const n = Math.min(110, Math.max(48, Math.floor(area / 16000)));
    particlesRef.current = Array.from({ length: n }, (_, i) => ({
      rx: rnd(i, 1),
      ry: rnd(i, 2),
      amp: 0.28 + rnd(i, 3) * 1.05,
      s: 0.55 + rnd(i, 4) * 1.35,
      a: 0.1 + rnd(i, 5) * 0.38,
      warm: rnd(i, 6) > 0.55,
      phaseX: rnd(i, 7) * Math.PI * 2,
      phaseY: rnd(i, 8) * Math.PI * 2,
      wx: 0.22 + rnd(i, 9) * 0.55,
      wy: 0.18 + rnd(i, 10) * 0.5,
      drift: 5 + rnd(i, 11) * 11,
    }));
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = {
        x: e.clientX / Math.max(1, window.innerWidth),
        y: e.clientY / Math.max(1, window.innerHeight),
      };
    };

    let raf = 0;
    const paintStatic = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pts = particlesRef.current;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const x = p.rx * w;
        const y = p.ry * h;
        ctx.fillStyle = p.warm ? `rgba(210, 175, 120, ${p.a * 0.85})` : `rgba(185, 208, 255, ${p.a})`;
        ctx.beginPath();
        ctx.arc(x, y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pts = particlesRef.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const t = now * 0.001;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const depth = 0.55 + p.amp * 0.65;
        const bx =
          Math.sin(t * p.wx + p.phaseX) * p.drift * depth +
          Math.sin(t * (p.wy * 0.62) + p.phaseY * 1.3) * p.drift * 0.28 * depth;
        const by =
          Math.cos(t * p.wy + p.phaseY) * p.drift * depth * 0.92 +
          Math.cos(t * (p.wx * 0.55) + p.phaseX * 0.9) * p.drift * 0.26 * depth;
        const ox = (mx - 0.5) * p.amp * 52;
        const oy = (my - 0.5) * p.amp * 40;
        const x = p.rx * w + ox + bx;
        const y = p.ry * h + oy + by;
        ctx.fillStyle = p.warm ? `rgba(210, 175, 120, ${p.a * 0.88})` : `rgba(188, 212, 255, ${p.a})`;
        ctx.beginPath();
        ctx.arc(x, y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(w, h);
      if (reducedMotion) paintStatic();
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    if (reducedMotion) {
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion, initParticles]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
    />
  );
}
