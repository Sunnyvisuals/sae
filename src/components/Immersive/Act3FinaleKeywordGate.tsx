"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import ShootingStars from "../ShootingStars";
import type { AppLanguage } from "../../stores/languageStore";
import {
  ACT3_FINALE_HINT_DELAY_MS,
  finaleCompletionReady,
  loadAct3FinaleGate,
  type Act3FinaleGateLocale,
} from "../../lib/act3FinaleGate";
import {
  ACT3_FIXED_STARFIELD_BG,
  ACT3_FIXED_STARFIELD_WARM_BG,
  ACT3_SKY_RADIAL_CSS,
  ACT3_SKY_RADIAL_WARM_CSS,
  ACT3_SKY_CONIC_CSS,
  ACT3_SKY_CONIC_WARM_CSS,
  ACT3_DUST_GRAIN_CSS,
  ACT3_DUST_GRAIN_WARM_CSS,
  ACT3_DUST_GRAIN_SIZE,
  ACT3_FINALE_DA_WARM_CYCLE_SEC,
} from "../../lib/act3NightSky";
import Act3FinaleCursorParticles from "./Act3FinaleCursorParticles";

/** Apparitions du gate finale : très lentes. */
const FINALE_VERSE_LINE_APPEAR_SEC = 5.4;
const FINALE_VERSE_LINE_STAGGER_SEC = 1.25;
const FINALE_LOADING_APPEAR_SEC = 4.2;
/** Fondu du gate entier avant passage aux crédits (mot juste trouvé). */
const FINALE_EXIT_TO_CREDITS_SEC = 1.35;
const FINALE_HINT_APPEAR_REDUCED_SEC = 2.1;
const FINALE_HINT_BREATH_CYCLE_SEC = 14;

type Props = {
  language: AppLanguage;
  /** Fin juste : ouvre les crédits voyage (même chaîne que le bouton). */
  onSolved: () => void;
  wrongLabel: string;
  enterHint: string;
  loadingLabel: string;
  timedHintKicker: string;
};

export default function Act3FinaleKeywordGate({
  language,
  onSolved,
  wrongLabel,
  enterHint,
  loadingLabel,
  timedHintKicker,
}: Props) {
  const arabicUi = language === "ar-dz";
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cfg, setCfg] = useState<Act3FinaleGateLocale | null>(null);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [exiting, setExiting] = useState(false);
  const solvedOnce = useRef(false);
  const pendingCreditsHandoffRef = useRef(false);
  const [showTimedHint, setShowTimedHint] = useState(false);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const data = await loadAct3FinaleGate(language);
      if (!cancel) setCfg(data);
    })();
    return () => {
      cancel = true;
    };
  }, [language]);

  useEffect(() => {
    if (!cfg || exiting) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [cfg, exiting]);

  useEffect(() => {
    if (!cfg || exiting) {
      setShowTimedHint(false);
      return;
    }
    setShowTimedHint(false);
    const t = window.setTimeout(() => setShowTimedHint(true), ACT3_FINALE_HINT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [cfg, exiting]);

  const trySubmit = useCallback(() => {
    if (!cfg || exiting || solvedOnce.current) return;
    if (finaleCompletionReady(value, cfg.minLength)) {
      solvedOnce.current = true;
      setWrong(false);
      if (reduceMotion) {
        onSolved();
        return;
      }
      pendingCreditsHandoffRef.current = true;
      setExiting(true);
      return;
    }
    setWrong(true);
    inputRef.current?.focus();
  }, [cfg, exiting, onSolved, reduceMotion, value]);

  useEffect(() => {
    if (!exiting || reduceMotion) return;
    const ms = Math.round(FINALE_EXIT_TO_CREDITS_SEC * 1000);
    const t = window.setTimeout(() => {
      if (!pendingCreditsHandoffRef.current) return;
      pendingCreditsHandoffRef.current = false;
      onSolved();
    }, ms);
    return () => window.clearTimeout(t);
  }, [exiting, onSolved, reduceMotion]);

  const curtainClass = arabicUi
    ? "da-curtain-ar text-center"
    : "da-curtain-fr text-center sm:tracking-[0.38em]";
  const bodyClass = arabicUi
    ? "da-act2-body-ar mx-auto max-w-[min(36ch,92vw)] text-center text-pretty"
    : "da-act2-body mx-auto max-w-[min(34ch,92vw)] text-center text-pretty";
  const inscriptionClass =
    (arabicUi ? "da-act2-body-ar " : "da-act2-body ") +
    "da-finale-inscription [field-sizing:content]";

  const verseLineEase = [0.22, 1, 0.36, 1] as const;
  const verseLineIn = reduceMotion
    ? false
    : { opacity: 0, y: 22, filter: "blur(11px)" as const };
  const verseLineAnim = { opacity: 1, y: 0, filter: "blur(0px)" as const };
  const verseLineTransition = (delaySec: number) =>
    reduceMotion
      ? { duration: 0 }
      : {
          duration: FINALE_VERSE_LINE_APPEAR_SEC,
          delay: delaySec,
          ease: verseLineEase,
        };

  const daWarmCrossfade = reduceMotion
    ? ({ opacity: 0 } as const)
    : ({ opacity: [0, 1, 0] } as const);
  const daWarmCrossfadeTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: ACT3_FINALE_DA_WARM_CYCLE_SEC,
        repeat: Infinity,
        ease: "easeInOut" as const,
        times: [0, 0.5, 1],
      };

  return (
    <motion.div
      className={
        "fixed inset-0 isolate z-[55] overflow-hidden bg-da-depth-night" +
        (exiting ? " pointer-events-none" : "")
      }
      role="dialog"
      aria-modal
      aria-labelledby="act3-finale-verse"
      aria-describedby="act3-finale-instructions"
      initial={false}
      animate={
        exiting
          ? { opacity: 0, filter: "blur(12px)", y: "-3vh" }
          : { opacity: 1, filter: "blur(0px)", y: 0 }
      }
      transition={{
        duration: exiting ? FINALE_EXIT_TO_CREDITS_SEC : 0,
        ease: verseLineEase,
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-da-depth-night" aria-hidden />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-[0.38]"
          style={{ backgroundImage: ACT3_FIXED_STARFIELD_BG }}
          animate={
            reduceMotion ? undefined : { opacity: [0.32, 0.44, 0.34, 0.4, 0.32] }
          }
          transition={reduceMotion ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: ACT3_FIXED_STARFIELD_WARM_BG }}
          animate={daWarmCrossfade}
          transition={daWarmCrossfadeTransition}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
        <div className="absolute inset-0" style={{ background: ACT3_SKY_RADIAL_CSS }} />
        <motion.div
          className="absolute inset-0"
          style={{ background: ACT3_SKY_RADIAL_WARM_CSS }}
          animate={daWarmCrossfade}
          transition={daWarmCrossfadeTransition}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.14] mix-blend-soft-light"
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: ACT3_SKY_CONIC_CSS }} />
        <motion.div
          className="absolute inset-0"
          style={{ background: ACT3_SKY_CONIC_WARM_CSS }}
          animate={daWarmCrossfade}
          transition={daWarmCrossfadeTransition}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden>
        <ShootingStars intense />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.22] mix-blend-soft-light"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: ACT3_DUST_GRAIN_CSS,
            backgroundSize: ACT3_DUST_GRAIN_SIZE,
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: ACT3_DUST_GRAIN_WARM_CSS,
            backgroundSize: ACT3_DUST_GRAIN_SIZE,
          }}
          animate={daWarmCrossfade}
          transition={daWarmCrossfadeTransition}
        />
      </div>

      <Act3FinaleCursorParticles
        reducedMotion={!!reduceMotion}
        className="pointer-events-none absolute inset-0 z-[6]"
      />

      <p id="act3-finale-instructions" className="sr-only">
        {cfg ? `${cfg.prompt} ${enterHint}` : `${loadingLabel} ${enterHint}`}
      </p>

      <div
        className={
          "pointer-events-auto relative z-[10] flex min-h-full items-center justify-center px-[max(1.25rem,env(safe-area-inset-left))] py-[max(3.5rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))]"
        }
      >
        <div className="w-full max-w-[min(72rem,calc(100vw-4rem))]">
          {!cfg ? (
            <motion.p
              id="act3-finale-verse"
              className={curtainClass + " opacity-45"}
              aria-live="polite"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 0.45, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : FINALE_LOADING_APPEAR_SEC, ease: verseLineEase }}
            >
              {loadingLabel}
            </motion.p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                trySubmit();
              }}
              className={"mx-auto w-full max-w-[min(30rem,92vw)]" + (exiting ? " pointer-events-none" : "")}
              dir={arabicUi ? "rtl" : "ltr"}
            >
              <motion.div
                className="mb-8 flex items-center gap-3 sm:gap-4"
                aria-hidden
                initial={verseLineIn}
                animate={verseLineAnim}
                transition={verseLineTransition(0)}
              >
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-solar-gold/35 to-transparent" />
                <span className="h-[5px] w-[5px] shrink-0 rotate-45 border border-solar-gold/45 bg-black/40 shadow-[0_0_12px_rgba(197,160,89,0.2)]" />
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-solar-gold/35 to-transparent" />
              </motion.div>

              <motion.p
                className={curtainClass}
                initial={verseLineIn}
                animate={verseLineAnim}
                transition={verseLineTransition(0.08)}
              >
                {cfg.kicker}
              </motion.p>

              <motion.p
                className={(arabicUi ? "da-eyebrow-ar" : "da-eyebrow") + " mx-auto mt-5 max-w-[28ch] text-center opacity-80"}
                initial={verseLineIn}
                animate={verseLineAnim}
                transition={verseLineTransition(0.16)}
              >
                {cfg.eyebrow}
              </motion.p>

              <motion.div
                id="act3-finale-verse"
                className="da-glass-moon relative mt-10 px-5 py-7 sm:mt-12 sm:px-8 sm:py-9"
                initial={verseLineIn}
                animate={verseLineAnim}
                transition={verseLineTransition(FINALE_VERSE_LINE_STAGGER_SEC * 0.35)}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(139_213_255/0.28)] to-transparent sm:inset-x-8"
                />
                <p className={bodyClass}>{cfg.before}</p>
                <div className="mt-5 sm:mt-6">
                  <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setWrong(false);
                    }}
                    placeholder={cfg.placeholder}
                    aria-label={cfg.inputAria}
                    aria-invalid={wrong}
                    aria-describedby={
                      [wrong ? "act3-finale-wrong" : "", showTimedHint ? "act3-finale-timed-hint" : ""]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    autoCapitalize="sentences"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={140}
                    disabled={exiting}
                    size={Math.max(value.length || cfg.placeholder.length, 14)}
                    data-cursor-text
                    className={inscriptionClass + (wrong ? " border-[rgba(255,186,186,0.45)]" : "")}
                  />
                </div>
                {cfg.after.trim() ? (
                  <p className={bodyClass + " mt-5 opacity-80"}>{cfg.after}</p>
                ) : null}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-solar-gold/22 to-transparent sm:inset-x-8"
                />
              </motion.div>

              <motion.p
                className="da-hint-micro mx-auto mt-9 max-w-[20rem] sm:mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : 1.2, duration: 0.8 }}
              >
                {enterHint}
              </motion.p>

              {showTimedHint ? (
                <motion.div
                  id="act3-finale-timed-hint"
                  className="mx-auto mt-10 max-w-[min(32ch,90vw)] text-center sm:mt-12"
                  initial={{ opacity: 0 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 0] }}
                  transition={
                    reduceMotion
                      ? { duration: FINALE_HINT_APPEAR_REDUCED_SEC, ease: verseLineEase }
                      : {
                          duration: FINALE_HINT_BREATH_CYCLE_SEC,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.5, 1],
                        }
                  }
                >
                  <p className={arabicUi ? "da-eyebrow-ar" : "da-eyebrow"}>{timedHintKicker}</p>
                  <p className={bodyClass + " mt-3 text-[clamp(0.88rem,1.35vw,0.98rem)] opacity-85"}>
                    {cfg.timedHint}
                  </p>
                </motion.div>
              ) : null}

              {wrong ? (
                <p
                  id="act3-finale-wrong"
                  role="alert"
                  className={
                    "mx-auto mt-4 max-w-[min(32ch,92vw)] text-center text-balance font-sans text-[10px] uppercase tracking-[0.22em] text-[rgba(255,186,186,0.88)] " +
                    (arabicUi ? "font-arabic-ui not-italic" : "")
                  }
                >
                  {wrongLabel}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
