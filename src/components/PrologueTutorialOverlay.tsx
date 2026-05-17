import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { copyFor } from "../lib/appCopy";
import {
  exitDocumentFullscreen,
  getDocumentFullscreenElement,
  isAlreadyInFullscreen,
  isFullscreenApiSupported,
  requestDocumentFullscreen,
  useDocumentFullscreenActive,
} from "../lib/fullscreenDocument";
import {
  IconChevronLeft,
  IconChevronUp,
  IconFullscreenEnter,
  IconFullscreenExit,
  IconMouseScroll,
} from "./ui/icons";
import PrologueVolumeFluid from "./PrologueVolumeFluid";
import PrologueVolumeHud, { PROLOGUE_VOLUME_HUD_POSITION } from "./PrologueVolumeHud";
import { shouldIgnoreVolumeKeyboardTarget } from "../lib/volumeKeyboard";
import {
  DA_MOTION_EASE,
  DA_TEXT_CROSSFADE,
  DA_TUTORIAL_SHELL,
  DA_FULLSCREEN_HANDOFF,
  DA_TUTORIAL_STEP,
  DA_VOLUME_STEP,
  daPick,
} from "../lib/motionDa";

type Copy = ReturnType<typeof copyFor>;

/** Corps tuto : un ou plusieurs paragraphes (séparateur `\n` dans appCopy). */
function TutorialBodyCopy({
  text,
  isArabic,
  className = "",
  /** Une phrase par ligne, sans césure au milieu (ex. étape Immersion). */
  onePhrasePerLine = false,
}: {
  text: string;
  isArabic: boolean;
  className?: string;
  onePhrasePerLine?: boolean;
}) {
  const parts = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const singleClass = isArabic ? "da-tutorial-body-ar" : "da-tutorial-body";
  const partClass = isArabic
    ? "da-act2-body-ar w-full text-pretty text-center"
    : "da-act2-body w-full text-pretty text-center";
  const lineClass = isArabic ? "da-tutorial-body-line-ar" : "da-tutorial-body-line";
  const stackClass = onePhrasePerLine
    ? "da-tutorial-body-stack-lines"
    : isArabic
      ? "da-tutorial-body-stack-ar"
      : "da-tutorial-body-stack";

  if (parts.length <= 1) {
    return (
      <p className={`${singleClass} ${className}`.trim()}>
        {parts[0] ?? text}
      </p>
    );
  }

  return (
    <motion.div
      className={`${stackClass} ${className}`.trim()}
      initial={false}
    >
      {parts.map((part, i) => (
        <p
          key={`${i}-${part.slice(0, 24)}`}
          className={onePhrasePerLine ? lineClass : partClass}
        >
          {part}
        </p>
      ))}
    </motion.div>
  );
}

const STEP_EASE = DA_MOTION_EASE;
const TUTORIAL_SHELL_ENTER = DA_TUTORIAL_SHELL;
const VOLUME_STEP_ENTER = DA_VOLUME_STEP;

/** RepÃ¨re losange DA (curseur / boutons intro). */
function TutorialStepGlyph({ active }: { active: boolean }) {
  const stroke = active ? "rgba(197, 160, 89, 0.88)" : "rgba(197, 160, 89, 0.34)";
  const fill = active ? "rgba(197, 160, 89, 0.72)" : "rgba(0, 0, 0, 0.42)";
  const glow = active
    ? "drop-shadow(0 0 10px rgba(197, 160, 89, 0.42))"
    : "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.65))";

  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className="h-[15px] w-[15px] shrink-0 transition-all duration-500 sm:h-[17px] sm:w-[17px]"
      style={{ filter: glow }}
    >
      <polygon
        points="6,1 10.8,6 6,11 1.2,6"
        fill={fill}
        stroke={stroke}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Souris + molette - invite scroll volume (sans texte). */
function TutorialVolumeScrollMouse({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.div
      className="relative flex h-11 w-11 items-center justify-center text-solar-gold/62 sm:h-12 sm:w-12"
      aria-hidden
      animate={
        prefersReducedMotion
          ? undefined
          : { y: [0, -4, 0], opacity: [0.55, 0.95, 0.55] }
      }
      transition={{
        duration: 1.85,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: [0.45, 0, 0.55, 1],
      }}
    >
      <IconChevronUp
        className="absolute -top-0.5 left-1/2 h-3 w-3 -translate-x-1/2 text-solar-gold/45 sm:h-3.5 sm:w-3.5"
        aria-hidden
      />
      <IconMouseScroll className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.2} />
      <motion.span
        className="pointer-events-none absolute left-1/2 top-[42%] h-2 w-[2px] -translate-x-1/2 rounded-full bg-solar-gold/75"
        aria-hidden
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, -5, 0], opacity: [0.35, 1, 0.35], scaleY: [1, 1.15, 1] }
        }
        transition={{
          duration: 1.35,
          repeat: prefersReducedMotion ? 0 : Infinity,
          ease: STEP_EASE,
        }}
      />
    </motion.div>
  );
}

/** Invite au scroll - même ancrage que le HUD volume (pas de chevauchement au changement). */
function TutorialVolumeScrollCue({
  visible,
  ariaLabel,
  prefersReducedMotion,
  enterDelay = 0,
  enterDuration = 0.28,
  instantExit = false,
}: {
  visible: boolean;
  ariaLabel: string;
  prefersReducedMotion: boolean;
  enterDelay?: number;
  enterDuration?: number;
  /** Dès que le volume bouge : pas de fondu sortie (même slot que le HUD). */
  instantExit?: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.aside
          key="tutorial-volume-scroll-cue"
          role="status"
          aria-live="polite"
          aria-label={ariaLabel}
          initial={{ opacity: 0, y: 12, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: instantExit ? -4 : 6, filter: instantExit ? "blur(0px)" : "blur(3px)" }}
          transition={{
            duration: instantExit ? 0.07 : enterDuration,
            delay: 0,
            ease: STEP_EASE,
          }}
          className={`${PROLOGUE_VOLUME_HUD_POSITION} z-[5]`}
        >
          <TutorialVolumeScrollMouse prefersReducedMotion={prefersReducedMotion} />
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export type PrologueTutorialStep = "skip" | "volume";

type Props = {
  step: PrologueTutorialStep;
  volume01: number;
  volumeHudVisible?: boolean;
  /** Molette / clavier : masquer la souris avant le HUD volume. */
  volumeScrollCueDismissed?: boolean;
  prefersReducedMotion: boolean;
  isArabic: boolean;
  copy: Copy;
  onSkipAck: () => void;
  /** Mission 2 : relire mission 1 (plein Ã©cran / casque). */
  onReviewSkip: () => void;
  /** Volume rÃ©glÃ© : passage au chargement puis Ã  la vidÃ©o. */
  onLaunchVideo: () => void;
  /** Fin du fondu dâ€™entrÃ©e (relÃ¢che le voile noir de handoff cÃ´tÃ© Intro). */
  onStepRevealed?: () => void;
};

function TutorialMissionHeader({
  stepIndex,
  isArabic,
  copy,
  eyebrow,
  enterDelay = 0,
  anchored = "top",
  settled = false,
}: {
  stepIndex: number;
  isArabic: boolean;
  copy: Copy;
  eyebrow?: string;
  enterDelay?: number;
  /** `top` = bandeau fixe ; `centered` = inclus dans le bloc centrÃ©. */
  anchored?: "top" | "centered";
  /** Ã‰tape 2 : pas de rÃ©-entrÃ©e du bandeau (changement rapide). */
  settled?: boolean;
}) {
  return (
    <motion.header
      initial={settled ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: settled ? 0.22 : 1.05,
        delay: settled ? 0 : enterDelay,
        ease: STEP_EASE,
      }}
      className={
        "pointer-events-none z-[4] flex flex-col items-center gap-2.5 " +
        (anchored === "top"
          ? "absolute inset-x-0 top-0 px-5 pt-[max(5.5rem,calc(env(safe-area-inset-top)+3.5rem))] sm:px-8"
          : "relative w-full")
      }
    >
      <motion.div className="flex items-center justify-center gap-5 sm:gap-6">
        <span
          className={
            (isArabic ? "da-eyebrow-ar" : "da-eyebrow") +
            " text-[15px] tracking-[0.34em] sm:text-[17px] sm:tracking-[0.36em]"
          }
        >
          {copy.introTutorialMission} {stepIndex}/2
        </span>
        <motion.div className="flex items-center gap-3 sm:gap-3.5" aria-hidden>
          {([1, 2] as const).map((n) => (
            <TutorialStepGlyph key={n} active={n <= stepIndex} />
          ))}
        </motion.div>
      </motion.div>
      {eyebrow ? (
        <span
          className={
            (isArabic ? "da-eyebrow-ar" : "da-eyebrow") +
            " text-center text-[11px] sm:text-[12px]"
          }
        >
          {eyebrow}
        </span>
      ) : null}
    </motion.header>
  );
}

/** Fond sobre uni â€” pas dâ€™aurora ni de halo derriÃ¨re le tuto. */
function TutorialDarkScrim({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[#020100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }}
        transition={{
          duration: prefersReducedMotion
            ? TUTORIAL_SHELL_ENTER.scrim.reduced
            : TUTORIAL_SHELL_ENTER.scrim.normal,
          ease: STEP_EASE,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0.28 : 1.65,
          delay: prefersReducedMotion ? 0.06 : 0.35,
          ease: STEP_EASE,
        }}
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 42%, rgba(197, 160, 89, 0.03) 0%, transparent 58%)",
        }}
      />
    </>
  );
}

const FULLSCREEN_NUDGE_DELAY_MS = 7000;

function TutorialFullscreenButton({
  placement,
  enterAriaLabel,
  exitAriaLabel,
  enterTitle,
  exitTitle,
  isArabic,
  onFullscreenTest,
  prefersReducedMotion = false,
  nudgeEnabled = true,
  exitTransition,
}: {
  placement: "inline" | "corner";
  enterAriaLabel: string;
  exitAriaLabel: string;
  enterTitle: string;
  exitTitle: string;
  isArabic: boolean;
  onFullscreenTest?: () => void;
  prefersReducedMotion?: boolean;
  nudgeEnabled?: boolean;
  exitTransition?: { duration: number; ease: typeof STEP_EASE };
}) {
  const fsActive = useDocumentFullscreenActive();
  const supported =
    typeof window !== "undefined" && isFullscreenApiSupported();
  const [nudgePulse, setNudgePulse] = useState(false);
  const inline = placement === "inline";

  useEffect(() => {
    if (!nudgeEnabled || !inline || prefersReducedMotion || fsActive) {
      setNudgePulse(false);
      return;
    }
    const id = window.setTimeout(() => setNudgePulse(true), FULLSCREEN_NUDGE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [nudgeEnabled, inline, prefersReducedMotion, fsActive]);

  if (!supported) return null;

  const cornerPositionClass = isArabic
    ? "top-[max(2.25rem,calc(env(safe-area-inset-top)+1.5rem))] left-[max(2.25rem,calc(env(safe-area-inset-left)+1.5rem))] md:top-[max(2.75rem,calc(env(safe-area-inset-top)+1.75rem))] md:left-[max(2.75rem,calc(env(safe-area-inset-left)+1.75rem))]"
    : "top-[max(2.25rem,calc(env(safe-area-inset-top)+1.5rem))] right-[max(2.25rem,calc(env(safe-area-inset-right)+1.5rem))] md:top-[max(2.75rem,calc(env(safe-area-inset-top)+1.75rem))] md:right-[max(2.75rem,calc(env(safe-area-inset-right)+1.75rem))]";

  const toggleFullscreen = () => {
    setNudgePulse(false);
    onFullscreenTest?.();
    if (fsActive) void exitDocumentFullscreen();
    else void requestDocumentFullscreen();
  };

  const shellClass = inline
    ? "pointer-events-auto relative flex items-center justify-center rounded-[2px] border-0 bg-transparent text-solar-gold/78 " +
      "shadow-none backdrop-blur-none transition-[color,opacity] duration-300 " +
      "hover:bg-transparent hover:text-solar-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/35"
    : "pointer-events-auto relative flex items-center justify-center rounded-[2px] border text-solar-gold/85 " +
      "shadow-[inset_0_1px_0_rgba(253,248,238,0.05),0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm " +
      "transition-[color,background-color,box-shadow] duration-300 " +
      "hover:border-solar-gold/55 hover:bg-black/70 hover:text-solar-gold " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/35 " +
      (fsActive ? "border-solar-gold/55 bg-solar-gold/14" : "border-solar-gold/35 bg-black/55");

  const icon = fsActive ? (
    <IconFullscreenExit className="h-5 w-5 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
  ) : (
    <IconFullscreenEnter className="h-5 w-5 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
  );

  const button = (
    <motion.button
      type="button"
      onClick={toggleFullscreen}
      whileTap={{ scale: 0.96 }}
      animate={
        nudgePulse && inline
          ? { scale: [1, 1.04, 1], opacity: [0.78, 1, 0.78] }
          : { scale: 1, opacity: 1 }
      }
      transition={
        nudgePulse && inline
          ? { duration: 1.35, repeat: Infinity, ease: STEP_EASE }
          : { duration: 0.28, ease: STEP_EASE }
      }
      aria-label={fsActive ? exitAriaLabel : enterAriaLabel}
      aria-pressed={fsActive}
      title={fsActive ? exitTitle : enterTitle}
      className={
        shellClass +
        (inline
          ? " gap-2.5 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.28em] sm:px-7 sm:text-[12px]"
          : " h-10 w-10 sm:h-11 sm:w-11")
      }
    >
      {inline ? <span>{enterTitle}</span> : null}
      {icon}
    </motion.button>
  );

  if (inline) {
    return (
      <motion.div
        key="prologue-fs-inline"
        className="relative mt-2 flex w-full flex-col items-center sm:mt-3"
        exit={{
          opacity: 0,
          y: DA_FULLSCREEN_HANDOFF.exitY,
          scale: 0.92,
          filter: "blur(6px)",
        }}
        transition={exitTransition ?? { duration: 0.58, ease: STEP_EASE }}
      >
        {button}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="prologue-fs-corner"
      className={`pointer-events-none absolute z-[5] ${cornerPositionClass}`}
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, scale: 0.88, y: -6, filter: "blur(6px)" }
      }
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
      transition={{
        duration: daPick(prefersReducedMotion, DA_FULLSCREEN_HANDOFF.cornerEnter),
        delay: daPick(prefersReducedMotion, DA_FULLSCREEN_HANDOFF.cornerEnterDelay),
        ease: STEP_EASE,
      }}
    >
      {button}
    </motion.div>
  );
}

function TutorialReviewBackButton({
  label,
  onClick,
  isArabic,
  enterDelay = 0,
  enterDuration = 0.35,
}: {
  label: string;
  onClick: () => void;
  isArabic: boolean;
  enterDelay?: number;
  enterDuration?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: enterDuration, delay: enterDelay, ease: STEP_EASE }}
      whileTap={{ scale: 0.96 }}
      aria-label={label}
      title={label}
      className={
        "pointer-events-auto absolute z-[5] flex h-10 w-10 items-center justify-center rounded-[2px] " +
        "border border-solar-gold/35 bg-black/55 text-solar-gold/85 shadow-[inset_0_1px_0_rgba(253,248,238,0.05),0_8px_28px_rgba(0,0,0,0.45)] " +
        "backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-300 " +
        "hover:border-solar-gold/55 hover:bg-black/70 hover:text-solar-gold " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/35 sm:h-11 sm:w-11 " +
        (isArabic
          ? "top-[max(2.25rem,calc(env(safe-area-inset-top)+1.5rem))] right-[max(2.25rem,calc(env(safe-area-inset-right)+1.5rem))] md:top-[max(2.75rem,calc(env(safe-area-inset-top)+1.75rem))] md:right-[max(2.75rem,calc(env(safe-area-inset-right)+1.75rem))]"
          : "top-[max(2.25rem,calc(env(safe-area-inset-top)+1.5rem))] left-[max(2.25rem,calc(env(safe-area-inset-left)+1.5rem))] md:top-[max(2.75rem,calc(env(safe-area-inset-top)+1.75rem))] md:left-[max(2.75rem,calc(env(safe-area-inset-left)+1.75rem))]")
      }
    >
      <IconChevronLeft
        className={
          "h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem] " + (isArabic ? "-scale-x-100" : "")
        }
        aria-hidden
      />
    </motion.button>
  );
}

export default function PrologueTutorialOverlay({
  step,
  volume01,
  volumeHudVisible = false,
  volumeScrollCueDismissed = false,
  prefersReducedMotion,
  isArabic,
  copy,
  onSkipAck,
  onReviewSkip,
  onLaunchVideo,
  onStepRevealed,
}: Props) {
  const volumePct = Math.round(Math.min(1, Math.max(0, volume01)) * 100);
  const canLaunchVideo = volumePct > 0;
  const fullscreenSupported =
    typeof window !== "undefined" && isFullscreenApiSupported();
  const [fullscreenTested, setFullscreenTested] = useState(
    () => typeof window !== "undefined" && isAlreadyInFullscreen(),
  );
  const [fsCornerReveal, setFsCornerReveal] = useState(
    () => typeof window !== "undefined" && isAlreadyInFullscreen(),
  );
  const fullscreenTestedRef = useRef(fullscreenTested);
  const fsCornerRevealFallbackRef = useRef(0);

  const fsInlineExitTransition = {
    duration: daPick(prefersReducedMotion, DA_FULLSCREEN_HANDOFF.exit),
    ease: STEP_EASE,
  } as const;

  const revealFsCorner = useCallback(() => {
    window.clearTimeout(fsCornerRevealFallbackRef.current);
    setFsCornerReveal(true);
  }, []);

  const onFsInlineExitComplete = useCallback(() => {
    if (fullscreenTestedRef.current) revealFsCorner();
  }, [revealFsCorner]);

  const markFullscreenTested = useCallback(() => {
    if (fullscreenTestedRef.current) return;
    fullscreenTestedRef.current = true;
    setFullscreenTested(true);
    const exitMs = Math.round(
      (daPick(prefersReducedMotion, DA_FULLSCREEN_HANDOFF.exit) + 0.08) * 1000,
    );
    fsCornerRevealFallbackRef.current = window.setTimeout(revealFsCorner, exitMs);
  }, [prefersReducedMotion, revealFsCorner]);

  useLayoutEffect(() => {
    if (step === "skip" && isAlreadyInFullscreen()) {
      markFullscreenTested();
      revealFsCorner();
    }
  }, [step, markFullscreenTested, revealFsCorner]);

  const canAckSkip = !fullscreenSupported || fullscreenTested;
  const showVolumeScrollCue =
    step === "volume" &&
    volumePct <= 0 &&
    !volumeHudVisible &&
    !volumeScrollCueDismissed;
  const stepIndex = step === "skip" ? 1 : 2;
  const headerSettledRef = useRef(false);
  if (step === "volume") headerSettledRef.current = true;
  else if (!step) headerSettledRef.current = false;
  const headerSettled = headerSettledRef.current;

  useEffect(() => {
    if (step === "volume") {
      setFsCornerReveal(true);
    }
  }, [step]);

  useEffect(() => {
    if (step === "skip" && !fullscreenTested) {
      setFsCornerReveal(false);
      window.clearTimeout(fsCornerRevealFallbackRef.current);
    }
  }, [step, fullscreenTested]);

  useEffect(() => {
    if (step !== "skip") {
      fullscreenTestedRef.current = false;
      setFullscreenTested(false);
      return;
    }
    if (!fullscreenSupported) return;

    if (isAlreadyInFullscreen()) markFullscreenTested();

    const onFsChange = () => {
      if (getDocumentFullscreenElement()) markFullscreenTested();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F11" || e.repeat) return;
      if (shouldIgnoreVolumeKeyboardTarget(e.target)) return;
      markFullscreenTested();
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as EventListener);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [step, fullscreenSupported, markFullscreenTested]);

  const reduced = prefersReducedMotion;
  const slowShellEnter = !headerSettled;
  const shellEnterDelay = headerSettled
    ? 0
    : reduced
      ? TUTORIAL_SHELL_ENTER.headerDelay.reduced
      : TUTORIAL_SHELL_ENTER.headerDelay.normal;
  const volumeStepSwap = step === "volume" && headerSettled;
  const textCrossfadeExit = {
    duration: daPick(reduced, DA_TEXT_CROSSFADE.exit),
    ease: STEP_EASE,
  } as const;
  const textCrossfadeEnter = {
    duration: daPick(reduced, DA_TEXT_CROSSFADE.enter),
    delay: daPick(reduced, DA_TEXT_CROSSFADE.enterDelay),
    ease: STEP_EASE,
  } as const;

  useEffect(() => {
    if (step !== "skip" || !canAckSkip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      e.preventDefault();
      onSkipAck();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [step, canAckSkip, onSkipAck]);

  useEffect(() => {
    if (!onStepRevealed) return;
    const delayMs = slowShellEnter
      ? reduced
        ? TUTORIAL_SHELL_ENTER.handoffReleaseMs.reduced
        : TUTORIAL_SHELL_ENTER.handoffReleaseMs.normal
      : volumeStepSwap
        ? Math.round(
            ((reduced ? VOLUME_STEP_ENTER.delay.reduced : VOLUME_STEP_ENTER.delay.normal) +
              (reduced
                ? VOLUME_STEP_ENTER.duration.reduced
                : VOLUME_STEP_ENTER.duration.normal)) *
              1000
          )
        : Math.round(
            (daPick(reduced, DA_TUTORIAL_STEP.enterDelay) +
              daPick(reduced, DA_TUTORIAL_STEP.enter)) *
              1000
          );
    const t = window.setTimeout(() => onStepRevealed(), delayMs);
    return () => window.clearTimeout(t);
  }, [step, slowShellEnter, volumeStepSwap, reduced, onStepRevealed]);

  const bodyExitTransition = {
    duration: daPick(reduced, DA_TUTORIAL_STEP.exit),
    ease: STEP_EASE,
  } as const;

  const bodyTransition = slowShellEnter
    ? ({
        duration: daPick(reduced, TUTORIAL_SHELL_ENTER.bodyDuration),
        delay: daPick(reduced, TUTORIAL_SHELL_ENTER.bodyDelay),
        ease: STEP_EASE,
      } as const)
    : volumeStepSwap
      ? ({
          duration: daPick(reduced, VOLUME_STEP_ENTER.duration),
          delay: daPick(reduced, VOLUME_STEP_ENTER.delay),
          ease: STEP_EASE,
        } as const)
      : ({
          duration: daPick(reduced, DA_TUTORIAL_STEP.enter),
          delay: daPick(reduced, DA_TUTORIAL_STEP.enterDelay),
          ease: STEP_EASE,
        } as const);
  const bodyEnterY = slowShellEnter
    ? TUTORIAL_SHELL_ENTER.bodyY
    : volumeStepSwap
      ? VOLUME_STEP_ENTER.enterY
      : DA_TUTORIAL_STEP.enterY;

  const scrollCueEnterDelay = step === "volume" ? bodyTransition.delay : 0;
  const scrollCueEnterDuration = step === "volume" ? bodyTransition.duration : 0.28;
  const showFsCorner =
    fullscreenSupported && (step === "volume" || fsCornerReveal);
  const showFsInline = step === "skip" && !fullscreenTested;

  return (
    <AnimatePresence>
      {step ? (
        <motion.div
          key="prologue-tutorial"
          role="dialog"
          aria-modal="true"
          aria-labelledby={
            step === "volume" ? "prologue-tutorial-volume-title" : "prologue-tutorial-title"
          }
          dir={isArabic ? "rtl" : "ltr"}
          className="pointer-events-auto fixed inset-0 z-[48] cursor-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: slowShellEnter
              ? reduced
                ? TUTORIAL_SHELL_ENTER.duration.reduced
                : TUTORIAL_SHELL_ENTER.duration.normal
              : reduced
                ? 0.22
                : 0.38,
            delay: slowShellEnter
              ? reduced
                ? TUTORIAL_SHELL_ENTER.delay.reduced
                : TUTORIAL_SHELL_ENTER.delay.normal
              : 0,
            ease: STEP_EASE,
          }}
        >
          <TutorialDarkScrim prefersReducedMotion={prefersReducedMotion} />

          <LayoutGroup id="prologue-tutorial-fs">
          <AnimatePresence initial={false}>
            {showFsCorner ? (
              <TutorialFullscreenButton
                key="prologue-fs-corner"
                placement="corner"
                enterAriaLabel={copy.introTutorialFullscreenAria}
                exitAriaLabel={copy.introTutorialFullscreenExitAria}
                enterTitle={copy.introTutorialFullscreenCta}
                exitTitle={copy.introTutorialFullscreenActive}
                isArabic={isArabic}
                onFullscreenTest={markFullscreenTested}
                prefersReducedMotion={prefersReducedMotion}
                nudgeEnabled={false}
              />
            ) : null}
          </AnimatePresence>

          <motion.div
            className="absolute inset-0 z-[2]"
            initial={false}
            animate={{
              backgroundColor:
                step === "volume" && volumeHudVisible
                  ? "rgba(10, 8, 6, 0.16)"
                  : "rgba(2, 1, 0, 0)",
            }}
            transition={{ duration: reduced ? 0.25 : 0.65, ease: STEP_EASE }}
            aria-hidden
          />

          {step === "volume" ? (
            <AnimatePresence mode="wait">
              {volumeHudVisible ? (
                <motion.div
                  key="tutorial-volume-feedback"
                  className="absolute inset-0 z-[2]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16, ease: STEP_EASE }}
                >
                  <PrologueVolumeFluid
                    visible
                    volume01={volume01}
                    prefersReducedMotion={prefersReducedMotion}
                    className="absolute inset-0"
                  />
                  <PrologueVolumeHud
                    volumePct={volumePct}
                    ariaLabel={`${copy.introPrologueVolumeAuraAria} ${volumePct}.`}
                    className="z-[1]"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          ) : null}

          <TutorialMissionHeader
            stepIndex={stepIndex}
            isArabic={isArabic}
            copy={copy}
            enterDelay={shellEnterDelay}
            settled={headerSettled}
          />

          {step === "volume" ? (
            <>
              <TutorialReviewBackButton
                label={copy.introTutorialReviewMission1}
                onClick={onReviewSkip}
                isArabic={isArabic}
                enterDelay={scrollCueEnterDelay}
                enterDuration={scrollCueEnterDuration}
              />
              <TutorialVolumeScrollCue
                visible={showVolumeScrollCue}
                ariaLabel={copy.introTutorialVolumeScrollAria}
                prefersReducedMotion={prefersReducedMotion}
                enterDelay={scrollCueEnterDelay}
                enterDuration={scrollCueEnterDuration}
                instantExit={
                  volumeScrollCueDismissed || volumeHudVisible || volumePct > 0
                }
              />
            </>
          ) : null}

          <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center px-5 sm:px-8">
            <AnimatePresence mode="wait" initial={false}>
              {step === "volume" ? (
                <motion.div
                  key="tutorial-body-volume"
                  id="prologue-tutorial-volume-title"
                  initial={{ opacity: 0, y: bodyEnterY, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    y: DA_TUTORIAL_STEP.exitY,
                    filter: "blur(4px)",
                    transition: bodyExitTransition,
                  }}
                  transition={bodyTransition}
                  className="pointer-events-auto flex w-full max-w-[min(36rem,calc(100vw-2.5rem))] flex-col items-center justify-center gap-3 text-center sm:gap-4"
                >
              <span
                className={
                  (isArabic ? "da-eyebrow-ar" : "da-eyebrow") +
                  " text-center text-[11px] sm:text-[12px]"
                }
              >
                {copy.introTutorialVolumeEyebrow}
              </span>
              <h2
                className={
                  (isArabic ? "da-display-title-ar" : "da-display-title") +
                  " w-full text-center " +
                  (isArabic
                    ? "text-[clamp(1.15rem,3.8vw,2rem)]"
                    : "text-[clamp(1.05rem,4vw,2rem)]")
                }
              >
                {copy.introTutorialVolumeTitle}
              </h2>
              <motion.div className="da-title-rule mx-auto !w-14 sm:!w-16" aria-hidden />
              <motion.div
                className={
                  "mx-auto mt-7 w-full max-w-[min(54rem,calc(100vw-1.25rem))] sm:mt-9 " +
                  (volumePct <= 0
                    ? "min-h-[2.75rem] sm:min-h-[3rem]"
                    : "min-h-[5.25rem] sm:min-h-[5.75rem]")
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  {volumePct <= 0 ? (
                    <motion.div
                      key="volume-body-scroll"
                      initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{
                        opacity: 0,
                        y: -8,
                        filter: "blur(5px)",
                        transition: textCrossfadeExit,
                      }}
                      transition={textCrossfadeEnter}
                      className="w-full"
                    >
                      <TutorialBodyCopy
                        text={copy.introTutorialVolumeBody}
                        isArabic={isArabic}
                        onePhrasePerLine
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="volume-body-saviez"
                      initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{
                        opacity: 0,
                        y: -8,
                        filter: "blur(5px)",
                        transition: textCrossfadeExit,
                      }}
                      transition={textCrossfadeEnter}
                      className="flex flex-col items-center gap-4 text-center"
                    >
                      <span
                        className={
                          (isArabic ? "da-eyebrow-ar" : "da-eyebrow") +
                          " text-[10px] sm:text-[11px]"
                        }
                      >
                        {copy.introTutorialVolumeSaviezEyebrow}
                      </span>
                      <TutorialBodyCopy
                        text={copy.introTutorialVolumeSaviezBody}
                        isArabic={isArabic}
                        onePhrasePerLine
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.button
                type="button"
                disabled={!canLaunchVideo}
                aria-disabled={!canLaunchVideo}
                onClick={canLaunchVideo ? onLaunchVideo : undefined}
                whileTap={canLaunchVideo ? { scale: 0.98 } : undefined}
                className={
                  (volumePct <= 0 ? "mt-5 sm:mt-6 " : "mt-9 sm:mt-11 ") +
                  "rounded-[2px] border px-7 py-3 text-[11px] uppercase tracking-[0.34em] transition-colors focus:outline-none sm:text-[12px] " +
                  (canLaunchVideo
                    ? "cursor-pointer border-solar-gold/45 bg-solar-gold/10 text-solar-gold hover:border-solar-gold/70 hover:bg-solar-gold/16 focus-visible:ring-2 focus-visible:ring-solar-gold/35"
                    : "cursor-not-allowed border-[#6a6458]/35 bg-[#1a1814]/40 text-[#6a6458]/72 grayscale")
                }
              >
                {copy.introTutorialVolumeLaunchCta}
              </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="tutorial-body-skip"
                  id="prologue-tutorial-title"
                  initial={{ opacity: 0, y: bodyEnterY, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    y: DA_TUTORIAL_STEP.exitY,
                    filter: "blur(4px)",
                    transition: bodyExitTransition,
                  }}
                  transition={bodyTransition}
                  className="pointer-events-auto flex w-full max-w-[min(54rem,calc(100vw-1.25rem))] flex-col items-center justify-center gap-6 text-center sm:gap-7"
                >
                  <span
                    className={
                      (isArabic ? "da-eyebrow-ar" : "da-eyebrow") +
                      " text-center text-[11px] sm:text-[12px]"
                    }
                  >
                    {copy.introTutorialSkipEyebrow}
                  </span>
                  <h2
                    className={
                      (isArabic ? "da-display-title-ar" : "da-display-title") +
                      " w-full text-center " +
                      (isArabic
                        ? "text-[clamp(1.15rem,3.8vw,2.1rem)]"
                        : "whitespace-nowrap text-[clamp(1.05rem,4.1vw,2.1rem)]")
                    }
                  >
                    {copy.introTutorialSkipTitle}
                  </h2>
                  <motion.div className="da-title-rule mx-auto !w-14 sm:!w-16" aria-hidden />
                  <TutorialBodyCopy
                    text={copy.introTutorialSkipBody}
                    isArabic={isArabic}
                    onePhrasePerLine
                  />
                  <div className="flex w-full flex-col items-center gap-0">
                    <motion.button
                      type="button"
                      disabled={!canAckSkip}
                      aria-disabled={!canAckSkip}
                      onClick={canAckSkip ? onSkipAck : undefined}
                      whileTap={canAckSkip ? { scale: 0.98 } : undefined}
                      title={canAckSkip ? undefined : copy.introTutorialSkipFullscreenHint}
                      className={
                        "rounded-[2px] border px-7 py-3 text-[11px] uppercase tracking-[0.34em] transition-colors focus:outline-none sm:text-[12px] " +
                        (canAckSkip
                          ? "cursor-pointer border-solar-gold/45 bg-solar-gold/10 text-solar-gold hover:border-solar-gold/70 hover:bg-solar-gold/16 focus-visible:ring-2 focus-visible:ring-solar-gold/35"
                          : "cursor-not-allowed border-[#6a6458]/35 bg-[#1a1814]/40 text-[#6a6458]/72 grayscale")
                      }
                    >
                      {copy.introTutorialSkipCta}
                    </motion.button>
                    <AnimatePresence
                      mode="wait"
                      initial={false}
                      onExitComplete={onFsInlineExitComplete}
                    >
                      {showFsInline ? (
                        <TutorialFullscreenButton
                          key="prologue-fs-inline"
                          placement="inline"
                          enterAriaLabel={copy.introTutorialFullscreenAria}
                          exitAriaLabel={copy.introTutorialFullscreenExitAria}
                          enterTitle={copy.introTutorialFullscreenCta}
                          exitTitle={copy.introTutorialFullscreenActive}
                          isArabic={isArabic}
                          onFullscreenTest={markFullscreenTested}
                          prefersReducedMotion={prefersReducedMotion}
                          nudgeEnabled
                          exitTransition={fsInlineExitTransition}
                        />
                      ) : null}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </LayoutGroup>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
