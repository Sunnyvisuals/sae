"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { useAppCopy } from "../../hooks/useAppCopy";
import { useLanguageStore } from "../../stores/languageStore";
import {
  ACT3_CONSTELLATION_WORDS,
  act3WordFloatLayout,
  type Act3ConstellationWord,
} from "../../lib/act3ConstellationWords";
import {
  fetchConstellationStars,
  submitConstellationStar,
  type ConstellationStarRow,
} from "../../lib/act3ConstellationApi";
import {
  readConstellationVote,
  writeConstellationVote,
} from "../../lib/act3ConstellationVote";
import {
  ACT3_CONFIRM_FORM_DELAY_MS,
  ACT3_INTRO_LINE2_MS,
  ACT3_INTRO_LINE3_MS,
  ACT3_INTRO_TO_SELECT_MS,
  ACT3_INTRO_TO_SELECT_REDUCED_MS,
  ACT3_OUTRO_LINE2_MS,
  ACT3_OUTRO_LINE3_MS,
  ACT3_OUTRO_TO_CREDITS_MS,
  ACT3_OUTRO_TO_CREDITS_REDUCED_MS,
  ACT3_PICK_FALLBACK_MS,
  ACT3_STAR_GEM_DURATION,
  ACT3_WORD_APPEAR_DELAY,
  ACT3_WORD_DRIFT_SCALE,
  ACT3_WORD_REVEAL_EACH_SEC,
  ACT3_WORD_REVEAL_GAP_SEC,
  ACT3_WORD_OTHERS_FADE,
  ACT3_WORD_RISE_DURATION,
  ACT3_WORD_RISE_FALL_DURATION,
  act3Fade,
  act3FadeDelayed,
} from "../../lib/act3ConstellationTiming";
import { metaForWord } from "./mapWordData";
import { arabicPoemWordLabel } from "../../lib/mapWordArabicDisplay";
import Act3ConstellationSky, {
  type Act3ConstellationSkyHandle,
} from "./Act3ConstellationSky";
import Act3ConstellationScrollLoad from "./Act3ConstellationScrollLoad";
import AuroraMeshBackground from "../AuroraMeshBackground";

type Step = "intro" | "select" | "confirm" | "constellation" | "outro";
type IntroPhase = "idle" | "line1" | "line2" | "line3";
type OutroPhase = "idle" | "line1" | "line2" | "line3";

type Props = {
  onContinueToCredits: () => void;
};

const WORD_BTN_BASE =
  "da-act3-floating-word pointer-events-auto absolute cursor-none border-0 bg-transparent p-0 " +
  "transition-[color,text-shadow] duration-[680ms] ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_rgba(197,160,89,0.38)]";

export default function Act3Constellation({ onContinueToCredits }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const arabicUi = lang === "ar-dz";
  const reduceMotion = useReducedMotion() ?? false;

  const priorVote = useMemo(() => readConstellationVote(), []);
  const [step, setStep] = useState<Step>(() => (priorVote ? "constellation" : "intro"));
  const [selectedWord, setSelectedWord] = useState<Act3ConstellationWord | null>(
    () => (priorVote?.mot as Act3ConstellationWord) ?? null,
  );
  const [identity, setIdentity] = useState(priorVote?.prenom_ville ?? "");
  const [stars, setStars] = useState<ConstellationStarRow[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(priorVote?.starId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingStars, setLoadingStars] = useState(step === "constellation");
  const [constellationRevealed, setConstellationRevealed] = useState(false);
  const [focusMyStarToken, setFocusMyStarToken] = useState(0);
  const [starFormVisible, setStarFormVisible] = useState(false);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("idle");
  const [outroPhase, setOutroPhase] = useState<OutroPhase>("idle");
  const creditsAutoRef = useRef(false);
  const [selectWordsInteractive, setSelectWordsInteractive] = useState(false);

  const skyRef = useRef<Act3ConstellationSkyHandle>(null);
  const wordsWrapRef = useRef<HTMLDivElement>(null);
  const risingWordRef = useRef<HTMLSpanElement>(null);
  const starDotRef = useRef<HTMLSpanElement>(null);
  const inscriptionInputRef = useRef<HTMLInputElement>(null);

  const labelFor = useCallback(
    (w: string) => (arabicUi ? arabicPoemWordLabel(w) : w),
    [arabicUi],
  );

  const handleConstellationRevealed = useCallback(() => {
    setConstellationRevealed(true);
  }, []);

  const handleSelectStar = useCallback(() => {}, []);

  const highlightMot = priorVote?.mot ?? selectedWord ?? null;

  const goToOutro = useCallback(() => {
    setStep("outro");
  }, []);

  const loadStars = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background === true;
    if (!background) setLoadingStars(true);
    const rows = await fetchConstellationStars();
    setStars(rows);
    if (!background) setLoadingStars(false);
  }, []);

  const viewMyStar = useCallback(async () => {
    if (!highlightId && !highlightMot) return;
    if (skyRef.current?.focusVisitorStar()) return;
    await loadStars({ background: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!skyRef.current?.focusVisitorStar()) {
          setFocusMyStarToken((n) => n + 1);
        }
      });
    });
  }, [highlightId, highlightMot, loadStars]);

  useEffect(() => {
    if (step === "confirm" || step === "constellation") void loadStars();
  }, [step, loadStars]);

  /** Ciel partagé : recharger les étoiles des autres visiteurs. */
  useEffect(() => {
    if (step !== "constellation") return;
    const refresh = () => void loadStars({ background: true });
    const interval = window.setInterval(refresh, 22_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [step, loadStars]);

  useEffect(() => {
    if (step !== "constellation") {
      setConstellationRevealed(false);
    }
  }, [step]);

  /* ── Intro : une phrase à la fois ── */
  useEffect(() => {
    if (step !== "intro") {
      setIntroPhase("idle");
      return;
    }
    if (reduceMotion) {
      setIntroPhase("line3");
      const t = window.setTimeout(() => setStep("select"), ACT3_INTRO_TO_SELECT_REDUCED_MS);
      return () => window.clearTimeout(t);
    }
    setIntroPhase("line1");
    const t1 = window.setTimeout(() => setIntroPhase("line2"), ACT3_INTRO_LINE2_MS);
    const t2 = window.setTimeout(() => setIntroPhase("line3"), ACT3_INTRO_LINE3_MS);
    const t3 = window.setTimeout(() => setStep("select"), ACT3_INTRO_TO_SELECT_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [step, reduceMotion]);

  useEffect(() => {
    if (step !== "select") {
      setSelectWordsInteractive(false);
      return;
    }
    if (reduceMotion) setSelectWordsInteractive(true);
  }, [step, reduceMotion]);

  const startWordDrift = useCallback((btn: HTMLButtonElement, index: number) => {
    const { rot, drift } = act3WordFloatLayout(index);
    const seg = (drift.dur / 4) * ACT3_WORD_DRIFT_SCALE;
    const tl = gsap.timeline({ repeat: -1, delay: drift.delay * 0.35 * ACT3_WORD_DRIFT_SCALE });
    tl.to(btn, {
      x: drift.ampX,
      y: -drift.ampY,
      rotation: rot + drift.rotDelta,
      duration: seg,
      ease: "sine.inOut",
    })
      .to(btn, {
        x: drift.ampX * 0.4,
        y: drift.ampY * 0.55,
        rotation: rot,
        duration: seg,
        ease: "sine.inOut",
      })
      .to(btn, {
        x: -drift.ampX * 0.9,
        y: -drift.ampY * 0.45,
        rotation: rot - drift.rotDelta * 0.75,
        duration: seg,
        ease: "sine.inOut",
      })
      .to(btn, { x: 0, y: 0, rotation: rot, duration: seg, ease: "sine.inOut" });
    return tl;
  }, []);

  /* ── Apparition un par un + dérive lente ── */
  useEffect(() => {
    if (step !== "select" || reduceMotion) return;

    let cancelled = false;
    let raf = 0;
    const driftTimelines: gsap.core.Timeline[] = [];
    let revealTl: gsap.core.Timeline | null = null;

    const boot = () => {
      if (cancelled) return;
      const wrap = wordsWrapRef.current;
      if (!wrap) {
        raf = requestAnimationFrame(boot);
        return;
      }
      const btns = [...wrap.querySelectorAll<HTMLButtonElement>("button[data-word]")];
      if (!btns.length) {
        raf = requestAnimationFrame(boot);
        return;
      }

      setSelectWordsInteractive(false);
      btns.forEach((btn, i) => {
        const { rot } = act3WordFloatLayout(i);
        gsap.set(btn, {
          opacity: 0,
          filter: "blur(10px)",
          xPercent: -50,
          yPercent: -50,
          rotation: rot,
          x: 0,
          y: 0,
        });
      });

      revealTl = gsap.timeline({
        delay: ACT3_WORD_APPEAR_DELAY,
        onComplete: () => {
          if (!cancelled) setSelectWordsInteractive(true);
        },
      });

      btns.forEach((btn, i) => {
        revealTl!.fromTo(
          btn,
          { opacity: 0, filter: "blur(12px)" },
          {
            opacity: 1,
            filter: "blur(0px)",
            duration: ACT3_WORD_REVEAL_EACH_SEC,
            ease: "power1.out",
            onStart: () => {
              if (!cancelled && i === 0) setSelectWordsInteractive(true);
            },
            onComplete: () => {
              if (!cancelled) driftTimelines.push(startWordDrift(btn, i));
            },
          },
          i === 0 ? 0 : `+=${ACT3_WORD_REVEAL_GAP_SEC}`,
        );
      });
    };

    raf = requestAnimationFrame(boot);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      revealTl?.kill();
      setSelectWordsInteractive(false);
      const wrap = wordsWrapRef.current;
      if (wrap) {
        const btns = [...wrap.querySelectorAll<HTMLButtonElement>("button[data-word]")];
        gsap.killTweensOf(btns);
      }
      driftTimelines.forEach((tl) => tl.kill());
    };
  }, [step, reduceMotion, startWordDrift]);

  const onPickWord = (w: Act3ConstellationWord) => {
    if (selectedWord) return;
    setSelectedWord(w);
    setStarFormVisible(false);

    const wrap = wordsWrapRef.current;
    if (!wrap || reduceMotion) {
      window.setTimeout(() => {
        setStep("confirm");
        setStarFormVisible(true);
      }, reduceMotion ? 60 : 100);
      return;
    }

    const allWordBtns = [...wrap.querySelectorAll<HTMLButtonElement>("button[data-word]")];
    gsap.killTweensOf(allWordBtns);

    const picked = wrap.querySelector<HTMLButtonElement>(`button[data-word="${w}"]`);
    const others = allWordBtns.filter((b) => b.dataset.word !== w);

    gsap.to(others, { opacity: 0, duration: ACT3_WORD_OTHERS_FADE, ease: "power1.in" });

    if (picked && risingWordRef.current) {
      const pr = picked.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const startX = pr.left + pr.width / 2 - wr.left;
      const startY = pr.top + pr.height / 2 - wr.top;
      const el = risingWordRef.current;
      gsap.set(el, {
        opacity: 1,
        x: startX,
        y: startY,
        xPercent: -50,
        yPercent: -50,
        scale: 1,
        fontSize: window.getComputedStyle(picked).fontSize,
      });
      picked.style.opacity = "0";

      const tl = gsap.timeline({
        onComplete: () => {
          setStep("confirm");
          window.setTimeout(() => setStarFormVisible(true), ACT3_CONFIRM_FORM_DELAY_MS);
        },
      });
      tl.to(el, {
        x: wr.width / 2,
        y: wr.height * 0.32,
        scale: 1.18,
        duration: ACT3_WORD_RISE_DURATION,
        ease: "power2.out",
      });
      tl.to(el, {
        y: wr.height * 0.14,
        scale: 0.35,
        opacity: 0,
        duration: ACT3_WORD_RISE_FALL_DURATION,
        ease: "power1.inOut",
      });
      if (starDotRef.current) {
        tl.set(starDotRef.current, {
          opacity: 0,
          scale: 0.4,
          left: "50%",
          top: "14%",
          xPercent: -50,
          yPercent: -50,
        });
        tl.to(starDotRef.current, {
          opacity: 1,
          scale: 1,
          duration: ACT3_STAR_GEM_DURATION,
          ease: "power2.out",
        });
      }
    } else {
      window.setTimeout(() => {
        setStep("confirm");
        setStarFormVisible(true);
      }, ACT3_PICK_FALLBACK_MS);
    }
  };

  useEffect(() => {
    if (step !== "confirm" || !starFormVisible) return;
    const t = window.setTimeout(() => inscriptionInputRef.current?.focus(), 160);
    return () => window.clearTimeout(t);
  }, [step, starFormVisible]);

  const onJoinConstellation = async () => {
    if (!selectedWord || submitting || readConstellationVote()) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitConstellationStar({
      mot: selectedWord,
      prenom_ville: identity.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(copy.act3SubmitError);
      return;
    }
    writeConstellationVote({
      starId: res.row.id,
      mot: res.row.mot,
      prenom_ville: identity.trim() || undefined,
      votedAt: new Date().toISOString(),
    });
    setHighlightId(res.row.id);
    setStep("constellation");
    await loadStars();
  };

  /* ── Outro séquentiel → fondu vers le générique ── */
  useEffect(() => {
    if (step !== "outro") {
      setOutroPhase("idle");
      creditsAutoRef.current = false;
      return;
    }
    if (reduceMotion) {
      setOutroPhase("line3");
      const t = window.setTimeout(() => {
        if (!creditsAutoRef.current) {
          creditsAutoRef.current = true;
          onContinueToCredits();
        }
      }, ACT3_OUTRO_TO_CREDITS_REDUCED_MS);
      return () => window.clearTimeout(t);
    }

    setOutroPhase("line1");
    const t1 = window.setTimeout(() => setOutroPhase("line2"), ACT3_OUTRO_LINE2_MS);
    const t2 = window.setTimeout(() => setOutroPhase("line3"), ACT3_OUTRO_LINE3_MS);
    const t3 = window.setTimeout(() => {
      if (!creditsAutoRef.current) {
        creditsAutoRef.current = true;
        onContinueToCredits();
      }
    }, ACT3_OUTRO_TO_CREDITS_MS);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [step, reduceMotion, onContinueToCredits]);

  const fontSizeFor = (w: Act3ConstellationWord) => {
    const imp = metaForWord(w).importance;
    if (imp >= 3) return "clamp(1.05rem, 2.8vw, 1.35rem)";
    if (imp === 2) return "clamp(0.95rem, 2.4vw, 1.18rem)";
    return "clamp(0.88rem, 2.1vw, 1.05rem)";
  };

  return (
    <section
      className="da-act3-scene relative flex min-h-dvh w-full flex-col overflow-hidden bg-transparent"
      aria-label={copy.act3Aria}
      dir={arabicUi ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <AuroraMeshBackground
          fillContainer
          hideShootingStars
          suppressBackgroundFluid
          compactDust
          className="z-0 opacity-90"
        />
        <motion.div
          aria-hidden
          className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_76%_82%_at_50%_42%,rgba(197,160,89,0.06)_0%,transparent_68%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={act3Fade(reduceMotion, 1.8)}
        />
      </div>

      <motion.div
        className="relative z-[2] flex min-h-0 flex-1 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))] sm:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={act3Fade(reduceMotion, 1.4)}
      >
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              className="flex flex-1 flex-col items-center justify-center px-3 text-center"
              exit={{ opacity: 0 }}
              transition={act3Fade(reduceMotion, 1)}
            >
              <div className="relative flex min-h-[5.5rem] w-full max-w-[min(100%,54rem)] items-center justify-center">
                <AnimatePresence mode="wait">
                  {introPhase === "line1" && (
                    <motion.p
                      key="i1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={act3Fade(reduceMotion, 0.9)}
                      className="da-act3-intro-line absolute inset-x-0"
                    >
                      {copy.act3IntroLine1}
                    </motion.p>
                  )}
                  {introPhase === "line2" && (
                    <motion.p
                      key="i2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={act3Fade(reduceMotion, 0.9)}
                      className="da-act3-intro-line absolute inset-x-0"
                    >
                      {copy.act3IntroLine2}
                    </motion.p>
                  )}
                  {introPhase === "line3" && (
                    <motion.p
                      key="i3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={act3Fade(reduceMotion, 1.1)}
                      className="da-act3-question absolute inset-x-0 max-sm:text-pretty sm:whitespace-nowrap"
                    >
                      {copy.act3IntroLine3}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {(step === "select" || (step === "confirm" && selectedWord)) && (
            <motion.div
              key="select-layer"
              ref={wordsWrapRef}
              className="relative flex-1 [contain:paint] [isolation:isolate]"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={act3Fade(reduceMotion, 0.5)}
            >
              {step === "select" ? (
                <p className="da-act3-hint pointer-events-none absolute left-0 right-0 top-0 z-[1] text-center">
                  {copy.act3SelectHint}
                </p>
              ) : null}

              {ACT3_CONSTELLATION_WORDS.map((w, i) => {
                const { x, y, rot } = act3WordFloatLayout(i);
                const hidden = step === "confirm" && selectedWord !== w;
                return (
                  <button
                    key={w}
                    type="button"
                    data-word={w}
                    disabled={step === "confirm" || (step === "select" && !selectWordsInteractive)}
                    className={
                      step === "select" && !reduceMotion
                        ? `${WORD_BTN_BASE} opacity-0`
                        : WORD_BTN_BASE
                    }
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      fontSize: fontSizeFor(w),
                      ...(reduceMotion
                        ? {
                            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                          }
                        : undefined),
                      visibility: hidden ? "hidden" : "visible",
                      pointerEvents:
                        step === "confirm" || (step === "select" && !selectWordsInteractive)
                          ? "none"
                          : undefined,
                    }}
                    onClick={() => onPickWord(w)}
                  >
                    {labelFor(w)}
                  </button>
                );
              })}

              <span
                ref={risingWordRef}
                className="da-act3-word-rise pointer-events-none absolute left-0 top-0 z-[3] whitespace-nowrap opacity-0"
                aria-hidden
              />
              <span
                ref={starDotRef}
                className="pointer-events-none absolute left-1/2 top-[14%] z-[3] block h-2.5 w-2.5 rounded-full bg-[rgba(244,234,210,0.92)] opacity-0 shadow-[0_0_20px_rgba(197,160,89,0.45),0_0_40px_rgba(0,0,0,0.35)]"
                aria-hidden
              />
            </motion.div>
          )}

          {step === "confirm" && selectedWord && (
            <motion.form
              key="confirm-form"
              className="pointer-events-none absolute inset-0 z-[4] flex flex-col items-center justify-center px-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: starFormVisible ? 1 : 0 }}
              transition={act3Fade(reduceMotion, 0.9)}
              onSubmit={(e) => {
                e.preventDefault();
                if (!submitting) void onJoinConstellation();
              }}
              aria-label={copy.act3ConfirmCta}
            >
              <motion.div className="pointer-events-auto flex w-full max-w-[min(100%,20rem)] flex-col items-center gap-2.5 text-center">
                <label htmlFor="act3-inscription" className="da-act3-inscription-hint">
                  {copy.act3ConfirmIdentityHint}
                </label>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => {
                    setIdentity(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  maxLength={80}
                  disabled={submitting}
                  ref={inscriptionInputRef}
                  id="act3-inscription"
                  name="given-name"
                  className="da-act3-inscription-minimal w-full"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  spellCheck={false}
                  aria-invalid={submitError ? true : undefined}
                  aria-describedby={
                    submitError
                      ? "act3-inscription-enter-hint act3-inscription-error"
                      : "act3-inscription-enter-hint"
                  }
                />
                <p
                  id="act3-inscription-enter-hint"
                  className="da-act3-inscription-enter"
                  aria-hidden={submitting}
                >
                  {submitting ? copy.act3Submitting : copy.act3ConfirmEnterHint}
                </p>
                {submitError ? (
                  <p
                    id="act3-inscription-error"
                    className="max-w-[18rem] text-[clamp(0.62rem,1.65vw,0.72rem)] leading-snug text-[rgba(212,197,176,0.62)]"
                  >
                    {submitError}
                  </p>
                ) : null}
              </motion.div>
            </motion.form>
          )}

          {step === "constellation" && (
            <motion.div
              key="constellation"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={act3Fade(reduceMotion, 1.4)}
            >
              <Act3ConstellationScrollLoad
                active={constellationRevealed}
                reduceMotion={reduceMotion}
                scrollCue={copy.act3ConstellationScrollCue}
                continueLabel={copy.act3ConstellationContinue}
                viewMyStarLabel={
                  highlightId || highlightMot ? copy.act3ViewMyStar : null
                }
                onViewMyStar={viewMyStar}
                onComplete={goToOutro}
              />
              <motion.p
                className="da-act3-micro pointer-events-none shrink-0 pb-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: loadingStars || !constellationRevealed ? 0.55 : 0 }}
                transition={act3Fade(reduceMotion, 0.8)}
                aria-live="polite"
              >
                {copy.act3LoadingStars}
              </motion.p>
              <motion.div
                className="relative min-h-0 w-full flex-1"
                style={{ minHeight: "min(72dvh, calc(100dvh - 11rem))" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: loadingStars ? 0 : 1 }}
                transition={
                  loadingStars
                    ? act3Fade(reduceMotion, 1.2)
                    : act3FadeDelayed(reduceMotion, 0.15, 1.2)
                }
              >
                {!loadingStars ? (
                  <Act3ConstellationSky
                    ref={skyRef}
                    stars={stars}
                    highlightId={highlightId}
                    highlightMot={highlightMot}
                    focusMyStarToken={focusMyStarToken}
                    arabicUi={arabicUi}
                    reduceMotion={reduceMotion}
                    onRevealComplete={handleConstellationRevealed}
                    onSelectStar={handleSelectStar}
                  />
                ) : null}
              </motion.div>
            </motion.div>
          )}

          {step === "outro" && (
            <motion.div
              key="outro"
              className="flex flex-1 flex-col items-center justify-center px-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={act3Fade(reduceMotion, 1)}
            >
              <div className="relative min-h-[5.5rem] w-full max-w-[min(100%,24rem)]">
                <AnimatePresence mode="wait">
                  {outroPhase === "line1" && (
                    <motion.p
                      key="o1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={act3Fade(reduceMotion, 0.9)}
                      className="da-act3-outro-line"
                    >
                      {copy.act3OutroLine1}
                    </motion.p>
                  )}
                  {outroPhase === "line2" && (
                    <motion.p
                      key="o2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={act3Fade(reduceMotion, 0.85)}
                      className="da-act3-outro-line text-da-parchment/72"
                    >
                      {copy.act3OutroLine2}
                    </motion.p>
                  )}
                  {outroPhase === "line3" && (
                    <motion.p
                      key="o3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={act3Fade(reduceMotion, 1.1)}
                      className="da-act3-outro-glow"
                    >
                      {copy.act3OutroLine3}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
