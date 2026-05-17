import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import React, { useState, useEffect, useRef, useId, lazy, Suspense, useLayoutEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
const PoetryGame = lazy(() => import("./PoetryGame"));
import AuroraMeshBackground from "./AuroraMeshBackground";
import {
  LANG_GATE_HOLD_AFTER_TIMELINE_S,
  LANG_GATE_TIMELINE_OVERLAP_S,
  transitionBridgeRevealFromTimeRatio,
  TRANSITION_BRIDGE_SMOKE_SFX,
  TRANSITION_BRIDGE_VIDEO_CROSSFADE_MS,
} from "../lib/transitionBridgeReveal";
import {
  applyVolumeKeyStep,
  getVolumeKeyDirection,
  shouldIgnoreVolumeKeyboardTarget,
} from "../lib/volumeKeyboard";
import { playSuspenseLoadCompleteChime, primeSuspenseAudio } from "../lib/suspenseLoadChime";
import { tapVideoElementForMeter } from "../lib/prologueVolumeAudioLevel";
import {
  applyPrologueVideoElementVolume,
  readPrologueVolume01,
  PROLOGUE_VIDEO_DEFAULT_VOLUME,
} from "../lib/prologueVideoElement";
import ProloguePlaybackMark, { GoldPlayIcon } from "./ProloguePlaybackMark";
import {
  disposePrologueTutorialVolumeProbe,
  primePrologueTutorialVolumeProbe,
  syncPrologueTutorialVolumeProbe,
} from "../lib/prologueTutorialVolumeProbe";
import PrologueTutorialOverlay, {
  type PrologueTutorialStep,
} from "./PrologueTutorialOverlay";
import PrologueVolumeFluid from "./PrologueVolumeFluid";
import PrologueVolumeHud from "./PrologueVolumeHud";
import DevChapterJumpsPanel, { type DevChapterJumps } from "./DevChapterJumpsPanel";
import { INTRO_VIDEO_SRC } from "../lib/act1IntroBridge";
import { useLanguageStore } from "../stores/languageStore";
import { useFullscreenPrefsStore } from "../stores/fullscreenPrefsStore";
import { useCursorPrefsStore, type CursorExperienceMode } from "../stores/cursorPrefsStore";
import { useCursorStore } from "../hooks/useCursorContext";
import { isFullscreenApiSupported } from "../lib/fullscreenDocument";
import { useMasterVolumeStore } from "../stores/masterVolumeStore";
import IntroFullscreenOverlay from "./IntroFullscreenOverlay";
import CursorOnboardingGate from "./CursorOnboardingGate";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useAppCopy } from "../hooks/useAppCopy";

// --- CONFIGURATION VIDÉO : même source que `act1IntroBridge` (Acte I aligné sur cette piste) ---
const ARABIC_TITLE_IMAGE_SRC = `${import.meta.env.BASE_URL}images/al-rihla-arabic-title.svg`;
/** Transition WebM avant le panneau de choix de langue (piste transparente possible). */
const LANGUAGE_GATE_TRANSITION_WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha.webm`;
/** Safari / iOS : WebM VP9 souvent indisponible - même clip en H.264 (générer via `npm run assets:lang-bridge-mp4`). */
const LANGUAGE_GATE_TRANSITION_MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha.mp4`;
/** `prefers-reduced-motion` : pas de fresque GSAP - délai avant le choix de langue. */
const ARRIVAL_LANGUAGE_PRELUDE_MS = 6500;
/** Sync avec le timeline GSAP du premier écran (`subtitleRevealRef` : start 2.45s, durée 1.75s). */
const INTRO_GSAP_SUBTITLE_END_S = 2.45 + 1.75;
/** Pause après le sous-titre avant le losange (dernier élément de la pile). */
const LANDING_DIAMOND_PAUSE_AFTER_SUBTITLE_S = 0.1;
const LANDING_DIAMOND_ENTRANCE_DELAY_S =
  INTRO_GSAP_SUBTITLE_END_S + LANDING_DIAMOND_PAUSE_AFTER_SUBTITLE_S;
/** Entrée lente « finale » (somme délai + durée ≈ fin du timeline GSAP avant le volet langue). */
const LANDING_DIAMOND_ENTRANCE_DURATION_S = 0.85;

const INTRO_CTA_WORDS_FR = ["Cliquer", "ou", "Entrée"] as const;
const INTRO_CTA_WORDS_AR = ["إضغط", "أو", "إنتر"] as const;

type AnimatedTitleProps = {
  text?: string;
  className?: string;
  heroMotion?: boolean;
  children?: React.ReactNode;
  viewportTracking?: boolean;
  /** false = texte statique (révélation gérée par GSAP parent, moins de travail main-thread). */
  staggerLetters?: boolean;
};

const AnimatedTitle = ({
  text,
  className,
  heroMotion = false,
  children,
  viewportTracking = false,
  staggerLetters = true,
}: AnimatedTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springSoft = { damping: 38, stiffness: 220 };
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], heroMotion ? [-10, 10] : [0, 0]), springSoft);
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], heroMotion ? [-8, 8] : [0, 0]), springSoft);

  useEffect(() => {
    if (!heroMotion || !viewportTracking) return;

    const syncFromViewport = (clientX: number, clientY: number) => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      mouseX.set(clientX / vw - 0.5);
      mouseY.set(clientY / vh - 0.5);

      const el = containerRef.current;
      if (el) {
        el.style.setProperty("--shine-x", `${(clientX / vw) * 100}%`);
        el.style.setProperty("--shine-y", `${(clientY / vh) * 100}%`);
      }
    };

    const resetViewportTracking = () => {
      mouseX.set(0);
      mouseY.set(0);
      const el = containerRef.current;
      if (el) {
        el.style.setProperty("--shine-x", "50%");
        el.style.setProperty("--shine-y", "50%");
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      syncFromViewport(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetViewportTracking);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetViewportTracking);
    };
  }, [heroMotion, mouseX, mouseY, viewportTracking]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroMotion || viewportTracking) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    const el = containerRef.current;
    if (el) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--shine-x", `${px}%`);
      el.style.setProperty("--shine-y", `${py}%`);
    }
  };

  const handleMouseLeave = () => {
    if (viewportTracking) return;
    mouseX.set(0);
    mouseY.set(0);
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--shine-x", "50%");
      el.style.setProperty("--shine-y", "50%");
    }
  };

  const characters = text?.split("") ?? [];
  const hasCustomContent = children != null;

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={heroMotion && !viewportTracking ? handleMouseMove : undefined}
      onMouseLeave={heroMotion && !viewportTracking ? handleMouseLeave : undefined}
      style={
        heroMotion
          ? ({
              x: parallaxX,
              y: parallaxY,
              "--shine-x": "50%",
              "--shine-y": "50%",
            } as React.CSSProperties)
          : undefined
      }
      className={`relative ${className ?? ""}`}
    >
      {heroMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[clamp(3rem,14vmin,10rem)] -z-10 opacity-40 blur-3xl transition-opacity md:-inset-[clamp(4rem,18vmin,14rem)] md:opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at var(--shine-x, 50%) var(--shine-y, 50%), rgba(197, 160, 89, 0.45), transparent 62%)",
          }}
        />
      )}
      <div className="relative inline-block">
        {hasCustomContent ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            {children}
          </motion.div>
        ) : staggerLetters ? (
          characters.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.85,
                delay: i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))
        ) : (
          <span>{text}</span>
        )}
      </div>
    </motion.div>
  );
};

function SuspenseOverlay({
  prefersReducedMotion,
  onComplete,
}: {
  prefersReducedMotion: boolean | null;
  onComplete: () => void;
}) {
  const copy = useAppCopy();
  const isArabic = useLanguageStore((s) => s.language === "ar-dz");
  const [phase, setPhase] = useState<"idle" | "building" | "climax">("idle");
  const loadProgress = useMotionValue(0);
  const [loadPct, setLoadPct] = useState(0);
  const loadWidth = useTransform(loadProgress, [0, 100], ["0%", "100%"]);
  const chimePlayedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const loadDelay = prefersReducedMotion ? 0.55 : 2.2;
    const ctrl = animate(loadProgress, 100, {
      delay: loadDelay,
      duration: prefersReducedMotion ? 0.45 : 3,
      ease: [0.4, 0, 0.2, 1],
      onComplete: () => onCompleteRef.current(),
    });
    return () => ctrl.stop();
  }, [loadProgress, prefersReducedMotion]);

  useMotionValueEvent(loadProgress, "change", (v) => {
    setLoadPct(Math.round(v));
    if (chimePlayedRef.current) return;
    if (v < 99.5) return;
    chimePlayedRef.current = true;
    playSuspenseLoadCompleteChime();
  });

  useEffect(() => {
    const buildingAt = prefersReducedMotion ? 2100 : 2200;
    const climaxAt = prefersReducedMotion ? 4600 : 4700;
    const t1 = setTimeout(() => setPhase("building"), buildingAt);
    const t2 = setTimeout(() => setPhase("climax"), climaxAt);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [prefersReducedMotion]);

  const isClimax = phase === "climax";
  const isBuilding = phase === "building" || isClimax;
  const revealEase = [0.22, 1, 0.36, 1] as const;
  const veilIn = prefersReducedMotion ? 0.4 : 1.55;
  const contentIn = prefersReducedMotion ? 0.35 : 1.15;

  return (
    <div className="pointer-events-none absolute inset-0 z-[26] flex flex-col items-center justify-center gap-0 px-6 text-center">

      {/* fond opaque - montée lente pour ne pas couper l’accueil d’un coup */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[#020100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: veilIn, ease: revealEase }}
      />

      {/* halo dor? - s'emballe au climax */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={
          isClimax
            ? { opacity: [0.35, 0.65, 0.35, 0.7, 0.35], scale: [1.2, 1.9, 1.3, 2.1, 1.4] }
            : isBuilding
            ? { opacity: [0.18, 0.28, 0.18], scale: [1.2, 1.5, 1.2] }
            : { opacity: [0, 0.28, 0.18], scale: [0.4, 1.6, 1.2] }
        }
        transition={
          isClimax
            ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
            : {
                duration: 3.2,
                delay: isBuilding ? 0 : prefersReducedMotion ? 0.25 : 1.05,
                ease: revealEase,
              }
        }
        style={{ width: 520, height: 520, background: "radial-gradient(circle, rgba(197,160,89,0.28) 0%, transparent 68%)", filter: isClimax ? "blur(28px)" : "blur(40px)" }}
      />

      {/* ?clats de particules au climax */}
      {isClimax && !prefersReducedMotion && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute rounded-full bg-solar-gold"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${30 + i * 8}%`,
                top: `${38 + (i % 2) * 24}%`,
                filter: "blur(0.5px)",
              }}
              animate={{
                y: [0, -18 - i * 6, 0],
                x: [0, (i % 2 === 0 ? 1 : -1) * (8 + i * 4), 0],
                opacity: [0, 0.9, 0],
                scale: [0.5, 1.4, 0.5],
              }}
              transition={{ duration: 0.45 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }}
            />
          ))}
        </>
      )}

      {/* vignette qui pulse au climax */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={
          isClimax
            ? { opacity: [0.0, 0.18, 0.0] }
            : { opacity: 0 }
        }
        transition={isClimax ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(197,160,89,0.12) 0%, transparent 70%), linear-gradient(to bottom, transparent 60%, rgba(197,100,20,0.08) 100%)" }}
      />

      {/* contenu centré - même DA que l’écran langue (sourcil, titre caps, filet) */}
      <motion.div
        dir={isArabic ? "rtl" : "ltr"}
        className="relative z-[2] flex flex-col items-center gap-6 px-4 text-center"
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{
          duration: contentIn,
          delay: prefersReducedMotion ? 0.2 : 0.95,
          ease: revealEase,
        }}
      >
        <motion.span
          className={isArabic ? "da-eyebrow-ar" : "da-eyebrow"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.35 : 1.05,
            delay: prefersReducedMotion ? 0.28 : 1.15,
            ease: revealEase,
          }}
        >
          {copy.introSuspenseEyebrow}
        </motion.span>

        <motion.span
          className={
            (isArabic
              ? "da-display-title-ar max-w-[min(92vw,22ch)]"
              : "da-display-title max-w-[96vw] whitespace-nowrap text-[clamp(0.82rem,2.85vw,3rem)]") +
            (isClimax ? " text-[#fff4dc]" : "")
          }
          initial={{ opacity: 0, y: 12 }}
          animate={
            isClimax && !prefersReducedMotion
              ? { opacity: 1, y: [0, -1, 0.6, 0], scale: [1, 1.008, 1] }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={
            isClimax
              ? {
                  y: { duration: 0.38, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 0.38, repeat: Infinity },
                  opacity: { duration: 0 },
                }
              : {
                  duration: prefersReducedMotion ? 0.4 : 1.2,
                  delay: prefersReducedMotion ? 0.38 : 1.42,
                  ease: revealEase,
                }
          }
        >
          {copy.introSuspenseTitle}
        </motion.span>

        <motion.div
          className="da-title-rule"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0.35 : 0.95,
            delay: prefersReducedMotion ? 0.48 : 1.78,
            ease: revealEase,
          }}
          aria-hidden
        />

        <motion.div
          className="relative flex w-full max-w-[17.5rem] flex-col items-center gap-2 md:max-w-[20rem]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.35 : 0.85,
            delay: prefersReducedMotion ? 0.55 : 2.35,
            ease: revealEase,
          }}
        >
          <motion.div
            className="relative h-px w-full overflow-hidden bg-solar-gold/18"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loadPct}
            aria-label={copy.introSuspenseProgressAria}
          >
            <motion.div
              className="absolute inset-y-0 left-0 h-full bg-solar-gold/52"
              style={{ width: loadWidth }}
            />
          </motion.div>
          <span className="da-eyebrow tabular-nums text-solar-gold/48" aria-hidden>
            {loadPct}%
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

interface IntroProps {
  onComplete: () => void;
  isExploring?: boolean;
  onVideoStart?: () => void;
  /** Volet langue / curseur : garde le curseur custom visible (App `CustomCursor`). */
  onIntroGateOpenChange?: (open: boolean) => void;
  /** Raccourcis vers les chapitres - affichés uniquement si défini (ex. mode dev dans App). */
  devChapterJumps?: DevChapterJumps;
}

export default function Intro({
  onComplete,
  isExploring,
  onVideoStart,
  onIntroGateOpenChange,
  devChapterJumps,
}: IntroProps) {
  const language = useLanguageStore((s) => s.language);
  const confirmLanguage = useLanguageStore((s) => s.confirmLanguage);
  const offerFullscreenOnArrival = useFullscreenPrefsStore((s) => s.offerFullscreenOnArrival);
  const isArabic = language === "ar-dz";
  const copy = useAppCopy();
  const introCtaWords = isArabic ? INTRO_CTA_WORDS_AR : INTRO_CTA_WORDS_FR;
  const ui = isArabic
    ? {
        shortcuts: "اختصارات",
        prologueDirect: "مقدمة",
        secretFragment: "قطعة من سيناك",
        openGame: "فتح اللعبة",
        secretHint: "هناك سر هنا...",
        skipIntro: "تخطي المقدمة",
        languageTitle: "✦ اللغة ✦",
        languageSubtitle: "اختر لغة العرض قبل بدء الرحلة",
        french: copy.languageFrenchBtn,
        arabicDz: copy.languageArabicBtn,
      }
    : {
        shortcuts: "Raccourcis",
        prologueDirect: "Prologue",
        secretFragment: "Fragment de Senac",
        openGame: "Ouvrir le jeu",
        secretHint: "Un secret est cache ici...",
        skipIntro: "Passer l'introduction",
        languageTitle: "✦ LANGUE ✦",
        languageSubtitle: "Choisissez la langue de l'experience avant de commencer",
        french: copy.languageFrenchBtn,
        arabicDz: copy.languageArabicBtn,
      };

  const prefersReducedMotion = useReducedMotion();
  const compactDesktop = useMediaQuery("(min-width: 1600px) and (max-height: 1100px)");
  const finePointer = useMediaQuery("(any-pointer: fine)");
  const [videoStarted, setVideoStarted] = useState(false);
  const [showInitialTitle, setShowInitialTitle] = useState(true);
  const [volume, setVolume] = useState(PROLOGUE_VIDEO_DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  /** Prologue vidéo : indicateur 0-100 affiché à la molette, puis masqué. */
  const [prologueVolumeHudVisible, setPrologueVolumeHudVisible] = useState(false);
  const [prologueVideoPaused, setPrologueVideoPaused] = useState(false);
  const [prologuePlayMarkVisible, setProloguePlayMarkVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  /** true après l’overlay « Prologue » : le 2e clic ouvre le tutoriel puis la vidéo. */
  const [introPrefetchDone, setIntroPrefetchDone] = useState(Boolean(isExploring));
  const [prologueTutorialStep, setPrologueTutorialStep] = useState<PrologueTutorialStep | null>(null);
  /** Évite double validation « Lancer la vidéo ». */
  const prologueTutorialVolumeDoneRef = useRef(false);
  /** Volume validé à la fin du test sonore - conservé jusqu’au lancement vidéo. */
  const prologueChosenVolumeRef = useRef<number | null>(null);
  const introSuspenseFinishedRef = useRef(false);
  const [introHandoffBlackout, setIntroHandoffBlackout] = useState(false);
  const [isPoetryGameOpen, setIsPoetryGameOpen] = useState(false);
  const [isEasterEggFound, setIsEasterEggFound] = useState(false);
  const [easterEggPromptHidden, setEasterEggPromptHidden] = useState(false);
  const [easterEggPos, setEasterEggPos] = useState({ top: "20%", left: "80%" });
  const [arrivalLanguageConfirmed, setArrivalLanguageConfirmed] = useState(Boolean(isExploring));
  const [arrivalLanguageGateVisible, setArrivalLanguageGateVisible] = useState(Boolean(isExploring));
  /** Lecture de `trans2-alpha.webm` avant de montrer les boutons FR / AR */
  const [arrivalLanguageBridgeVideoActive, setArrivalLanguageBridgeVideoActive] = useState(false);
  /** Fondu sortie vidéo bridge pendant que le choix langue apparaît */
  const [arrivalLanguageBridgeCrossfading, setArrivalLanguageBridgeCrossfading] = useState(false);
  /** 0 → 1 : opacité panneau langue pendant la WebM (timeupdate). */
  const [languageBridgeReveal01, setLanguageBridgeReveal01] = useState(0);
  const [launchCtaVisible, setLaunchCtaVisible] = useState(Boolean(isExploring));
  const [launchCtaRevealToken, setLaunchCtaRevealToken] = useState(0);
  const [fullscreenIntroOpen, setFullscreenIntroOpen] = useState(false);
  const [cursorOnboardingOpen, setCursorOnboardingOpen] = useState(false);
  /** Coupure synchrone au clic langue - disparition immédiate du losange (voir `showLandingDiamond`). */
  const [landingOrnamentAllowed, setLandingOrnamentAllowed] = useState(true);
  const initialStageRef = useRef<HTMLDivElement>(null);
  const backgroundRevealRef = useRef<HTMLDivElement>(null);
  const sunRevealRef = useRef<HTMLDivElement>(null);
  const hazeRevealRef = useRef<HTMLDivElement>(null);
  const duneFrontRevealRef = useRef<HTMLDivElement>(null);
  const titleRevealRef = useRef<HTMLDivElement>(null);
  const subtitleRevealRef = useRef<HTMLDivElement>(null);
  const launchCtaWrapRef = useRef<HTMLDivElement>(null);
  const launchOrbRef = useRef<HTMLDivElement>(null);
  const launchPromptRef = useRef<HTMLParagraphElement>(null);
  const launchAuraRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeScrollRef = useRef(volume);
  const prologueVolumeAuraHideRef = useRef<number | null>(null);
  const prologuePlayMarkHideRef = useRef<number | null>(null);
  const prologueWasPausedRef = useRef(false);
  const mutedScrollRef = useRef(isMuted);
  const arrivalLangBridgeVideoRef = useRef<HTMLVideoElement>(null);
  const languageGateSmokeSfxRef = useRef<import("howler").Howl | null>(null);
  const bridgeCrossfadeTimeoutRef = useRef<number | null>(null);
  /** Safari : refus WebM ou échec décode → recharger uniquement le MP4. */
  const [languageGateBridgeForceMp4, setLanguageGateBridgeForceMp4] = useState(false);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  if (prologueTutorialStep !== "volume") {
    volumeScrollRef.current = volume;
    mutedScrollRef.current = isMuted;
  }

  const commitPrologueVolume = useCallback((volume01: number) => {
    const v = Math.min(1, Math.max(0, volume01));
    const silent = v <= 0;
    prologueChosenVolumeRef.current = v;
    volumeScrollRef.current = v;
    mutedScrollRef.current = silent;
    volumeRef.current = v;
    isMutedRef.current = silent;
    setVolume(v);
    setIsMuted(silent);
    if (v > 0) {
      useMasterVolumeStore.getState().setVolume(v);
      useMasterVolumeStore.getState().unlockPlayback();
    }
  }, []);

  const pulsePrologueVolumeHud = useCallback(() => {
    setPrologueVolumeHudVisible(true);
    if (prologueVolumeAuraHideRef.current != null) {
      window.clearTimeout(prologueVolumeAuraHideRef.current);
    }
    prologueVolumeAuraHideRef.current = window.setTimeout(() => {
      setPrologueVolumeHudVisible(false);
      prologueVolumeAuraHideRef.current = null;
    }, 1500);
  }, []);

  const shouldOfferFullscreenNow =
    offerFullscreenOnArrival &&
    typeof window !== "undefined" &&
    isFullscreenApiSupported();
  const showArrivalLanguageOverlay = !arrivalLanguageConfirmed && arrivalLanguageGateVisible;

  const stopLanguageGateSmokeSfx = useCallback(() => {
    const h = languageGateSmokeSfxRef.current;
    if (!h) return;
    try {
      h.stop();
      h.unload();
    } catch {
      /* ignore */
    }
    languageGateSmokeSfxRef.current = null;
  }, []);

  const openArrivalLanguageGate = useCallback(() => {
    setArrivalLanguageGateVisible(true);
    setArrivalLanguageBridgeCrossfading(false);
    setLanguageGateBridgeForceMp4(false);
    if (prefersReducedMotion) {
      setLanguageBridgeReveal01(1);
      setArrivalLanguageBridgeVideoActive(false);
      return;
    }
    setLanguageBridgeReveal01(0);
    setArrivalLanguageBridgeVideoActive(true);
  }, [prefersReducedMotion]);

  const openFirstIntroGate = useCallback(() => {
    openArrivalLanguageGate();
  }, [openArrivalLanguageGate]);

  const finishBridgeVideoPlayback = useCallback(() => {
    stopLanguageGateSmokeSfx();
    setLanguageBridgeReveal01(1);
    setArrivalLanguageBridgeCrossfading(false);
    if (bridgeCrossfadeTimeoutRef.current != null) {
      window.clearTimeout(bridgeCrossfadeTimeoutRef.current);
      bridgeCrossfadeTimeoutRef.current = null;
    }
    setArrivalLanguageBridgeVideoActive(false);
  }, [stopLanguageGateSmokeSfx]);

  const onLanguageGateBridgeVideoError = useCallback(() => {
    if (!languageGateBridgeForceMp4) {
      setLanguageGateBridgeForceMp4(true);
      return;
    }
    finishBridgeVideoPlayback();
  }, [languageGateBridgeForceMp4, finishBridgeVideoPlayback]);

  const endArrivalLanguageBridgeVideo = useCallback(() => {
    arrivalLangBridgeVideoRef.current?.pause();
    stopLanguageGateSmokeSfx();
    setLanguageBridgeReveal01(1);
    if (prefersReducedMotion) {
      setArrivalLanguageBridgeVideoActive(false);
      setArrivalLanguageBridgeCrossfading(false);
      return;
    }
    if (arrivalLanguageBridgeCrossfading) {
      if (bridgeCrossfadeTimeoutRef.current != null) {
        window.clearTimeout(bridgeCrossfadeTimeoutRef.current);
        bridgeCrossfadeTimeoutRef.current = null;
      }
      setArrivalLanguageBridgeVideoActive(false);
      setArrivalLanguageBridgeCrossfading(false);
      return;
    }
    if (arrivalLanguageBridgeVideoActive) {
      setArrivalLanguageBridgeCrossfading(true);
    }
  }, [
    prefersReducedMotion,
    arrivalLanguageBridgeCrossfading,
    arrivalLanguageBridgeVideoActive,
    stopLanguageGateSmokeSfx,
  ]);

  useEffect(() => {
    if (!arrivalLanguageBridgeCrossfading) return;
    if (bridgeCrossfadeTimeoutRef.current != null) {
      window.clearTimeout(bridgeCrossfadeTimeoutRef.current);
    }
    bridgeCrossfadeTimeoutRef.current = window.setTimeout(() => {
      setArrivalLanguageBridgeVideoActive(false);
      setArrivalLanguageBridgeCrossfading(false);
      bridgeCrossfadeTimeoutRef.current = null;
    }, TRANSITION_BRIDGE_VIDEO_CROSSFADE_MS);
    return () => {
      if (bridgeCrossfadeTimeoutRef.current != null) {
        window.clearTimeout(bridgeCrossfadeTimeoutRef.current);
        bridgeCrossfadeTimeoutRef.current = null;
      }
    };
  }, [arrivalLanguageBridgeCrossfading]);

  useEffect(() => {
    if (!showArrivalLanguageOverlay) {
      setArrivalLanguageBridgeVideoActive(false);
      setArrivalLanguageBridgeCrossfading(false);
      setLanguageBridgeReveal01(0);
      setLanguageGateBridgeForceMp4(false);
    }
  }, [showArrivalLanguageOverlay]);

  useEffect(() => {
    if (!arrivalLanguageBridgeVideoActive) return;
    const v = arrivalLangBridgeVideoRef.current;
    if (!v) return;
    setLanguageBridgeReveal01(0);
    const tick = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const ratio = Math.min(1, Math.max(0, v.currentTime / d));
      setLanguageBridgeReveal01(transitionBridgeRevealFromTimeRatio(ratio));
    };
    v.addEventListener("timeupdate", tick);
    v.addEventListener("loadedmetadata", tick);
    /* Chrome : autoplay sans geste utilisateur - lecture refusée si volume > 0 */
    v.muted = true;
    v.volume = 0;
    v.currentTime = 0;
    void v
      .play()
      .then(() => {
        if (prefersReducedMotion || isMutedRef.current) return;
        stopLanguageGateSmokeSfx();
        void import("howler").then(({ Howl }) => {
          if (!arrivalLangBridgeVideoRef.current) return;
          const h = new Howl({
            src: [TRANSITION_BRIDGE_SMOKE_SFX],
            html5: true,
            volume: Math.min(0.52, Math.max(0.1, volumeRef.current * 4)),
          });
          languageGateSmokeSfxRef.current = h;
          h.play();
        });
      })
      .catch(() => {
        setArrivalLanguageBridgeVideoActive(false);
      });
    return () => {
      v.removeEventListener("timeupdate", tick);
      v.removeEventListener("loadedmetadata", tick);
      stopLanguageGateSmokeSfx();
    };
  }, [
    arrivalLanguageBridgeVideoActive,
    languageGateBridgeForceMp4,
    prefersReducedMotion,
    stopLanguageGateSmokeSfx,
  ]);

  useEffect(() => {
    if (!arrivalLanguageBridgeVideoActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Enter") return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
      e.preventDefault();
      endArrivalLanguageBridgeVideo();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [arrivalLanguageBridgeVideoActive, endArrivalLanguageBridgeVideo]);
  /** Masquer le losange décoratif seulement pendant la WebM pont (pas pendant le choix FR/AR). */
  const hideLandingDiamondForLangBridge =
    showArrivalLanguageOverlay &&
    arrivalLanguageBridgeVideoActive &&
    !arrivalLanguageBridgeCrossfading &&
    languageBridgeReveal01 < 0.72;

  const introSuspenseActive = isStarting && !videoStarted;
  const prologueTutorialActive = prologueTutorialStep !== null;
  const introCoverActive =
    introSuspenseActive ||
    prologueTutorialActive ||
    introHandoffBlackout ||
    cursorOnboardingOpen;

  const showLandingDiamond =
    landingOrnamentAllowed &&
    showInitialTitle &&
    !videoStarted &&
    !isStarting &&
    !isExploring &&
    !arrivalLanguageConfirmed &&
    !fullscreenIntroOpen &&
    !launchCtaVisible &&
    !cursorOnboardingOpen &&
    !hideLandingDiamondForLangBridge;

  useEffect(() => {
    onIntroGateOpenChange?.(showArrivalLanguageOverlay || cursorOnboardingOpen);
  }, [showArrivalLanguageOverlay, cursorOnboardingOpen, onIntroGateOpenChange]);

  const triggerLaunchCtaReveal = useCallback(() => {
    setLaunchCtaVisible(true);
    setLaunchCtaRevealToken((token) => token + 1);
  }, []);

  const proceedAfterIntroGates = useCallback(() => {
    if (shouldOfferFullscreenNow) {
      setLaunchCtaVisible(false);
      setFullscreenIntroOpen(true);
      return;
    }
    triggerLaunchCtaReveal();
  }, [shouldOfferFullscreenNow, triggerLaunchCtaReveal]);

  const confirmCursorOnboarding = useCallback(
    (experience: CursorExperienceMode) => {
      useCursorPrefsStore.getState().setExperience(experience);
      if (experience === "fluid") {
        useCursorStore.getState().setMode("default");
      } else {
        useCursorStore.getState().setMode("stylus");
      }
      setCursorOnboardingOpen(false);
      proceedAfterIntroGates();
    },
    [proceedAfterIntroGates]
  );

  const handleArrivalLanguageChoice = (nextLanguage: "fr" | "ar-dz") => {
    setLandingOrnamentAllowed(false);
    confirmLanguage(nextLanguage);
    flushSync(() => {
      setArrivalLanguageConfirmed(true);
      const needsCursorOnboarding = finePointer;
      if (needsCursorOnboarding) {
        setLaunchCtaVisible(false);
        setCursorOnboardingOpen(true);
        return;
      }
      proceedAfterIntroGates();
    });
  };

  const handleIntroFullscreenClose = useCallback(() => {
    flushSync(() => {
      setFullscreenIntroOpen(false);
      triggerLaunchCtaReveal();
    });
  }, [triggerLaunchCtaReveal]);

  useEffect(() => {
    if (isExploring) {
      setArrivalLanguageConfirmed(true);
      setArrivalLanguageGateVisible(true);
      setLaunchCtaVisible(true);
    }
  }, [isExploring]);

  useLayoutEffect(() => {
    if (
      arrivalLanguageConfirmed ||
      arrivalLanguageGateVisible ||
      isExploring ||
      videoStarted ||
      isStarting ||
      !showInitialTitle
    ) {
      return;
    }
    if (prefersReducedMotion) {
      const timer = window.setTimeout(() => {
        openFirstIntroGate();
      }, ARRIVAL_LANGUAGE_PRELUDE_MS);
      return () => window.clearTimeout(timer);
    }
    const ctx = gsap.context(() => {
      gsap.set(backgroundRevealRef.current, {
        opacity: 0.42,
        scale: 1.12,
        filter: "brightness(0.68) saturate(0.82)",
      });
      gsap.set([sunRevealRef.current, duneFrontRevealRef.current], {
        opacity: 0,
      });
      gsap.set(titleRevealRef.current, {
        opacity: 0,
        y: 56,
      });
      gsap.set(subtitleRevealRef.current, {
        opacity: 0,
        y: 28,
      });
      gsap.set(hazeRevealRef.current, { opacity: 0 });

      const holdTotal = LANG_GATE_HOLD_AFTER_TIMELINE_S;
      const gateOverlap = Math.min(LANG_GATE_TIMELINE_OVERLAP_S, holdTotal * 0.5);
      const holdBeforeGate = Math.max(0, holdTotal - gateOverlap);

      gsap
        .timeline({
          defaults: { overwrite: true },
        })
        .to(
          backgroundRevealRef.current,
          {
            opacity: 1,
            scale: 1,
            filter: "brightness(1) saturate(1)",
            duration: 3.9,
            ease: "power2.out",
          },
          0
        )
        .fromTo(
          sunRevealRef.current,
          { opacity: 0, yPercent: 18, scale: 0.78 },
          { opacity: 0.95, yPercent: 0, scale: 1, duration: 3.6, ease: "sine.out" },
          0.08
        )
        .fromTo(
          duneFrontRevealRef.current,
          { opacity: 0, yPercent: 38, scaleX: 1.14 },
          { opacity: 0.98, yPercent: 0, scaleX: 1, duration: 3.35, ease: "power3.out" },
          0.82
        )
        .to(
          hazeRevealRef.current,
          {
            opacity: 1,
            duration: 2.2,
            ease: "sine.out",
          },
          0.65
        )
        .to(
          titleRevealRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 2.35,
            ease: "power4.out",
          },
          1.34
        )
        .to(
          subtitleRevealRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.75,
            ease: "power3.out",
          },
          2.45
        )
        .to({}, { duration: 0.95 })
        .to({}, { duration: holdBeforeGate })
        .call(() => {
          openFirstIntroGate();
        })
        .to({}, { duration: gateOverlap });
    }, initialStageRef);

    /* `arrivalLanguageGateVisible` omis des deps : sinon à l’ouverture du volet langue le cleanup
     * revert le timeline terminé - effets visuels indésirables sur la pile titre / losange. */
    return () => ctx.revert();
  }, [
    arrivalLanguageConfirmed,
    isExploring,
    openFirstIntroGate,
    prefersReducedMotion,
    videoStarted,
    isStarting,
    showInitialTitle,
  ]);

  /** Plein écran : proposé sur l’écran Immersion ; overlay classique fermé pendant le tuto. */
  useEffect(() => {
    if (videoStarted || isStarting || prologueTutorialActive) {
      setFullscreenIntroOpen(false);
      return undefined;
    }
    if (!arrivalLanguageConfirmed || !shouldOfferFullscreenNow) {
      setFullscreenIntroOpen(false);
      return undefined;
    }
    return undefined;
  }, [
    arrivalLanguageConfirmed,
    videoStarted,
    isStarting,
    prologueTutorialActive,
    shouldOfferFullscreenNow,
  ]);

  useEffect(() => {
    if (!videoStarted) return;
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreVolumeKeyboardTarget(e.target)) return;
      const dir = getVolumeKeyDirection(e);
      if (!dir) return;
      e.preventDefault();
      const { volume: v, muted: m } = applyVolumeKeyStep(
        dir,
        volumeRef.current,
        isMutedRef.current
      );
      setVolume(v);
      setIsMuted(m);
      pulsePrologueVolumeHud();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [videoStarted, pulsePrologueVolumeHud]);

  useEffect(() => {
    if (videoStarted && isEasterEggFound) {
      setEasterEggPromptHidden(true);
    }
  }, [videoStarted, isEasterEggFound]);

  useEffect(() => {
    const corners: [number, number][] = [
      [0.09, 0.13],
      [0.13, 0.78],
      [0.2, 0.48],
      [0.3, 0.2],
    ];
    const [lx, ty] = corners[Math.floor(Math.random() * corners.length)]!;
    const jitter = () => (Math.random() - 0.5) * 0.05;
    setEasterEggPos({
      top: `${Math.round((ty + jitter()) * 100)}%`,
      left: `${Math.round((lx + jitter()) * 100)}%`,
    });
  }, []);

  useEffect(() => {
    if (!isEasterEggFound) return;
    void import("./PoetryGame");
  }, [isEasterEggFound]);

  useEffect(() => {
    if (videoStarted && !showSkip) {
      const showTimer = setTimeout(() => setShowSkip(true), 4000);
      const hideTimer = setTimeout(() => setShowSkip(false), 12000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShowSkip(false);
    }
  }, [videoStarted]);

  const startPrologueVideo = useCallback(() => {
    if (videoStarted) return;
    disposePrologueTutorialVolumeProbe();
    const chosen =
      prologueChosenVolumeRef.current ??
      readPrologueVolume01(volumeRef, isMutedRef);
    prologueChosenVolumeRef.current = null;
    if (chosen > 0) commitPrologueVolume(chosen);
    setVideoStarted(true);
    onVideoStart?.();
    window.setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      const vol = readPrologueVolume01(volumeRef, isMutedRef);
      applyPrologueVideoElementVolume(el, vol);
      void el.play().catch((err) => {
        console.log("Play failed:", err);
      });
    }, 100);
    setShowInitialTitle(false);
  }, [videoStarted, onVideoStart, commitPrologueVolume]);

  const startPrologueDirect = useCallback(() => {
    if (videoStarted) return;
    disposePrologueTutorialVolumeProbe();
    if (!arrivalLanguageConfirmed) {
      confirmLanguage(language);
      setArrivalLanguageConfirmed(true);
    }
    introSuspenseFinishedRef.current = true;
    setIntroPrefetchDone(true);
    setIsStarting(false);
    setPrologueTutorialStep(null);
    startPrologueVideo();
  }, [
    videoStarted,
    arrivalLanguageConfirmed,
    confirmLanguage,
    language,
    startPrologueVideo,
  ]);

  const openPrologueTutorial = useCallback(() => {
    prologueTutorialVolumeDoneRef.current = false;
    prologueChosenVolumeRef.current = null;
    volumeScrollRef.current = 0;
    mutedScrollRef.current = true;
    setVolume(0);
    setIsMuted(true);
    setPrologueTutorialStep("skip");
  }, []);

  const reviewPrologueTutorialSkip = useCallback(() => {
    setPrologueTutorialStep("skip");
  }, []);

  const acknowledgePrologueTutorialSkip = useCallback(() => {
    prologueTutorialVolumeDoneRef.current = false;
    setPrologueTutorialStep("volume");
  }, []);

  const handleTutorialStepRevealed = useCallback(() => {
    setIntroHandoffBlackout(false);
  }, []);

  const finishIntroSuspense = useCallback(() => {
    if (introSuspenseFinishedRef.current) return;
    introSuspenseFinishedRef.current = true;
    setIntroPrefetchDone(true);
    if (!videoStarted) {
      if (isExploring) {
        startPrologueVideo();
        setIsStarting(false);
        return;
      }
      setIntroHandoffBlackout(true);
      setIsStarting(false);
      openPrologueTutorial();
      return;
    }
    setIsStarting(false);
  }, [isExploring, videoStarted, startPrologueVideo, openPrologueTutorial]);

  useEffect(() => {
    if (!isStarting || introSuspenseFinishedRef.current) return;
    const fallbackMs = (prefersReducedMotion ? 2550 : 5100) + 400;
    const t = window.setTimeout(finishIntroSuspense, fallbackMs);
    return () => window.clearTimeout(t);
  }, [isStarting, prefersReducedMotion, finishIntroSuspense]);

  const startExperience = () => {
    if (!arrivalLanguageConfirmed) {
      openFirstIntroGate();
      return;
    }
    if (isStarting || videoStarted || prologueTutorialActive) return;

    if (!introPrefetchDone) {
      primeSuspenseAudio();
      introSuspenseFinishedRef.current = false;
      setIntroHandoffBlackout(false);
      setIsStarting(true);
      return;
    }

    if (isExploring) {
      startPrologueVideo();
      return;
    }

    introSuspenseFinishedRef.current = false;
    setIntroHandoffBlackout(false);
    setIsStarting(true);
  };

  useEffect(() => {
    if (videoStarted || isStarting || !showInitialTitle || isPoetryGameOpen || prologueTutorialActive) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
      e.preventDefault();
      startExperience();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps ?? déclenchement aligné sur l’écran titre initial uniquement
  }, [videoStarted, isStarting, showInitialTitle, isPoetryGameOpen, prologueTutorialActive]);

  const completePrologueVolumeTutorial = useCallback(() => {
    if (prologueTutorialVolumeDoneRef.current) return false;
    const vol = readPrologueVolume01(volumeRef, isMutedRef);
    if (vol <= 0) return false;

    prologueTutorialVolumeDoneRef.current = true;
    commitPrologueVolume(vol);
    disposePrologueTutorialVolumeProbe();
    setPrologueTutorialStep(null);
    setIntroHandoffBlackout(false);
    setIsStarting(false);
    introSuspenseFinishedRef.current = true;
    setIntroPrefetchDone(true);
    startPrologueVideo();
    return true;
  }, [commitPrologueVolume, startPrologueVideo]);

  useEffect(() => {
    if (prologueTutorialStep === "skip") {
      prologueTutorialVolumeDoneRef.current = false;
    }
  }, [prologueTutorialStep]);

  useEffect(() => {
    if (prologueTutorialStep !== "volume") {
      setPrologueVolumeHudVisible(false);
      return;
    }
    volumeScrollRef.current = 0;
    mutedScrollRef.current = true;
    setVolume(0);
    setIsMuted(true);
    setPrologueVolumeHudVisible(false);
    const onWheel = (e: WheelEvent) => {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      e.preventDefault();
      const currentPct = Math.round(
        (mutedScrollRef.current ? 0 : volumeScrollRef.current) * 100
      );
      const dy = e.deltaY;
      const deltaPct =
        -Math.sign(dy) * Math.max(1, Math.min(2, Math.round(Math.abs(dy) / 48)));
      const nextPct = Math.min(100, Math.max(0, currentPct + deltaPct));
      const next = nextPct / 100;
      volumeScrollRef.current = next;
      mutedScrollRef.current = next === 0;
      setVolume(next);
      setIsMuted(next === 0);
      pulsePrologueVolumeHud();
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = getVolumeKeyDirection(e);
      if (dir) {
        if (shouldIgnoreVolumeKeyboardTarget(e.target)) return;
        e.preventDefault();
        const { volume: v, muted: m } = applyVolumeKeyStep(
          dir,
          mutedScrollRef.current ? 0 : volumeScrollRef.current,
          mutedScrollRef.current
        );
        volumeScrollRef.current = v;
        mutedScrollRef.current = m;
        setVolume(v);
        setIsMuted(m);
        pulsePrologueVolumeHud();
        return;
      }
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
      completePrologueVolumeTutorial();
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("keydown", onKey, true);
    };
  }, [prologueTutorialStep, completePrologueVolumeTutorial, pulsePrologueVolumeHud]);

  useEffect(() => {
    if (prologueTutorialStep !== "volume") {
      disposePrologueTutorialVolumeProbe();
      return;
    }
    primePrologueTutorialVolumeProbe();
    return () => disposePrologueTutorialVolumeProbe();
  }, [prologueTutorialStep]);

  useEffect(() => {
    if (prologueTutorialStep !== "volume") return;
    syncPrologueTutorialVolumeProbe(volume, isMuted);
  }, [prologueTutorialStep, volume, isMuted]);

  /** Précharge la vidéo prologue pendant l’overlay « Le voyage va commencer ». */
  useEffect(() => {
    if (!isStarting || introPrefetchDone || videoStarted) return;
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = INTRO_VIDEO_SRC;
    v.load();
    return () => {
      v.removeAttribute("src");
      v.load();
    };
  }, [isStarting, introPrefetchDone, videoStarted]);

  const hideProloguePlayMark = useCallback(() => {
    if (prologuePlayMarkHideRef.current != null) {
      window.clearTimeout(prologuePlayMarkHideRef.current);
      prologuePlayMarkHideRef.current = null;
    }
    setProloguePlayMarkVisible(false);
  }, []);

  const showProloguePlayMark = useCallback(() => {
    hideProloguePlayMark();
    setProloguePlayMarkVisible(true);
    prologuePlayMarkHideRef.current = window.setTimeout(() => {
      setProloguePlayMarkVisible(false);
      prologuePlayMarkHideRef.current = null;
    }, 900);
  }, [hideProloguePlayMark]);

  const toggleProloguePlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onComplete();
  }, [onComplete]);

  // Trailer : Espace = lecture/pause, Entrée = passer
  useEffect(() => {
    if (!videoStarted || isPoetryGameOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggleProloguePlayback();
        return;
      }
      if (e.key !== "Enter" || e.repeat) return;
      e.preventDefault();
      handleSkip();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [videoStarted, isPoetryGameOpen, toggleProloguePlayback, handleSkip]);

  useEffect(() => {
    if (!videoRef.current || !videoStarted) return;
    applyPrologueVideoElementVolume(
      videoRef.current,
      readPrologueVolume01(volumeRef, isMutedRef)
    );
  }, [volume, isMuted, videoStarted]);

  useEffect(() => {
    if (!videoStarted) return;
    const v = videoRef.current;
    if (!v) return;
    tapVideoElementForMeter(v);
  }, [videoStarted]);

  useEffect(() => {
    if (videoStarted) return;
    setPrologueVideoPaused(false);
    prologueWasPausedRef.current = false;
    hideProloguePlayMark();
  }, [videoStarted, hideProloguePlayMark]);

  useEffect(() => {
    if (!videoStarted) {
      setPrologueVolumeHudVisible(false);
      return;
    }
    const onWheel = (e: WheelEvent) => {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      e.preventDefault();
      const currentPct = Math.round(
        (mutedScrollRef.current ? 0 : volumeScrollRef.current) * 100
      );
      const dy = e.deltaY;
      /** Pas entiers 0-100 : ~1 % par cran de molette, max 2 % par événement. */
      const deltaPct =
        -Math.sign(dy) * Math.max(1, Math.min(2, Math.round(Math.abs(dy) / 48)));
      const nextPct = Math.min(100, Math.max(0, currentPct + deltaPct));
      const next = nextPct / 100;
      volumeScrollRef.current = next;
      mutedScrollRef.current = next === 0;
      setVolume(next);
      setIsMuted(next === 0);
      pulsePrologueVolumeHud();
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      if (prologueVolumeAuraHideRef.current != null) {
        window.clearTimeout(prologueVolumeAuraHideRef.current);
        prologueVolumeAuraHideRef.current = null;
      }
    };
  }, [videoStarted, pulsePrologueVolumeHud]);

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    onComplete();
  };

  return (
    <>
      <Suspense fallback={null}>
        <PoetryGame
          isOpen={isPoetryGameOpen}
          onClose={() => {
            setIsPoetryGameOpen(false);
            setEasterEggPromptHidden(true);
          }}
        />
      </Suspense>

      {devChapterJumps ? (
        <DevChapterJumpsPanel jumps={devChapterJumps} shortcutsLabel={ui.shortcuts}>
          <motion.div className="mb-1.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={startPrologueDirect}
              disabled={videoStarted}
              className="rounded-sm border border-solar-gold/45 bg-solar-gold/12 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold transition-colors hover:border-solar-gold/60 hover:bg-solar-gold/20 disabled:pointer-events-none disabled:opacity-40"
            >
              {ui.prologueDirect}
            </button>
          </motion.div>
        </DevChapterJumpsPanel>
      ) : null}

      {!videoStarted && arrivalLanguageConfirmed && !cursorOnboardingOpen && (
      <motion.div 
        className="fixed z-[60] flex items-center gap-4 group"
        style={{ 
          top: easterEggPos.top, 
          left: easterEggPos.left,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence>
          {isEasterEggFound && !easterEggPromptHidden && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setIsPoetryGameOpen(true)}
              className="border border-solar-gold/35 bg-black/50 px-5 py-2.5 text-[10px] uppercase tracking-[0.45em] text-solar-gold shadow-[0_0_18px_rgba(197,160,89,0.15)] backdrop-blur-md transition-all duration-500 hover:border-solar-gold hover:bg-solar-gold/10 hover:shadow-[0_0_24px_rgba(197,160,89,0.25)]"
            >
              <span className="relative z-10">{ui.secretFragment}</span>
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (isEasterEggFound) {
              setIsPoetryGameOpen(true);
            } else {
              setIsEasterEggFound(true);
            }
          }}
          className={`relative flex h-[4.25rem] min-w-[3.25rem] shrink-0 items-center justify-center overflow-visible transition-opacity duration-300 ease-[0.22,1,0.36,1] focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm
            ${isEasterEggFound ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          title={isEasterEggFound ? ui.openGame : ui.secretHint}
        >
          <span aria-hidden className="pointer-events-none absolute -bottom-0.5 left-1/2 h-[2px] w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-solar-gold/50 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
          <span aria-hidden className="pointer-events-none absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-solar-gold/35 blur-[1px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <motion.span
            className="relative z-[1] select-none font-serif text-5xl font-normal italic leading-none tracking-tight text-transparent sm:text-[3.15rem]"
            style={{
              backgroundImage: "linear-gradient(165deg, #f0e2c8 0%, #c5a059 42%, #8a6a35 88%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              filter: isEasterEggFound
                ? "drop-shadow(0 0 8px rgba(197, 160, 89, 0.32))"
                : "drop-shadow(0 0 5px rgba(197, 160, 89, 0.12))",
            }}
            animate={prefersReducedMotion ? undefined : { y: [0, -2, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          >
            S
          </motion.span>
        </motion.button>
      </motion.div>
      )}

      <motion.div className="fixed inset-0 z-0 overflow-hidden bg-[#020100]">
      <AnimatePresence mode="wait">
        {showInitialTitle && !videoStarted && (
          <motion.div
            ref={initialStageRef}
            key="initial-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
          >
          <AnimatePresence>
            {cursorOnboardingOpen && (
              <CursorOnboardingGate
                prefersReducedMotion={prefersReducedMotion}
                finePointer={finePointer}
                onChoose={confirmCursorOnboarding}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
          {showArrivalLanguageOverlay && (
            <motion.div
              key="lang-splash"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6, scale: 1.02 }}
              transition={{ duration: 1.85, ease: [0.22, 1, 0.36, 1] }}
              className={
                "pointer-events-auto fixed inset-0 z-[100] min-h-[100dvh] w-full overflow-hidden " +
                (finePointer ? "cursor-none" : "")
              }
              style={{ background: "#03020100" }}
            >
              <div
                className="absolute inset-0 z-[5]"
                style={{
                  opacity:
                    !arrivalLanguageBridgeVideoActive || arrivalLanguageBridgeCrossfading
                      ? 1
                      : languageBridgeReveal01,
                  pointerEvents:
                    !arrivalLanguageBridgeVideoActive ||
                    arrivalLanguageBridgeCrossfading ||
                    languageBridgeReveal01 > 0.2
                      ? "auto"
                      : "none",
                }}
              >
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background:
                    "linear-gradient(180deg, rgba(7, 5, 3, 0.985) 0%, rgba(5, 3, 2, 0.996) 42%, rgba(2, 1, 0, 1) 100%)",
                }}
              />
              <motion.div
                aria-hidden
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-x-[-18%] bottom-[-16%] h-[42vh]"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(58, 34, 19, 0.08) 0%, rgba(20, 12, 7, 0.08) 34%, transparent 74%)",
                  filter: "blur(18px)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[-14%] bottom-[-8%] h-[30vh]"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(10, 6, 4, 1) 0%, rgba(10, 6, 4, 0.94) 42%, transparent 76%)",
                }}
              />

              {/* Radial glow central */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-hidden
              >
                <div
                  className="h-[70vmax] w-[70vmax] rounded-full opacity-12"
                  style={{ background: "radial-gradient(circle, rgba(197,160,89,0.015) 0%, transparent 70%)" }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center"
              >
                <div className="relative mt-0 flex flex-row flex-wrap items-baseline justify-center gap-x-5 gap-y-0 px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
                  <span className="font-bahlull text-[clamp(3.8rem,10vw,8rem)] italic leading-none tracking-tight text-transparent">
                    Al Rihla
                  </span>
                  <span className="text-[8px] uppercase leading-none tracking-[0.38em] text-transparent">
                    « La traversée »
                  </span>
                </div>
              </motion.div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1/2 z-[3] hidden w-24 -translate-x-1/2 sm:block"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(5,3,2,0.03) 46%, rgba(5,3,2,0.08) 50%, rgba(5,3,2,0.03) 54%, transparent 100%)",
                  filter: "blur(8px)",
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 top-0 z-20 pointer-events-none"
                style={{
                  height: "max(7.25rem, calc(env(safe-area-inset-top) + 5.75rem))",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[#020100]"
                />
                <div className="relative flex h-full w-full items-center justify-center px-4 py-4 text-center sm:py-5">
                  <motion.div
                  className="mx-auto flex max-w-[min(96vw,52rem)] flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-x-4"
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: [1, 0, 1] }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          opacity: {
                            duration: 3.4,
                            repeat: Infinity,
                            ease: [0.45, 0, 0.55, 1],
                            delay: 1.35,
                            times: [0, 0.52, 1],
                          },
                        }
                  }
                >
                  <span className="hidden h-px w-[min(6.5rem,16vw)] bg-gradient-to-r from-transparent to-[#c5a059]/22 sm:block" />
                  <span dir="rtl" className="da-curtain-ar drop-shadow-[0_0_10px_rgba(0,0,0,0.72)]">
                    اختر لغتك
                  </span>
                  <span
                    aria-hidden
                    className="h-[3px] w-[3px] rounded-full bg-[#c5a059]/42 shadow-[0_0_8px_rgba(197,160,89,0.16)]"
                  />
                  <span className="da-curtain-fr sm:tracking-[0.4em]">
                    Choisissez votre langue
                  </span>
                  <span className="hidden h-px w-[min(9rem,22vw)] bg-gradient-to-l from-transparent to-[#c5a059]/18 sm:block" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Split layout */}
              <motion.div
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18, duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-full w-full flex-col sm:flex-row"
              >

                {/* ── FRANÇAIS ── */}
                <motion.button
                  type="button"
                  onClick={() => handleArrivalLanguageChoice("fr")}
                  className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden"
                  initial={{ opacity: 0, x: -44 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.34, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(197,160,89,0.04),rgba(197,160,89,0.015))]" />
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        "radial-gradient(ellipse 76% 82% at 24% 50%, rgba(197,160,89,0.08) 0%, transparent 68%)",
                    }}
                  />
                  {/* Hover wash */}
                  <div className="absolute inset-0 bg-[#c5a059] opacity-0 transition-opacity duration-700 group-hover:opacity-[0.1]" />
                  {/* Hover bottom glow */}
                  <div
                    className="absolute bottom-0 inset-x-0 h-2/3 translate-y-full transition-transform duration-700 ease-out group-hover:translate-y-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(197,160,89,0.18), transparent)" }}
                  />
                  {/* Right border separator (hidden on mobile - center divider takes care of it) */}
                  <div className="absolute right-0 top-[15%] bottom-[15%] w-px hidden sm:block"
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(197,160,89,0.32), transparent)" }}
                  />

                  <div className="relative z-10 flex flex-col items-center gap-6 px-8">
                    <motion.span
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.72, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                      className="da-eyebrow"
                    >
                      Langue
                    </motion.span>

                    <motion.span
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.88, duration: 1.12, ease: [0.22, 1, 0.36, 1] }}
                      className="da-display-title transition-colors duration-300 group-hover:text-[#fff4dc]"
                    >
                      Français
                    </motion.span>

                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.7 }}
                      className="da-title-rule"
                    />
                  </div>
                </motion.button>

                {/* ── CENTRE ── */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center sm:static sm:relative sm:inset-auto sm:w-0 sm:flex sm:items-center sm:justify-center">
                  <div className="relative flex flex-col items-center gap-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2 z-10">
                    <motion.div
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="hidden sm:block h-28 w-px origin-top"
                      style={{ background: "linear-gradient(to bottom, transparent, rgba(197,160,89,0.4))" }}
                    />
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="text-[#c5a059]/72 text-xl drop-shadow-[0_0_14px_rgba(0,0,0,0.8)] select-none"
                    >
                      ✦
                    </motion.span>
                    <motion.div
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="hidden sm:block h-28 w-px origin-bottom"
                      style={{ background: "linear-gradient(to top, transparent, rgba(197,160,89,0.4))" }}
                    />
                    {/* Horizontal separator on mobile */}
                    <div
                      className="sm:hidden h-px w-24 my-1"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(197,160,89,0.48), transparent)" }}
                    />
                  </div>
                </div>

                {/* ── ARABIC ── */}
                <motion.button
                  type="button"
                  onClick={() => handleArrivalLanguageChoice("ar-dz")}
                  className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden"
                  dir="rtl"
                  initial={{ opacity: 0, x: 44 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.42, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(197,160,89,0.04),rgba(197,160,89,0.015))]" />
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        "radial-gradient(ellipse 76% 82% at 76% 50%, rgba(197,160,89,0.08) 0%, transparent 68%)",
                    }}
                  />
                  {/* Hover wash */}
                  <div className="absolute inset-0 bg-[#c5a059] opacity-0 transition-opacity duration-700 group-hover:opacity-[0.1]" />
                  {/* Hover bottom glow */}
                  <div
                    className="absolute bottom-0 inset-x-0 h-2/3 translate-y-full transition-transform duration-700 ease-out group-hover:translate-y-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(197,160,89,0.18), transparent)" }}
                  />
                  {/* Left border separator */}
                  <div className="absolute left-0 top-[15%] bottom-[15%] w-px hidden sm:block"
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(197,160,89,0.32), transparent)" }}
                  />

                  <div className="relative z-10 flex flex-col items-center gap-6 px-8">
                    <motion.span
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.72, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                      className="da-eyebrow-ar"
                    >
                      لغة
                    </motion.span>

                    <motion.span
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.88, duration: 1.12, ease: [0.22, 1, 0.36, 1] }}
                      className="da-display-title-ar transition-colors duration-300 group-hover:text-[#fff4dc]"
                    >
                      العربية الجزائرية
                    </motion.span>

                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.7 }}
                      className="da-title-rule"
                    />
                  </div>
                </motion.button>
              </motion.div>

              </div>
              {arrivalLanguageBridgeVideoActive && (
                <div
                  className={
                    "absolute inset-0 z-[250] min-h-[100dvh] min-w-full cursor-pointer bg-transparent [isolation:isolate] " +
                    (languageBridgeReveal01 > 0.45 ? "pointer-events-none" : "pointer-events-auto")
                  }
                  style={{
                    opacity: arrivalLanguageBridgeCrossfading
                      ? 0
                      : Math.max(0, Math.min(1, 1 - 0.97 * languageBridgeReveal01)),
                    transition: arrivalLanguageBridgeCrossfading
                      ? `opacity ${TRANSITION_BRIDGE_VIDEO_CROSSFADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                      : undefined,
                  }}
                  onClick={endArrivalLanguageBridgeVideo}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    endArrivalLanguageBridgeVideo();
                  }}
                  role="button"
                  tabIndex={languageBridgeReveal01 > 0.45 ? -1 : 0}
                  aria-label={ui.skipIntro}
                >
                  {/*
                    Fond derrière la vidéo : sans calque ici, les zones « vides » (lettres object-contain,
                    vraie alpha WebM) révèlent le body / main (da-depth-intro) → impression de noir plat.
                  */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 95% 80% at 50% 32%, rgba(118, 82, 52, 0.42) 0%, rgba(36, 22, 14, 0.88) 42%, rgba(8, 5, 3, 0.97) 100%), linear-gradient(180deg, #100a07 0%, #060403 100%)",
                    }}
                  />
                  {/*
                    WebM (Chrome, Firefox) puis MP4 H.264 (Safari / iOS).
                    MP4 : pas d’alpha - le dégradé z-0 sous la vidéo reste visible.
                  */}
                  <video
                    ref={arrivalLangBridgeVideoRef}
                    key={languageGateBridgeForceMp4 ? "lang-bridge-mp4" : "lang-bridge-webm"}
                    className="pointer-events-none absolute inset-0 z-[1] h-full w-full bg-transparent object-cover object-center"
                    style={{ backgroundColor: "transparent" }}
                    playsInline
                    muted
                    preload="auto"
                    onEnded={finishBridgeVideoPlayback}
                    onError={onLanguageGateBridgeVideoError}
                  >
                    {languageGateBridgeForceMp4 ? (
                      <source src={LANGUAGE_GATE_TRANSITION_MP4} type="video/mp4" />
                    ) : (
                      <>
                        <source
                          src={LANGUAGE_GATE_TRANSITION_WEBM}
                          type='video/webm; codecs="vp09.00.10.08"'
                        />
                        <source src={LANGUAGE_GATE_TRANSITION_MP4} type="video/mp4" />
                      </>
                    )}
                  </video>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
          <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center origin-center will-change-transform"
              animate={
                prefersReducedMotion
                  ? { scale: 1, opacity: 1 }
                  : showArrivalLanguageOverlay &&
                      arrivalLanguageBridgeVideoActive &&
                      !arrivalLanguageBridgeCrossfading
                    ? {
                        scale: 1.02 - 0.016 * languageBridgeReveal01,
                        opacity: 0.58 * (1 - languageBridgeReveal01 * 0.91),
                        filter: "blur(14px) saturate(0.72) brightness(0.48)",
                      }
                    : showArrivalLanguageOverlay
                      ? { scale: 1.01, opacity: 0, filter: "blur(24px) saturate(0.4) brightness(0.2)" }
                      : { scale: 1, opacity: 1, filter: "blur(0px) saturate(1)" }
              }
              transition={{
                duration: prefersReducedMotion
                  ? 0
                  : showArrivalLanguageOverlay &&
                      arrivalLanguageBridgeVideoActive &&
                      !arrivalLanguageBridgeCrossfading
                    ? 0
                    : showArrivalLanguageOverlay
                      ? 1.68
                      : 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1]"
                initial={false}
                animate={{ opacity: 0 }}
                transition={{ duration: 2.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: "radial-gradient(ellipse 72% 58% at 50% 48%, transparent 0%, rgba(8, 5, 3, 0.08) 45%, rgba(5, 3, 2, 0.72) 100%)" }}
              />

              {!introCoverActive ? (
              <motion.div
                animate={{ opacity: 1 }}
                transition={{ duration: 1.92, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 z-[-1]"
                >
                <div ref={backgroundRevealRef} className="absolute inset-0 will-change-transform">
                  <AuroraMeshBackground />
                </div>
                <div
                  ref={sunRevealRef}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[18%] z-[1] h-[min(70vmax,54rem)] w-[min(70vmax,54rem)] -translate-x-1/2 rounded-full blur-[90px] sm:blur-[120px]"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(207, 154, 72, 0.26) 0%, rgba(176, 102, 43, 0.16) 38%, transparent 74%)",
                  }}
                />
                <div
                  ref={hazeRevealRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(252, 228, 174, 0.02) 0%, rgba(197, 160, 89, 0.05) 26%, transparent 52%, rgba(23, 14, 9, 0.16) 100%)",
                  }}
                />
                <div
                  ref={duneFrontRevealRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-x-[-20%] bottom-[-12%] z-[1] h-[36vh] blur-[18px]"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 100%, rgba(28, 17, 10, 0.98) 0%, rgba(28, 17, 10, 0.82) 34%, rgba(28, 17, 10, 0.34) 56%, transparent 84%)",
                  }}
                />
              </motion.div>
              ) : null}

            <motion.h1
              animate={{ opacity: introCoverActive ? 0 : 1, y: 0 }}
              transition={{ duration: introCoverActive ? 0.48 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[2]"
              aria-hidden={introCoverActive}
            >
              <div ref={titleRevealRef}>
                {language === "ar-dz" ? (
                  <AnimatedTitle
                    heroMotion
                    viewportTracking
                    className={
                      "mx-auto flex min-h-[clamp(13rem,30vw,22rem)] w-screen max-w-[1500px] items-center justify-center px-6 md:px-10 select-none"
                    }
                  >
                    <span className="sr-only">الرحلة</span>
                    <img
                      src={ARABIC_TITLE_IMAGE_SRC}
                      width={1400}
                      height={520}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className={
                        "mx-auto h-auto drop-shadow-[0_0_22px_rgba(197,160,89,0.28)] " +
                        (compactDesktop ? "w-[min(54rem,78vw)]" : "w-[min(60rem,86vw)]")
                      }
                    />
                  </AnimatedTitle>
                ) : (
                  <AnimatedTitle
                    heroMotion
                    viewportTracking
                    staggerLetters={false}
                    text="Al Rihla"
                    className={
                      "font-bahlull text-white tracking-tighter italic drop-shadow-[0_0_22px_rgba(197,160,89,0.35)] " +
                      (compactDesktop ? "text-6xl md:text-8xl" : "text-7xl md:text-9xl")
                    }
                  />
                )}
              </div>
            </motion.h1>

            <motion.div
              animate={{ opacity: introCoverActive ? 0 : 1, y: 0 }}
              transition={{ duration: introCoverActive ? 0.48 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
              aria-hidden={introCoverActive}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.95, delay: 0.72, ease: [0.22, 1, 0.36, 1] }}
                className={
                  "mx-auto max-w-[min(min(18rem,88vw),22rem)] px-6 text-center [font-feature-settings:'kern'_1] " +
                  (compactDesktop ? "mt-3 mb-2" : "mt-3 mb-2")
                }
              >
                <div ref={subtitleRevealRef}>
                  {language === "ar-dz" ? (
                    <p
                      dir="rtl"
                      className={
                        "font-arabic-ui font-medium leading-relaxed text-[#f4ead2]/78 drop-shadow-[0_0_18px_rgba(197,160,89,0.22)] " +
                        (compactDesktop
                          ? "text-[clamp(0.82rem,1.65vw,1rem)] tracking-[0.06em]"
                          : "text-[clamp(0.88rem,1.95vw,1.12rem)] tracking-[0.06em]")
                      }
                    >
                      {copy.introJeanSenacSubtitle}
                    </p>
                  ) : (
                    <p
                      className={
                        "font-serif italic font-normal leading-none text-[#f4ead2]/78 tracking-[0.18em] drop-shadow-[0_0_18px_rgba(197,160,89,0.2)] " +
                        (compactDesktop ? "text-[clamp(0.8rem,1.45vw,0.95rem)]" : "text-[clamp(0.85rem,1.75vw,1.05rem)]")
                      }
                    >
                      {copy.introJeanSenacSubtitle}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Losange hors Presence (suppression synchrone au commit) pour éviter recouvrement avec le play. */}
              {showLandingDiamond ? (
                <motion.div
                  aria-hidden
                  variants={{
                    off: {
                      opacity: 0,
                      y: 18,
                      scale: 0.92,
                    },
                    on: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition:
                        prefersReducedMotion
                          ? {
                              duration: 0.55,
                              delay: 0.72 + 0.95 + 0.28,
                              ease: [0.22, 1, 0.36, 1],
                            }
                          : {
                              duration: LANDING_DIAMOND_ENTRANCE_DURATION_S,
                              delay: LANDING_DIAMOND_ENTRANCE_DELAY_S,
                              ease: [0.16, 1, 0.32, 1],
                            },
                    },
                  }}
                  initial="off"
                  animate="on"
                  className="pointer-events-none mt-14 flex justify-center sm:mt-16"
                >
                  <motion.div className="relative flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
                    <div className="absolute inset-0 rotate-45 border border-white/22 bg-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[2px]" />
                    <div className="relative z-[1] flex -rotate-45 items-center justify-center">
                      <motion.div
                        className="relative h-6 w-6"
                        animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
                        transition={{ rotate: { duration: 4.2, repeat: Infinity, ease: "linear" } }}
                        aria-hidden
                      >
                        <span
                          className="pointer-events-none absolute left-1/2 top-1/2 block h-2 w-2 rounded-full bg-[#e8d4a4]/90 shadow-[0_0_10px_rgba(197,160,89,0.45)] blur-[0.35px]"
                          style={{ transform: "translate(-50%, -50%) translate(-5.5px, -5.5px)" }}
                        />
                        <span
                          className="pointer-events-none absolute left-1/2 top-1/2 block h-2 w-2 rounded-full bg-[#c5a059]/80 shadow-[0_0_8px_rgba(197,160,89,0.4)] blur-[0.35px]"
                          style={{ transform: "translate(-50%, -50%) translate(5.5px, 5.5px)" }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}

              <AnimatePresence>
                {arrivalLanguageConfirmed && launchCtaVisible && !introCoverActive ? (
                  <motion.div
                    key={`intro-launch-cta-${launchCtaRevealToken}`}
                    ref={launchCtaWrapRef}
                    initial={{ opacity: 0, y: 16, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{
                      duration: prefersReducedMotion ? 0.42 : 1.15,
                      delay: prefersReducedMotion ? 0.05 : 0.18,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={compactDesktop ? "mt-12" : "mt-20"}
                  >
                    <motion.button
                      onClick={startExperience}
                      whileTap={{ scale: 0.98 }}
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="group relative flex flex-col items-center gap-10 pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
                    >
                      <motion.div
                        ref={launchAuraRef}
                        className="absolute -inset-14 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.18)_0%,transparent_68%)] blur-2xl"
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: prefersReducedMotion ? 0.35 : 1.35,
                          delay: prefersReducedMotion ? 0.08 : 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                      <div className="absolute -inset-14 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[0.22,1,0.36,1] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.14)_0%,transparent_68%)] blur-2xl" />

                      <motion.div
                        ref={launchOrbRef}
                        className="relative flex h-20 w-20 items-center justify-center"
                        initial={{ opacity: 0, scale: 0.7, rotate: -28, filter: "blur(8px)" }}
                        animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: prefersReducedMotion ? 0.4 : 1.22,
                          delay: prefersReducedMotion ? 0.1 : 0.28,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <motion.div
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center"
                          animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
                          transition={{ rotate: { duration: 18, repeat: Infinity, ease: "linear" } }}
                        >
                          <motion.div
                            className="relative flex h-full w-full rotate-45 items-center justify-center border border-solar-gold/38 bg-black/42 backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:bg-black/56 group-hover:shadow-[0_0_22px_rgba(197,160,89,0.42)]"
                            animate={prefersReducedMotion ? undefined : { opacity: [0.58, 0.88, 0.58] }}
                            transition={{ duration: 5.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                          >
                            <motion.div
                              className="pointer-events-none absolute inset-[9px] -rotate-45 rounded-full border border-dashed border-solar-gold/22 transition-[border-color,opacity] duration-700 group-hover:border-solar-gold/42 group-hover:opacity-100"
                              animate={prefersReducedMotion ? undefined : { opacity: [0.24, 0.42, 0.24] }}
                              transition={{ duration: 3.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1], delay: 0.35 }}
                            />
                            <motion.div
                              className="-rotate-45 relative flex h-[26px] w-[26px] items-center justify-center"
                              animate={prefersReducedMotion ? undefined : { y: [0, -2, 0], rotate: [0, -360] }}
                              transition={{
                                y: { duration: 4.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
                                rotate: { duration: 18, repeat: Infinity, ease: "linear" },
                              }}
                            >
                              <GoldPlayIcon className="h-[26px] w-[26px]" />
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: prefersReducedMotion ? 0.38 : 1.05,
                          delay: prefersReducedMotion ? 0.16 : 0.72,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <motion.p
                          ref={launchPromptRef}
                          className="max-w-[min(92vw,24rem)] text-center text-[9px] font-light uppercase leading-relaxed tracking-[0.38em] text-solar-gold/75 transition-colors duration-500 group-hover:text-solar-gold md:text-[10px] md:tracking-[0.42em]"
                          animate={
                            prefersReducedMotion
                              ? { opacity: 0.9, filter: "brightness(1)" }
                              : {
                                  opacity: [0.52, 1, 0.52],
                                  filter: ["brightness(0.88)", "brightness(1.14)", "brightness(0.88)"],
                                  textShadow: [
                                    "0 0 12px rgba(197,160,89,0.1), 0 0 2px rgba(253,248,238,0.06)",
                                    "0 0 36px rgba(197,160,89,0.55), 0 0 14px rgba(253,248,238,0.2)",
                                    "0 0 12px rgba(197,160,89,0.1), 0 0 2px rgba(253,248,238,0.06)",
                                  ],
                                }
                          }
                          transition={{
                            duration: 2.65,
                            repeat: prefersReducedMotion ? 0 : Infinity,
                            ease: [0.4, 0, 0.6, 1],
                            delay: prefersReducedMotion ? 0 : 1.05,
                          }}
                        >
                          {introCtaWords.join(" ")}
                        </motion.p>
                      </motion.div>
                    </motion.button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

            </motion.div>

            </motion.div>

            <AnimatePresence>
              {introHandoffBlackout && !introSuspenseActive ? (
                <motion.div
                  key="intro-handoff-blackout"
                  aria-hidden
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.45 : 1.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="pointer-events-none absolute inset-0 z-[44] bg-[#020100]"
                />
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {prologueTutorialStep ? (
                <PrologueTutorialOverlay
                  key="prologue-tutorial"
                  step={prologueTutorialStep}
                  volume01={isMuted ? 0 : volume}
                  volumeHudVisible={prologueVolumeHudVisible}
                  prefersReducedMotion={prefersReducedMotion ?? false}
                  isArabic={isArabic}
                  copy={copy}
                  onSkipAck={acknowledgePrologueTutorialSkip}
                  onReviewSkip={reviewPrologueTutorialSkip}
                  onLaunchVideo={completePrologueVolumeTutorial}
                  onStepRevealed={handleTutorialStepRevealed}
                />
              ) : isStarting && !videoStarted ? (
                <motion.div
                  key="intro-suspense"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, filter: "blur(6px)" }}
                  transition={{
                    duration: prefersReducedMotion ? 0.42 : 1.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 z-[45] overflow-hidden"
                >
                  <SuspenseOverlay
                    prefersReducedMotion={prefersReducedMotion ?? false}
                    onComplete={finishIntroSuspense}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
        </motion.div>
      )}

      {videoStarted && (
        <motion.div
          key="video-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3.1, delay: 0.12, ease: "easeInOut" }}
          className="fixed inset-0 z-10 h-dvh max-h-dvh w-full overflow-hidden bg-[#020100]"
        >
          <motion.div className="relative h-full min-h-0 w-full overflow-hidden">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 bg-[#060403]"
            />
            <video
              ref={videoRef}
              onEnded={handleVideoEnd}
              onError={() => setHasError(true)}
              onPlay={() => {
                setPrologueVideoPaused(false);
                if (prologueWasPausedRef.current) {
                  prologueWasPausedRef.current = false;
                  showProloguePlayMark();
                }
              }}
              onPause={() => {
                const v = videoRef.current;
                if (v?.ended) return;
                prologueWasPausedRef.current = true;
                hideProloguePlayMark();
                setPrologueVideoPaused(true);
              }}
              className="absolute inset-0 z-[1] h-full w-full cursor-none object-cover"
              muted={isMuted}
              playsInline
              autoPlay
              src={INTRO_VIDEO_SRC}
            />
            <AnimatePresence>
              {prologueVideoPaused ? (
                <ProloguePlaybackMark
                  key="prologue-pause-mark"
                  mode="pause"
                  ariaLabel={copy.introProloguePausedAria}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ) : null}
              {prologuePlayMarkVisible && !prologueVideoPaused ? (
                <ProloguePlaybackMark
                  key="prologue-play-mark"
                  mode="play"
                  ariaLabel={copy.introProloguePlayingAria}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ) : null}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {prologueVolumeHudVisible ? (
                <motion.div
                  key="prologue-volume-feedback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <PrologueVolumeFluid
                    visible
                    volume01={isMuted ? 0 : volume}
                    prefersReducedMotion={prefersReducedMotion}
                    className="absolute inset-0 z-[19]"
                  />
                  <div className="absolute inset-0 z-[22]">
                    <PrologueVolumeHud
                      volumePct={Math.round((isMuted ? 0 : volume) * 100)}
                      ariaLabel={copy.introPrologueVolumeAuraAria}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* Skip */}
          <AnimatePresence>
            {showSkip && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-16 right-[max(2.5rem,calc(env(safe-area-inset-right)+1.25rem))] z-50 pointer-events-auto"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkip}
                  className="group relative flex items-center gap-4 transition-[gap] duration-700 ease-[0.22,1,0.36,1] hover:gap-5"
                >
                  <div className="flex min-w-0 flex-col items-end gap-1.5">
                    <span className="text-[10px] font-light uppercase tracking-[0.6em] text-solar-gold/70 transition-colors duration-500 group-hover:text-solar-gold">
                      {ui.skipIntro}
                    </span>
                    <motion.div className="relative mt-0.5 h-[2px] w-[min(17rem,72vw)] overflow-hidden rounded-full bg-solar-gold/15">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 8, ease: "linear" }}
                        className="h-full bg-solar-gold/50"
                      />
                    </motion.div>
                  </div>
                  <motion.div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                    <div className="absolute inset-0 rotate-45 border border-solar-gold/40 bg-black/45 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:shadow-[0_0_18px_rgba(197,160,89,0.5)]" />
                    <div className="relative z-[1] -rotate-45 flex items-center justify-center">
                      <motion.div
                        className="relative h-5 w-5"
                        animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
                        transition={{ rotate: { duration: 4.2, repeat: Infinity, ease: "linear" } }}
                        aria-hidden
                      >
                        <span
                          className="pointer-events-none absolute left-1/2 top-1/2 block h-[7px] w-[7px] rounded-full bg-solar-gold/90 shadow-[0_0_10px_rgba(197,160,89,0.55)] blur-[0.35px]"
                          style={{ transform: "translate(-50%, -50%) translate(-4.5px, -4.5px)" }}
                        />
                        <span
                          className="pointer-events-none absolute left-1/2 top-1/2 block h-[7px] w-[7px] rounded-full bg-solar-gold/65 shadow-[0_0_8px_rgba(197,160,89,0.4)] blur-[0.35px]"
                          style={{ transform: "translate(-50%, -50%) translate(4.5px, 4.5px)" }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
      </motion.div>

      <IntroFullscreenOverlay
        open={fullscreenIntroOpen}
        onRequestClose={handleIntroFullscreenClose}
      />
    </>
  );
}
