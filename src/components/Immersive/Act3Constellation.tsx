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
import { SHELL_GOLD_BTN } from "../../lib/shellGoldButton";
import { metaForWord } from "./mapWordData";
import { arabicPoemWordLabel } from "../../lib/mapWordArabicDisplay";
import Act3ConstellationSky from "./Act3ConstellationSky";
import Act3ConstellationScrollLoad from "./Act3ConstellationScrollLoad";
import AuroraMeshBackground from "../AuroraMeshBackground";

type Step = "intro" | "select" | "confirm" | "constellation" | "outro";
type OutroPhase = "idle" | "line1" | "line2" | "line3";

/** Délai avant fondu vers le générique (ms) — laisse la 3ᵉ ligne respirer. */
const OUTRO_TO_CREDITS_MS = 6800;
const OUTRO_TO_CREDITS_REDUCED_MS = 1800;

type Props = {
  onContinueToCredits: () => void;
};

const WORD_BTN_BASE =
  "da-act3-floating-word pointer-events-auto absolute cursor-none border-0 bg-transparent p-0 " +
  "transition-[color,text-shadow,opacity] duration-500 " +
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-solar-gold/45";

const FADE = { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const };

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
  const [starFormVisible, setStarFormVisible] = useState(false);
  const [outroPhase, setOutroPhase] = useState<OutroPhase>("idle");
  const creditsAutoRef = useRef(false);

  const wordsWrapRef = useRef<HTMLDivElement>(null);
  const risingWordRef = useRef<HTMLSpanElement>(null);
  const starDotRef = useRef<HTMLSpanElement>(null);

  const labelFor = useCallback(
    (w: string) => (arabicUi ? arabicPoemWordLabel(w) : w),
    [arabicUi],
  );

  const handleConstellationRevealed = useCallback(() => {
    setConstellationRevealed(true);
  }, []);

  const goToOutro = useCallback(() => {
    setStep("outro");
  }, []);

  const loadStars = useCallback(async () => {
    setLoadingStars(true);
    setStars(await fetchConstellationStars());
    setLoadingStars(false);
  }, []);

  useEffect(() => {
    if (step === "confirm" || step === "constellation") void loadStars();
  }, [step, loadStars]);

  useEffect(() => {
    if (step !== "constellation") {
      setConstellationRevealed(false);
    }
  }, [step]);

  /* ── Intro : lignes séquentielles ── */
  useEffect(() => {
    if (step !== "intro") return;
    if (reduceMotion) {
      const t = window.setTimeout(() => setStep("select"), 500);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStep("select"), 6200);
    return () => window.clearTimeout(t);
  }, [step, reduceMotion]);

  /* ── Apparition + dérive lente des mots flottants ── */
  useEffect(() => {
    if (step !== "select" || reduceMotion) return;
    const wrap = wordsWrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    const driftTimelines: gsap.core.Timeline[] = [];

    const boot = () => {
      if (cancelled) return;
      const btns = [...wrap.querySelectorAll<HTMLButtonElement>("button[data-word]")];
      if (!btns.length) return;

      btns.forEach((btn, i) => {
        const { rot, drift } = act3WordFloatLayout(i);
        gsap.set(btn, {
          xPercent: -50,
          yPercent: -50,
          rotation: rot,
          x: 0,
          y: 0,
        });

        const seg = drift.dur / 4;
        const tl = gsap.timeline({ repeat: -1, delay: drift.delay + 0.35 });
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
        driftTimelines.push(tl);
      });

      gsap.fromTo(
        btns,
        { opacity: 0, filter: "blur(8px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.055,
          ease: "power2.out",
          delay: 0.3,
        },
      );
    };

    const raf = requestAnimationFrame(() => requestAnimationFrame(boot));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      const btns = [...wrap.querySelectorAll<HTMLButtonElement>("button[data-word]")];
      gsap.killTweensOf(btns);
      driftTimelines.forEach((tl) => tl.kill());
    };
  }, [step, reduceMotion]);

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

    gsap.to(others, { opacity: 0, duration: 0.5, ease: "power1.in" });

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
          window.setTimeout(() => setStarFormVisible(true), 200);
        },
      });
      tl.to(el, {
        x: wr.width / 2,
        y: wr.height * 0.32,
        scale: 1.18,
        duration: 0.9,
        ease: "power2.out",
      });
      tl.to(el, {
        y: wr.height * 0.14,
        scale: 0.35,
        opacity: 0,
        duration: 2,
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
          duration: 0.55,
          ease: "power2.out",
        });
      }
    } else {
      window.setTimeout(() => {
        setStep("confirm");
        setStarFormVisible(true);
      }, 2600);
    }
  };

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
    setStars((prev) => {
      if (prev.some((s) => s.id === res.row.id)) return prev;
      return [...prev, res.row];
    });
    setStep("constellation");
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
      }, OUTRO_TO_CREDITS_REDUCED_MS);
      return () => window.clearTimeout(t);
    }

    setOutroPhase("line1");
    const t1 = window.setTimeout(() => setOutroPhase("line2"), 1500);
    const t2 = window.setTimeout(() => setOutroPhase("line3"), 4500);
    const t3 = window.setTimeout(() => {
      if (!creditsAutoRef.current) {
        creditsAutoRef.current = true;
        onContinueToCredits();
      }
    }, OUTRO_TO_CREDITS_MS);

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

  const introDelay = (s: number) => (reduceMotion ? 0 : s);

  return (
    <section
      className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#1a0f00] text-[#f4ead2]"
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
          className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_95%_70%_at_50%_18%,rgba(213,175,110,0.12)_0%,transparent_55%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: FADE.ease }}
        />
        <div
          aria-hidden
          className="absolute inset-0 z-[1] bg-[linear-gradient(165deg,rgba(35,24,16,0.5)_0%,transparent_42%,rgba(8,6,4,0.45)_100%)]"
        />
      </div>

      <motion.div
        className="relative z-[2] flex min-h-0 flex-1 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))] sm:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0.15 : 1.4, ease: FADE.ease }}
      >
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              className="flex flex-1 flex-col items-center justify-center gap-0 text-center"
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.2 : 1 }}
            >
              <motion.p
                className="da-act3-intro-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: introDelay(0.5), duration: 1.3, ease: FADE.ease }}
              >
                {copy.act3IntroLine1}
              </motion.p>
              <motion.p
                className="da-act3-intro-line mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: introDelay(1.7), duration: 1.3, ease: FADE.ease }}
              >
                {copy.act3IntroLine2}
              </motion.p>
              <motion.p
                className="da-act3-question mt-10 w-full max-w-[min(100%,54rem)] px-3 text-center max-sm:text-pretty sm:whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: introDelay(3.7), duration: 1.5, ease: FADE.ease }}
              >
                {copy.act3IntroLine3}
              </motion.p>
            </motion.div>
          )}

          {(step === "select" || (step === "confirm" && selectedWord)) && (
            <motion.div
              key="select-layer"
              ref={wordsWrapRef}
              className="relative flex-1 [contain:paint] [isolation:isolate]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
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
                    disabled={step === "confirm"}
                    className={WORD_BTN_BASE}
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
                      pointerEvents: step === "confirm" ? "none" : undefined,
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
                className="pointer-events-none absolute left-1/2 top-[14%] z-[3] block h-2.5 w-2.5 rounded-full bg-[#f8f4eb] opacity-0 shadow-[0_0_20px_rgba(197,160,89,0.65),0_0_40px_rgba(197,160,89,0.28)]"
                aria-hidden
              />
            </motion.div>
          )}

          {step === "confirm" && selectedWord && (
            <motion.div
              key="confirm-form"
              className="pointer-events-none absolute inset-x-0 bottom-[max(12%,env(safe-area-inset-bottom))] z-[4] flex flex-col items-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: starFormVisible ? 1 : 0 }}
              transition={{ duration: 0.9, ease: FADE.ease }}
            >
              <div className="pointer-events-auto w-full max-w-[min(100%,20rem)] space-y-5">
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  maxLength={80}
                  placeholder={copy.act3ConfirmIdentityPlaceholder}
                  className="da-act3-inscription w-full"
                />
                {submitError ? (
                  <p className="text-center text-[11px] text-[rgba(255,160,120,0.85)]">{submitError}</p>
                ) : null}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void onJoinConstellation()}
                  className={`w-full min-h-[48px] ${SHELL_GOLD_BTN}`}
                >
                  {submitting ? copy.act3Submitting : copy.act3ConfirmCta}
                </button>
              </div>
            </motion.div>
          )}

          {step === "constellation" && (
            <motion.div
              key="constellation"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, ease: FADE.ease }}
            >
              <motion.p
                className="da-act3-micro pointer-events-none shrink-0 pb-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: loadingStars || !constellationRevealed ? 0.55 : 0 }}
                transition={{ duration: 0.8, ease: FADE.ease }}
                aria-live="polite"
              >
                {copy.act3LoadingStars}
              </motion.p>
              <motion.div
                className="relative min-h-0 w-full flex-1"
                style={{ minHeight: "min(72dvh, calc(100dvh - 11rem))" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: loadingStars ? 0 : 1 }}
                transition={{ duration: 1.2, ease: FADE.ease, delay: loadingStars ? 0 : 0.15 }}
              >
                {!loadingStars ? (
                  <Act3ConstellationSky
                    stars={stars}
                    highlightId={highlightId}
                    arabicUi={arabicUi}
                    reduceMotion={reduceMotion}
                    onRevealComplete={handleConstellationRevealed}
                    onSelectStar={() => {}}
                  />
                ) : null}
              </motion.div>
              <motion.div
                className="shrink-0 pt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: constellationRevealed ? 1 : 0 }}
                transition={{ duration: 1, ease: FADE.ease }}
              >
                {highlightId && constellationRevealed ? (
                  <p className="da-act3-micro mb-3 text-solar-gold/42">
                    {copy.act3YourStarHint}
                  </p>
                ) : null}
                <Act3ConstellationScrollLoad
                  active={constellationRevealed}
                  reduceMotion={reduceMotion}
                  scrollCue={copy.act3ConstellationScrollCue}
                  loadingLabel={copy.act3ConstellationScrollLoading}
                  continueLabel={copy.act3ConstellationContinue}
                  onComplete={goToOutro}
                />
              </motion.div>
            </motion.div>
          )}

          {step === "outro" && (
            <motion.div
              key="outro"
              className="flex flex-1 flex-col items-center justify-center px-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: FADE.ease }}
            >
              <div className="relative min-h-[5.5rem] w-full max-w-[min(100%,24rem)]">
                <AnimatePresence mode="wait">
                  {outroPhase === "line1" && (
                    <motion.p
                      key="o1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: FADE.ease }}
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
                      transition={{ duration: 0.85, ease: FADE.ease }}
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
                      transition={{ duration: 1.1, ease: FADE.ease }}
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
