import { useCallback, useEffect, useRef, useState } from "react";
import type { ConstellationStarRow } from "../../lib/act3ConstellationApi";
import { countByMot } from "../../lib/act3ConstellationApi";
import { starPositionFromId, starVisualFromPopularity } from "../../lib/act3StarLayout";
import { arabicPoemWordLabel } from "../../lib/mapWordArabicDisplay";

type Props = {
  stars: ConstellationStarRow[];
  highlightId: string | null;
  arabicUi: boolean;
  reduceMotion: boolean;
  onRevealComplete?: () => void;
  onSelectStar: (star: ConstellationStarRow | null) => void;
};

type DrawStar = ConstellationStarRow & {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  glow: number;
};

const GOLD = { r: 232, g: 212, b: 164 };
const HIGHLIGHT = { r: 253, g: 248, b: 238 };

export default function Act3ConstellationSky({
  stars,
  highlightId,
  arabicUi,
  reduceMotion,
  onRevealComplete,
  onSelectStar,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<DrawStar[]>([]);
  const revealRef = useRef(0);
  const revealDoneRef = useRef(false);
  const rafRef = useRef(0);
  const [selected, setSelected] = useState<ConstellationStarRow | null>(null);

  const rebuild = useCallback(() => {
    const counts = countByMot(stars);
    const max = Math.max(1, ...counts.values());
    starsRef.current = stars.map((s) => {
      const pos = starPositionFromId(s.id);
      const vis = starVisualFromPopularity(counts.get(s.mot) ?? 1, max);
      return { ...s, x: pos.x, y: pos.y, ...vis };
    });
  }, [stars]);

  useEffect(() => {
    rebuild();
    revealRef.current = reduceMotion ? 1 : 0;
    revealDoneRef.current = false;
  }, [rebuild, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      revealRef.current = 1;
      if (!revealDoneRef.current) {
        revealDoneRef.current = true;
        onRevealComplete?.();
      }
      return;
    }
    const start = performance.now();
    const dur = Math.min(6500, 1400 + stars.length * 42);
    const tick = (now: number) => {
      revealRef.current = Math.min(1, (now - start) / dur);
      if (revealRef.current >= 1 && !revealDoneRef.current) {
        revealDoneRef.current = true;
        onRevealComplete?.();
      }
      if (revealRef.current < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stars.length, reduceMotion, onRevealComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(canvas.clientWidth, 1);
      const h = Math.max(canvas.clientHeight, 1);
      const tw = Math.floor(w * dpr);
      const th = Math.floor(h * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };

    const draw = (t: number) => {
      if (!running) return;
      const { w, h } = sizeCanvas();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      const list = starsRef.current;
      const reveal = revealRef.current;
      const visibleCount = Math.ceil(list.length * reveal);

      for (let i = 0; i < visibleCount; i++) {
        for (let j = i + 1; j < Math.min(i + 14, visibleCount); j++) {
          const a = list[i]!;
          const b = list[j]!;
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          if (dx * dx + dy * dy > 160 * 160) continue;
          ctx.strokeStyle = `rgba(197, 160, 89, ${(0.06 + 0.05 * reveal) * a.opacity})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }

      for (let i = 0; i < visibleCount; i++) {
        const s = list[i]!;
        const isHi = s.id === highlightId || selected?.id === s.id;
        const pulse = 0.88 + 0.12 * Math.sin(t * 0.002 + i * 0.4);
        const r = s.radius * (isHi ? 1.65 : 1) * pulse;
        const cx = s.x * w;
        const cy = s.y * h;
        const c = isHi ? HIGHLIGHT : GOLD;
        const a = Math.min(1, s.opacity * reveal * (isHi ? 1.08 : 0.98));

        const glowR = r * (isHi ? 2.65 : 2.15);
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.12 * s.glow * a})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${a})`;
        ctx.fill();

        if (isHi) {
          ctx.strokeStyle = `rgba(255, 248, 238, ${0.65 * a})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => sizeCanvas());
    ro.observe(canvas);

    return () => {
      running = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [highlightId, selected?.id]);

  const hitTest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    let best: DrawStar | null = null;
    let bestD = 0.04;
    for (const s of starsRef.current) {
      const dx = s.x - x;
      const dy = s.y - y;
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  };

  const labelFor = (mot: string) => (arabicUi ? arabicPoemWordLabel(mot) : mot);

  return (
    <div className="absolute inset-0 h-full w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-hidden
        onPointerDown={(e) => {
          const hit = hitTest(e.clientX, e.clientY);
          setSelected(hit);
          onSelectStar(hit);
        }}
      />
      {selected ? (
        <div
          role="status"
          className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-10 w-[min(92vw,22rem)] -translate-x-1/2 rounded-[2px] border border-solar-gold/22 bg-[rgba(12,8,4,0.88)] px-4 py-3 text-center backdrop-blur-md"
        >
          <p className="da-act3-star-label">{labelFor(selected.mot)}</p>
          {selected.prenom_ville ? (
            <p className="da-act3-star-meta mt-1.5">{selected.prenom_ville}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
