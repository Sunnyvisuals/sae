import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import React, { useState, useEffect, useRef, useId, MouseEvent } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import PoetryGame from "./PoetryGame";
import AuroraMeshBackground from "./AuroraMeshBackground";

// --- CONFIGURATION VIDÉO ---
const VIDEO_SOURCE = "/al-rihla.mp4"; 

type AnimatedTitleProps = {
  text: string;
  className?: string;
  heroMotion?: boolean;
};

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
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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

interface IntroProps {
  onComplete: () => void;
  isExploring?: boolean;
  onVideoStart?: () => void;
}

export default function Intro({ onComplete, isExploring, onVideoStart }: IntroProps) {
  const prefersReducedMotion = useReducedMotion();
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
    if (isStarting || videoStarted) return;
    setIsStarting(true);
    const suspenseDuration = 2500;
    setTimeout(() => {
      setVideoStarted(true);
      onVideoStart?.();
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.log("Play failed:", err);
          });
          videoRef.current.volume = 0;
          let vol = 0;
          const interval = setInterval(() => {
            if (vol < volume) {
              vol += 0.05;
              if (videoRef.current) videoRef.current.volume = Math.min(vol, volume);
            } else {
              clearInterval(interval);
            }
          }, 100);
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

  useEffect(() => {
    if (videoStarted && videoRef.current) {
      videoRef.current.volume = volume;
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (err) {
          console.log("Autoplay bloque:", err);
        }
      };
      playVideo();
    }
  }, [videoStarted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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
      <PoetryGame
        isOpen={isPoetryGameOpen}
        onClose={() => {
          setIsPoetryGameOpen(false);
          setEasterEggPromptHidden(true);
        }}
      />

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
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              onClick={() => setIsPoetryGameOpen(true)}
              className="border border-solar-gold/35 bg-black/50 px-5 py-2.5 text-[10px] uppercase tracking-[0.45em] text-solar-gold shadow-[0_0_18px_rgba(197,160,89,0.15)] backdrop-blur-md transition-all duration-500 hover:border-solar-gold hover:bg-solar-gold/10 hover:shadow-[0_0_24px_rgba(197,160,89,0.25)]"
            >
              <span className="relative z-10">Fragment de Senac</span>
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
          title={isEasterEggFound ? "Ouvrir le jeu" : "Un secret est cache ici..."}
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
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(30px)", scale: 1.08 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
          >
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

            <AnimatedTitle
              heroMotion
              text="Al-Rihla"
              className="font-bahlull text-7xl md:text-9xl text-white tracking-tighter italic drop-shadow-[0_0_22px_rgba(197,160,89,0.35)]"
            />

            <motion.div
              animate={{ opacity: isStarting ? 0 : 1, y: isStarting ? 40 : 0, filter: isStarting ? "blur(10px)" : "blur(0px)" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1.1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto mt-10 mb-4 h-px w-12 origin-center bg-solar-gold/40"
              />
              <motion.p
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="mb-12 text-[10px] font-light uppercase tracking-[0.6em] text-solar-gold"
              >
                Jean Senac
              </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{
                opacity: isStarting ? 0 : 1,
                y: isStarting ? 48 : 0,
                filter: isStarting ? "blur(12px)" : "blur(0px)",
              }}
              transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-24"
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

              <div className="flex w-full max-w-[min(100vw,18rem)] flex-col items-center gap-2">
                <span className="text-[10px] font-light uppercase tracking-[0.6em] text-solar-gold/60 transition-colors duration-500 group-hover:text-solar-gold">
                  Commencer le voyage
                </span>
                <div className="flex h-px w-full justify-center overflow-hidden">
                  <div className="h-full w-0 bg-solar-gold/65 transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:w-4/5 max-w-[11rem]" />
                </div>
              </div>
            </motion.button>
            </motion.div>
          </motion.div>
            </motion.div>

            <motion.div
              aria-hidden={isStarting}
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-[25] px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-6 text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: isStarting ? 0 : 1,
                y: isStarting ? 24 : 0,
              }}
              transition={{
                opacity: { duration: 0.65, delay: isStarting ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 0.65, delay: isStarting ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] },
              }}
            >
              <motion.p
                className="mx-auto max-w-[min(100vw,22rem)] text-[8px] font-light uppercase leading-relaxed tracking-[0.32em] text-solar-gold/50"
                style={{
                  textShadow: "0 0 18px rgba(197,160,89,0.2)",
                }}
                animate={
                  prefersReducedMotion || isStarting
                    ? { opacity: 0.68, y: 0 }
                    : {
                        opacity: [0.4, 0.98, 0.45, 0.98, 0.4],
                        y: [0, -7, 0, -4, 0],
                        textShadow: [
                          "0 0 12px rgba(197,160,89,0.1)",
                          "0 0 32px rgba(197,160,89,0.48)",
                          "0 0 14px rgba(197,160,89,0.15)",
                          "0 0 28px rgba(197,160,89,0.4)",
                          "0 0 12px rgba(197,160,89,0.1)",
                        ],
                      }
                }
                transition={
                  prefersReducedMotion || isStarting
                    ? { duration: 0.3 }
                    : {
                        duration: 3.6,
                        repeat: Infinity,
                        ease: [0.42, 0, 0.58, 1],
                        delay: 1.35,
                      }
                }
              >
                Cliquer ou appuyer sur Entrée
              </motion.p>
            </motion.div>
        </motion.div>
      )}

      {videoStarted && (
        <motion.div
          key="video-container"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
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

          {/* Volume Control */}
          <AnimatePresence>
            {!showSkip && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute top-16 right-16 z-50 flex items-center gap-4 group"
              >
                <div
                  onClick={toggleMute}
                  className="w-10 h-10 border border-solar-gold/40 bg-black/40 backdrop-blur-md rotate-45 flex items-center justify-center cursor-none hover:border-solar-gold transition-colors group-hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                >
                  <div className="-rotate-45 text-white group-hover:text-solar-gold transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
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
            )}
          </AnimatePresence>

          {/* Skip */}
          <AnimatePresence>
            {showSkip && (
              <motion.div
                initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
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
                      Passer l&apos;introduction
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