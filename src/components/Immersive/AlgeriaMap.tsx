import { useState, useEffect, useLayoutEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionValueEvent } from 'motion/react';
import gsap from 'gsap';
import { useCursorStore } from '../../hooks/useCursorContext';
import { ALGERIA_PATH } from './algeriaOutlinePath';
import {
  REVELATION_WORDS,
  metaForWord,
  randomPoemWord,
  isRevelationWord,
  type WordFontRole,
  type Importance,
} from './mapWordData';

/** Carte en carré centré, plus petite que l’écran → marge autour (moins « zoomé »). */
function mapLayout(W: number, H: number) {
  const S = Math.min(W, H) * 0.5;
  return { S, mapOX: (W - S) / 2, mapOY: (H - S) / 2 };
}

// ─── Couleurs DA ──────────────────────────────────────────────────────────────
const GOLD  = { r: 197, g: 160, b: 89  };
const SAND  = { r: 230, g: 205, b: 155 };
const CREAM = { r: 253, g: 248, b: 238 };

function lerpC(a: {r:number;g:number;b:number}, b: {r:number;g:number;b:number}, t: number) {
  return { r: a.r+(b.r-a.r)*t, g: a.g+(b.g-a.g)*t, b: a.b+(b.b-a.b)*t };
}
function rnd(s: number, salt: number) {
  const x = Math.sin(s * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Construit un bitmap de la silhouette Algérie
function buildChecker(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const sc = size / 400;
  ctx.save();
  ctx.scale(sc, sc);
  ctx.fillStyle = '#fff';
  ctx.fill(new Path2D(ALGERIA_PATH));
  ctx.restore();
  const d = ctx.getImageData(0, 0, size, size).data;
  return (nx: number, ny: number) => {
    const ix = Math.min(size - 1, Math.max(0, Math.round(nx * (size - 1))));
    const iy = Math.min(size - 1, Math.max(0, Math.round(ny * (size - 1))));
    return d[(iy * size + ix) * 4]! > 128;
  };
}

interface Particle {
  ox: number; oy: number;
  cx: number; cy: number;
  tx: number; ty: number;
  size: number;
  alpha: number; baseAlpha: number;
  word: string;
  isPoem: boolean;
  colorT: number;
  fontRole: WordFontRole;
  importance: Importance;
  isRevelation: boolean;
}

const LS_CONSIGNES_KEY = 'al-rihla-consignes-vues';

const N_PARTICLES = 3200;
const REPEL_R = 100;
const REPEL_F = 0.32;
const RETURN  = 0.06;

function plantRevelationKeywords(list: Particle[]) {
  const idxs: number[] = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i]!.isPoem) idxs.push(i);
  }
  for (let s = idxs.length - 1; s > 0; s--) {
    const j = Math.floor(Math.random() * (s + 1));
    [idxs[s], idxs[j]] = [idxs[j]!, idxs[s]!];
  }
  for (let k = 0; k < REVELATION_WORDS.length; k++) {
    const idx = idxs[k];
    if (idx === undefined) break;
    const w = REVELATION_WORDS[k]!;
    const m = metaForWord(w);
    const p = list[idx]!;
    p.word = w;
    p.isRevelation = true;
    p.importance = 3;
    p.fontRole = m.fontRole;
    p.size = 11 + rnd(idx, 44) * 5;
  }
}

function canvasFontForParticle(p: Particle, hover: boolean): string {
  const mult = hover ? 1.12 : 1;
  const imp = p.importance;
  const base = p.size * (imp === 3 ? 1.22 : imp === 2 ? 1.06 : 0.94) * mult;
  const sz = Math.max(9, Math.round(base));
  if (p.fontRole === 'serifPoem') {
    return `italic ${sz}px "Playfair Display", "Bahlull", Georgia, serif`;
  }
  return `${sz}px "Inter", system-ui, sans-serif`;
}

type AlgeriaMapProps = {
  onMemoryMapComplete?: () => void;
  onRevelationProgress?: (count: number) => void;
  escapePriorityRef?: MutableRefObject<(() => boolean) | null>;
};

export default function AlgeriaMap({
  onMemoryMapComplete,
  onRevelationProgress,
  escapePriorityRef,
}: AlgeriaMapProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const mouse      = useRef({ x: -9999, y: -9999 });
  const raf        = useRef(0);
  const appearRef  = useRef(0);
  const isDragging = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const ready      = useRef(false);

  const [tooltip, setTooltip] = useState<{
    word: string; verse: string; poem: string; px: number; py: number;
  } | null>(null);
  const [sidePanel, setSidePanel] = useState<{
    word: string; verse: string; poem: string;
  } | null>(null);
  const [revelationFound, setRevelationFound] = useState<string[]>([]);

  const revelRef = useRef(0);
  const mapAwakenedRef = useRef(false);
  const awakenNotify = useRef(false);
  const hoveredIdx = useRef(-1);
  const downPt = useRef<{ x: number; y: number } | null>(null);
  const panPending = useRef(false);
  const [mapTilt, setMapTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    revelRef.current = revelationFound.length;
    mapAwakenedRef.current = revelationFound.length >= 5;
    if (revelationFound.length >= 5 && onMemoryMapComplete && !awakenNotify.current) {
      awakenNotify.current = true;
      onMemoryMapComplete();
    }
  }, [revelationFound, onMemoryMapComplete]);

  useEffect(() => {
    onRevelationProgress?.(revelationFound.length);
  }, [revelationFound, onRevelationProgress]);

  useEffect(() => {
    if (!escapePriorityRef) return;
    escapePriorityRef.current = () => {
      if (sidePanel) {
        setSidePanel(null);
        return true;
      }
      return false;
    };
    return () => {
      escapePriorityRef.current = null;
    };
  }, [escapePriorityRef, sidePanel]);

  const { setMode } = useCursorStore();

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 6;

  // Cibles (molette / drag) → springs pour zoom/pan fluides
  const mzoom = useMotionValue(1);
  const mpanX = useMotionValue(0);
  const mpanY = useMotionValue(0);
  // Ressorts plus amortis / moins raides = zoom et pan très fluides (inertie douce)
  const zoomSpring  = useSpring(mzoom, { damping: 52, stiffness: 110, mass: 0.92, restDelta: 0.0008 });
  const panXSpring  = useSpring(mpanX, { damping: 54, stiffness: 125, mass: 0.95, restDelta: 0.001 });
  const panYSpring  = useSpring(mpanY, { damping: 54, stiffness: 125, mass: 0.95, restDelta: 0.001 });

  const [zoomLabel, setZoomLabel] = useState(1);
  useMotionValueEvent(zoomSpring, 'change', (v) => setZoomLabel(v));

  /** Tutoriel consignes + voile — false si déjà vu (localStorage) */
  const [tutorialActive, setTutorialActive] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(LS_CONSIGNES_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const tutorialVeilRef = useRef<HTMLDivElement>(null);
  const dismissRunningRef = useRef(false);
  const actHudRef = useRef<HTMLDivElement>(null);
  const actMetaRef = useRef<HTMLDivElement>(null);
  const actTitleRef = useRef<HTMLHeadingElement>(null);
  const actLineRef = useRef<HTMLDivElement>(null);
  const actConsignesRef = useRef<HTMLDivElement>(null);
  const actConsignesGlowRef = useRef<HTMLDivElement>(null);

  const dismissTutorial = useCallback(() => {
    if (!tutorialActive || dismissRunningRef.current) return;
    dismissRunningRef.current = true;
    const veil = tutorialVeilRef.current;
    const cons = actConsignesRef.current;
    const glow = actConsignesGlowRef.current;
    if (glow) gsap.killTweensOf(glow);

    const finish = () => {
      try {
        localStorage.setItem(LS_CONSIGNES_KEY, '1');
      } catch {
        /* ignore */
      }
      setTutorialActive(false);
      dismissRunningRef.current = false;
    };

    if (!veil && !cons) {
      finish();
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: finish,
    });
    if (veil) {
      tl.fromTo(
        veil,
        { opacity: 1, scale: 1, filter: 'blur(0px)' },
        { opacity: 0, scale: 1.018, duration: 0.88, filter: 'blur(4px)' },
        0
      );
    }
    if (cons) {
      tl.to(cons, { opacity: 0, y: 20, duration: 0.72, ease: 'power2.in' }, 0.06);
    }
    if (!veil && cons) tl.duration(0.75);
    if (veil && !cons) tl.duration(0.9);
  }, [tutorialActive]);

  useEffect(() => {
    if (!tutorialActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();
      dismissTutorial();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [tutorialActive, dismissTutorial]);

  useLayoutEffect(() => {
    const v = tutorialVeilRef.current;
    if (!v || !tutorialActive) return;
    gsap.fromTo(v, { opacity: 0 }, { opacity: 1, duration: 0.48, ease: 'power2.out' });
  }, [tutorialActive]);

  useLayoutEffect(() => {
    const root = actHudRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const meta = actMetaRef.current;
      const title = actTitleRef.current;
      const line = actLineRef.current;
      const consignes = actConsignesRef.current;
      const glow = actConsignesGlowRef.current;

      gsap.set(meta, { opacity: 0, x: -12 });
      gsap.set(title, { opacity: 0, y: 12 });
      gsap.set(line, { scaleX: 0, transformOrigin: '0% 50%' });
      if (consignes) gsap.set(consignes, { opacity: 0, y: 10 });

      const tl = gsap.timeline({ delay: 0.45, defaults: { ease: 'power3.out' } });
      tl.to(meta, { opacity: 1, x: 0, duration: 0.5 })
        .to(title, { opacity: 1, y: 0, duration: 0.55 }, '-=0.36')
        .to(line, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, '-=0.38');
      if (consignes) {
        tl.to(consignes, { opacity: 1, y: 0, duration: 0.5 }, '-=0.28');
      }

      if (glow && tutorialActive) {
        const shadowSoft =
          '0 0 0 1px rgba(197,160,89,0.12), 0 10px 40px rgba(0,0,0,0.45), 0 0 36px rgba(197,160,89,0.14), inset 0 0 28px rgba(197,160,89,0.05)';
        const shadowBright =
          '0 0 0 1px rgba(197,160,89,0.2), 0 10px 40px rgba(0,0,0,0.45), 0 0 52px rgba(197,160,89,0.28), inset 0 0 36px rgba(197,160,89,0.1)';
        gsap.set(glow, { boxShadow: shadowSoft });
        gsap.to(glow, {
          boxShadow: shadowBright,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.6,
        });
      }
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intro une fois au montage selon présence consignes
  }, []);

  // ── Init + resize ─────────────────────────────────────────────────────────
  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth  || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const checker = buildChecker(256);
    const { S, mapOX, mapOY } = mapLayout(W, H);
    const list: Particle[] = [];

    for (let i = 0; i < N_PARTICLES; i++) {
      const ox = rnd(i, 1);
      const oy = rnd(i, 2);
      const inside = checker(ox, oy);
      const isPoem = inside && rnd(i, 3) < 0.022;
      const baseAlpha = inside
        ? (isPoem ? 0.75 + rnd(i, 6) * 0.25 : 0.3 + rnd(i, 7) * 0.4)
        : 0.06 + rnd(i, 8) * 0.08;

      const w = isPoem ? randomPoemWord(i) : '';
      const m = isPoem ? metaForWord(w) : null;

      list.push({
        ox,
        oy,
        cx: mapOX + ox * S,
        cy: mapOY + oy * S,
        tx: mapOX + ox * S,
        ty: mapOY + oy * S,
        size: isPoem ? 8 + rnd(i, 4) * (m!.importance >= 2 ? 5 : 3.5) : 1.2 + rnd(i, 5) * 1.8,
        alpha: 0,
        baseAlpha,
        word: w,
        isPoem,
        colorT: rnd(i, 10),
        fontRole: m?.fontRole ?? 'sansNote',
        importance: m?.importance ?? 1,
        isRevelation: false,
      });
    }
    plantRevelationKeywords(list);
    particles.current = list;
    ready.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => initParticles());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [initParticles]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void document.fonts.ready.then(() => initParticles());
    });
    return () => cancelAnimationFrame(id);
  }, [initParticles]);

  // ── Fade-in ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const start = performance.now();
    const fade = () => {
      appearRef.current = Math.min((performance.now() - start) / 2200, 1);
      if (appearRef.current < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }, []);

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      if (!ready.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      if (!W || !H) return;

      const z = zoomSpring.get();
      const px = panXSpring.get();
      const py = panYSpring.get();
      const { S, mapOX, mapOY } = mapLayout(W, H);
      const mx = (mouse.current.x - px) / z;
      const my = (mouse.current.y - py) / z;
      const prog = appearRef.current;
      const revel = revelRef.current;
      const mapAwake = revel >= 5;
      const veil = mapAwake ? 1 : 0.34 + 0.66 * (revel / 5);

      ctx.clearRect(0, 0, W, H);

      // Pulse central (intensité liée à la progression des révélations)
      const t = performance.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
      const pulseA = 0.1 * pulse * prog * veil * (mapAwake ? 1.25 : 1);
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.min(W,H) * 0.35);
      grd.addColorStop(0, `rgba(197,160,89,${pulseA})`);
      grd.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Zoom / pan (valeurs spring = rendu fluide)
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(z, z);

      // Terre : remplissage doux + un seul trait fin (contour GeoJSON, pas d’étirement W×H)
      const algeriaShape = new Path2D(ALGERIA_PATH);
      ctx.save();
      ctx.translate(mapOX, mapOY);
      ctx.scale(S / 400, S / 400);
      ctx.globalAlpha = prog * (0.65 + 0.35 * veil);
      ctx.fillStyle = 'rgba(230, 205, 155, 0.07)';
      ctx.fill(algeriaShape);
      const pulseStroke = mapAwake ? 0.5 + 0.5 * Math.sin(t * 2.1) : 0;
      const strokeGold = Math.round(mapAwake ? GOLD.r + 35 * pulseStroke : GOLD.r);
      const strokeGg = Math.round(mapAwake ? GOLD.g + 22 * pulseStroke : GOLD.g);
      ctx.globalAlpha = (0.55 + 0.25 * veil) * prog;
      ctx.strokeStyle = `rgba(${strokeGold},${strokeGg},${GOLD.b},${mapAwake ? 0.72 : 0.5})`;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = (1.35 * 400) / (z * S);
      ctx.stroke(algeriaShape);
      ctx.restore();

      const arr = particles.current;
      const hi = hoveredIdx.current;
      for (let idx = 0; idx < arr.length; idx++) {
        const p = arr[idx]!;
        p.tx = mapOX + p.ox * S;
        p.ty = mapOY + p.oy * S;

        const dx = p.cx - mx, dy = p.cy - my;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < REPEL_R && dist > 0) {
          const f = (1 - dist / REPEL_R) * REPEL_F;
          p.tx += (dx / dist) * f * REPEL_R;
          p.ty += (dy / dist) * f * REPEL_R;
        }

        p.cx += (p.tx - p.cx) * RETURN;
        p.cy += (p.ty - p.cy) * RETURN;

        const target = p.baseAlpha * prog * veil * (mapAwake && p.isPoem ? 1.12 : 1);
        p.alpha += (target - p.alpha) * 0.05;
        if (p.alpha < 0.005) continue;

        const c = lerpC(GOLD, p.isPoem ? CREAM : SAND, p.colorT);
        const isHover = p.isPoem && idx === hi;
        let drawA = p.alpha * (isHover ? 1.2 : 1);
        drawA = Math.min(1, drawA);
        ctx.globalAlpha = drawA;

        if (p.isPoem) {
          ctx.save();
          if (isHover) {
            ctx.shadowColor = 'rgba(253,248,238,0.45)';
            ctx.shadowBlur = 18 / z;
          }
          ctx.font = canvasFontForParticle(p, isHover);
          ctx.fillStyle = `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
          ctx.fillText(p.word, p.cx, p.cy);
          ctx.restore();
        } else {
          ctx.fillStyle = `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [zoomSpring, panXSpring, panYSpring]);

  const hitTestWord = useCallback((canvasX: number, canvasY: number) => {
    const z = zoomSpring.get();
    const px = panXSpring.get();
    const py = panYSpring.get();
    const mx2 = (canvasX - px) / z;
    const my2 = (canvasY - py) / z;
    let best: { p: Particle; i: number } | null = null;
    let bestD = Infinity;
    const arr = particles.current;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i]!;
      if (!p.isPoem) continue;
      const dx = mx2 - p.cx;
      const dy = my2 - p.cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const hitR = p.size * (p.importance >= 3 ? 4.2 : 3.5);
      if (d < hitR && d < bestD) {
        bestD = d;
        best = { p, i };
      }
    }
    return best;
  }, [zoomSpring, panXSpring, panYSpring]);

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tutorialActive) dismissTutorial();
    const r = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    mouse.current = { x: cx, y: cy };

    const rw = r.width;
    const rh = r.height;
    if (rw > 0 && rh > 0) {
      const nx = (cx / rw - 0.5) * 2;
      const ny = (cy / rh - 0.5) * 2;
      setMapTilt({ x: nx * 6.8, y: -ny * 5 });
    }

    if (downPt.current && panPending.current && zoomSpring.get() > 1.05) {
      const moved = Math.hypot(e.clientX - downPt.current.x, e.clientY - downPt.current.y);
      if (moved > 10 && !isDragging.current) {
        isDragging.current = true;
        setMode('drag');
      }
    }

    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const nx = dragStart.current.px + dx;
      const ny = dragStart.current.py + dy;
      mpanX.set(nx);
      mpanY.set(ny);
      hoveredIdx.current = -1;
      return;
    }

    const z = zoomSpring.get();
    const hit = hitTestWord(cx, cy);
    hoveredIdx.current = hit ? hit.i : -1;

    if (hit) {
      const d = metaForWord(hit.p.word);
      setTooltip({ word: hit.p.word, verse: d.verse, poem: d.poem, px: e.clientX, py: e.clientY });
      setMode('feather', hit.p.word);
    } else {
      setTooltip(null);
      setMode(z > 1.05 ? 'drag' : 'default');
    }
  }, [setMode, mpanX, mpanY, zoomSpring, hitTestWord, tutorialActive, dismissTutorial]);

  // ── Wheel zoom centré curseur ─────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (tutorialActive) dismissTutorial();
    e.preventDefault();
    // Molette : pas plus fin (trackpad = petits deltas)
    const raw = e.deltaY;
    const step = Math.sign(raw) * Math.min(Math.abs(raw) * 0.0018, 0.11);
    const factor = 1 - step;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const prev = mzoom.get();
    const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev * factor));
    if (next === prev) return;
    const scale = next / prev;
    const curX = mpanX.get();
    const curY = mpanY.get();
    const nx = mx - scale * (mx - curX);
    const ny = my - scale * (my - curY);
    mpanX.set(next <= ZOOM_MIN ? 0 : nx);
    mpanY.set(next <= ZOOM_MIN ? 0 : ny);
    mzoom.set(next);
  }, [mzoom, mpanX, mpanY, tutorialActive, dismissTutorial]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      downPt.current = { x: e.clientX, y: e.clientY };
      panPending.current = zoomSpring.get() > 1.05;
      if (panPending.current) {
        dragStart.current = { x: e.clientX, y: e.clientY, px: mpanX.get(), py: mpanY.get() };
      }
    },
    [zoomSpring, mpanX, mpanY]
  );

  const openWordPanel = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      const r = canvas.getBoundingClientRect();
      const cx = clientX - r.left;
      const cy = clientY - r.top;
      const hit = hitTestWord(cx, cy);
      if (!hit) return;
      const m = metaForWord(hit.p.word);
      setSidePanel({ word: hit.p.word, verse: m.verse, poem: m.poem });
      setTooltip(null);
      if (hit.p.isRevelation && isRevelationWord(hit.p.word)) {
        setRevelationFound((prev) =>
          prev.includes(hit.p.word) ? prev : [...prev, hit.p.word]
        );
      }
    },
    [hitTestWord]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const moved = downPt.current
        ? Math.hypot(e.clientX - downPt.current.x, e.clientY - downPt.current.y)
        : 999;
      const wasDrag = isDragging.current;
      isDragging.current = false;
      panPending.current = false;
      downPt.current = null;

      if (!wasDrag && moved < 14) {
        openWordPanel(e.clientX, e.clientY, e.currentTarget);
      }
      setMode('default');
    },
    [setMode, openWordPanel]
  );

  const memoryAwake = revelationFound.length >= 5;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0a0806' }}>
      {/* ── Grille narrative : chapitre + progression (5 mots-révélation) ── */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-col items-center px-4 pt-6">
        <p className="text-[9px] tracking-[0.45em] text-solar-gold/42 uppercase">Chapitre I — Carte-mémoire</p>
        <div className="mt-3 flex h-[3px] w-full max-w-sm gap-1.5">
          {REVELATION_WORDS.map((w) => (
            <div
              key={w}
              title={w}
              className={`h-full min-w-0 flex-1 rounded-full transition-all duration-700 ${
                revelationFound.includes(w)
                  ? 'bg-solar-gold shadow-[0_0_14px_rgba(197,160,89,0.45)]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 max-w-md text-center text-[9px] leading-relaxed text-solar-gold/32">
          {memoryAwake
            ? 'Les cinq feux sont rallumés — la carte respire.'
            : 'Cherchez cinq mots du territoire intérieur : naissance, soleil, mère, liberté, corps.'}
        </p>
      </header>

      {/* Scène « showcase » : perspective + léger parallax (Canvas 2D inchangé) */}
      <div className="absolute inset-0 [perspective:1600px]">
        <div
          className="absolute inset-2 origin-center will-change-transform [transform-style:preserve-3d] max-md:inset-1"
          style={{
            transform: `rotateX(${mapTilt.y}deg) rotateY(${mapTilt.x}deg) scale(0.987) translateZ(0)`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full cursor-none"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setTooltip(null);
              setMode('default');
              isDragging.current = false;
              hoveredIdx.current = -1;
              mouse.current = { x: -9999, y: -9999 };
              setMapTilt({ x: 0, y: 0 });
            }}
            onWheel={handleWheel}
          />
        </div>
        {tutorialActive && (
          <div
            ref={tutorialVeilRef}
            className="pointer-events-none absolute inset-0 z-[8]"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 90% 75% at 12% 100%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.74) 100%), radial-gradient(ellipse 120% 80% at 50% -5%, rgba(0,0,0,0.5) 0%, transparent 55%)',
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_0%,rgba(5,4,3,0.35)_55%,rgba(0,0,0,0.82)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(125deg, rgba(197,160,89,0.35) 0%, transparent 42%, rgba(253,248,238,0.04) 100%)',
          }}
          aria-hidden
        />
      </div>

      {/* ── Panneau latéral (clic sur un mot) ── */}
      <AnimatePresence>
        {sidePanel && (
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-word-title"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-[100] flex h-full w-[min(420px,92vw)] flex-col border-l border-solar-gold/20 bg-[#080705]/96 px-7 py-10 pl-8 shadow-[-20px_0_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <button
              type="button"
              className="absolute right-5 top-5 text-[9px] uppercase tracking-[0.35em] text-solar-gold/45 transition-colors hover:text-solar-gold/90"
              onClick={() => setSidePanel(null)}
            >
              Fermer
            </button>
            <p className="text-[8px] uppercase tracking-[0.55em] text-solar-gold/45">{sidePanel.poem}</p>
            <h3 id="memory-word-title" className="font-bahlull mt-3 text-3xl italic text-white/95">
              {sidePanel.word}
            </h3>
            <p className="font-serif mt-6 text-lg italic leading-relaxed text-white/85">« {sidePanel.verse} »</p>
            <p className="mt-8 text-[9px] tracking-widest text-solar-gold/40">Jean Sénac</p>
            <div className="mt-10 h-px w-full bg-solar-gold/15" />
            <p className="mt-4 text-[10px] leading-relaxed text-solar-gold/35">
              Fragment — lecture audio et archives visuelles : prochaine itération.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 w-fit rounded border border-solar-gold/20 px-4 py-2 text-[9px] uppercase tracking-[0.3em] text-solar-gold/25"
            >
              Écouter (bientôt)
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Tooltip poétique (aperçu au survol) ── */}
      <AnimatePresence>
        {tooltip && !sidePanel && (
          <motion.div
            key={tooltip.word}
            className="fixed z-50 pointer-events-none"
            style={{ left: Math.min(tooltip.px + 20, window.innerWidth - 320), top: Math.max(tooltip.py - 80, 20) }}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-[#120e0a]/92 backdrop-blur-xl border border-solar-gold/25 px-5 py-4 max-w-[300px]"
              style={{ boxShadow: '0 0 40px rgba(197,160,89,0.08), inset 0 0 0 1px rgba(197,160,89,0.05)' }}>
              <p className="text-[8px] tracking-[0.55em] uppercase text-solar-gold/45 mb-2">{tooltip.poem}</p>
              <p className="font-bahlull text-[1.1rem] italic text-white/90 leading-snug">
                « {tooltip.verse} »
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-solar-gold/20" />
                <p className="text-[9px] text-solar-gold/50 font-light tracking-widest">Jean Sénac</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HUD acte : bas gauche, au-dessus du voile tutoriel (z-8) ── */}
      <div
        ref={actHudRef}
        className="pointer-events-none absolute bottom-0 left-0 z-[18] flex max-w-[min(92vw,320px)] flex-col items-start pl-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pr-3 pt-0 select-none md:max-w-sm md:pl-7 md:pb-[max(2rem,env(safe-area-inset-bottom))]"
      >
        <div className="relative pl-2">
          <div
            className="pointer-events-none absolute bottom-1 left-0 top-3 w-px bg-gradient-to-b from-solar-gold/40 via-solar-gold/15 to-transparent"
            aria-hidden
          />
          <div ref={actMetaRef} className="pl-1">
            <p className="text-[7px] font-light uppercase tracking-[0.65em] text-solar-gold/50 md:tracking-[0.72em]">
              Acte I <span className="text-solar-gold/25">·</span> Algérie
            </p>
          </div>
          <h2
            ref={actTitleRef}
            className="font-bahlull mt-2.5 text-[clamp(1.6rem,4vw,2.25rem)] italic leading-[1.06] text-white/[0.93]"
            style={{ textShadow: '0 0 32px rgba(197,160,89,0.22)' }}
          >
            La Naissance
          </h2>
          <div
            ref={actLineRef}
            className="mt-3 h-px w-24 max-w-[90%] origin-left bg-gradient-to-r from-solar-gold/55 via-solar-gold/25 to-transparent md:w-[6.5rem]"
          />

          {tutorialActive && (
            <div ref={actConsignesRef} className="mt-5 flex flex-col gap-2">
              <p className="pl-0.5 text-[6px] font-medium uppercase tracking-[0.7em] text-solar-gold/32">
                Consignes
              </p>
              <div
                ref={actConsignesGlowRef}
                className="rounded-[2px] border border-solar-gold/28 bg-[#060504]/80 px-3 py-2.5 backdrop-blur-md md:px-3.5 md:py-3"
              >
                <p
                  className="text-[7px] font-medium uppercase leading-relaxed tracking-[0.36em] text-solar-gold/[0.88] md:text-[7.5px] md:tracking-[0.4em]"
                  style={{
                    textShadow:
                      '0 0 18px rgba(197,160,89,0.4), 0 0 6px rgba(253,248,238,0.12)',
                  }}
                >
                  Survolez — clic pour ouvrir —
                </p>
                <p
                  className="mt-2 text-[7px] font-medium uppercase tracking-[0.42em] text-solar-gold/[0.82] md:text-[7.5px]"
                  style={{
                    textShadow: '0 0 16px rgba(197,160,89,0.35)',
                  }}
                >
                  Molette zoom
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Indicateur zoom ── */}
      <AnimatePresence>
        {zoomLabel > 1.08 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 right-[min(200px,24vw)] text-[9px] tracking-[0.4em] text-solar-gold/35 pointer-events-none z-10 max-md:right-3 max-md:top-8"
          >
            ×{zoomLabel.toFixed(1)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}