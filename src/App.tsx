import { useState, useEffect, useRef, useCallback } from "react";
import { ReactLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";

import Intro from "./components/Intro";
import AlgeriaMap from "./components/Immersive/AlgeriaMap";
import Act2 from "./components/Immersive/Act2";
import CustomCursor from "./components/ui/CustomCursor";
import GrainOverlay from "./components/ui/GrainOverlay";
import CinematicOverlay from "./components/CinematicOverlay";
import Soundscape from "./components/Soundscape";
import SplashCursor from "./components/SplashCursor";
import SystemMenu from "./components/ui/SystemMenu";
import OrientationPanel from "./components/ui/OrientationPanel";
import ChapterCompleteToast from "./components/ui/ChapterCompleteToast";
import IntroVideoOverlay from "./components/ui/IntroVideoOverlay";

export default function App() {
  const [phase, setPhase] = useState<"intro" | "act1" | "act2">("intro");
  const [videoStarted, setVideoStarted] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [introVideoOpen, setIntroVideoOpen] = useState(false);
  const [introVideoNonce, setIntroVideoNonce] = useState(0);
  const [chapterToast, setChapterToast] = useState(false);
  const [revelationCount, setRevelationCount] = useState(0);

  const escapePriorityRef = useRef<(() => boolean) | null>(null);
  const pendingAct2 = useRef(false);

  const handleMemoryMapComplete = useCallback(() => {
    setChapterToast(true);
    pendingAct2.current = true;
    window.setTimeout(() => {
      setChapterToast(false);
      if (pendingAct2.current) {
        setPhase("act2");
        pendingAct2.current = false;
      }
    }, 3200);
  }, []);

  /** Surcouche vidéo uniquement : ne change pas la phase, ne recharge pas, garde carte / acte. */
  const openIntroVideoOverlay = useCallback(() => {
    setSystemMenuOpen(false);
    setIntroVideoNonce((n) => n + 1);
    setIntroVideoOpen(true);
  }, []);

  const restartExperience = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (escapePriorityRef.current?.()) {
        e.preventDefault();
        return;
      }
      if (introVideoOpen) {
        e.preventDefault();
        setIntroVideoOpen(false);
        return;
      }
      if (chapterToast) {
        e.preventDefault();
        return;
      }
      if (systemMenuOpen) {
        e.preventDefault();
        setSystemMenuOpen(false);
        return;
      }
      if (phase === "intro") return;
      e.preventDefault();
      setSystemMenuOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [systemMenuOpen, chapterToast, phase, introVideoOpen]);

  return (
    <>
      {/* Hors Lenis : portail sur document.body pour rester toujours visible */}
      <CustomCursor />
    <ReactLenis root options={{ lerp: 0.06, duration: 1.8, smoothWheel: true }}>
      <GrainOverlay opacity={0.04} />
      <CinematicOverlay videoStarted={videoStarted} />
      <Soundscape />
      <SplashCursor
        SIM_RESOLUTION={256}
        DYE_RESOLUTION={1024}
        DENSITY_DISSIPATION={10}
        VELOCITY_DISSIPATION={5}
        PRESSURE={0.1}
        CURL={10}
        SPLAT_RADIUS={0.05}
        SPLAT_FORCE={12000}
        COLOR_UPDATE_SPEED={10}
      />

      <AnimatePresence mode="sync">
        {chapterToast && (
          <ChapterCompleteToast
            key="ch1-toast"
            chapterTitle="La Naissance"
            subtitle="Les cinq feux sont rallumés — la carte respire. Le voyage continue."
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {introVideoOpen && (
          <IntroVideoOverlay
            key={`intro-video-${introVideoNonce}`}
            onClose={() => setIntroVideoOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {systemMenuOpen && (
          <SystemMenu
            key="sysmenu"
            onClose={() => setSystemMenuOpen(false)}
            onReplayIntroVideo={openIntroVideoOverlay}
            onRestartExperience={restartExperience}
          />
        )}
      </AnimatePresence>

      {phase !== "intro" && (
        <>
          <button
            type="button"
            onClick={() => setSystemMenuOpen(true)}
            className="pointer-events-auto fixed left-0 top-0 z-[40] m-[max(0.65rem,env(safe-area-inset-left))] mt-[max(0.65rem,env(safe-area-inset-top))] border border-solar-gold/18 bg-[#060504]/55 px-3 py-1.5 text-[7px] font-medium uppercase tracking-[0.42em] text-solar-gold/55 backdrop-blur-md transition-[color,background-color,border-color] hover:border-solar-gold/28 hover:bg-[#080705]/70 hover:text-solar-gold/75"
            aria-haspopup="dialog"
            aria-expanded={systemMenuOpen}
            aria-label="Ouvrir le menu pause"
          >
            Menu
          </button>
          <OrientationPanel phase={phase} revelationCount={revelationCount} />
        </>
      )}

      <main className="relative w-full min-h-screen" style={{ background: "#0a0806" }}>
        <AnimatePresence>
          {phase === "intro" && (
            <motion.div
              key={`intro-${introKey}`}
              className="fixed inset-0 z-20"
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <Intro
                onComplete={() => setPhase("act1")}
                onVideoStart={() => setVideoStarted(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "act1" && (
          <motion.div
            key="act1"
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <AlgeriaMap
              escapePriorityRef={escapePriorityRef}
              onRevelationProgress={setRevelationCount}
              onMemoryMapComplete={handleMemoryMapComplete}
            />
          </motion.div>
        )}

        {phase === "act2" && (
          <motion.div
            key="act2"
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <Act2 />
          </motion.div>
        )}
      </main>
    </ReactLenis>
    </>
  );
}
