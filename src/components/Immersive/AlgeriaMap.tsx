import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';
import gsap from 'gsap';
import { useCursorStore } from '../../hooks/useCursorContext';
import { useCursorPrefsStore } from '../../stores/cursorPrefsStore';
import { useAppCopy } from '../../hooks/useAppCopy';
import { revelationWordUISurface } from '../../lib/appCopy';
import { arabicPoemWordLabel } from '../../lib/mapWordArabicDisplay';
import { wordTooltipLines } from '../../lib/wordTooltipLocale';
import { useLanguageStore } from '../../stores/languageStore';
import type { Act1QuestProgress } from '../../components/ui/HintPanel';
import ActOneAmbiance from './ActOneAmbiance';
import ActOnePhraseStrip from './ActOnePhraseStrip';
import { ALGERIA_PATH } from './algeriaOutlinePath';

/** Path2D partagé : ne pas recréer à chaque frame du canvas. */
const ALGERIA_SHAPE_PATH = new Path2D(ALGERIA_PATH);
import {
  REVELATION_WORDS,
  metaForWord,
  randomPoemWord,
  isRevelationWord,
  type RevelationWord,
  type WordFontRole,
  type Importance,
} from './mapWordData';

/** Carte centrée : échelle un peu plus large pour que littoral / « rayons » ne butent pas au bord du cadre. */
function mapLayout(W: number, H: number) {
  const S = Math.min(W, H) * 0.66;
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
  ctx.fill(ALGERIA_SHAPE_PATH);
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

/** Après ce nombre de clics sans ouvrir le bon mot, surbrillance d’indice sur la carte. */
const WORD_HINT_AFTER_MISS_CLICKS = 2;
/** Surbrillance d’indice : léger zoom pulsé (canvas). */
const HINT_GLOW_SCALE_MIN = 1.07;
const HINT_GLOW_SCALE_AMP = 0.12;
/** Marge cliquable autour du mot (italique / serif = traits fins sur le canvas). */
const WORD_HIT_EXTRA_X = 2.8;
const WORD_HIT_EXTRA_Y = 2.4;

const N_PARTICLES = 2700;
/** Calibre la densité de « slots » poème comme avant (3200 × 0.022 ≈ N_PARTICLES × ce taux). */
const INSIDE_POEM_RATE = (3200 * 0.022) / N_PARTICLES;
/** > 1 : compense la rotation 3D (perspective) pour ne pas révéler le fond derrière aux bords de l’écran. */
/** Légère marge sur scale pour éviter franges aux bords en ultrawide + tilt 3D. */
const MAP_PARALLAX_COVER_SCALE = 1.098;
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

/** Taille d’affichage du mot (alignée hit-test / rendu). */
function poemParticleFontSizePx(p: Particle, hover: boolean): number {
  const mult = hover ? 1.12 : 1;
  const imp = p.importance;
  const base = p.size * (imp === 3 ? 1.22 : imp === 2 ? 1.06 : 0.94) * mult;
  return Math.max(10, Math.round(base));
}

function canvasFontForParticle(p: Particle, hover: boolean): string {
  const sz = poemParticleFontSizePx(p, hover);
  if (p.fontRole === 'serifPoem') {
    return `italic ${sz}px "Playfair Display", "Bahlull", Georgia, serif`;
  }
  return `${sz}px "Inter", system-ui, sans-serif`;
}

export type Act1QuestStep = 'hover' | 'clickWord' | 'zoom';

function sanitizeInitialRevelations(words: string[] | undefined): string[] {
  if (!words?.length) return [];
  const valid = new Set(REVELATION_WORDS as readonly string[]);
  return words.filter((w) => valid.has(w));
}

type AlgeriaMapProps = {
  onMemoryMapComplete?: () => void;
  onRevelationProgress?: (count: number) => void;
  /** Liste persistée des mots « révélation » trouvés (ordre découverte conservé). */
  onRevelationWordsChange?: (words: string[]) => void;
  /** Premiers gestes (panneau gauche) : survol mot, clic sur le bon fragment, zoom */
  onQuestStepComplete?: (step: Act1QuestStep) => void;
  /** Mode revisite après traversée complète : carte déjà éveillée, sans auto-transition vers l'acte II. */
  completedReplay?: boolean;
  /** État carte restauré depuis la sauvegarde (sans forcément avoir terminé la traversée globale). */
  initialRevelationWords?: string[];
  initialQuestProgress?: Act1QuestProgress;
  initialHasZoomed?: boolean;
  initialConsignesDismissed?: boolean;
  onConsignesDismissed?: () => void;
  onHasZoomedPersist?: () => void;
  /** Rail développé vs replié - largeur alignée avec `OrientationPanel`. */
  parcoursRailExpanded?: boolean;
};

export default function AlgeriaMap({
  onMemoryMapComplete,
  onRevelationProgress,
  onRevelationWordsChange,
  onQuestStepComplete,
  completedReplay = false,
  initialRevelationWords,
  initialQuestProgress,
  initialHasZoomed = false,
  initialConsignesDismissed = false,
  onConsignesDismissed,
  onHasZoomedPersist,
  parcoursRailExpanded = true,
}: AlgeriaMapProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  /** Sous-ensemble des index contenant des mots (évite de balayer les entrées au hit-test). */
  const poemParticleIndicesRef = useRef<number[]>([]);
  /** Gradient radial du halo central - recréé seulement si la taille du canvas change. */
  const pulseGradCacheRef = useRef<{ W: number; H: number; grad: CanvasGradient | null }>({
    W: -1,
    H: -1,
    grad: null,
  });
  /** Arrêt rendu canvas si l’onglet est en arrière-plan (CPU/GPU). */
  const pageVisibleRef = useRef(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);
  /** Index canvas du mot-révélation planté (un par mot du parcours). */
  const revelationParticleIdxRef = useRef<Partial<Record<RevelationWord, number>>>({});
  const mouse      = useRef({ x: -9999, y: -9999 });
  const raf        = useRef(0);
  const appearRef  = useRef(0);
  const isDragging = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const ready      = useRef(false);

  const [tooltip, setTooltip] = useState<{
    word: string; verse: string; poem: string; px: number; py: number;
  } | null>(null);
  const tooltipRafRef = useRef<number | null>(null);
  const pendingTooltipRef = useRef<typeof tooltip>(null);
  const queueTooltip = useCallback((next: typeof tooltip) => {
    pendingTooltipRef.current = next;
    if (tooltipRafRef.current != null) return;
    tooltipRafRef.current = requestAnimationFrame(() => {
      tooltipRafRef.current = null;
      setTooltip(pendingTooltipRef.current);
    });
  }, []);
  const [revelationFound, setRevelationFound] = useState<string[]>(() =>
    completedReplay ? [...REVELATION_WORDS] : sanitizeInitialRevelations(initialRevelationWords)
  );
  const [hasZoomed, setHasZoomed] = useState(() => completedReplay || initialHasZoomed === true);
  const prefersReducedMotion = useReducedMotion();
  const copy = useAppCopy();
  const arabicUi = useLanguageStore((s) => s.language === 'ar-dz');

  const poemLabel = useCallback(
    (p: Particle) => {
      if (!arabicUi || !p.isPoem || !p.word) return p.word;
      return arabicPoemWordLabel(p.word);
    },
    [arabicUi],
  );

  const revelRef = useRef(0);
  const mapAwakenedRef = useRef(false);
  const awakenNotify = useRef(
    completedReplay || sanitizeInitialRevelations(initialRevelationWords).length >= 5
  );
  const hoveredIdx = useRef(-1);
  const questDone = useRef({
    hover:
      completedReplay ||
      (initialQuestProgress?.hover ?? false),
    clickWord:
      completedReplay ||
      (initialQuestProgress?.clickWord ?? false),
    zoom:
      completedReplay ||
      (initialQuestProgress?.zoom ?? false),
  });
  const downPt = useRef<{ x: number; y: number } | null>(null);
  const panPending = useRef(false);
  const mapParallaxLayerRef = useRef<HTMLDivElement>(null);
  const mapTiltRafRef = useRef<number | null>(null);
  const mapTiltPendingRef = useRef({ x: 0, y: 0 });
  const applyMapParallax = useCallback((x: number, y: number) => {
    mapTiltPendingRef.current = { x, y };
    if (mapTiltRafRef.current != null) return;
    mapTiltRafRef.current = requestAnimationFrame(() => {
      mapTiltRafRef.current = null;
      const el = mapParallaxLayerRef.current;
      if (!el) return;
      const { x: tx, y: ty } = mapTiltPendingRef.current;
      el.style.transform = `rotateX(${ty}deg) rotateY(${tx}deg) scale(${MAP_PARALLAX_COVER_SCALE}) translateZ(0)`;
    });
  }, []);

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
    onRevelationWordsChange?.(revelationFound);
  }, [revelationFound, onRevelationWordsChange]);

  const { setMode } = useCursorStore();
  const cursorIdle = useCursorPrefsStore((s) => (s.experience === 'basic' ? 'stylus' : 'default'));

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
  const zoomLabelStepRef = useRef(1);
  useMotionValueEvent(zoomSpring, 'change', (v) => {
    const step = Math.round(v * 10) / 10;
    if (step !== zoomLabelStepRef.current) {
      zoomLabelStepRef.current = step;
      setZoomLabel(step);
    }
  });

  /** Mot du parcours en cours - tant qu’il reste des trous, seul ce mot est cliquable / mis en avant. */
  const activeWordTarget = useMemo(
    () => REVELATION_WORDS.find((w) => !revelationFound.includes(w)),
    [revelationFound]
  );

  const activeWordTargetRef = useRef<typeof activeWordTarget>(undefined);
  activeWordTargetRef.current = activeWordTarget;

  /** Indice visuel : surbrillance après N clics sans succès sur le mot attendu. */
  const showWordHintRef = useRef(false);
  const missClicksForHintRef = useRef(0);
  useEffect(() => {
    showWordHintRef.current = false;
    missClicksForHintRef.current = 0;
  }, [activeWordTarget]);

  /** Tutoriel consignes + voile - false si déjà vu (localStorage) */
  const [tutorialActive, setTutorialActive] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (initialConsignesDismissed) return false;
    try {
      return localStorage.getItem(LS_CONSIGNES_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const tutorialVeilRef = useRef<HTMLDivElement>(null);
  const dismissRunningRef = useRef(false);
  const actConsignesRef = useRef<HTMLDivElement>(null);

  const dismissTutorial = useCallback(() => {
    if (!tutorialActive || dismissRunningRef.current) return;
    dismissRunningRef.current = true;
    const veil = tutorialVeilRef.current;
    const cons = actConsignesRef.current;

    const finish = () => {
      try {
        localStorage.setItem(LS_CONSIGNES_KEY, '1');
      } catch {
        /* ignore */
      }
      onConsignesDismissed?.();
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
        { opacity: 1, scale: 1 },
        { opacity: 0, scale: 1.018, duration: 0.88 },
        0
      );
    }
    if (cons) {
      tl.to(cons, { opacity: 0, y: 20, duration: 0.72, ease: 'power2.in' }, 0.06);
    }
    if (!veil && cons) tl.duration(0.75);
    if (veil && !cons) tl.duration(0.9);
  }, [tutorialActive, onConsignesDismissed]);

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
      const isPoem = inside && rnd(i, 3) < INSIDE_POEM_RATE;
      const baseAlpha = inside
        ? (isPoem ? 0.84 + rnd(i, 6) * 0.16 : 0.38 + rnd(i, 7) * 0.38)
        : 0.08 + rnd(i, 8) * 0.1;

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
    const poemIdx: number[] = [];
    const byWord: Partial<Record<RevelationWord, number>> = {};
    for (let i = 0; i < list.length; i++) {
      const p = list[i]!;
      if (p.isPoem) poemIdx.push(i);
      if (p.isRevelation && isRevelationWord(p.word)) {
        byWord[p.word as RevelationWord] = i;
      }
    }
    poemParticleIndicesRef.current = poemIdx;
    revelationParticleIdxRef.current = byWord;
    particles.current = list;
    ready.current = true;
    pulseGradCacheRef.current = { W: -1, H: -1, grad: null };
  }, []);

  useEffect(() => {
    const onVis = () => {
      pageVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let debounceTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => initParticles(), 120);
    });
    ro.observe(canvas);
    return () => {
      window.clearTimeout(debounceTimer);
      ro.disconnect();
    };
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

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      if (!ready.current) return;
      if (!pageVisibleRef.current) return;

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
      const veil = mapAwake ? 1 : 0.5 + 0.5 * (revel / 5);

      ctx.clearRect(0, 0, W, H);

      // Pulse central - gradient réutilisé (évite createRadialGradient à chaque frame).
      const t = performance.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
      const pulseAlpha = 0.1 * pulse * prog * veil * (mapAwake ? 1.25 : 1);
      let cg = pulseGradCacheRef.current;
      if (cg.W !== W || cg.H !== H || !cg.grad) {
        const grd = ctx.createRadialGradient(
          W / 2,
          H / 2,
          0,
          W / 2,
          H / 2,
          Math.min(W, H) * 0.35
        );
        grd.addColorStop(0, 'rgba(197,160,89,1)');
        grd.addColorStop(1, 'rgba(197,160,89,0)');
        cg = { W, H, grad: grd };
        pulseGradCacheRef.current = cg;
      }
      ctx.globalAlpha = pulseAlpha;
      ctx.fillStyle = cg.grad!;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // Zoom / pan (valeurs spring = rendu fluide)
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(z, z);

      ctx.save();
      ctx.translate(mapOX, mapOY);
      ctx.scale(S / 400, S / 400);

      // 1) Algérie - territoire mis en avant (remplissage + contour fort + léger halo)
      ctx.globalAlpha = prog * (0.78 + 0.22 * veil);
      ctx.fillStyle = 'rgba(240, 220, 185, 0.12)';
      ctx.fill(ALGERIA_SHAPE_PATH);

      const pulseStroke = mapAwake ? 0.5 + 0.5 * Math.sin(t * 2.1) : 0;
      const strokeGold = Math.round(mapAwake ? GOLD.r + 38 * pulseStroke : GOLD.r);
      const strokeGg = Math.round(mapAwake ? GOLD.g + 26 * pulseStroke : GOLD.g);

      ctx.globalAlpha = (0.38 + 0.32 * veil) * prog;
      ctx.strokeStyle = `rgba(${strokeGold},${strokeGg},${GOLD.b},${mapAwake ? 0.28 : 0.14})`;
      ctx.lineWidth = (3.2 * 400) / (z * S);
      ctx.stroke(ALGERIA_SHAPE_PATH);

      ctx.globalAlpha = (0.62 + 0.28 * veil) * prog;
      ctx.strokeStyle = `rgba(${strokeGold},${strokeGg},${GOLD.b},${mapAwake ? 0.95 : 0.68})`;
      ctx.lineWidth = (1.78 * 400) / (z * S);
      ctx.shadowColor = 'rgba(253, 248, 238, 0.25)';
      ctx.shadowBlur = 6 / z;
      ctx.stroke(ALGERIA_SHAPE_PATH);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      ctx.globalAlpha = prog * (0.45 + 0.35 * veil) * (mapAwake ? 1 : 0.75);
      ctx.strokeStyle = 'rgba(253, 248, 238, 0.22)';
      ctx.lineWidth = (0.48 * 400) / (z * S);
      ctx.stroke(ALGERIA_SHAPE_PATH);

      ctx.restore();

      const arr = particles.current;
      const hi = hoveredIdx.current;
      const need = activeWordTargetRef.current;
      const hintOn = Boolean(need && showWordHintRef.current);
      const hintIdx =
        hintOn && need ? revelationParticleIdxRef.current[need as RevelationWord] : undefined;

      for (let idx = 0; idx < arr.length; idx++) {
        const p = arr[idx]!;
        p.tx = mapOX + p.ox * S;
        p.ty = mapOY + p.oy * S;

        const dx = p.cx - mx, dy = p.cy - my;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0 && distSq < REPEL_R * REPEL_R) {
          const dist = Math.sqrt(distSq);
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
        const isHintGlow = p.isPoem && hintIdx === idx;
        /** Respiration douce + léger scintillement (DA or / crème, pas halo orangé). */
        const hintBreath = 0.5 + 0.5 * Math.sin(t * 3.05 + idx * 0.11);
        const hintTwinkle =
          0.45 +
          0.55 * Math.sin(t * 5.9 + idx * 0.19) * Math.sin(t * 2.4 + 0.85);
        let drawA = p.alpha * (
          isHover ? 1.22
            : isHintGlow ? 1.12 + 0.14 * hintBreath
            : revel < 3 ? 1.06 : 1
        );
        drawA = Math.min(1, drawA);
        ctx.globalAlpha = drawA;

        if (p.isPoem) {
          ctx.save();
          if (isHover) {
            ctx.shadowColor = 'rgba(253,248,238,0.45)';
            ctx.shadowBlur = 18 / z;
            ctx.font = canvasFontForParticle(p, true);
            ctx.fillStyle = `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
            ctx.fillText(poemLabel(p), p.cx, p.cy);
          } else if (isHintGlow) {
            const hintScalePulse = HINT_GLOW_SCALE_MIN + HINT_GLOW_SCALE_AMP * hintBreath;
            ctx.translate(p.cx, p.cy);
            ctx.scale(hintScalePulse, hintScalePulse);
            ctx.translate(-p.cx, -p.cy);
            ctx.font = canvasFontForParticle(p, false);
            ctx.shadowColor = `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${0.28 + 0.22 * hintBreath})`;
            ctx.shadowBlur = (11 + 9 * hintTwinkle) / z;
            const br = Math.min(255, Math.round(c.r + (CREAM.r - c.r) * (0.4 + 0.35 * hintTwinkle)));
            const bg = Math.min(255, Math.round(c.g + (CREAM.g - c.g) * (0.32 + 0.28 * hintTwinkle)));
            const bb = Math.min(255, Math.round(c.b + (CREAM.b - c.b) * (0.26 + 0.22 * hintTwinkle)));
            ctx.fillStyle = `rgb(${br},${bg},${bb})`;
            ctx.fillText(poemLabel(p), p.cx, p.cy);
            ctx.shadowBlur = (6 + 5 * hintTwinkle) / z;
            ctx.shadowColor = `rgba(253, 248, 238, ${0.2 + 0.18 * hintBreath})`;
            ctx.fillText(poemLabel(p), p.cx, p.cy);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255, 250, 238, ${0.1 + 0.2 * hintTwinkle * hintTwinkle})`;
            ctx.fillText(poemLabel(p), p.cx, p.cy);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.font = canvasFontForParticle(p, false);
            ctx.fillStyle = `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
            ctx.fillText(poemLabel(p), p.cx, p.cy);
          }
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
  }, [zoomSpring, panXSpring, panYSpring, poemLabel]);

  const hitTestWord = useCallback((canvasX: number, canvasY: number) => {
    const z = zoomSpring.get();
    const px = panXSpring.get();
    const py = panYSpring.get();
    const mx2 = (canvasX - px) / z;
    const my2 = (canvasY - py) / z;
    let best: { p: Particle; i: number } | null = null;
    let bestD = Infinity;
    const arr = particles.current;
    const poemIndices = poemParticleIndicesRef.current;
    const needHit = activeWordTargetRef.current;
    const hintIdxHit =
      needHit && showWordHintRef.current
        ? revelationParticleIdxRef.current[needHit as RevelationWord]
        : undefined;
    for (let k = 0; k < poemIndices.length; k++) {
      const i = poemIndices[k]!;
      const p = arr[i]!;
      const sz = poemParticleFontSizePx(p, false);
      const cyVis = p.cy - sz * 0.38;
      const hintPad = hintIdxHit === i ? HINT_GLOW_SCALE_MIN + HINT_GLOW_SCALE_AMP : 1;
      const lw = poemLabel(p).length;
      const halfW =
        Math.max(sz * 1.65, sz * 0.56 * Math.max(lw, 2.5)) * WORD_HIT_EXTRA_X * hintPad;
      const halfH = sz * 0.95 * WORD_HIT_EXTRA_Y * hintPad;
      const dx = mx2 - p.cx;
      const dy = my2 - cyVis;
      if (Math.abs(dx) >= halfW || Math.abs(dy) >= halfH) continue;
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        best = { p, i };
      }
    }
    return best;
  }, [zoomSpring, panXSpring, panYSpring, poemLabel]);

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (tutorialActive) dismissTutorial();
    const canvas = e.currentTarget;
    const r = canvas.getBoundingClientRect();
    // Correction du scale CSS (parallax cover scale + perspective) : getBoundingClientRect
    // renvoie les dimensions visuelles après transform, mais les coords canvas sont en espace layout.
    const scaleX = r.width  > 0 ? canvas.width  / r.width  : 1;
    const scaleY = r.height > 0 ? canvas.height / r.height : 1;
    const cx = (e.clientX - r.left) * scaleX;
    const cy = (e.clientY - r.top)  * scaleY;
    mouse.current = { x: cx, y: cy };

    const rw = r.width;
    const rh = r.height;
    if (rw > 0 && rh > 0) {
      const nx = ((e.clientX - r.left) / rw - 0.5) * 2;
      const ny = ((e.clientY - r.top)  / rh - 0.5) * 2;
      applyMapParallax(nx * 6.8, -ny * 5);
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

    if (hit?.p.isPoem && onQuestStepComplete && !questDone.current.hover) {
      questDone.current.hover = true;
      onQuestStepComplete('hover');
    }

    const blockOtherWords = Boolean(activeWordTarget && hit?.p.isPoem && hit.p.word !== activeWordTarget);
    if (blockOtherWords) {
      hoveredIdx.current = -1;
      queueTooltip(null);
      setMode(z > 1.05 ? 'drag' : cursorIdle);
      return;
    }

    hoveredIdx.current = hit ? hit.i : -1;

    if (hit) {
      const lines = wordTooltipLines(hit.p.word, arabicUi);
      queueTooltip({ word: hit.p.word, verse: lines.verse, poem: lines.poem, px: e.clientX, py: e.clientY });
      setMode('feather', hit.p.word);
    } else {
      queueTooltip(null);
      setMode(z > 1.05 ? 'drag' : cursorIdle);
    }
  }, [
    setMode,
    mpanX,
    mpanY,
    zoomSpring,
    hitTestWord,
    tutorialActive,
    dismissTutorial,
    onQuestStepComplete,
    activeWordTarget,
    applyMapParallax,
    queueTooltip,
    arabicUi,
    cursorIdle,
  ]);

  // ── Wheel zoom centré curseur ─────────────────────────────────────────────
  const handleWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
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
    if (next > 1.12) {
      setHasZoomed((was) => {
        if (!was) onHasZoomedPersist?.();
        return true;
      });
      if (onQuestStepComplete && !questDone.current.zoom) {
        questDone.current.zoom = true;
        onQuestStepComplete('zoom');
      }
    }
  }, [mzoom, mpanX, mpanY, tutorialActive, dismissTutorial, onQuestStepComplete, onHasZoomedPersist]);

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      downPt.current = { x: e.clientX, y: e.clientY };
      panPending.current = zoomSpring.get() > 1.05;
      if (panPending.current) {
        dragStart.current = { x: e.clientX, y: e.clientY, px: mpanX.get(), py: mpanY.get() };
      }
    },
    [zoomSpring, mpanX, mpanY]
  );

  /** Clic sur un bon mot : valide la révélation sans panneau latéral (mécanique conservée). */
  const tryRevealWordFromClick = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement): boolean => {
      const r = canvas.getBoundingClientRect();
      const scaleX = r.width  > 0 ? canvas.width  / r.width  : 1;
      const scaleY = r.height > 0 ? canvas.height / r.height : 1;
      const cx = (clientX - r.left) * scaleX;
      const cy = (clientY - r.top)  * scaleY;
      const hit = hitTestWord(cx, cy);
      if (!hit) return false;

      const need = REVELATION_WORDS.find((w) => !revelationFound.includes(w));
      if (need && hit.p.word !== need) {
        return false;
      }

      if (onQuestStepComplete && !questDone.current.clickWord) {
        questDone.current.clickWord = true;
        onQuestStepComplete('clickWord');
      }
      setTooltip(null);
      /** Toute occurrence du mot attendu compte (pas seulement la pastille « plantée »), pour éviter les doublons illisibles. */
      if (need && hit.p.word === need && isRevelationWord(need)) {
        setRevelationFound((prev) => (prev.includes(need) ? prev : [...prev, need]));
      }
      return true;
    },
    [hitTestWord, onQuestStepComplete, revelationFound]
  );

  const handleMouseUp = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const moved = downPt.current
        ? Math.hypot(e.clientX - downPt.current.x, e.clientY - downPt.current.y)
        : 999;
      const wasDrag = isDragging.current;
      isDragging.current = false;
      panPending.current = false;
      downPt.current = null;

      if (!wasDrag && moved < 14) {
        const opened = tryRevealWordFromClick(e.clientX, e.clientY, e.currentTarget);
        const need = activeWordTargetRef.current;
        if (!opened && need && !showWordHintRef.current) {
          missClicksForHintRef.current += 1;
          if (missClicksForHintRef.current >= WORD_HINT_AFTER_MISS_CLICKS) {
            showWordHintRef.current = true;
          }
        }
      }
      setMode(cursorIdle);
    },
    [setMode, tryRevealWordFromClick, cursorIdle]
  );

  const memoryAwake = revelationFound.length >= 5;

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 max-w-full overflow-x-hidden overflow-y-visible bg-da-depth-map">
      <span className="sr-only">{copy.act1AriaHud}</span>
      <ActOneAmbiance chapterComplete={memoryAwake} />

      {/* ── Grille narrative : chapitre + progression (5 mots-révélation) ── */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-col items-center px-4 pt-6">
        <p className="text-[11px] font-medium tracking-[0.32em] text-solar-gold/72 uppercase [text-shadow:0_1px_14px_rgba(0,0,0,0.75)] md:text-xs">
          {copy.act1HeaderLine}
        </p>
        <div className="mt-3 flex h-[3px] w-full max-w-sm gap-1.5">
          {REVELATION_WORDS.map((w) => (
            <div
              key={w}
              title={arabicUi ? revelationWordUISurface(w, 'ar-dz') : w}
              className={`h-full min-w-0 flex-1 rounded-[1px] transition-all duration-700 ${
                revelationFound.includes(w)
                  ? 'bg-solar-gold shadow-[0_0_14px_rgba(197,160,89,0.45)]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        {memoryAwake ? (
          <p className="mt-3 max-w-lg text-center text-[12px] font-medium leading-snug text-solar-gold/72 [text-shadow:0_1px_14px_rgba(0,0,0,0.82)] sm:text-[13px] md:text-[14px]">
            {copy.act1HudSubtitleDone}
          </p>
        ) : (
          <motion.p
            className="mt-3 max-w-lg text-center text-[12px] font-medium leading-snug text-solar-gold/72 [text-shadow:0_1px_14px_rgba(0,0,0,0.82)] sm:text-[13px] md:text-[14px]"
            animate={{
              opacity: prefersReducedMotion ? 1 : [1, 0.88, 1],
            }}
            transition={{
              duration: 6.5,
              repeat: prefersReducedMotion ? 0 : Infinity,
              ease: [0.45, 0, 0.55, 1],
            }}
          >
            {copy.act1HudSubtitleFind}
          </motion.p>
        )}
      </header>

      <ActOnePhraseStrip revelationFound={revelationFound} chapterComplete={memoryAwake} hasZoomed={hasZoomed} />

      {/* Scène « showcase » : perspective + parallax - overflow-hidden + scale>1 évite les bords noirs au tilt */}
      <div className="absolute inset-0 z-[10] overflow-hidden [perspective:1600px] [perspective-origin:50%_50%]">
        <div
          ref={mapParallaxLayerRef}
          className="absolute inset-0 origin-center will-change-transform [transform-style:preserve-3d]"
          style={{
            transform: `rotateX(0deg) rotateY(0deg) scale(${MAP_PARALLAX_COVER_SCALE}) translateZ(0)`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full cursor-none"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (tooltipRafRef.current != null) {
                cancelAnimationFrame(tooltipRafRef.current);
                tooltipRafRef.current = null;
              }
              setTooltip(null);
              setMode(cursorIdle);
              isDragging.current = false;
              hoveredIdx.current = -1;
              mouse.current = { x: -9999, y: -9999 };
              applyMapParallax(0, 0);
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
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(5,4,3,0.06)_50%,rgba(0,0,0,0.14)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(125deg, rgba(197,160,89,0.14) 0%, transparent 45%, rgba(253,248,238,0.02) 100%)',
          }}
          aria-hidden
        />
      </div>

      {/* ── Tooltip poétique (aperçu au survol) ── */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key={tooltip.word}
            className="fixed z-50 pointer-events-none"
            style={{ left: Math.min(tooltip.px + 20, window.innerWidth - 320), top: Math.max(tooltip.py - 80, 20) }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-[#120e0a]/92 backdrop-blur-xl border border-solar-gold/25 px-5 py-4 max-w-[300px]"
              style={{ boxShadow: '0 0 40px rgba(197,160,89,0.08), inset 0 0 0 1px rgba(197,160,89,0.05)' }}>
                <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-solar-gold/72">{tooltip.poem}</p>
              <p className="font-bahlull text-[1.1rem] italic text-white/90 leading-snug">
                « {tooltip.verse} »
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-solar-gold/20" />
                <p className="text-[10px] font-medium tracking-widest text-solar-gold/70">{copy.introJeanSenacSubtitle}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Consignes tutoriel : bas-gauche (anciennement + bandeau Acte / Sahara - retiré) ── */}
      {tutorialActive && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 z-[45] flex w-full max-w-[min(calc(100vw-1.25rem),380px)] flex-col items-start pb-[max(1.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-4 pt-3 select-none sm:pr-6 md:pb-[max(2.5rem,env(safe-area-inset-bottom))] md:pl-8 md:pr-8"
        >
          <motion.div
            ref={actConsignesRef}
            className="relative mt-0 flex w-full flex-col gap-2"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { delay: 1.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <p className="pl-0.5 text-[9px] font-semibold uppercase tracking-[0.45em] text-solar-gold/65">
              {copy.act1TutorialHeading}
            </p>
            <div className="rounded-[2px] border border-solar-gold/28 bg-[#060504]/85 px-3 py-2.5 shadow-[0_0_0_1px_rgba(197,160,89,0.08),0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-md md:px-3.5 md:py-3">
              <p
                className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-solar-gold [text-shadow:0_0_20px_rgba(197,160,89,0.45),0_1px_8px_rgba(0,0,0,0.85)] md:text-[11px] md:tracking-[0.26em]"
              >
                {copy.act1TutorialLine1}
              </p>
              <p
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-solar-gold/92 [text-shadow:0_0_18px_rgba(197,160,89,0.4),0_1px_8px_rgba(0,0,0,0.8)] md:text-[11px]"
              >
                {copy.act1TutorialLine2}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Échelle / zoom : bas droite, décal si rail Parcours (cf. OrientationPanel) ── */}
      <AnimatePresence>
        {zoomLabel > 1.08 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={
              'pointer-events-none fixed z-[110] flex flex-col items-end gap-2 pb-px text-right ' +
              (parcoursRailExpanded
                ? 'right-[max(1rem,calc(env(safe-area-inset-right)+min(248px,max(200px,22vw))+1.35rem))] '
                : 'right-[max(1rem,calc(env(safe-area-inset-right)+3.35rem))] ') +
              'bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))]'
            }
            role="status"
            aria-label={copy.act1ScaleAria(zoomLabel.toFixed(1))}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.34em] text-solar-gold/60 [text-shadow:0_1px_14px_rgba(0,0,0,0.88)]">
              {copy.act1ScaleLabel}
            </span>
            <span
              className="block h-px w-11 max-w-full bg-gradient-to-l from-solar-gold/40 via-solar-gold/15 to-transparent"
              aria-hidden
            />
            <span className="font-serif text-[15px] italic leading-none tabular-nums tracking-tight text-solar-gold/[0.88] [text-shadow:0_0_26px_rgba(197,160,89,0.2),0_2px_16px_rgba(0,0,0,0.92)]">
              ×{zoomLabel.toFixed(1)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}