import { useState, useEffect, useRef, useCallback, lazy, Suspense, useMemo } from "react";
import { Settings } from "lucide-react";
import { ReactLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";

import Intro from "./components/Intro";
const AlgeriaMap = lazy(() => import("./components/Immersive/AlgeriaMap"));
const Act2 = lazy(() => import("./components/Immersive/Act2"));
import CustomCursor from "./components/ui/CustomCursor";
import GrainOverlay from "./components/ui/GrainOverlay";
import CinematicOverlay from "./components/CinematicOverlay";
import Soundscape from "./components/Soundscape";
import SplashCursor from "./components/SplashCursor";
import SystemMenu from "./components/ui/SystemMenu";
import OrientationPanel from "./components/ui/OrientationPanel";
import ChapterCompleteToast from "./components/ui/ChapterCompleteToast";
import IntroVideoOverlay from "./components/ui/IntroVideoOverlay";
import HintPanel from "./components/ui/HintPanel";
import ScrollNudge from "./components/ui/ScrollNudge";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import type { Act1QuestProgress, Act2QuestProgress } from "./components/ui/HintPanel";
import type { Act1QuestStep } from "./components/Immersive/AlgeriaMap";
import { useCursorStore } from "./hooks/useCursorContext";
import { useMasterVolumeStore } from "./stores/masterVolumeStore";

/** Page statique parchemin (ch. II / III) - respecte `import.meta.env.BASE_URL` (déploiement sous sous-chemin). */
function parcheminSenacHref(hash: string) {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const h = hash.startsWith("#") ? hash : `#${hash}`;
  return `${prefix}parchemin-senac.html${h}`;
}

export default function App() {
  const phaseRef = useRef<"intro" | "act1" | "act2">("intro");
  const [phase, setPhase] = useState<"intro" | "act1" | "act2">("intro");
  const [videoStarted, setVideoStarted] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [introVideoOpen, setIntroVideoOpen] = useState(false);
  const [introVideoNonce, setIntroVideoNonce] = useState(0);
  const [chapterToast, setChapterToast] = useState(false);
  const [chapterDaTransition, setChapterDaTransition] = useState(false);
  const [revelationCount, setRevelationCount] = useState(0);
  /** Rail Parcours : ouvert / replié (animation GSAP dans OrientationPanel). */
  const [parcoursOpen, setParcoursOpen] = useState(false);
  const [act1Quest, setAct1Quest] = useState<Act1QuestProgress>({
    hover: false,
    clickWord: false,
    zoom: false,
  });
  const [act2Quest, setAct2Quest] = useState<Act2QuestProgress>({
    scroll: false,
  });
  const showDevChapterJumps = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

  const pendingAct2 = useRef(false);
  const setCursorAmbient = useCursorStore((s) => s.setAmbient);
  const masterVolume = useMasterVolumeStore((s) => s.volume);
  const playbackUnlocked = useMasterVolumeStore((s) => s.playbackUnlocked);
  /** Ton UI acte II (iframe parchemin) : solaire en haut, minuit après défile - via `senac-chrome`. */
  const [act2ParcheminTone, setAct2ParcheminTone] = useState<"solar" | "midnight" | null>(null);

  const act2AmbientMidnight =
    phase === "act2" && (act2ParcheminTone ?? "solar") === "midnight";

  phaseRef.current = phase;

  useEffect(() => {
    if (phase !== "act2") setAct2ParcheminTone(null);
  }, [phase]);

  useEffect(() => {
    const theme = act2AmbientMidnight ? "midnight" : "solar";
    setCursorAmbient(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [phase, act2AmbientMidnight, setCursorAmbient]);

  /** Ratio scroll parchemin (postMessage depuis l’iframe) — même barre en z élevée au-dessus du rail. */
  const [senacIframeScrollRatio, setSenacIframeScrollRatio] = useState(0);

  useEffect(() => {
    if (phase !== "act2") setSenacIframeScrollRatio(0);
  }, [phase]);

  /** Relais volume menu pause -> iframe acte II (musique locale parchemin). */
  useEffect(() => {
    if (phase !== "act2") return;
    const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
    if (!(iframe instanceof HTMLIFrameElement)) return;
    const payload = {
      type: "senac-audio" as const,
      volume: Math.min(1, Math.max(0, masterVolume)),
      unlocked: playbackUnlocked,
    };
    const post = () => {
      try {
        iframe.contentWindow?.postMessage(payload, window.location.origin);
      } catch {
        /* ignore */
      }
    };
    post();
    const t1 = window.setTimeout(post, 500);
    const t2 = window.setTimeout(post, 1500);
    try {
      iframe.addEventListener("load", post, { once: true });
    } catch {}
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      try {
        iframe.removeEventListener("load", post);
      } catch {}
    };
  }, [phase, masterVolume, playbackUnlocked]);

  /** Délai avant le toast : laisser voir la carte + fond « célébration » sans masque plein écran. */
  const CHAPTER_TOAST_DELAY_MS = 3200;
  /** Durée lecture toast + sortie avant acte II */
  const CHAPTER_TOAST_VISIBLE_MS = 5200;
  /** Fondu DA : doré désert -> bleu nuit saharien avant le chapitre II. */
  const CHAPTER_DA_TRANSITION_MS = 2600;
  const CHAPTER_DA_PHASE_SWAP_MS = 1550;

  const handleMemoryMapComplete = useCallback(() => {
    pendingAct2.current = true;
    window.setTimeout(() => {
      setChapterToast(true);
    }, CHAPTER_TOAST_DELAY_MS);
    window.setTimeout(() => {
      setChapterToast(false);
      if (pendingAct2.current) {
        setChapterDaTransition(true);
        window.setTimeout(() => {
          if (pendingAct2.current) {
            setPhase("act2");
            pendingAct2.current = false;
          }
        }, CHAPTER_DA_PHASE_SWAP_MS);
        window.setTimeout(() => {
          setChapterDaTransition(false);
        }, CHAPTER_DA_TRANSITION_MS);
      }
    }, CHAPTER_TOAST_DELAY_MS + CHAPTER_TOAST_VISIBLE_MS);
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

  const onAct1QuestStep = useCallback((step: Act1QuestStep) => {
    setAct1Quest((p) => (p[step] ? p : { ...p, [step]: true }));
  }, []);

  /** Acte I carte : Lenis sans lissage molette (zoom molette précis sur le canvas). Autres phases : glide doux. */
  const lenisOptions = useMemo(
    () =>
      phase === "act1"
        ? { lerp: 0.12, duration: 1.2, smoothWheel: false }
        : {
            lerp: 0.068,
            duration: 1.82,
            smoothWheel: true,
            wheelMultiplier: 0.92,
          },
    [phase]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (introVideoOpen) {
        e.preventDefault();
        setIntroVideoOpen(false);
        return;
      }
      if (chapterToast || chapterDaTransition) {
        e.preventDefault();
        return;
      }
      if (systemMenuOpen) {
        e.preventDefault();
        setSystemMenuOpen(false);
        return;
      }
      if (parcoursOpen && phase !== "intro") {
        e.preventDefault();
        setParcoursOpen(false);
        return;
      }
      if (phase === "intro") return;
      e.preventDefault();
      setSystemMenuOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [systemMenuOpen, chapterToast, chapterDaTransition, phase, introVideoOpen, parcoursOpen]);

  /** Rail Parcours ouvert : la molette / le trackpad le referme (comme un clic sur le voile). */
  useEffect(() => {
    if (!parcoursOpen || phase === "intro") return;
    const onWheel = () => setParcoursOpen(false);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [parcoursOpen, phase]);

  /**
   * Acte II : iframe - relais souris + progression « Défilez » (postMessage).
   */
  useEffect(() => {
    if (phase !== "act2") return;
    const expectedOrigin = window.location.origin;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      const d = e.data as Record<string, unknown>;
      if (d?.type === "senac-scroll-progress") {
        const ratio = typeof d.ratio === "number" ? d.ratio : NaN;
        if (phaseRef.current === "act2" && Number.isFinite(ratio)) {
          setSenacIframeScrollRatio(Math.min(1, Math.max(0, ratio)));
        }
        return;
      }
      if (e.data?.type === "senac-quest") {
        const step = e.data.step as string;
        if (step === "scroll") {
          setAct2Quest((p) => (p.scroll ? p : { ...p, scroll: true }));
        }
        return;
      }
      if (e.data?.type === "senac-chrome") {
        const mode = e.data.mode as string;
        if (mode === "midnight" || mode === "solar") {
          setAct2ParcheminTone(mode);
        }
        return;
      }
      if (e.data?.type !== "senac-pointer") return;
      const x = e.data.x as number;
      const y = e.data.y as number;
      if (typeof x !== "number" || typeof y !== "number") return;
      const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
      let gx = x;
      let gy = y;
      if (iframe instanceof HTMLIFrameElement) {
        const r = iframe.getBoundingClientRect();
        gx = x + r.left;
        gy = y + r.top;
      }
      window.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: gx,
          clientY: gy,
          bubbles: true,
          view: window,
        })
      );
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: gx,
          clientY: gy,
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          view: window,
        })
      );
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [phase]);

  return (
    <>
    <ReactLenis root options={lenisOptions}>
      <GrainOverlay opacity={0.04} />
      <CinematicOverlay />
      <Soundscape enabled={phase !== "act2"} />

      <AnimatePresence mode="sync">
        {chapterToast && (
          <ChapterCompleteToast
            key="ch1-toast"
            chapterTitle="La Naissance"
            subtitle="Les cinq feux sont rallumés - la carte respire. Le voyage continue."
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {chapterDaTransition && <ChapterDaTransition />}
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

      {/* Backdrop invisible - ferme le rail Parcours si on clique à côté */}
      {parcoursOpen && phase !== "intro" && (
        <div
          className="fixed inset-0 z-[39] pointer-events-auto"
          onClick={() => setParcoursOpen(false)}
          aria-hidden
        />
      )}

      {phase !== "intro" && (
        <>
          <motion.button
            type="button"
            onClick={() => setSystemMenuOpen(true)}
            whileHover="hovered"
            initial="idle"
            className={
              "group pointer-events-auto fixed z-[40] flex items-center justify-center rounded-[2px] p-2.5 backdrop-blur-sm transition-[border-color,background-color,box-shadow,filter,color] duration-300 focus-visible:outline-none focus-visible:ring-1 left-[max(1.25rem,calc(env(safe-area-inset-left)+0.5rem))] top-[max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))] md:left-[max(2rem,calc(env(safe-area-inset-left)+1rem))] md:top-[max(1.75rem,calc(env(safe-area-inset-top)+0.75rem))] " +
              (phase === "act2" && act2AmbientMidnight
                ? "border border-[rgba(139,213,255,0.34)] bg-[rgba(3,12,34,0.55)] shadow-[0_6px_28px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(180,218,255,0.06),0_0_28px_rgba(72,148,230,0.09)] hover:border-[rgba(155,226,255,0.5)] hover:bg-[rgba(5,18,42,0.68)] hover:shadow-[0_8px_34px_rgba(0,0,0,0.58),0_0_40px_rgba(90,168,255,0.13)] active:brightness-[0.97] focus-visible:ring-[rgba(148,206,255,0.4)]"
                : "border border-[color:rgba(197,160,89,0.38)] bg-[rgba(0,0,0,0.48)] shadow-[0_6px_28px_rgba(0,0,0,0.45),0_0_28px_rgba(197,160,89,0.18)] hover:border-[color:rgba(197,160,89,0.55)] hover:bg-black/58 hover:shadow-[0_8px_32px_rgba(0,0,0,0.52),0_0_34px_rgba(197,160,89,0.28)] focus-visible:ring-[color:rgba(197,160,89,0.45)]")
            }
            aria-haspopup="dialog"
            aria-expanded={systemMenuOpen}
            aria-label="Menu - options et pause"
          >
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[2px]"
              variants={{
                idle: { opacity: 0, scale: 0.8 },
                hovered: { opacity: 1, scale: 1 },
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={
                phase === "act2" && act2AmbientMidnight
                  ? {
                      background:
                        "radial-gradient(circle at 50% 50%, rgba(100,172,235,0.16) 0%, transparent 58%, rgba(197,160,89,0.05) 100%)",
                      filter: "blur(7px)",
                    }
                  : {
                      background: "radial-gradient(circle at 50% 50%, rgba(197,160,89,0.2) 0%, transparent 75%)",
                      filter: "blur(6px)",
                    }
              }
            />
            <motion.span
              className={
                "relative flex items-center justify-center transition-[color,filter] duration-300 " +
                (phase === "act2" && act2AmbientMidnight
                  ? "text-[rgba(198,226,252,0.92)] group-hover:text-[#f0ebd4] group-hover:drop-shadow-[0_0_14px_rgba(120,185,255,0.45)]"
                  : "text-[rgba(229,206,154,0.95)] group-hover:text-[#fdf8ee] group-hover:drop-shadow-[0_0_12px_rgba(197,160,89,0.55)]")
              }
              variants={{
                idle: { rotate: 0, scale: 1 },
                hovered: { rotate: 90, scale: 1.12 },
              }}
              transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Settings className="h-5 w-5" strokeWidth={1.25} aria-hidden />
            </motion.span>
          </motion.button>
          <OrientationPanel
            phase={phase}
            revelationCount={revelationCount}
            expanded={parcoursOpen}
            onExpandedChange={setParcoursOpen}
            parcoursRailMidnight={
              phase === "act2" ? (act2ParcheminTone ?? "solar") === "midnight" : false
            }
          />
        </>
      )}

      {!systemMenuOpen && !introVideoOpen && (
        <HintPanel
          phase={phase}
          act1Quest={phase === "act1" ? act1Quest : undefined}
          act2Quest={phase === "act2" ? act2Quest : undefined}
        />
      )}

      {/* Nudge scroll - acte I uniquement, se démonte quand on quitte l'acte */}
      {phase === "act1" && !systemMenuOpen && !introVideoOpen && (
        <ScrollNudge key="scroll-nudge-act1" />
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
                devChapterJumps={
                  showDevChapterJumps
                    ? {
                        goChapter1: () => setPhase("act1"),
                        goChapter2: () => setPhase("act2"),
                        goChapter3: () => {
                          window.location.assign(parcheminSenacHref("chapitre-3"));
                        },
                      }
                    : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "act1" && (
          <motion.div
            key="act1"
            className="fixed inset-0 z-20 overflow-x-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <Suspense
              fallback={
                <div
                  className="fixed inset-0 bg-[#080604]"
                  style={{ background: "#080604" }}
                  aria-hidden
                />
              }
            >
              <AlgeriaMap
                onRevelationProgress={setRevelationCount}
                onMemoryMapComplete={handleMemoryMapComplete}
                onQuestStepComplete={onAct1QuestStep}
                parcoursRailExpanded={parcoursOpen}
              />
            </Suspense>
          </motion.div>
        )}

        {phase === "act2" && (
          <motion.div
            key="act2"
            className="fixed inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <Suspense fallback={<div className="fixed inset-0 bg-[#0a0806]" aria-hidden />}>
              <Act2 />
            </Suspense>
          </motion.div>
        )}
      </main>

      {/* Acte II : iframe parchemin a sa propre barre (--senac-scroll-progress) ; ici elle serait au-dessus et à ~0 %. */}
      <ScrollProgressBar
        tone={act2AmbientMidnight ? "midnight" : "solar"}
        iframeFillRatio={phase === "act2" ? senacIframeScrollRatio : undefined}
        aboveChrome={phase === "act2"}
      />
    </ReactLenis>
      {/* Hors Lenis - fluide + curseur : en acte II, coords relayées depuis l’iframe (postMessage). */}
      <div style={{ visibility: systemMenuOpen || introVideoOpen ? "hidden" : "visible" }}>
        <SplashCursor
          key={phase === "act1" ? "splash-act1" : phase === "act2" ? "splash-act2" : "splash-default"}
          syncPaletteFromAmbient
          SIM_RESOLUTION={phase === "act1" ? 128 : 160}
          DYE_RESOLUTION={phase === "act1" ? 512 : 720}
          DENSITY_DISSIPATION={phase === "act1" ? 12 : 10}
          VELOCITY_DISSIPATION={5}
          PRESSURE={0.1}
          CURL={10}
          SPLAT_RADIUS={0.05}
          SPLAT_FORCE={phase === "act1" ? 9000 : 12000}
          COLOR_UPDATE_SPEED={10}
        />
      </div>
      <CustomCursor overlayOpen={systemMenuOpen || introVideoOpen} />
    </>
  );
}

function ChapterDaTransition() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed inset-0 z-[205] flex items-center justify-center overflow-hidden bg-[#02040c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(18px)" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(197,160,89,0.28), transparent 58%), linear-gradient(180deg, #130d07 0%, #070503 100%)",
        }}
        animate={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 32%, rgba(90,168,255,0.32), transparent 62%), radial-gradient(ellipse 45% 35% at 70% 58%, rgba(197,160,89,0.12), transparent 64%), linear-gradient(180deg, #041331 0%, #01030a 100%)",
        }}
        transition={{ duration: 2.15, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-35 mix-blend-screen"
        style={{
          backgroundImage:
            "url('https://grainy-gradients.vercel.app/noise.svg'), radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12), transparent 45%)",
          backgroundSize: "240px, 100% 100%",
        }}
        animate={{ x: ["0%", "-2%", "1%", "0%"], y: ["0%", "1%", "-1%", "0%"] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ead7a4] shadow-[0_0_36px_rgba(234,215,164,0.55),0_0_70px_rgba(90,168,255,0.26)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 0.7], opacity: [0, 1, 0.55] }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[120vw] origin-left"
        style={{
          background:
            "linear-gradient(100deg, transparent 0%, rgba(234,215,164,0.0) 20%, rgba(234,215,164,0.28) 38%, rgba(90,168,255,0.46) 52%, rgba(4,19,49,0.96) 66%, #01030a 100%)",
          filter: "blur(0.5px)",
        }}
        initial={{ x: "-115%", skewX: -9 }}
        animate={{ x: "18%", skewX: 0 }}
        transition={{ duration: 1.85, ease: [0.7, 0, 0.2, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute h-[42rem] w-[42rem] rounded-full border border-[#79b7ff]/18"
        initial={{ scale: 0.35, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.35, 1.15, 1.38], opacity: [0, 0.55, 0], rotate: 80 }}
        transition={{ duration: 2.3, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute h-[27rem] w-[27rem] rounded-full border border-[#ead7a4]/18"
        initial={{ scale: 0.6, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.6, 1.3, 1.65], opacity: [0, 0.45, 0], rotate: -110 }}
        transition={{ duration: 2.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="relative z-10 max-w-xl px-6 text-center"
        initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
        animate={{ opacity: [0, 1, 1, 0], y: [28, 0, 0, -16], filter: ["blur(14px)", "blur(0px)", "blur(0px)", "blur(10px)"] }}
        transition={{ duration: 2.35, times: [0, 0.28, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[10px] uppercase tracking-[0.6em] text-[#ead7a4]/55">Changement de ciel</p>
        <h2
          className="font-bahlull mt-4 text-4xl italic text-white md:text-6xl"
          style={{ textShadow: "0 0 70px rgba(90,168,255,0.34), 0 0 44px rgba(197,160,89,0.18)" }}
        >
          La nuit s'ouvre
        </h2>
        <p className="mx-auto mt-5 max-w-md font-serif text-lg italic leading-relaxed text-[#ead7a4]/65">
          Le désert quitte l'or chaud. Le fil devient constellation.
        </p>
      </motion.div>
    </motion.div>
  );
}
