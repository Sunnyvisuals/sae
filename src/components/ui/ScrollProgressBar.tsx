import { useEffect, useLayoutEffect, useRef } from "react";

type Tone = "solar" | "midnight";
type Rgb = { r: number; g: number; b: number };

function scrollRatio(): number {
  const el = document.documentElement;
  const max = Math.max(1, el.scrollHeight - window.innerHeight);
  const y = window.scrollY ?? el.scrollTop;
  return Math.min(1, Math.max(0, y / max));
}

/** Aligné avec parchemin : mélange sRGB (pas verts/cyan parasite). */
function rgbLerp(rgb1: Rgb, rgb2: Rgb, t: number): Rgb {
  const tt = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * tt),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * tt),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * tt),
  };
}

function hslPctToRgb(hDeg: number, sp: number, lp: number): Rgb {
  const hh = ((((Number(hDeg) || 0) % 360) + 360) % 360);
  const s = Math.min(100, Math.max(0, sp)) / 100;
  const l = Math.min(100, Math.max(0, lp)) / 100;
  const kFn = (n: number) => ((n + hh / 30) % 12);
  const al = s * Math.min(l, 1 - l);
  const channel = (n: number) => l - al * Math.max(-1, Math.min(Math.min(kFn(n) - 3, 9 - kFn(n)), 1));
  return {
    r: Math.round(255 * channel(0)),
    g: Math.round(255 * channel(8)),
    b: Math.round(255 * channel(4)),
  };
}

/** Interpolation HSL : arc de teinte court (évite le détour rouge→bleu moche en sRGB linéaire). */
function hslLerpShortest(
  h1: number,
  s1: number,
  l1: number,
  h2: number,
  s2: number,
  l2: number,
  t: number
): { h: number; s: number; l: number } {
  const tt = Math.min(1, Math.max(0, t));
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = h1 + dh * tt;
  const hh = ((h % 360) + 360) % 360;
  return {
    h: hh,
    s: s1 + (s2 - s1) * tt,
    l: l1 + (l2 - l1) * tt,
  };
}

function mixRgbPerceptual(a: Rgb, b: Rgb, t: number): Rgb {
  const ha = rgbToHsl(a);
  const hb = rgbToHsl(b);
  const m = hslLerpShortest(ha.h, ha.s, ha.l, hb.h, hb.s, hb.l, t);
  return hslPctToRgb(m.h, m.s, m.l);
}

function rgbToHsl(rgb: Rgb): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const dh = max - min;
  const lMid = (max + min) / 2;
  if (dh < 1e-10) return { h: 0, s: 0, l: lMid * 100 };
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / dh) % 6;
      break;
    case g:
      h = (b - r) / dh + 2;
      break;
    default:
      h = (r - g) / dh + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  const sHue = dh / (1 - Math.abs(2 * lMid - 1));
  return { h, s: sHue * 100, l: lMid * 100 };
}

function rgbFmt(rgb: Rgb): string {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

function scrollDepthEmphasis(scroll01: number): number {
  const x = Math.min(1, Math.max(0, scroll01));
  return x * x * (3 - 2 * x);
}

/** Une extrémité de palette : 0 = solaire, 1 = minuit — puis emphase scroll (identique pour les deux). */
function barStopsForPaletteEnd(uRaw: number, paletteEnd: 0 | 1, emphasisSource: number): { rgbStop1: Rgb; rgbStop2: Rgb } {
  const u = Math.min(1, Math.max(0, uRaw));
  const nb = paletteEnd;

  const hSol = 36 + u * 18;
  const sSol = 48 + u * 12;
  const lSol = 48 - u * 10;
  const h2Sol = hSol - 8 + u * 6;
  const s2Sol = sSol + 6;
  const l2Sol = lSol - 6;

  const hMid = 198 + u * 22;
  const sMid = 52 + u * 14;
  const lMid = 54 + u * 10;
  const lMidA = lMid - 4;
  const lMidB = lMid + 4;
  const h2Mid = hMid + 12;
  const s2Mid = Math.min(72, sMid + 10);

  const r1Solar = hslPctToRgb(hSol, sSol, lSol);
  const r1Mid = hslPctToRgb(hMid, sMid, lMidA);
  const r2Solar = hslPctToRgb(h2Sol, s2Sol, l2Sol);
  const r2Mid = hslPctToRgb(h2Mid, s2Mid, lMidB);

  let rgbStop1 = rgbLerp(r1Solar, r1Mid, nb);
  let rgbStop2 = rgbLerp(r2Solar, r2Mid, nb);

  const e = scrollDepthEmphasis(emphasisSource);

  let hsl1Post = rgbToHsl(rgbStop1);
  rgbStop1 = hslPctToRgb(
    hsl1Post.h,
    Math.min(76, Math.max(0, hsl1Post.s * (1 + e * 0.28))),
    Math.min(92, Math.max(17, hsl1Post.l - e * 4.2))
  );

  hsl1Post = rgbToHsl(rgbStop1);

  const hsl2Post = rgbToHsl(rgbStop2);
  let lStop2 = Math.min(94, Math.max(19, hsl2Post.l + e * 2.6));
  lStop2 = Math.min(94, Math.max(hsl1Post.l + 2, lStop2));
  rgbStop2 = hslPctToRgb(
    hsl2Post.h,
    Math.min(78, Math.max(0, hsl2Post.s * (1 + e * 0.24))),
    lStop2
  );

  return { rgbStop1, rgbStop2 };
}

function blendedBar(uRaw: number, nightBlendSmooth: number, emphasisScroll?: number): { bg: string; boxShadow: string } {
  const u = Math.min(1, Math.max(0, uRaw));
  const tTone = Math.min(1, Math.max(0, nightBlendSmooth));
  const emphasisSource =
    typeof emphasisScroll === "number"
      ? Math.min(1, Math.max(0, emphasisScroll))
      : u;

  const solar = barStopsForPaletteEnd(u, 0, emphasisSource);
  const midnight = barStopsForPaletteEnd(u, 1, emphasisSource);
  const rgbStop1 = mixRgbPerceptual(solar.rgbStop1, midnight.rgbStop1, tTone);
  const rgbStop2 = mixRgbPerceptual(solar.rgbStop2, midnight.rgbStop2, tTone);

  const e = scrollDepthEmphasis(emphasisSource);

  const bg = `linear-gradient(90deg, ${rgbFmt(rgbStop1)} 0%, ${rgbFmt(rgbStop2)} 100%)`;

  const hslGlow = rgbToHsl(rgbLerp(rgbStop1, rgbStop2, 0.5));
  const glowHue = hslGlow.h;
  const gSat = Math.min(80, Math.max(62, 64 + e * 12));
  const gLight = Math.min(60, Math.max(50, 55 + e * 5));
  const blurA = Math.round(6 + e * 16);
  const blurB = Math.round(16 + e * 28);
  const blurC = Math.round(28 + e * 36);
  const a1 = Math.min(0.52, 0.22 + e * 0.36);
  const a2 = Math.min(0.28, 0.08 + e * 0.22);
  const a3 = Math.min(0.14, 0.035 + e * 0.1);
  const aRim = Math.min(0.38, 0.14 + e * 0.26);

  const boxShadow =
    `0 0 ${blurA}px hsla(${glowHue}, ${gSat}%, ${gLight}%, ${a1}), ` +
    `0 0 ${blurB}px hsla(${glowHue}, ${Math.max(58, gSat - 6)}%, ${Math.max(48, gLight - 4)}%, ${a2}), ` +
    `0 0 ${blurC}px hsla(${glowHue}, 58%, 52%, ${a3}), ` +
    `0 1px 0 hsla(${glowHue}, 54%, ${50 + e * 4}%, ${aRim})`;

  return { bg, boxShadow };
}

type Props = {
  tone: Tone;
  /** Acte II (iframe parchemin) : ratio synchro depuis `postMessage` — barre alors au-dessus du chrome `aboveChrome`. */
  iframeFillRatio?: number;
  /** z-index au-dessus du rail « Parcours » / aides (toujours sous menus plein écran). */
  aboveChrome?: boolean;
};

export default function ScrollProgressBar({ tone, iframeFillRatio, aboveChrome }: Props) {
  const fillRef = useRef<HTMLDivElement>(null);
  const bSmooth = useRef(tone === "midnight" ? 1 : 0);
  const toneRef = useRef(tone);
  const iframeRatioRef = useRef(iframeFillRatio);
  toneRef.current = tone;
  iframeRatioRef.current = iframeFillRatio;

  useLayoutEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    const reduced =
      typeof window.matchMedia !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.style.transition =
      reduced || iframeFillRatio === undefined
        ? "none"
        : "transform 0.16s cubic-bezier(0.25, 0.94, 0.32, 0.97)";
  }, [iframeFillRatio]);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;

    function frame() {
      if (!alive) return;
      const el = fillRef.current;
      const iframeR = iframeRatioRef.current;
      const hasIframe = iframeR !== undefined && Number.isFinite(iframeR);
      const kb = reduced ? 1 : 0.13;

      let rawP: number;
      if (hasIframe && typeof iframeR === "number") {
        rawP = Math.min(1, Math.max(0, iframeR));
      } else {
        /** Suit Lenis / le scroll natif frame par frame — pas de 2ᵉ lissage (évite retard + crans sur `width`). */
        rawP = scrollRatio();
      }

      const tgtTone = toneRef.current === "midnight" ? 1 : 0;
      bSmooth.current += (tgtTone - bSmooth.current) * kb;

      const p = Math.min(1, Math.max(0, rawP));
      const nb = bSmooth.current;
      const { bg, boxShadow } = blendedBar(p, nb, p);

      if (el) {
        el.style.transform = `scaleX(${p})`;
        el.style.background = bg;
        el.style.boxShadow = boxShadow;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 h-[2px] ${aboveChrome ? "z-[220]" : "z-[480]"}`}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-hidden
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1px]">
        <div
          className="absolute inset-0 rounded-[1px] bg-[rgba(0,8,20,0.32)] shadow-[inset_0_1px_0_rgba(255,252,245,0.06),0_0_18px_rgba(0,0,0,0.45)]"
          aria-hidden
        />
        <div
          ref={fillRef}
          className="absolute left-0 top-0 h-full w-full origin-left will-change-transform rounded-[1px]"
          style={{ transform: "scaleX(0)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}