import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ConstellationStarRow } from "../../lib/act3ConstellationApi";
import { countByMot } from "../../lib/act3ConstellationApi";
import {
  constellationAllEdges,
  starPositionForRow,
  starVisualFromPopularity,
} from "../../lib/act3StarLayout";
import { arabicPoemWordLabel } from "../../lib/mapWordArabicDisplay";
import {
  cometAlpha,
  cometCoreScale,
  cometGlowScale,
  cometTrailAngleRad,
  easeInOutCubic,
  easeOutCubic,
} from "../../lib/act3CometAppear";
import {
  ACT3_COMET_APPEAR_MS,
  ACT3_COMET_APPEAR_LEAD_MS,
  ACT3_COMET_APPEAR_STAGGER_MS,
  ACT3_STAR_FOCUS_HOLD_MS,
  ACT3_STAR_FOCUS_ZOOM_IN_MS,
  ACT3_STAR_FOCUS_ZOOM_OUT_MS,
  act3Ms,
  act3SkyRevealDurationMs,
} from "../../lib/act3ConstellationTiming";

export type Act3ConstellationSkyHandle = {
  /** Centre et zoome sur l’étoile du visiteur ; `false` si introuvable. */
  focusVisitorStar: () => boolean;
};

type Props = {
  stars: ConstellationStarRow[];
  highlightId: string | null;
  /** Mot choisi (repli si l’id localStorage ne correspond plus à la BDD). */
  highlightMot: string | null;
  /** Incrémenté par le parent pour centrer l’étoile du visiteur. */
  focusMyStarToken?: number;
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
const FOCUS_ZOOM = 2.55;
const FOCUS_Y = 0.5;

type Camera = {
  panX: number;
  panY: number;
  panTx: number;
  panTy: number;
  zoom: number;
  zoomT: number;
};

function lerpCamera(cam: Camera, k: number) {
  cam.panX += (cam.panTx - cam.panX) * k;
  cam.panY += (cam.panTy - cam.panY) * k;
  cam.zoom += (cam.zoomT - cam.zoom) * k;
}

/** Coordonnées normalisées → écran avec pan + zoom (centre optique). */
function mapStarToScreen(nx: number, ny: number, cam: Camera, w: number, h: number) {
  const zx = (nx + cam.panX - 0.5) * cam.zoom + 0.5;
  const zy = (ny + cam.panY - FOCUS_Y) * cam.zoom + FOCUS_Y;
  return { x: zx * w, y: zy * h };
}

function screenToNorm(sx: number, sy: number, cam: Camera) {
  const nx = (sx - 0.5) / cam.zoom - cam.panX + 0.5;
  const ny = (sy - FOCUS_Y) / cam.zoom - cam.panY + FOCUS_Y;
  return { x: nx, y: ny };
}

function rowToDrawStar(row: ConstellationStarRow, all: ConstellationStarRow[]): DrawStar {
  const counts = countByMot(all);
  const max = Math.max(1, ...counts.values());
  const pos = starPositionForRow(row, all);
  const vis = starVisualFromPopularity(counts.get(row.mot) ?? 1, max);
  return { ...row, x: pos.x, y: pos.y, ...vis };
}

function resolveVisitorStar(
  list: DrawStar[],
  all: ConstellationStarRow[],
  highlightId: string | null,
  highlightMot: string | null,
): DrawStar | null {
  if (highlightId) {
    const byId = list.find((s) => s.id === highlightId);
    if (byId) return byId;
    const row = all.find((s) => s.id === highlightId);
    if (row) return rowToDrawStar(row, all);
  }

  if (!highlightMot) return null;

  const sameMot = all.filter((s) => s.mot === highlightMot);
  if (!sameMot.length) return null;

  const row =
    (highlightId ? sameMot.find((s) => s.id === highlightId) : null) ??
    [...sameMot].sort(
      (a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
    )[0]!;

  return list.find((s) => s.id === row.id) ?? rowToDrawStar(row, all);
}

const Act3ConstellationSky = forwardRef<Act3ConstellationSkyHandle, Props>(
  function Act3ConstellationSky(
    {
      stars,
      highlightId,
      highlightMot,
      focusMyStarToken = 0,
      arabicUi,
      reduceMotion,
      onRevealComplete,
      onSelectStar,
    },
    ref,
  ) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<DrawStar[]>([]);
  const revealRef = useRef(0);
  const revealDoneRef = useRef(false);
  const appearRef = useRef<Map<string, { startAt: number }>>(new Map());
  const knownStarIdsRef = useRef<Set<string>>(new Set());
  const rafRef = useRef(0);
  const cameraRef = useRef<Camera>({
    panX: 0,
    panY: 0,
    panTx: 0,
    panTy: 0,
    zoom: 1,
    zoomT: 1,
  });
  type StarFocusAnim =
    | { phase: "idle" }
    | {
        phase: "zoom-in" | "zoom-out";
        startAt: number;
        duration: number;
        fromPanX: number;
        fromPanY: number;
        fromZoom: number;
        toPanX: number;
        toPanY: number;
        toZoom: number;
        star: DrawStar;
      }
    | { phase: "hold"; until: number; star: DrawStar };
  const focusAnimRef = useRef<StarFocusAnim>({ phase: "idle" });
  const [selected, setSelected] = useState<ConstellationStarRow | null>(null);

  const resetCameraHome = useCallback((snap = false) => {
    const cam = cameraRef.current;
    cam.panTx = 0;
    cam.panTy = 0;
    cam.zoomT = 1;
    if (snap || reduceMotion) {
      cam.panX = 0;
      cam.panY = 0;
      cam.zoom = 1;
    }
    focusAnimRef.current = { phase: "idle" };
  }, [reduceMotion]);

  const rebuild = useCallback(() => {
    const counts = countByMot(stars);
    const max = Math.max(1, ...counts.values());
    starsRef.current = stars.map((s) => {
      const pos = starPositionForRow(s, stars);
      const vis = starVisualFromPopularity(counts.get(s.mot) ?? 1, max);
      return { ...s, x: pos.x, y: pos.y, ...vis };
    });
  }, [stars]);

  const syncCometAppearances = useCallback(
    (list: DrawStar[]) => {
      const now = performance.now();
      const ids = new Set(list.map((s) => s.id));

      if (reduceMotion) {
        for (const s of list) appearRef.current.set(s.id, { startAt: now });
        knownStarIdsRef.current = ids;
        return;
      }

      for (let i = 0; i < list.length; i++) {
        const s = list[i]!;
        if (knownStarIdsRef.current.has(s.id)) continue;
        const startAt =
          s.id === highlightId
            ? now + 100
            : now +
              ACT3_COMET_APPEAR_LEAD_MS +
              i * ACT3_COMET_APPEAR_STAGGER_MS;
        appearRef.current.set(s.id, { startAt });
      }

      for (const id of appearRef.current.keys()) {
        if (!ids.has(id)) appearRef.current.delete(id);
      }
      knownStarIdsRef.current = ids;
    },
    [highlightId, reduceMotion],
  );

  const starsCountRef = useRef(0);

  useEffect(() => {
    rebuild();
    if (stars.length !== starsCountRef.current) {
      starsCountRef.current = stars.length;
      resetCameraHome(true);
    }
    revealRef.current = reduceMotion ? 1 : 0;
    revealDoneRef.current = false;
    syncCometAppearances(starsRef.current);
  }, [rebuild, reduceMotion, resetCameraHome, syncCometAppearances, stars.length]);

  useEffect(() => {
    syncCometAppearances(starsRef.current);
  }, [stars, syncCometAppearances]);

  const startVisitorStarFocusSequence = useCallback(
    (star: DrawStar) => {
      const cam = cameraRef.current;
      const toPanX = 0.5 - star.x;
      const toPanY = FOCUS_Y - star.y;
      const toZoom = FOCUS_ZOOM;

      appearRef.current.set(star.id, {
        startAt: performance.now() - ACT3_COMET_APPEAR_MS,
      });
      setSelected(star);
      onSelectStar(star);

      if (reduceMotion) {
        cam.panX = toPanX;
        cam.panY = toPanY;
        cam.zoom = toZoom;
        cam.panTx = toPanX;
        cam.panTy = toPanY;
        cam.zoomT = toZoom;
        window.setTimeout(() => {
          resetCameraHome(true);
          setSelected(null);
          onSelectStar(null);
        }, act3Ms(700, true));
        return;
      }

      focusAnimRef.current = {
        phase: "zoom-in",
        startAt: performance.now(),
        duration: ACT3_STAR_FOCUS_ZOOM_IN_MS,
        fromPanX: cam.panX,
        fromPanY: cam.panY,
        fromZoom: cam.zoom,
        toPanX,
        toPanY,
        toZoom,
        star,
      };
    },
    [onSelectStar, reduceMotion, resetCameraHome],
  );

  const focusVisitorStar = useCallback(() => {
    if (focusAnimRef.current.phase !== "idle") return true;
    const star = resolveVisitorStar(
      starsRef.current,
      stars,
      highlightId,
      highlightMot,
    );
    if (!star) return false;
    startVisitorStarFocusSequence(star);
    return true;
  }, [stars, highlightId, highlightMot, startVisitorStarFocusSequence]);

  useImperativeHandle(ref, () => ({ focusVisitorStar }), [focusVisitorStar]);

  useEffect(() => {
    if (focusMyStarToken === 0) return;
    focusVisitorStar();
  }, [focusMyStarToken, focusVisitorStar]);

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
    const dur = act3SkyRevealDurationMs(stars.length, false);
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
      const byId = new Map<string, DrawStar>(list.map((s) => [s.id, s]));
      const edges = constellationAllEdges(stars);

      const cam = cameraRef.current;
      const camK = reduceMotion ? 1 : 0.12;
      const focusAnim = focusAnimRef.current;

      if (focusAnim.phase === "zoom-in" || focusAnim.phase === "zoom-out") {
        const elapsed = t - focusAnim.startAt;
        const te = easeInOutCubic(elapsed / focusAnim.duration);
        cam.panX =
          focusAnim.fromPanX + (focusAnim.toPanX - focusAnim.fromPanX) * te;
        cam.panY =
          focusAnim.fromPanY + (focusAnim.toPanY - focusAnim.fromPanY) * te;
        cam.zoom =
          focusAnim.fromZoom + (focusAnim.toZoom - focusAnim.fromZoom) * te;
        cam.panTx = cam.panX;
        cam.panTy = cam.panY;
        cam.zoomT = cam.zoom;

        if (elapsed >= focusAnim.duration) {
          if (focusAnim.phase === "zoom-in") {
            focusAnimRef.current = {
              phase: "hold",
              until: t + ACT3_STAR_FOCUS_HOLD_MS,
              star: focusAnim.star,
            };
          } else {
            focusAnimRef.current = { phase: "idle" };
            setSelected(null);
            onSelectStar(null);
          }
        }
      } else if (focusAnim.phase === "hold") {
        const star = focusAnim.star;
        cam.panTx = 0.5 - star.x;
        cam.panTy = FOCUS_Y - star.y;
        cam.zoomT = FOCUS_ZOOM;
        cam.panX += (cam.panTx - cam.panX) * camK;
        cam.panY += (cam.panTy - cam.panY) * camK;
        cam.zoom += (cam.zoomT - cam.zoom) * camK;

        if (t >= focusAnim.until) {
          focusAnimRef.current = {
            phase: "zoom-out",
            startAt: t,
            duration: ACT3_STAR_FOCUS_ZOOM_OUT_MS,
            fromPanX: cam.panX,
            fromPanY: cam.panY,
            fromZoom: cam.zoom,
            toPanX: 0,
            toPanY: 0,
            toZoom: 1,
            star,
          };
        }
      } else {
        lerpCamera(cam, camK);
      }

      const zoomed = cam.zoom > 1.08;

      const appearOf = (id: string) => {
        if (reduceMotion) return 1;
        const entry = appearRef.current.get(id);
        if (!entry) return 1;
        const elapsed = t - entry.startAt;
        if (elapsed <= 0) return 0;
        return Math.min(1, elapsed / ACT3_COMET_APPEAR_MS);
      };

      const drawEdge = (
        a: DrawStar,
        b: DrawStar,
        kind: "mot" | "bridge",
        alphaMul: number,
        linkT: number,
      ) => {
        const base = kind === "mot" ? 0.42 : 0.22;
        const alpha = Math.min(1, base * reveal * alphaMul * easeOutCubic(linkT));
        if (alpha < 0.04 || linkT <= 0.01) return;

        const aPt = mapStarToScreen(a.x, a.y, cam, w, h);
        const bPt = mapStarToScreen(b.x, b.y, cam, w, h);
        const ax = aPt.x;
        const ay = aPt.y;
        const bx = bPt.x;
        const by = bPt.y;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const ex = ax + ux * len * linkT;
        const ey = ay + uy * len * linkT;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = kind === "mot" ? 1.35 : 0.85;
        ctx.strokeStyle = `rgba(197, 160, 89, ${alpha * 0.55})`;
        ctx.shadowColor = `rgba(197, 160, 89, ${alpha * 0.35})`;
        ctx.shadowBlur = kind === "mot" ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(232, 212, 164, ${alpha})`;
        ctx.lineWidth = kind === "mot" ? 1.05 : 0.65;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      };

      for (const { a: idA, b: idB, kind } of edges) {
        const a = byId.get(idA);
        const b = byId.get(idB);
        if (!a || !b) continue;
        const ap = appearOf(idA);
        const bp = appearOf(idB);
        if (ap <= 0.02 && bp <= 0.02) continue;
        const linkT = Math.min(1, Math.max(0, Math.min(ap, bp) - 0.12) / 0.72);
        drawEdge(a, b, kind, Math.min(a.opacity, b.opacity), linkT);
      }

      for (let i = 0; i < list.length; i++) {
        const s = list[i]!;
        const appear = appearOf(s.id);
        if (appear <= 0.001) continue;

        const isHi = s.id === highlightId || selected?.id === s.id;
        const coreScale = cometCoreScale(appear);
        const glowScale = cometGlowScale(appear);
        const appearAlpha = cometAlpha(appear);
        const pulse = 0.88 + 0.12 * Math.sin(t * 0.002 + i * 0.4);
        const baseR =
          s.radius * (isHi ? 2.1 : zoomed ? 0.82 : 1) * pulse * (isHi ? Math.min(1.15, cam.zoom * 0.42) : 1);
        const r = baseR * coreScale;

        const trailT = Math.min(1, appear / 0.72);
        const trailAngle = cometTrailAngleRad(s.id);
        const trailNorm = 0.055 * (1 - easeOutCubic(trailT));
        const nx = s.x + Math.cos(trailAngle) * trailNorm;
        const ny = s.y + Math.sin(trailAngle) * trailNorm;
        const finalPt = mapStarToScreen(s.x, s.y, cam, w, h);
        const { x: cx, y: cy } =
          trailT < 0.995 ? mapStarToScreen(nx, ny, cam, w, h) : finalPt;

        const c = isHi ? HIGHLIGHT : GOLD;
        let a = Math.min(1, s.opacity * reveal * appearAlpha * (isHi ? 1.12 : 0.98));
        if (zoomed && !isHi) a *= 0.42;

        if (appear < 0.92) {
          const rippleP = appear < 0.5 ? appear / 0.5 : (appear - 0.5) / 0.42;
          const rippleR = baseR * (2.2 + rippleP * 5.5);
          ctx.beginPath();
          ctx.arc(finalPt.x, finalPt.y, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${(1 - rippleP) * 0.38 * a})`;
          ctx.lineWidth = isHi ? 1.45 : 1.05;
          ctx.stroke();
        }

        if (trailT < 0.98 && appear > 0.04) {
          const tailA = a * (1 - trailT) * 0.55;
          const grad = ctx.createLinearGradient(
            finalPt.x - Math.cos(trailAngle) * baseR * 5,
            finalPt.y - Math.sin(trailAngle) * baseR * 5,
            cx,
            cy,
          );
          grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0)`);
          grad.addColorStop(0.55, `rgba(${c.r},${c.g},${c.b},${tailA * 0.35})`);
          grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},${tailA * 0.85})`);
          ctx.save();
          ctx.lineCap = "round";
          ctx.strokeStyle = grad;
          ctx.lineWidth = isHi ? 2 : 1.35;
          ctx.shadowColor = `rgba(197, 160, 89, ${tailA * 0.4})`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(
            finalPt.x - Math.cos(trailAngle) * baseR * 6,
            finalPt.y - Math.sin(trailAngle) * baseR * 6,
          );
          ctx.lineTo(cx, cy);
          ctx.stroke();
          ctx.restore();
        }

        const glowR = baseR * (isHi ? 2.65 : 2.15) * glowScale;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.12 * s.glow * a})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2);
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
  }, [highlightId, selected?.id, stars, reduceMotion]);

  const hitTest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) / rect.width;
    const sy = (clientY - rect.top) / rect.height;
    const { x, y } = screenToNorm(sx, sy, cameraRef.current);
    let best: DrawStar | null = null;
    const hitR = 0.05 / Math.max(1, cameraRef.current.zoom * 0.85);
    let bestD = hitR;
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
          className="pointer-events-none absolute bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+3.5rem))] left-1/2 z-10 w-[min(92vw,22rem)] -translate-x-1/2 rounded-[var(--radius-da)] border border-[rgba(197,160,89,0.22)] bg-[rgba(5,3,2,0.92)] px-4 py-3 text-center shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,252,245,0.05)]"
        >
          <p className="da-act3-star-label">{labelFor(selected.mot)}</p>
          {selected.prenom_ville ? (
            <p className="da-act3-star-meta mt-1.5">{selected.prenom_ville}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  },
);

export default Act3ConstellationSky;
