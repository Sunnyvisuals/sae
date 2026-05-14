"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import gsap from "gsap";
import { useAppCopy } from "../../hooks/useAppCopy";
import { useLanguageStore } from "../../stores/languageStore";
import { buildAct3Fragments } from "../../lib/act3WritingData";
import Act3FinaleKeywordGate from "./Act3FinaleKeywordGate";
import ShootingStars from "../ShootingStars";
import { IconCheck, IconSparkles } from "../ui/icons";
import {
  ACT3_FIXED_STARFIELD_BG,
  ACT3_SKY_RADIAL_CSS,
  ACT3_SKY_CONIC_CSS,
  ACT3_DUST_GRAIN_CSS,
  ACT3_DUST_GRAIN_SIZE,
} from "../../lib/act3NightSky";

const ACT3_WORDMARK_AR_SRC = `${import.meta.env.BASE_URL}images/al-rihla-arabic-title.svg`;

/** Même ombre de vers que {@link ActOnePhraseStrip}. */
const ACT3_VERSE_TEXT_SHADOW =
  "0 0 28px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,0.88), 0 0 20px rgba(197,160,89,0.15)";

const act3NightPanelClass =
  "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2px] border border-[rgba(139,213,255,0.26)] bg-[rgba(2,6,18,0.88)] shadow-[0_16px_52px_rgba(0,0,0,0.52),0_0_0_1px_rgba(90,168,255,0.06),0_0_40px_rgba(90,168,255,0.06)] backdrop-blur-xl";

const act3PanelHeadClass =
  "shrink-0 border-b border-[rgba(139,213,255,0.14)] px-3.5 pb-3.5 pt-3.5 sm:px-4 sm:pt-4 sm:pb-4";

function Act3ChromeCorners() {
  return (
    <>
      <span
        className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 border-l border-t border-[rgba(139,213,255,0.35)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r border-[rgba(197,160,89,0.35)]"
        aria-hidden
      />
    </>
  );
}

type Props = {
  onContinueToCredits: () => void;
  onKeywordGateChange?: (open: boolean) => void;
};

function shuffleFragments<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export default function Act3Writing({ onContinueToCredits, onKeywordGateChange }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const reduceMotion = useReducedMotion();

  const fragmentDefs = useMemo(
    () =>
      buildAct3Fragments(lang, {
        daTitle: copy.daTitle,
        daSubtitle: copy.daSubtitle,
        chapterToastSubtitle: copy.chapterToastSubtitle,
      }),
    [lang, copy.daTitle, copy.daSubtitle, copy.chapterToastSubtitle]
  );

  const [pool] = useState(() => shuffleFragments(fragmentDefs));
  const [activated, setActivated] = useState<Set<string>>(() => new Set());
  const [composition, setComposition] = useState<{ id: string; line: string }[]>([]);
  const [complete, setComplete] = useState(false);
  const [showKeywordGate, setShowKeywordGate] = useState(false);

  const total = fragmentDefs.length;
  const arabicUi = lang === "ar-dz";

  const onPick = useCallback((id: string, line: string) => {
    let added = false;
    setActivated((prev) => {
      if (prev.has(id)) return prev;
      added = true;
      return new Set([...prev, id]);
    });
    if (!added) return;
    setComposition((prev) => (prev.some((p) => p.id === id) ? prev : [...prev, { id, line }]));
  }, []);

  useEffect(() => {
    if (!total || activated.size < total || complete) return;
    const delay = reduceMotion ? 120 : 480;
    const t = window.setTimeout(() => setComplete(true), delay);
    return () => window.clearTimeout(t);
  }, [activated.size, total, complete, reduceMotion]);

  useEffect(() => {
    if (!complete) return;
    if (reduceMotion) return;
    const t = window.setTimeout(() => {
      setShowKeywordGate(true);
      onKeywordGateChange?.(true);
    }, 640);
    return () => window.clearTimeout(t);
  }, [complete, reduceMotion, onKeywordGateChange]);

  useEffect(() => {
    if (!complete || !reduceMotion) return;
    const t = window.setTimeout(() => onContinueToCredits(), 1400);
    return () => window.clearTimeout(t);
  }, [complete, reduceMotion, onContinueToCredits]);

  const fragmentGridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduceMotion || complete) return;
    const wrap = fragmentGridRef.current;
    if (!wrap) return;
    const btns = [...wrap.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
    const unsubs = btns.map((btn) => {
      const onEnter = () =>
        gsap.to(btn, { opacity: 1, scale: 1.002, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      const onLeave = () =>
        gsap.to(btn, { opacity: 0.92, scale: 1, duration: 0.32, ease: "power3.out", overwrite: "auto" });
      btn.addEventListener("pointerenter", onEnter);
      btn.addEventListener("pointerleave", onLeave);
      return () => {
        btn.removeEventListener("pointerenter", onEnter);
        btn.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(btn);
        gsap.set(btn, { clearProps: "opacity,scale" });
      };
    });
    return () => unsubs.forEach((u) => u());
  }, [reduceMotion, complete, activated.size, fragmentDefs.length]);

  const isRtl = arabicUi;
  const baseDur = reduceMotion ? 0.01 : 0.65;
  const easing = [0.22, 1, 0.36, 1] as const;

  const poeticBodyClass = arabicUi
    ? "font-arabic-ui text-[clamp(0.94rem,1.95vw,1.06rem)] not-italic leading-[1.75] tracking-[0.015em]"
    : "font-serif text-[clamp(0.94rem,1.95vw,1.05rem)] italic leading-snug tracking-[0.01em]";

  return (
    <section
      className="fixed inset-0 z-[20] flex min-h-dvh flex-col overflow-hidden bg-da-depth-night"
      dir={isRtl ? "rtl" : "ltr"}
      aria-labelledby="act3-writing-title"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-da-depth-night" aria-hidden />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.38]"
        style={{ backgroundImage: ACT3_FIXED_STARFIELD_BG }}
        animate={
          reduceMotion ? undefined : { opacity: [0.32, 0.44, 0.34, 0.4, 0.32] }
        }
        transition={reduceMotion ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        aria-hidden
        style={{
          background: ACT3_SKY_RADIAL_CSS,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.14] mix-blend-soft-light"
        aria-hidden
        style={{
          background: ACT3_SKY_CONIC_CSS,
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden>
        <ShootingStars />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.2] mix-blend-soft-light"
        style={{
          backgroundImage: ACT3_DUST_GRAIN_CSS,
          backgroundSize: ACT3_DUST_GRAIN_SIZE,
        }}
      />

      {/* ── Fil de progression : même métaphore que AlgeriaMap ── */}
      <header className="relative z-[10] shrink-0 px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))]">
        <div className="mb-4 flex justify-center">
          {arabicUi ? (
            <img
              src={ACT3_WORDMARK_AR_SRC}
              alt=""
              width={1400}
              height={520}
              decoding="async"
              style={{
                filter:
                  "drop-shadow(0 2px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 18px rgba(90,168,255,0.2))",
              }}
              className="h-[clamp(26px,4.8vw,40px)] w-auto max-w-[min(88vw,400px)] opacity-[0.94]"
            />
          ) : (
            <p
              translate="no"
              className="text-center font-sans text-[10px] font-medium uppercase tracking-[0.52em] text-solar-gold/48 [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]"
            >
              Al-Rihla
            </p>
          )}
        </div>

        <p className="text-center font-sans text-[11px] font-medium uppercase tracking-[0.32em] text-solar-gold/72 [text-shadow:0_1px_14px_rgba(0,0,0,0.75)] md:text-xs">
          {copy.act3Kicker}
        </p>

        <h1
          id="act3-writing-title"
          className="mt-2 text-center font-bahlull text-[clamp(1.25rem,3.9vw,1.72rem)] italic leading-snug tracking-tight text-transparent bg-gradient-to-br from-da-parchment-bright/[0.93] via-solar-gold/85 to-da-oxide/[0.8] bg-clip-text md:text-[clamp(1.35rem,3.6vw,1.85rem)]"
          style={{ textShadow: "0 1px 0 rgba(0,0,0,0.42), 0 0 48px rgba(197,160,89,0.16)" }}
        >
          {copy.orientationPhaseAct3Label}
        </h1>

        <p className="mx-auto mt-3 max-w-[min(40rem,93vw)] text-center font-sans text-[12px] font-medium leading-relaxed tracking-[0.02em] text-solar-gold/72 [text-shadow:0_1px_14px_rgba(0,0,0,0.82)] sm:text-[13px] md:text-[14px]">
          {copy.act3Hint}
        </p>

        <div className="mx-auto mt-5 flex w-full max-w-sm flex-col items-stretch px-1">
          <p className="mb-2 text-center font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[rgba(139,213,255,0.42)]">
            {copy.poetry.fragment(activated.size, total)}
          </p>
          <div className="flex h-[3px] w-full gap-1.5">
            {Array.from({ length: total }, (_, i) => {
              const on = i < activated.size || complete;
              return (
                <div
                  key={i}
                  className={`h-full min-w-0 flex-1 rounded-[1px] transition-all duration-[520ms] ${
                    on
                      ? complete
                        ? "bg-gradient-to-br from-da-starline/95 via-solar-gold/90 to-solar-gold shadow-[0_0_14px_rgba(197,160,89,0.38)]"
                        : "bg-gradient-to-br from-[rgba(139,213,255,0.92)] to-solar-gold/75 shadow-[0_0_12px_rgba(139,213,255,0.28)]"
                      : "bg-white/[0.1]"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </header>

      <div className="relative z-[10] mx-auto mt-6 flex min-h-0 w-full max-w-[min(72rem,calc(100vw-2rem))] flex-1 flex-col gap-4 px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))] pr-[max(1.25rem,env(safe-area-inset-right))] md:mt-8 md:flex-row md:items-stretch md:gap-6">
        {/* Panneau fragments - chrome identique HintPanel « nuit » */}
        <div className={`${act3NightPanelClass} md:min-h-0 md:w-[min(24rem,40%)]`}>
          <Act3ChromeCorners />
          <div className={act3PanelHeadClass}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 text-start">
                <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[rgba(234,215,164,0.78)]">
                  {copy.act3FragmentsPanelTitle}
                </p>
                <p className="mt-1.5 font-sans text-[11px] font-normal leading-relaxed text-[rgba(250,246,235,0.58)]">
                  {copy.act3FragmentsPanelSub}
                </p>
              </div>
              <span className="shrink-0 pt-px font-sans text-[9px] tabular-nums text-[rgba(139,213,255,0.45)]">
                {activated.size}/{total}
              </span>
            </div>
          </div>
          <div
            ref={fragmentGridRef}
            aria-label={copy.poetry.fragment(activated.size, total)}
            className="flex max-h-[min(50vh,480px)] min-h-[min(240px,32vh)] flex-col gap-0 overflow-y-auto overscroll-contain"
          >
            {pool.map(({ id, line }) => {
              const done = activated.has(id);
              return (
                <motion.button
                  key={id}
                  type="button"
                  disabled={done || complete}
                  onClick={() => onPick(id, line)}
                  initial={false}
                  animate={{ opacity: done ? 0.52 : 0.92 }}
                  transition={{ duration: baseDur * 0.85, ease: easing }}
                  className={
                    "group flex w-full items-start gap-2.5 border-b border-[rgba(139,213,255,0.09)] px-3.5 py-3.5 text-start transition-[background-color,color] duration-300 sm:px-4 " +
                    (done
                      ? "pointer-events-none cursor-default bg-[rgba(90,168,255,0.045)]"
                      : "cursor-pointer bg-transparent hover:bg-[rgba(139,213,255,0.06)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(139,213,255,0.35)] motion-reduce:transition-none")
                  }
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
                    {done ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(90,168,255,0.14)] text-[#ead7a4] shadow-[0_0_10px_rgba(90,168,255,0.28)] ring-1 ring-[rgba(139,213,255,0.22)]">
                        <IconCheck className="h-3 w-3" aria-hidden strokeWidth={2} />
                      </span>
                    ) : (
                      <IconSparkles className="h-[15px] w-[15px] text-[rgba(139,213,255,0.58)] opacity-95" aria-hidden />
                    )}
                  </span>
                  <span
                    className={
                      poeticBodyClass +
                      " min-w-0 flex-1 " +
                      (done
                        ? "text-[rgba(250,246,235,0.38)] line-through decoration-[rgba(139,213,255,0.25)] decoration-1"
                        : "text-[rgba(250,246,235,0.85)]")
                    }
                  >
                    {line}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Panneau composition */}
        <div
          className={`${act3NightPanelClass} md:min-h-0 md:flex-[1.15]`}
          id="poem-composition"
          aria-live="polite"
        >
          <Act3ChromeCorners />
          <div className={act3PanelHeadClass}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[rgba(234,215,164,0.78)]">
              {copy.act3CompositionPanelTitle}
            </p>
            <p className="mt-1.5 font-sans text-[11px] font-normal leading-relaxed text-[rgba(250,246,235,0.58)]">
              {copy.act3CompositionPanelSub}
            </p>
          </div>
          <div className="flex min-h-[min(40vh,360px)] flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7">
            {composition.length === 0 && !complete && (
              <div className="mb-6 rounded-[var(--radius-da)] border border-dashed border-[rgba(139,213,255,0.18)] bg-[rgba(90,168,255,0.035)] px-4 py-5 text-start">
                <p className="font-sans text-[11px] font-normal leading-relaxed text-[rgba(250,246,235,0.44)]">
                  {copy.act3CompositionEmptyBody}
                </p>
              </div>
            )}

            <div className="mx-auto w-full max-w-xl text-start">
              <AnimatePresence initial={false} mode="popLayout">
                {composition.map(({ id, line }, i) => (
                  <motion.p
                    key={`${id}-${i}`}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(10px)", y: 8 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: baseDur,
                      ease: easing,
                      delay: reduceMotion ? 0 : i * 0.05,
                    }}
                    className={
                      poeticBodyClass +
                      " mb-6 text-[clamp(1.03rem,2.65vw,1.18rem)] leading-[1.9] tracking-[0.015em] text-white"
                    }
                    style={{ textShadow: ACT3_VERSE_TEXT_SHADOW }}
                  >
                    {line.trim()}
                  </motion.p>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {complete && (
                  <motion.p
                    key="closing-verse"
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(16px)", y: 12 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{ duration: reduceMotion ? 0.08 : 0.95, ease: easing, delay: 0.16 }}
                    className={
                      poeticBodyClass +
                      " mt-2 border-t border-solar-gold/18 pb-4 pt-8 text-[clamp(1.05rem,2.75vw,1.22rem)] leading-[1.9] text-solar-gold/90"
                    }
                    style={{ textShadow: ACT3_VERSE_TEXT_SHADOW }}
                  >
                    {copy.phraseStripComplete}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <span id="act3-live" className="sr-only">
        {copy.poetry.fragment(activated.size, total)}
      </span>

      {showKeywordGate && !reduceMotion ? (
        <Act3FinaleKeywordGate
          language={lang}
          onSolved={() => {
            onContinueToCredits();
            onKeywordGateChange?.(false);
          }}
          wrongLabel={copy.act3FinaleWrong}
          enterHint={copy.act3FinaleEnterHint}
          loadingLabel={copy.act3FinaleLoading}
          timedHintKicker={copy.act3FinaleTimedHintKicker}
        />
      ) : null}
    </section>
  );
}
