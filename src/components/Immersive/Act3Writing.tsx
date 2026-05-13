"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import gsap from "gsap";
import { useAppCopy } from "../../hooks/useAppCopy";
import { useLanguageStore } from "../../stores/languageStore";
import { buildAct3Fragments } from "../../lib/act3WritingData";
import Act3FinaleKeywordGate from "./Act3FinaleKeywordGate";

type Props = {
  onContinueToCredits: () => void;
  onBackToParchemin: () => void;
  /** Remonte l'état de la gate (phrase à compléter) vers le parent pour masquer le chrome UI. */
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

export default function Act3Writing({ onContinueToCredits, onBackToParchemin, onKeywordGateChange }: Props) {
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
      const onEnter = () => gsap.to(btn, { opacity: 1, duration: 0.22, ease: "power2.out", overwrite: "auto" });
      const onLeave = () => gsap.to(btn, { opacity: 0.72, duration: 0.32, ease: "power3.out", overwrite: "auto" });
      btn.addEventListener("pointerenter", onEnter);
      btn.addEventListener("pointerleave", onLeave);
      return () => {
        btn.removeEventListener("pointerenter", onEnter);
        btn.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(btn);
        gsap.set(btn, { clearProps: "opacity" });
      };
    });
    return () => unsubs.forEach((u) => u());
  }, [reduceMotion, complete, activated.size, fragmentDefs.length]);

  const isRtl = lang === "ar-dz";
  const baseDur = reduceMotion ? 0.01 : 0.65;
  const easing = [0.22, 1, 0.36, 1] as const;

  return (
    <div
      className="fixed inset-0 z-[20] flex min-h-dvh flex-col overflow-hidden bg-da-depth-night"
      dir={isRtl ? "rtl" : "ltr"}
      role="presentation"
    >
      {/* Lueur nuit — palette constellation Acte II */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(6,14,38,0.85), transparent 70%)",
        }}
      />

      {/* En-tête — même hiérarchie que Acte I */}
      <header className="relative z-[2] shrink-0 px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))]">
        <p className="text-center font-sans text-[11px] font-medium uppercase tracking-[0.32em] text-solar-gold/65 [text-shadow:0_1px_14px_rgba(0,0,0,0.75)]">
          {copy.act3Kicker}
        </p>
        <h1 className="mt-2 text-center font-bahlull text-[clamp(1.15rem,3.8vw,1.45rem)] italic leading-snug tracking-tight bg-gradient-to-br from-da-parchment-bright/88 via-solar-gold/76 to-da-oxide/72 bg-clip-text text-transparent">
          {copy.orientationPhaseAct3Label}
        </h1>
        <p className="mx-auto mt-3 max-w-[min(36rem,92vw)] text-center font-sans text-[12px] font-normal leading-relaxed tracking-[0.04em] text-solar-gold/52 [text-shadow:0_1px_14px_rgba(0,0,0,0.82)]">
          {copy.act3Hint}
        </p>
      </header>

      {/* Corps — deux colonnes sans box */}
      <div className="relative z-[2] mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-[max(1.25rem,env(safe-area-inset-left))] pt-6 pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:flex-row md:gap-12 md:pt-8">

        {/* Colonne fragments */}
        <div
          className="flex min-h-0 shrink-0 flex-col md:w-[min(20rem,38vw)]"
          aria-label={copy.poetry.fragment(activated.size, total)}
        >
          <div
            ref={fragmentGridRef}
            className="flex flex-col max-h-[min(58vh,460px)] overflow-y-auto overscroll-contain"
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
                  animate={{ opacity: done ? 0.24 : 0.72 }}
                  transition={{ duration: baseDur * 0.85, ease: easing }}
                  className={
                    "w-full border-b py-3.5 text-left " +
                    (done
                      ? "pointer-events-none border-solar-gold/10 cursor-default"
                      : "border-solar-gold/16 cursor-pointer focus-visible:outline-none motion-reduce:transition-none")
                  }
                >
                  <span
                    className={
                      "block font-serif text-[clamp(0.8rem,1.9vw,0.93rem)] italic leading-snug tracking-[0.01em] " +
                      (done
                        ? "text-solar-gold/30"
                        : "text-da-parchment/72 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]")
                    }
                  >
                    {line.length > 88 ? `${line.slice(0, 86)}\u2026` : line}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Séparateur vertical md+ */}
        <div className="hidden md:block w-px self-stretch bg-solar-gold/12 shrink-0" aria-hidden />

        {/* Colonne composition — pas de box, texte seul */}
        <div
          id="poem-composition"
          aria-live="polite"
          className="flex min-h-[min(48vh,380px)] flex-1 flex-col overflow-y-auto overscroll-contain pt-2 md:pt-0"
        >
          {composition.length === 0 && (
            <p className="font-sans text-[9px] font-medium uppercase tracking-[0.44em] text-solar-gold/20">
              {copy.poetry.rebuildVerse}
            </p>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {composition.map(({ id, line }, i) => (
              <motion.p
                key={`${id}-${i}`}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(8px)", y: 6 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: baseDur, ease: easing, delay: reduceMotion ? 0 : i * 0.04 }}
                className="mb-5 font-serif text-[clamp(1rem,2.4vw,1.15rem)] italic leading-relaxed tracking-[0.02em] text-da-parchment-bright/88 [text-shadow:0_0_28px_rgba(0,0,0,0.9),0_2px_14px_rgba(0,0,0,0.85),0_0_18px_rgba(197,160,89,0.08)] md:mb-6 [&:last-child]:mb-0"
              >
                {line.trim()}
              </motion.p>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {complete && (
              <motion.p
                key="closing-verse"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(14px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: reduceMotion ? 0.08 : 0.92, ease: easing, delay: 0.18 }}
                className="mt-8 border-t border-solar-gold/18 pt-7 font-serif text-[clamp(1rem,2.6vw,1.18rem)] italic leading-relaxed text-solar-gold/88 [text-shadow:0_0_28px_rgba(0,0,0,0.9),0_0_22px_rgba(197,160,89,0.18)]"
              >
                {copy.phraseStripComplete}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <span id="act3-live" className="sr-only">
        {copy.poetry.fragment(activated.size, total)}
      </span>

      {showKeywordGate && !reduceMotion ? (
        <Act3FinaleKeywordGate
          language={lang}
          onSolved={() => {
            onKeywordGateChange?.(false);
            onContinueToCredits();
          }}
          onBackToParchemin={onBackToParchemin}
          wrongLabel={copy.act3FinaleWrong}
          enterHint={copy.act3FinaleEnterHint}
          loadingLabel={copy.act3FinaleLoading}
          redirectingLabel={copy.act3FinaleRedirecting}
          backLabel={copy.act3BackScroll}
        />
      ) : null}
    </div>
  );
}
