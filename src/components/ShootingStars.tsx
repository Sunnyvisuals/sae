'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;       // longueur de la traîne en px
  life: number;      // 0→1
  maxLife: number;   // durée totale en frames
  width: number;
  hue: number;       // légère variation de teinte
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawnStar(w: number, h: number): Star {
  // Nait sur le bord haut ou gauche, traverse en diagonale bas-droite
  const fromTop = Math.random() > 0.35;
  const x = fromTop ? rnd(w * 0.05, w * 0.95) : rnd(-60, 0);
  const y = fromTop ? rnd(-60, 0) : rnd(h * 0.02, h * 0.65);

  const angle = rnd(28, 52) * (Math.PI / 180); // ~30-50° vers bas-droite
  const speed = rnd(14, 26);

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    len: rnd(100, 260),
    life: 0,
    maxLife: rnd(20, 40),
    width: rnd(0.6, 1.6),
    hue: rnd(-8, 8), // décalage autour de l'or
  };
}

export default function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const stars: Star[] = [];
    let rafId = 0;
    let idleTimer = 0;

    // Cadence : première entre ~3 - 9 s, puis une nouvelle toutes les ~8 - 18 s
    let nextSpawnAt = Date.now() + rnd(3000, 9000);

    const scheduleFrame = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(tick);
    };

    const tick = () => {
      rafId = 0;
      ctx.clearRect(0, 0, w, h);

      // Spawn
      const now = Date.now();
      if (now >= nextSpawnAt) {
        stars.push(spawnStar(w, h));
        nextSpawnAt = now + rnd(8000, 18000);
      }

      // Draw & update
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]!;
        s.life++;
        s.x += s.vx;
        s.y += s.vy;

        const t = s.life / s.maxLife;
        // Fade in rapide, fade out progressif
        const alpha = t < 0.15 ? t / 0.15 : 1 - ((t - 0.15) / 0.85);

        // Traîne : gradient de la tête vers la queue
        const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.len;
        const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.len;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `hsla(${42 + s.hue}, 72%, 72%, 0)`);
        grad.addColorStop(0.55, `hsla(${42 + s.hue}, 85%, 82%, ${alpha * 0.38})`);
        grad.addColorStop(0.85, `hsla(${44 + s.hue}, 90%, 90%, ${alpha * 0.72})`);
        grad.addColorStop(1,   `hsla(${46 + s.hue}, 95%, 96%, ${alpha * 0.92})`);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.shadowColor = `hsla(${42 + s.hue}, 80%, 75%, ${alpha * 0.55})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Petit éclat à la tête
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 100%, 95%, ${alpha * 0.85})`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();

        if (s.life >= s.maxLife) stars.splice(i, 1);
      }

      /* Entre deux étoiles : pas de RAF 60fps sur un canvas vide */
      const untilSpawn = nextSpawnAt - Date.now();
      if (stars.length === 0 && untilSpawn > 32) {
        idleTimer = window.setTimeout(scheduleFrame, Math.min(Math.max(untilSpawn, 50), 20000));
        return;
      }
      scheduleFrame();
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      if (idleTimer) {
        window.clearTimeout(idleTimer);
        idleTimer = 0;
      }
      if (rafId === 0) scheduleFrame();
    };
    window.addEventListener('resize', resize, { passive: true });

    scheduleFrame();
    return () => {
      cancelAnimationFrame(rafId);
      if (idleTimer) window.clearTimeout(idleTimer);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[3]"
      style={{ mixBlendMode: 'screen', opacity: 0.82 }}
    />
  );
}
