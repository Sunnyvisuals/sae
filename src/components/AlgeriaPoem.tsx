'use client';

import { useEffect, useRef, useMemo, useCallback, useState, MouseEvent, WheelEvent } from 'react';
import { motion } from "motion/react";
import WordTooltip from './WordTooltip';

interface Props {
  /** 0-1 : scroll progress de la section (fourni par le parent) */
  sectionProgress?: number;
}

interface Particle {
  ox: number; oy: number;   // position d'origine (0-1)
  cx: number; cy: number;   // position courante (px)
  tx: number; ty: number;   // position cible (px)
  size: number;
  alpha: number;
  baseAlpha: number;
  word: string;
  isPoem: boolean;
  colorT: number;           // 0 = GOLD, 1 = CREAM
}

// ─── Silhouette Algérie (path SVG simplifié, viewBox 0 0 400 400) ────────────
const ALGERIA_PATH =
  'M 72 58 L 88 54 L 110 52 L 140 50 L 168 48 L 200 46 L 228 44 L 255 45 L 275 48 L 290 52 L 302 58 L 310 68 L 318 80 L 322 95 L 320 112 L 315 128 L 308 142 L 298 155 L 285 165 L 270 172 L 255 178 L 242 188 L 232 200 L 225 215 L 220 232 L 218 250 L 220 268 L 225 284 L 232 298 L 240 310 L 248 320 L 252 330 L 250 340 L 244 348 L 235 352 L 224 352 L 212 348 L 200 340 L 188 330 L 175 318 L 162 305 L 150 290 L 138 275 L 126 260 L 115 245 L 105 230 L 96 215 L 88 200 L 82 185 L 78 170 L 74 155 L 70 140 L 68 124 L 66 108 L 66 92 L 68 76 L 72 58 Z';

// ─── Mots du poème (Jean Sénac, "Vocation de l'arbre") ──────────────────────
const POEM_WORDS = [
  'soleil', 'sable', 'mémoire', 'lumière', 'désert', 'algérie',
  'cri', 'immensité', 'corps', 'vent', 'dune', 'horizon',
  'nuit', 'étoile', 'racine', 'silence', 'feu', 'terre',
  'eau', 'ombre', 'aube', 'poème', 'voix', 'rêve',
  'sang', 'pierre', 'sel', 'oasis', 'caravane', 'aurore',
  'souffle', 'source', 'vague', 'dieu', 'peuple', 'chant',
  'liberté', 'naissance', 'chemin', 'éclat',
];

// ─── Couleurs DA ─────────────────────────────────────────────────────────────
const GOLD     = { r: 197, g: 160, b: 89  };
const SAND     = { r: 230, g: 205, b: 155 };
const CREAM    = { r: 253, g: 248, b: 238 };

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rnd(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Teste si un point (px, py) est à l'intérieur du path SVG (viewBox 400×400) */
function buildAlgeriaChecker(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const scale = size / 400;
  ctx.save();
  ctx.scale(scale, scale);
  const p = new Path2D(ALGERIA_PATH);
  ctx.fillStyle = '#fff';
  ctx.fill(p);
  ctx.restore();
  const data = ctx.getImageData(0, 0, size, size).data;
  return (x: number, y: number) => {
    const ix = Math.round(x * (size - 1));
    const iy = Math.round(y * (size - 1));
    const idx = (iy * size + ix) * 4;
    return data[idx]! > 128;
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Particle {
  ox: number; oy: number;   // position d'origine (0-1)
  cx: number; cy: number;   // position courante (px)
  tx: number; ty: number;   // position cible (px)
  size: number;
  alpha: number;
  baseAlpha: number;
  word: string;
  isPoem: boolean;
  colorT: number;           // 0 = GOLD, 1 = CREAM
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const TOTAL_PARTICLES = 2800;
const REPEL_RADIUS    = 120;
const REPEL_FORCE     = 0.38;
const RETURN_SPEED    = 0.055;
const FONT_SIZE_POEM  = 9;
const FONT_SIZE_SAND  = 6;

// ─── Composant ───────────────────────────────────────────────────────────────
interface Props {
  /** 0-1 : scroll progress de la section (fourni par le parent) */
  sectionProgress?: number;
}

export default function AlgeriaPoem({ sectionProgress = 0 }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const particles   = useRef<Particle[]>([]);
  const mouse       = useRef({ x: -9999, y: -9999 });
  const rafId       = useRef(0);
  const initialized = useRef(false);
  const [appeared, setAppeared] = useState(false);
  const appearRef = useRef(0);
  const [tooltip, setTooltip] = useState<{ title: string; description: string; citation: string; } | null>(null);
  const [zoom, setZoom] = useState(1); // Zoom level
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [data, setData] = useState<any>(null);
  const handlePan = (e: MouseEvent) => {
    if (zoom === 1) return;
    setPan({
      x: pan.x + e.movementX,
      y: pan.y + e.movementY,
    });
  };

  useEffect(() => {
    fetch('/data/algeria_poem_data.json')
      .then(response => response.json())
      .then(data => {
        setData(data);
        console.log("Data loaded:", data);
      })
      .catch(error => console.error('Erreur lors du chargement du fichier JSON:', error));
  }, []);

  // ── Scroll de la section pour l'apparition ──────────────────────────────
  
  useEffect(() => {
    const start = performance.now();
    const fade = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / 2500, 1);
      appearRef.current = t;
      if (t < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
    setAppeared(true);
  }, []);

  // ── Mouse ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onClick = () =>{

    }

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        setZoom(prevZoom => {
            let newZoom = prevZoom * delta;
            newZoom = Math.max(1, Math.min(3, newZoom));
            return newZoom;
        });
        console.log("Zoom level:", zoom)
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!data) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const mouseX = event.clientX - r.left;
      const mouseY = event.clientY - r.top;
      let hoveredParticle = null;
      for (const p of particles.current) {
        if (!p.isPoem) continue;
        const dx = mouseX - p.cx;
        const dy = mouseY - p.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.size * 2) {
          hoveredParticle = p;
          break;
        }
      }
      if (hoveredParticle) {
        const wordData = data[hoveredParticle.word];
        if (wordData) {
          setTooltip({
            title: wordData.title,
            description: wordData.description,
            citation: wordData.citation,
          });
          console.log("Tooltip data:", wordData)
        } else {
          setTooltip(null);
          console.log("No tooltip data");
        }
      } else {
        setTooltip(null);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('mousedown', (e) => {
      canvasRef.current!.style.cursor = 'grabbing';
      const handlePan = (e: MouseEvent) => {
        if (zoom === 1) return;
        setPan({
          x: pan.x + e.movementX,
          y: pan.y + e.movementY,
        });
      };
      canvasRef.current!.addEventListener('mousemove', handlePan);
    });
    canvasRef.current.addEventListener('mouseup', () => {
      canvasRef.current!.style.cursor = 'auto';
      canvasRef.current!.removeEventListener('mousemove', handlePan);
    });
    canvasRef.current.addEventListener('mouseleave', () => {
      canvasRef.current!.style.cursor = 'auto';
      canvasRef.current!.removeEventListener('mousemove', handlePan);
    });
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener('mousemove', onMove);
      canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current.removeEventListener('mousedown', (e) => {
        const handlePan = (e: MouseEvent) => {
          if (zoom === 1) return;
          setPan({
            x: pan.x + e.movementX,
            y: pan.y + e.movementY,
          });
        };
        canvasRef.current!.removeEventListener('mousemove', handlePan);
      });
      canvasRef.current.removeEventListener('mouseup', () => {
        canvasRef.current!.removeEventListener('mousemove', handlePan);
      });
      canvasRef.current.removeEventListener('mouseleave', () => {
        canvasRef.current!.removeEventListener('mousemove', handlePan);
      });
      window.removeEventListener("wheel", onWheel);
    };
  }, [data, zoom, pan]);

  // ── Boucle de rendu ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
        console.log('Canvas not available');
        return;
    }
    const ctx = canvas.getContext('2d')!;
    console.log("Data in render loop:", data);
    const tick = () => {
      const W = canvas.width;
      const H = canvas.height;
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const progress = appearRef.current;

      ctx.clearRect(0, 0, W, H);

      // Grain de lumière central (pulse)
      const t = performance.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
      const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.22);
      grd.addColorStop(0, `rgba(197,160,89,${0.06 * pulse * progress})`);
      grd.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      for (const p of particles.current) {
        // Cible : position d'origine
        p.tx = p.ox * W;
        p.ty = p.oy * H;

        // Répulsion souris
        const dx = p.cx - mx;
        const dy = my - p.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
          p.tx += (dx / dist) * force * REPEL_RADIUS;
          p.ty += (dy / dist) * force * REPEL_RADIUS;
        }

        // Lerp position
        p.cx += (p.tx - p.cx) * RETURN_SPEED;
        p.cy += (p.ty - p.cy) * RETURN_SPEED;

        // Alpha (apparition progressive avec scroll)
        const targetAlpha = p.baseAlpha * progress;
        p.alpha += (targetAlpha - p.alpha) * 0.04;

        if (p.alpha < 0.005) continue;

        // Couleur
        const c = lerpColor(GOLD, p.isPoem ? CREAM : SAND, p.colorT);
        ctx.globalAlpha = p.alpha;

        if (p.isPoem) {
          // Mot du poème
          ctx.font = `${p.size}px "Bahlull", serif`;
          ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
          ctx.fillText(p.word, p.cx, p.cy);
        } else {
          // Grain de sable
          ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, p.size * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [data, zoom, pan]);

  // ── Légende / titre Acte I ───────────────────────────────────────────────
  const titleLines = useMemo(() => [
    { text: 'ACTE I', cls: 'text-[9px] tracking-[0.6em] text-solar-gold/50 font-light uppercase' },
    { text: 'La Naissance', cls: 'font-bahlull text-4xl md:text-6xl italic text-white/90 drop-shadow-[0_0_22px_rgba(197,160,89,0.35)] mt-2' },
  ], []);

  return (
    <motion.div
      style={{ opacity: appearRef.current }}
      className="absolute inset-0 z-[15] pointer-events-none"
    >
      {/* Canvas particules plein écran */}
      <motion.div
        style={{ scale: zoom, x: pan.x, y: pan.y, originX: 0, originY: 0 }} // Zoom and Pan applied here
        className="relative w-full h-full"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-none"
          style={{ background: '#0a0806' }}
        />
      </motion.div>

      {tooltip && ( // Render tooltip if state is set
        <WordTooltip
          title={tooltip.title}
          description={tooltip.description}
          citation={tooltip.citation}
        />
      )}

      {/* Titre Acte I ─────────────────────────────────────────────── */}
      <div className="absolute bottom-16 left-16 flex flex-col pointer-events-none select-none">
        {titleLines.map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.4, delay: 0.4 + i * 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={l.cls}
          >
            {l.text}
          </motion.p>
        ))}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 1.6, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="h-px bg-solar-gold/40 mt-4"
        />
      </div>

      {/* Hint souris ──────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0] }}
        transition={{ duration: 5, delay: 1.5, ease: 'easeInOut' }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.55em] text-solar-gold/45 pointer-events-none select-none"
      >
        Déplacez votre souris
      </motion.p>
    </motion.div>
  );
}