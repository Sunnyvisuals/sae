import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { Play, Volume2, VolumeX, ChevronDown, Volume1, Compass } from "lucide-react";
import PoetryGame from "./PoetryGame";
import AuroraMeshBackground from "./AuroraMeshBackground";

// --- CONFIGURATION VIDÉO ---
const VIDEO_SOURCE = "/al-rihla.mp4"; 

type AnimatedTitleProps = {
  text: string;
  className?: string;
  /** Parallax léger + lueur au curseur (écran d’accueil). Désactiver pour les titres longs. */
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

interface IntroProps {
  onComplete: () => void;
  onReplay?: () => void;
  isExploring?: boolean;
  onVideoStart?: () => void;
}

export default function Intro({ onComplete, onReplay, isExploring, onVideoStart }: IntroProps) {
  const { scrollYProgress } = useScroll();
  const introOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const introScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.05]);
  const introBlur = useTransform(scrollYProgress, [0, 0.2], ["blur(0px)", "blur(20px)"]);
  const [videoStarted, setVideoStarted] = useState(false);
  const [showInitialTitle, setShowInitialTitle] = useState(true);
  const [showFinalTitle, setShowFinalTitle] = useState(false);
  const [volume, setVolume] = useState(0.1); // Start at 10%
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [isAttemptingScroll, setIsAttemptingScroll] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPoetryGameOpen, setIsPoetryGameOpen] = useState(false);
  const [isEasterEggFound, setIsEasterEggFound] = useState(false);
  /** Masque le libellé « Fragment de Sénac » après fermeture du jeu ou lecture vidéo */
  const [easterEggPromptHidden, setEasterEggPromptHidden] = useState(false);
  const [easterEggPos, setEasterEggPos] = useState({ top: "20%", left: "80%" });
  /** Évite tout flash « Continuer l'exploration » pendant un replay */
  const [suppressPostVideoUI, setSuppressPostVideoUI] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoStarted && isEasterEggFound) {
      setEasterEggPromptHidden(true);
    }
  }, [videoStarted, isEasterEggFound]);

  // Randomize easter egg position on mount
  useEffect(() => {
    const randomTop = Math.floor(Math.random() * 60 + 20) + "%"; // Between 20% and 80%
    const randomLeft = Math.floor(Math.random() * 60 + 20) + "%"; // Between 20% and 80%
    setEasterEggPos({ top: randomTop, left: randomLeft });
  }, []);

  // Detect scroll attempts to guide the user
  useEffect(() => {
    const handleScrollAttempt = (e: WheelEvent | TouchEvent) => {
      if (videoEnded && !showInitialTitle) {
        setIsAttemptingScroll(true);
        // If the user scrolls after the video ends, we trigger the exploration mode
        if (!isExploring) {
          onComplete();
        }
        setTimeout(() => setIsAttemptingScroll(false), 500);
      }
    };

    window.addEventListener("wheel", handleScrollAttempt);
    window.addEventListener("touchmove", handleScrollAttempt);
    return () => {
      window.removeEventListener("wheel", handleScrollAttempt);
      window.removeEventListener("touchmove", handleScrollAttempt);
    };
  }, [videoEnded, showInitialTitle]);

  // Handle Skip Notification Timing
  useEffect(() => {
    if (videoStarted && !videoEnded) {
      const showTimer = setTimeout(() => setShowSkip(true), 4000); // Show after 4s
      const hideTimer = setTimeout(() => setShowSkip(false), 12000); // Hide after 8s of visibility
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShowSkip(false);
    }
  }, [videoStarted, videoEnded]);

  const startExperience = () => {
    setIsStarting(true);
    
    // Suspense duration: Title remains alone on screen while background fades
    const suspenseDuration = 2500; 

    setTimeout(() => {
      setVideoStarted(true);
      onVideoStart?.();
      
      // Small delay to ensure video element is mounted before calling play()
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.log("Play failed:", err);
          });
          
          // Audio fade in
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

      // Delay hiding the title to overlap with the video fade-in (fondu)
      setTimeout(() => {
        setShowInitialTitle(false);
        setIsStarting(false);
      }, 2000); 
    }, suspenseDuration);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showInitialTitle) {
        // Auto-start if user hasn't clicked, but might be muted by browser
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [showInitialTitle]);

  useEffect(() => {
    if (videoStarted && videoRef.current) {
      videoRef.current.volume = volume;
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (err) {
          console.log("Autoplay bloqué:", err);
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
    setSuppressPostVideoUI(false);
    setShowFinalTitle(true);
    setVideoEnded(true);
    setShowSkip(false);
  };

  const handleSkip = () => {
    setIsResetting(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = videoRef.current.duration;
        handleVideoEnd();
      }
      setIsResetting(false);
    }, 800);
  };

  const handleReplay = () => {
    setSuppressPostVideoUI(true);
    setIsResetting(true);
    setVideoEnded(false);
    setShowFinalTitle(false);
    onReplay?.();
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        void videoRef.current.play();
      }
      setIsResetting(false);
      /* Garde l’UI de fin masquée le temps que la lecture reparte (évite flash AnimatePresence) */
      setTimeout(() => setSuppressPostVideoUI(false), 400);
    }, 1000);
  };

  return (
    <>
      {/* Poetry Game Modal */}
      <PoetryGame
        isOpen={isPoetryGameOpen}
        onClose={() => {
          setIsPoetryGameOpen(false);
          setEasterEggPromptHidden(true);
        }}
      />

      {/* Œuf de Pâques : uniquement avant la vidéo (sinon z-60 au-dessus du lecteur) */}
      {!videoStarted && (
      <motion.div 
        className="fixed z-[60] flex items-center gap-4 group"
        style={{ 
          top: easterEggPos.top, 
          left: easterEggPos.left,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5, duration: 2 }}
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
              <span className="relative z-10">Fragment de Sénac</span>
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ 
            scale: 1.2, 
            rotate: 225, 
            backgroundColor: "rgba(197, 160, 89, 0.2)",
            borderColor: "rgba(197, 160, 89, 0.8)"
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isEasterEggFound) {
              setIsPoetryGameOpen(true);
            } else {
              setIsEasterEggFound(true);
            }
          }}
          className={`transition-all duration-700 rotate-45 border
            ${isEasterEggFound 
              ? "w-10 h-10 bg-solar-gold border-solar-gold shadow-[0_0_30px_rgba(197,160,89,0.6)] opacity-100" 
              : "w-32 h-32 border-transparent opacity-0 group-hover:opacity-100 group-hover:border-solar-gold/20"}`}
          title={isEasterEggFound ? "Ouvrir le jeu" : "Un secret est caché ici..."}
        >
          {!isEasterEggFound && (
            <div className="absolute inset-0 flex items-center justify-center -rotate-45">
               <div className="w-1 h-1 bg-solar-gold/20 rounded-full blur-[1px] animate-pulse" />
            </div>
          )}
        </motion.button>
      </motion.div>
      )}

      <motion.div 
      style={{ 
        opacity: isExploring ? introOpacity : 1,
        scale: isExploring ? introScale : 1,
        filter: isExploring ? introBlur : "blur(0px)"
      }}
      className="relative h-full w-full overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence>
        {showInitialTitle && (
          <motion.div
            key="initial-title"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(30px)", scale: 1.15 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          >
            {/* Fond interactif (mesh) — remplace le marron statique + WebGL */}
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
                Jean Sénac
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
              className="group relative flex flex-col items-center gap-6 pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
            >
              {/* Halo discret — même logique que le contrôle volume */}
              <div className="absolute -inset-14 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[0.22,1,0.36,1] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.14)_0%,transparent_68%)] blur-2xl" />

              {/* Losange type « monolithe son » : statique, lueur au survol */}
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div
                  aria-hidden
                  className="absolute inset-0 rotate-45 border border-solar-gold/20 transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold/45"
                />
                <div
                  className="absolute inset-[6px] flex rotate-45 items-center justify-center border border-solar-gold/45 bg-black/40 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:bg-black/55 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.45)]"
                >
                  <div className="pointer-events-none absolute inset-[7px] -rotate-45 rounded-full border border-dashed border-solar-gold/25 opacity-60 transition-all duration-700 group-hover:border-solar-gold/45 group-hover:opacity-100" />
                  <Play className="-rotate-45 h-6 w-6 fill-white text-white transition-colors duration-500 group-hover:fill-solar-gold group-hover:text-solar-gold" />
                </div>
              </div>

              <div className="flex w-full max-w-[min(100vw,18rem)] flex-col items-center gap-2">
                <span className="text-[10px] font-light uppercase tracking-[0.6em] text-solar-gold/60 transition-colors duration-500 group-hover:text-solar-gold">
                  Commencer le voyage
                </span>
                {/* Ligne qui se révèle au centre — même easing que le slider volume */}
                <div className="flex h-px w-full justify-center overflow-hidden">
                  <div className="h-full w-0 bg-solar-gold/65 transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:w-4/5 max-w-[11rem]" />
                </div>
              </div>
            </motion.button>
            </motion.div>
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
              animate={{ 
                filter: videoEnded ? "blur(20px) brightness(0.2)" : "blur(0px) brightness(1.1)",
                scale: videoEnded ? 1.15 : 1,
                opacity: videoEnded ? 0.3 : 1
              }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <video
                ref={videoRef}
                onEnded={handleVideoEnd}
                onError={() => setHasError(true)}
                className="w-full h-full object-cover"
                muted={isMuted}
                playsInline
                autoPlay
                src="/al-rihla.mp4"
              />
            </motion.div>
            
            {/* Cinematic Overlays - Gold Tint */}
            <motion.div 
              animate={{ opacity: videoEnded ? 1 : 0.3 }}
              className="absolute inset-0 bg-solar-brown pointer-events-none" 
              style={{ opacity: videoEnded ? 0.9 : 0 }}
            />
            <motion.div 
              animate={{ opacity: videoEnded ? 1 : 0 }}
              className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] pointer-events-none" 
            />

            {/* Volume Control Bar - Monolith Style */}
            <AnimatePresence>
              {!videoEnded && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute top-16 right-16 z-50 flex items-center gap-4 group"
                >
                  {/* Diamond Icon Container - Gold Glow */}
                  <div 
                    onClick={toggleMute}
                    className="w-10 h-10 border border-solar-gold/40 bg-black/40 backdrop-blur-md rotate-45 flex items-center justify-center cursor-pointer hover:border-solar-gold transition-colors group-hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                  >
                    <div className="-rotate-45 text-white group-hover:text-solar-gold transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                    </div>
                  </div>

                  {/* Slider Container */}
                  <div className="w-0 group-hover:w-32 overflow-hidden transition-all duration-700 ease-[0.22,1,0.36,1] flex items-center bg-black/40 backdrop-blur-md rounded-full px-0 group-hover:px-4 h-8 border border-transparent group-hover:border-solar-gold/20">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-0.5 bg-solar-gold/20 rounded-full appearance-none cursor-pointer accent-solar-gold"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip Video Notification - Solar Diamond Style */}
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
                      {/* Piste + progression 8s (inchangée) + réaction hover façon volume */}
                      <div className="relative mt-0.5 h-[2px] w-[min(17rem,72vw)] overflow-hidden rounded-full bg-solar-gold/15">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 8, ease: "linear" }}
                          className="h-full bg-solar-gold/50"
                        />
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_14px_rgba(197,160,89,0.45)]" />
                      </div>
                    </div>

                    {/* Même principe que le bouton volume : losange + lueur, pas de pulse */}
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                      <div
                        className="absolute inset-0 rotate-45 border border-solar-gold/40 bg-black/45 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:shadow-[0_0_18px_rgba(197,160,89,0.5)]"
                      />
                      <div className="relative z-[1] -rotate-45 flex items-center gap-0.5">
                        <motion.span
                          className="block h-1.5 w-1.5 rounded-full bg-solar-gold shadow-[0_0_8px_rgba(197,160,89,0.45)]"
                          animate={{
                            opacity: [0.45, 1, 0.45],
                            scale: [1, 1.22, 1],
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: [0.45, 0, 0.55, 1],
                          }}
                        />
                        <motion.span
                          className="block h-1.5 w-1.5 rounded-full bg-solar-gold/70 shadow-[0_0_6px_rgba(197,160,89,0.3)]"
                          animate={{
                            opacity: [0.35, 0.95, 0.35],
                            scale: [1, 1.18, 1],
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: [0.45, 0, 0.55, 1],
                            delay: 0.45,
                          }}
                        />
                      </div>
                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full rotate-45 text-solar-gold/35 transition-colors duration-500 group-hover:text-solar-gold/55"
                        viewBox="0 0 56 56"
                        aria-hidden
                      >
                        <motion.rect
                          x="3"
                          y="3"
                          width="50"
                          height="50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.85"
                          strokeDasharray="200"
                          initial={{ strokeDashoffset: 200 }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 8, ease: "linear" }}
                        />
                      </svg>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final Title Reappearance - Cinematic Gold */}
            <AnimatePresence>
              {showFinalTitle && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
                >
                  <AnimatedTitle 
                    text="Entrer dans le désert de Sénac" 
                    className="font-bahlull text-4xl md:text-6xl text-white tracking-tight italic drop-shadow-[0_0_30px_rgba(197,160,89,0.4)] text-center px-6"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: 60 }}
                    transition={{ delay: 1, duration: 2 }}
                    className="h-px bg-solar-gold/50 mt-8"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton Play de secours discret si bloqué (pas pendant le reset replay) */}
            {(hasError ||
              (videoRef.current &&
                videoRef.current.paused &&
                !videoEnded &&
                !isResetting)) && (
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleManualPlay}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 z-30 pointer-events-auto"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-20 h-20 border border-solar-gold/40 rotate-45 flex items-center justify-center bg-black/40 backdrop-blur-md"
                >
                  <Play className="-rotate-45 text-solar-gold fill-solar-gold w-8 h-8" />
                </motion.div>
              </motion.button>
            )}

            {/* Indicateur de Scroll une fois fini - Oriental Gold Style */}
            <AnimatePresence mode="wait">
              {videoEnded && !suppressPostVideoUI && (
                <motion.div
                  key="post-video-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="contents"
                >
                  {/* Ingenious Replay Button - Solar Mandala */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 1.5, delay: 2 }}
                    className="absolute top-16 left-16 z-50 flex flex-col items-center gap-3 group pointer-events-auto"
                  >
                    <motion.button
                      onClick={handleReplay}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative w-12 h-12 flex items-center justify-center"
                    >
                      {/* Solar Corona Effect on Hover */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0, 0.3, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-solar-gold rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      />

                      {/* Rotating Mandala Layers */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-solar-gold/30 rounded-full"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-1 border border-dashed border-solar-gold/20 rounded-full"
                      />
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border border-solar-gold/40 border-t-transparent rounded-full"
                      />
                      
                      {/* Replay Icon */}
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="relative z-10 text-solar-gold group-hover:text-white transition-colors duration-500"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                        </svg>
                      </motion.div>

                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-solar-gold/0 group-hover:bg-solar-gold/10 blur-xl rounded-full transition-all duration-500" />
                    </motion.button>
                    
                    <span className="text-[8px] uppercase tracking-[0.4em] text-solar-gold/40 group-hover:text-solar-gold/80 transition-colors duration-500 font-light">
                      Revivre
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2, delay: 1.5 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 cursor-pointer group pointer-events-auto"
                  onClick={onComplete}
                >
                  {/* Gold Shimmer Effect */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1.05, 1],
                      opacity: [0.1, 0.2, 0.15, 0.1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -inset-12 bg-solar-gold/20 blur-[60px] rounded-full pointer-events-none"
                  />

                  {/* Oriental Ornament / Gold Diamond */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ 
                      scale: isAttemptingScroll ? [1, 1.3, 1] : 1,
                      rotate: isAttemptingScroll ? [45, 60, 30, 45] : 45,
                      borderColor: isAttemptingScroll ? "rgba(197, 160, 89, 1)" : "rgba(197, 160, 89, 0.4)",
                      boxShadow: isAttemptingScroll ? "0 0 50px rgba(197, 160, 89, 1)" : "0 0 0px rgba(197, 160, 89, 0)"
                    }}
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: 135,
                      borderColor: "rgba(197, 160, 89, 1)",
                      boxShadow: "0 0 30px rgba(197, 160, 89, 0.6)"
                    }}
                    whileTap={{ scale: 0.9, rotate: 45 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="w-14 h-14 border border-solar-gold/40 mb-6 flex items-center justify-center relative cursor-pointer group/diamond"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-solar-gold rounded-full shadow-[0_0_10px_rgba(197,160,89,1)]" 
                    />
                    
                    {/* Constant Ambient Particles */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={`ambient-${i}`}
                        animate={{ 
                          y: [-10, -25, -40], 
                          x: [0, (i % 2 === 0 ? 7 : -7), (i % 2 === 0 ? 15 : -15)],
                          opacity: [0, 0.6, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 3 + i, 
                          repeat: Infinity, 
                          delay: i * 0.5,
                          ease: "easeOut"
                        }}
                        className="absolute w-1 h-1 bg-solar-gold/40 rounded-full blur-[0.5px]"
                      />
                    ))}

                    {/* Hover Burst Particles */}
                    <div className="absolute inset-0 opacity-0 group-hover/diamond:opacity-100 transition-opacity duration-500">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={`hover-${i}`}
                          animate={{ 
                            x: [0, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100],
                            y: [0, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100],
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0]
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            delay: i * 0.1,
                            ease: "circOut"
                          }}
                          className="absolute top-1/2 left-1/2 w-1 h-1 bg-solar-gold rounded-full blur-[1px]"
                        />
                      ))}
                    </div>

                    {/* Click/Tap Pulse Ring & Burst */}
                    <motion.div
                      whileTap={{ scale: [1, 3], opacity: [0.8, 0] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 border-2 border-solar-gold rounded-full pointer-events-none"
                    />
                    <motion.div
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 border border-solar-gold/30"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, letterSpacing: "1em", filter: "blur(10px)" }}
                    animate={{ opacity: 1, letterSpacing: "0.6em", filter: "blur(0px)" }}
                    transition={{ duration: 2.5, delay: 2.5, ease: "easeOut" }}
                    className="text-center"
                  >
                    <p className="text-white text-[11px] uppercase font-light tracking-[0.6em] mb-4 group-hover:text-solar-gold transition-colors duration-500">
                      Continuer l'exploration
                    </p>
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronDown className="text-solar-gold/60 mx-auto" size={20} />
                    </motion.div>
                  </motion.div>
                </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Reset Flash Overlay */}
      <AnimatePresence>
        {isResetting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 2, 4], opacity: [0, 1, 0] }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-64 h-64 bg-solar-gold rounded-full blur-3xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
