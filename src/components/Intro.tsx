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
import React, { useState, useEffect, useRef, useId, lazy, Suspense } from "react";
const PoetryGame = lazy(() => import("./PoetryGame"));
import AuroraMeshBackground from "./AuroraMeshBackground";
import {
  applyVolumeKeyStep,
  getVolumeKeyDirection,
  shouldIgnoreVolumeKeyboardTarget,
} from "../lib/volumeKeyboard";
import { playSuspenseLoadCompleteChime, primeSuspenseAudio } from "../lib/suspenseLoadChime";
import { useLanguageStore } from "../stores/languageStore";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useAppCopy } from "../hooks/useAppCopy";

// --- CONFIGURATION VIDÉO ---
const VIDEO_SOURCE = "/al-rihla.mp4";

const INTRO_CTA_WORDS_FR = ["Cliquer", "ou", "Entrée"] as const;
const INTRO_CTA_WORDS_AR = ["إضغط", "أو", "إنتر"] as const;

type AnimatedTitleProps = {
  text: string;
  className?: string;
  heroMotion?: boolean;
};

function Volume2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 10v4h4l5 4V6l-5 4H4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M16 9a4 4 0 010 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M18.5 6.5a7.5 7.5 0 010 11" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function Volume1Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 10v4h4l5 4V6l-5 4H4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M16 9a4 4 0 010 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function VolumeXIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 10v4h4l5 4V6l-5 4H4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M16 10l5 5M21 10l-5 5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

const AnimatedTitle = ({ text, className, heroMotion = false }: AnimatedTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springSoft = { damping: 38, stiffness: 220 };
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], heroMotion ? [-10, 10] : [0, 0]), springSoft);
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], heroMotion ? [-8, 8] : [0, 0]), springSoft);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroMotion) return;
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
    mouseX.set(0);
    mouseY.set(0);
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--shine-x", "50%");
      el.style.setProperty("--shine-y", "50%");
    }
  };

  const characters = text.split("");

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={heroMotion ? handleMouseMove : undefined}
      onMouseLeave={heroMotion ? handleMouseLeave : undefined}
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
          className="pointer-events-none absolute -inset-12 -z-10 opacity-40 blur-3xl transition-opacity md:opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at var(--shine-x, 50%) var(--shine-y, 50%), rgba(197, 160, 89, 0.45), transparent 62%)",
          }}
        />
      )}
      <div className="relative inline-block">
        {characters.map((char, i) => (
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
        ))}
      </div>
    </motion.div>
  );
};

function SuspenseOverlay({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  const [phase, setPhase] = useState<"idle" | "building" | "climax">("idle");
  const loadProgress = useMotionValue(0);
  const [loadPct, setLoadPct] = useState(0);
  const loadWidth = useTransform(loadProgress, [0, 100], ["0%", "100%"]);
  const chimePlayedRef = useRef(false);

  useEffect(() => {
    const ctrl = animate(loadProgress, 100, {
      delay: 2.1,
      duration: prefersReducedMotion ? 0.45 : 3,
      ease: [0.4, 0, 0.2, 1],
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
    // "building" démarre quand la barre commence (~2,1 s)
    const t1 = setTimeout(() => setPhase("building"), 2100);
    // "climax" quand la barre est à ~85% (~4,6 s après le début = 2,1 + 2,5)
    const t2 = setTimeout(() => setPhase("climax"), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const isClimax = phase === "climax";
  const isBuilding = phase === "building" || isClimax;

  return (
    <div className="pointer-events-none absolute inset-0 z-[26] flex flex-col items-center justify-center gap-0 px-6 text-center">

      {/* fond noir */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeIn" }}
        style={{ background: "radial-gradient(ellipse 110% 110% at 50% 50%, rgba(4,2,1,0.82) 0%, rgba(2,1,0,0.97) 100%)" }}
      />

      {/* halo doré - s'emballe au climax */}
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
            : { duration: 3.2, delay: isBuilding ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ width: 520, height: 520, background: "radial-gradient(circle, rgba(197,160,89,0.28) 0%, transparent 68%)", filter: isClimax ? "blur(28px)" : "blur(40px)" }}
      />

      {/* éclats de particules au climax */}
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

      {/* contenu centré */}
      <div className="relative z-[2] flex flex-col items-center gap-8">

        {/* ornement haut */}
        <motion.div
          aria-hidden
          className="flex items-center gap-3"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-solar-gold/50" />
          <div className="h-1 w-1 rotate-45 bg-solar-gold/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-solar-gold/50" />
        </motion.div>

        {/* phrase principale - tremble légèrement au climax */}
        <motion.p
          className="font-bahlull text-[clamp(2.2rem,7.5vw,4.2rem)] italic leading-[1.1] tracking-tight text-white"
          style={{ textShadow: isClimax ? "0 0 120px rgba(197,160,89,0.55), 0 8px 48px rgba(0,0,0,0.9)" : "0 0 80px rgba(197,160,89,0.25), 0 8px 48px rgba(0,0,0,0.9)" }}
          initial={{ opacity: 0, y: 32 }}
          animate={
            isClimax && !prefersReducedMotion
              ? { opacity: 1, y: [0, -1.5, 1, -0.8, 0], scale: [1, 1.012, 1] }
              : { opacity: 1, y: 0 }
          }
          transition={
            isClimax
              ? { y: { duration: 0.38, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.38, repeat: Infinity }, opacity: { duration: 0 } }
              : { duration: 1.3, delay: 0.9, ease: [0.22, 1, 0.36, 1] }
          }
        >
          Le voyage va commencer
        </motion.p>

        {/* sous-titre */}
        <motion.p
          className="text-[9px] font-light uppercase tracking-[0.58em] text-solar-gold/55 md:text-[10px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Prologue
        </motion.p>

        {/* barre de chargement - sobre, même logique que « Passer l&apos;introduction » */}
        <motion.div
          className="relative mt-3 flex w-full max-w-[17.5rem] flex-col items-center gap-2 md:max-w-[20rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.0 }}
        >
          <div
            className="relative h-[2px] w-full overflow-hidden rounded-full bg-solar-gold/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loadPct}
            aria-label="Progression du chargement"
          >
            <motion.div
              className="absolute inset-y-0 left-0 h-full rounded-full bg-solar-gold/50"
              style={{ width: loadWidth }}
            />
          </div>
          <span
            className="text-[10px] tabular-nums tracking-[0.45em] text-solar-gold/55 md:text-[11px]"
            aria-hidden
          >
            {loadPct}%
          </span>
        </motion.div>

        {/* ornement bas */}
        <motion.div
          aria-hidden
          className="flex items-center gap-3"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-solar-gold/30" />
          <div className="h-[3px] w-[3px] rotate-45 bg-solar-gold/40" />
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-solar-gold/30" />
        </motion.div>

      </div>
    </div>
  );
}


function GoldPlayIcon({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={`play-grad-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8d5a4" />
          <stop offset="42%" stopColor="#c5a059" />
          <stop offset="100%" stopColor="#7a5c2e" />
        </linearGradient>
      </defs>
      <polygon
        points="8,5 8,19 19,12"
        fill={`url(#play-grad-${gid})`}
        className="transition-[filter] duration-500 group-hover:brightness-110"
        style={{ filter: `drop-shadow(0 0 8px rgba(197, 160, 89, 0.35))` }}
      />
    </svg>
  );
}

export type DevChapterJumps = {
  goChapter1: () => void;
  goChapter2: () => void;
  goChapter3: () => void;
  /** Ouvre le parchemin sur Ch. III avec générique façon cinéma (`?previewCredits=1`). */
  previewCredits: () => void;
};

interface IntroProps {
  onComplete: () => void;
  isExploring?: boolean;
  onVideoStart?: () => void;
  /** Raccourcis vers les chapitres - affichés uniquement si défini (ex. mode dev dans App). */
  devChapterJumps?: DevChapterJumps;
}

export default function Intro({ onComplete, isExploring, onVideoStart, devChapterJumps }: IntroProps) {
  const language = useLanguageStore((s) => s.language);
  const hasConfirmedChoice = useLanguageStore((s) => s.hasConfirmedChoice);
  const confirmLanguage = useLanguageStore((s) => s.confirmLanguage);
  const isArabic = language === "ar-dz";
  const copy = useAppCopy();
  const introCtaWords = isArabic ? INTRO_CTA_WORDS_AR : INTRO_CTA_WORDS_FR;
  const ui = isArabic
    ? {
        shortcuts: "اختصارات المطور",
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
        shortcuts: "Raccourcis dev",
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
  const [videoStarted, setVideoStarted] = useState(false);
  const [showInitialTitle, setShowInitialTitle] = useState(true);
  const [volume, setVolume] = useState(0.1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPoetryGameOpen, setIsPoetryGameOpen] = useState(false);
  const [isEasterEggFound, setIsEasterEggFound] = useState(false);
  const [easterEggPromptHidden, setEasterEggPromptHidden] = useState(false);
  const [easterEggPos, setEasterEggPos] = useState({ top: "20%", left: "80%" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  volumeRef.current = volume;
  isMutedRef.current = isMuted;

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
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [videoStarted]);

  useEffect(() => {
    if (videoStarted && isEasterEggFound) {
      setEasterEggPromptHidden(true);
    }
  }, [videoStarted, isEasterEggFound]);

  useEffect(() => {
    const corners: [number, number][] = [
      [0.08, 0.1],
      [0.88, 0.1],
      [0.08, 0.82],
      [0.88, 0.82],
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

  const startExperience = () => {
    if (!hasConfirmedChoice) return;
    if (isStarting || videoStarted) return;
    primeSuspenseAudio();
    setIsStarting(true);
    const suspenseDuration = 5200;
    setTimeout(() => {
      setVideoStarted(true);
      onVideoStart?.();
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.volume = isMuted ? 0 : volume;
          videoRef.current.play().catch((err) => {
            console.log("Play failed:", err);
          });
        }
      }, 100);
      setTimeout(() => {
        setShowInitialTitle(false);
        setIsStarting(false);
      }, 2000);
    }, suspenseDuration);
  };

  useEffect(() => {
    if (videoStarted || isStarting || !showInitialTitle || isPoetryGameOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
      e.preventDefault();
      startExperience();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- déclenchement aligné sur l’écran titre initial uniquement
  }, [videoStarted, isStarting, showInitialTitle, isPoetryGameOpen]);
  // Entr\u00e9e pendant le trailer = passer
  useEffect(() => {
    if (!videoStarted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
      e.preventDefault();
      handleSkip();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [videoStarted]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, videoStarted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
    else setIsMuted(true);
  };

  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) setVolume(0.5);
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    onComplete();
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
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

      {devChapterJumps && (
        <div
          className="pointer-events-auto fixed z-[100] flex flex-col gap-2 rounded-sm border border-solar-gold/25 bg-black/55 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm"
          style={{
            left: "max(0.75rem, env(safe-area-inset-left))",
            bottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <p className="m-0 text-[8px] font-medium uppercase tracking-[0.35em] text-solar-gold/50">
            {ui.shortcuts}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={devChapterJumps.goChapter1}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
            >
              Ch. I
            </button>
            <button
              type="button"
              onClick={devChapterJumps.goChapter2}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
            >
              Ch. II
            </button>
            <button
              type="button"
              onClick={devChapterJumps.goChapter3}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
            >
              Ch. III
            </button>
            <button
              type="button"
              onClick={devChapterJumps.previewCredits}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
              title={copy.introDevPreviewCreditsTitle}
            >
              Crédits
            </button>
          </div>
        </div>
      )}

      {!videoStarted && (
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
                ? "drop-shadow(0 0 14px rgba(197, 160, 89, 0.45))"
                : "drop-shadow(0 0 8px rgba(197, 160, 89, 0.2))",
            }}
            animate={prefersReducedMotion ? undefined : { y: [0, -2, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          >
            S
          </motion.span>
        </motion.button>
      </motion.div>
      )}

      <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {showInitialTitle && (
          <motion.div
            key="initial-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
          >
          {!hasConfirmedChoice && (
            <div className="pointer-events-auto absolute inset-0 z-[35] flex items-center justify-center bg-black/68 px-5">
              <div className="w-full max-w-md border border-solar-gold/35 bg-[#050302]/92 p-6 text-center backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.45em] text-solar-gold/65">{ui.languageTitle}</p>
                <p className="mt-3 text-sm text-solar-gold/85">{ui.languageSubtitle}</p>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => confirmLanguage("fr")}
                    className="border border-solar-gold/35 bg-black/35 px-3 py-2 text-xs uppercase tracking-[0.25em] text-solar-gold transition-colors hover:border-solar-gold/65"
                  >
                    {ui.french}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmLanguage("ar-dz")}
                    className="border border-solar-gold/35 bg-black/35 px-3 py-2 text-xs text-solar-gold transition-colors hover:border-solar-gold/65"
                  >
                    {ui.arabicDz}
                  </button>
                </div>
              </div>
            </div>
          )}
          <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center origin-center will-change-transform"
              animate={{ scale: prefersReducedMotion ? 1 : isStarting ? 1.14 : 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : isStarting ? 2.35 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1]"
                initial={false}
                animate={{ opacity: prefersReducedMotion ? 0 : isStarting ? 1 : 0 }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: "radial-gradient(ellipse 72% 58% at 50% 48%, transparent 0%, rgba(8, 5, 3, 0.08) 45%, rgba(5, 3, 2, 0.72) 100%)" }}
              />

              <motion.div
                animate={{ opacity: isStarting ? 0 : 1 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 z-[-1]"
                >
                <AuroraMeshBackground />
              </motion.div>

            <motion.div
              animate={{
                opacity: isStarting ? 0 : 1,
                y: isStarting ? -28 : 0,
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[2]"
            >
              <AnimatedTitle
                heroMotion
                text="Al-Rihla"
                className={
                  "font-bahlull text-white tracking-tighter italic drop-shadow-[0_0_22px_rgba(197,160,89,0.35)] " +
                  (compactDesktop ? "text-6xl md:text-8xl" : "text-7xl md:text-9xl")
                }
              />
            </motion.div>

            <motion.div
              animate={{ opacity: isStarting ? 0 : 1, y: isStarting ? 40 : 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1.1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className={
                  "mx-auto h-px w-12 origin-center bg-solar-gold/40 " +
                  (compactDesktop ? "mt-6 mb-3" : "mt-10 mb-4")
                }
              />
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className={
                  "text-[10px] font-light uppercase tracking-[0.6em] text-solar-gold " +
                  (compactDesktop ? "mb-8" : "mb-12")
                }
              >
                {copy.introJeanSenacSubtitle}
              </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: isStarting ? 0 : 1,
                y: isStarting ? 48 : 0,
              }}
              transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className={compactDesktop ? "mt-14" : "mt-24"}
            >
            <motion.button
              onClick={startExperience}
              whileTap={{ scale: 0.98 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="group relative flex flex-col items-center gap-6 pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
            >
              <div className="absolute -inset-14 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[0.22,1,0.36,1] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.14)_0%,transparent_68%)] blur-2xl" />

              <div className="relative h-20 w-20 flex items-center justify-center">
                <motion.div
                  aria-hidden
                  className="absolute inset-0"
                  animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
                  transition={{ rotate: { duration: 18, repeat: Infinity, ease: "linear" } }}
                >
                  <motion.div
                    className="absolute inset-0 rotate-45 border border-solar-gold/20 transition-[border-color,box-shadow] duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold/45"
                    animate={prefersReducedMotion ? undefined : { opacity: [0.52, 0.78, 0.52] }}
                    transition={{ duration: 5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                  />
                  <motion.div className="absolute inset-[6px] flex rotate-45 items-center justify-center border border-solar-gold/45 bg-black/40 backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:bg-black/55 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.45)]">
                    <motion.div
                      className="pointer-events-none absolute inset-[7px] -rotate-45 rounded-full border border-dashed border-solar-gold/30 transition-[border-color,opacity] duration-700 group-hover:border-solar-gold/50 group-hover:opacity-100"
                      animate={prefersReducedMotion ? undefined : { opacity: [0.42, 0.72, 0.42] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1], delay: 0.5 }}
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
              </div>

              <motion.p
                className="max-w-[min(92vw,24rem)] text-center text-[9px] font-light uppercase leading-relaxed tracking-[0.38em] text-solar-gold/75 transition-colors duration-500 group-hover:text-solar-gold md:text-[10px] md:tracking-[0.42em]"
                animate={
                  prefersReducedMotion || isStarting
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
                  repeat: prefersReducedMotion || isStarting ? 0 : Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }}
              >
                {introCtaWords.join(" ")}
              </motion.p>
            </motion.button>
            </motion.div>
            </motion.div>
            </motion.div>

            <AnimatePresence>
              {isStarting && !videoStarted && (
                <motion.div
                  key="intro-suspense"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.06 }}
                  transition={{
                    opacity: { duration: prefersReducedMotion ? 0.2 : 0.65, delay: prefersReducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
                  }}
                  className="absolute inset-0 z-[26]"
                >
                  <SuspenseOverlay prefersReducedMotion={prefersReducedMotion ?? false} />
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
      )}

      {videoStarted && (
        <motion.div
          key="video-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full z-10"
        >
          <motion.div
            className="w-full h-full"
          >
            <video
              ref={videoRef}
              onEnded={handleVideoEnd}
              onError={() => setHasError(true)}
              className="h-full w-full cursor-none object-cover"
              muted={isMuted}
              playsInline
              autoPlay
              src={VIDEO_SOURCE}
            />
          </motion.div>

          {/* Volume - toujours visible pendant la vidéo (indépendant du bouton « Passer ») */}
          <AnimatePresence>
            <motion.div
              key="intro-volume"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute top-16 right-16 z-50 flex items-center gap-4 group"
            >
                <div
                  onClick={toggleMute}
                  className="w-10 h-10 border border-solar-gold/40 bg-black/40 backdrop-blur-md rotate-45 flex items-center justify-center cursor-none hover:border-solar-gold transition-colors group-hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                >
                  <div className="-rotate-45 text-white group-hover:text-solar-gold transition-colors">
                    {isMuted || volume === 0 ? <VolumeXIcon width={16} height={16} /> : volume < 0.5 ? <Volume1Icon width={16} height={16} /> : <Volume2Icon width={16} height={16} />}
                  </div>
                </div>
                <div className="w-0 group-hover:w-32 overflow-hidden transition-all duration-700 ease-[0.22,1,0.36,1] flex items-center bg-black/40 backdrop-blur-md rounded-full px-0 group-hover:px-4 h-8 border border-transparent group-hover:border-solar-gold/20">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-0.5 bg-solar-gold/20 rounded-full appearance-none cursor-none accent-solar-gold"
                  />
                </div>
              </motion.div>
          </AnimatePresence>

          {/* Skip */}
          <AnimatePresence>
            {showSkip && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-16 right-16 z-50 pointer-events-auto"
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
                    <div className="relative mt-0.5 h-[2px] w-[min(17rem,72vw)] overflow-hidden rounded-full bg-solar-gold/15">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 8, ease: "linear" }}
                        className="h-full bg-solar-gold/50"
                      />
                    </div>
                  </div>
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
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
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
      </div>
    </>
  );
}