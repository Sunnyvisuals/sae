import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  lazy,
  Suspense,
  useMemo,
  Fragment,
} from "react";
import { ReactLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";

import Intro from "./components/Intro";
const AlgeriaMap = lazy(() => import("./components/Immersive/AlgeriaMap"));
const Act2 = lazy(() => import("./components/Immersive/Act2"));

const loadOrientationPanelMod = () => import("./components/ui/OrientationPanel");
const OrientationPanel = lazy(() =>
  loadOrientationPanelMod().then((m) => ({ default: m.default }))
);
const ParcoursPanelInnerContent = lazy(() =>
  loadOrientationPanelMod().then((m) => ({ default: m.ParcoursPanelInnerContent }))
);
const SystemMenu = lazy(() => import("./components/ui/SystemMenu"));
const IntroVideoOverlay = lazy(() => import("./components/ui/IntroVideoOverlay"));

import type { SVGProps } from "react";
import type { ParcoursPhaseLabel } from "./components/ui/OrientationPanel";
import CustomCursor from "./components/ui/CustomCursor";
import GrainOverlay from "./components/ui/GrainOverlay";
import CinematicOverlay from "./components/CinematicOverlay";
import Soundscape from "./components/Soundscape";
import SplashCursor from "./components/SplashCursor";
import ChapterCompleteToast from "./components/ui/ChapterCompleteToast";
import HintPanel from "./components/ui/HintPanel";
import ScrollNudge from "./components/ui/ScrollNudge";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import type { Act1QuestProgress, Act2QuestProgress } from "./components/ui/HintPanel";
import type { Act1QuestStep } from "./components/Immersive/AlgeriaMap";
import { useCursorStore } from "./hooks/useCursorContext";
import { useMediaQuery } from "./hooks/useMediaQuery";
import {
  useLanguageStore,
  LANGUAGE_MORPH_IN_MS,
  LANGUAGE_MORPH_OUT_MS,
} from "./stores/languageStore";
import { useAppCopy } from "./hooks/useAppCopy";
import { useMasterVolumeStore } from "./stores/masterVolumeStore";
import { NOISE_DATA_URI } from "./lib/noiseDataUri";
import {
  exitDocumentFullscreen,
  getDocumentFullscreenElement,
  isFullscreenApiSupported,
  requestDocumentFullscreen,
} from "./lib/fullscreenDocument";

/** Page statique parchemin (ch. II / III) - respecte `import.meta.env.BASE_URL` (déploiement sous sous-chemin). */
function parcheminSenacHref(hash: string, options?: { previewCredits?: boolean }) {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const h = hash.startsWith("#") ? hash : `#${hash}`;
  const q = options?.previewCredits ? "?previewCredits=1" : "";
  return `${prefix}parchemin-senac.html${q}${h}`;
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <line x1="4" y1="7"  x2="20" y2="7"  strokeWidth="1.7" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="4" y1="17" x2="20" y2="17" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
  );
}

/** Persistance : traversée complète → navigation libre entre les actes. */
const JOURNEY_REPLAY_STORAGE_KEY = "al-rihla-journey-complete";
const MENU_HINT_SEEN_STORAGE_KEY = "al-rihla-menu-hint-seen";
const EMPTY_ACT1_QUEST: Act1QuestProgress = { hover: false, clickWord: false, zoom: false };
const COMPLETE_ACT1_QUEST: Act1QuestProgress = { hover: true, clickWord: true, zoom: true };
const EMPTY_ACT2_QUEST: Act2QuestProgress = { scroll: false };
const COMPLETE_ACT2_QUEST: Act2QuestProgress = { scroll: true };

function readJourneyReplayUnlocked(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(JOURNEY_REPLAY_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readMenuHintSeen(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(MENU_HINT_SEEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const phaseRef = useRef<"intro" | "act1" | "act2">("intro");
  const [phase, setPhase] = useState<"intro" | "act1" | "act2">("intro");
  const [videoStarted, setVideoStarted] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [menuHintSeen, setMenuHintSeen] = useState(readMenuHintSeen);
  const [menuHintVisible, setMenuHintVisible] = useState(false);
  const [introVideoOpen, setIntroVideoOpen] = useState(false);
  const [introVideoNonce, setIntroVideoNonce] = useState(0);
  const [chapterToast, setChapterToast] = useState(false);
  const [chapterDaTransition, setChapterDaTransition] = useState(false);
  const [revelationCount, setRevelationCount] = useState(() => (readJourneyReplayUnlocked() ? 5 : 0));
  /** Rail Parcours : ouvert / replié (animation GSAP dans OrientationPanel). */
  const [parcoursOpen, setParcoursOpen] = useState(false);
  /** Après Ch. III / générique : retour intro + navigation libre entre actes (Parcours cliquable). */
  const [journeyReplayUnlocked, setJourneyReplayUnlocked] = useState(readJourneyReplayUnlocked);
  const [act1Quest, setAct1Quest] = useState<Act1QuestProgress>(() =>
    readJourneyReplayUnlocked() ? COMPLETE_ACT1_QUEST : EMPTY_ACT1_QUEST
  );
  const [act2Quest, setAct2Quest] = useState<Act2QuestProgress>(() =>
    readJourneyReplayUnlocked() ? COMPLETE_ACT2_QUEST : EMPTY_ACT2_QUEST
  );
  const showDevChapterJumps = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

  const pendingAct2 = useRef(false);
  const setCursorAmbient = useCursorStore((s) => s.setAmbient);
  const masterVolume = useMasterVolumeStore((s) => s.volume);
  const playbackUnlocked = useMasterVolumeStore((s) => s.playbackUnlocked);
  const unlockPlayback = useMasterVolumeStore((s) => s.unlockPlayback);
  const masterVolumeRef = useRef(masterVolume);
  const playbackUnlockedRef = useRef(playbackUnlocked);
  masterVolumeRef.current = masterVolume;
  playbackUnlockedRef.current = playbackUnlocked;
  /** Ton UI acte II (iframe parchemin) : solaire en haut, minuit après défile - via `senac-chrome`. */
  const [act2ParcheminTone, setAct2ParcheminTone] = useState<"solar" | "midnight" | null>(null);
  /** Progression de scroll remontée par l'iframe parchemin pour la barre parent en haut. */
  const [act2ScrollFillRatio, setAct2ScrollFillRatio] = useState<number | undefined>(undefined);

  const act2AmbientMidnight =
    phase === "act2" && (act2ParcheminTone ?? "solar") === "midnight";

  const mdUp = useMediaQuery("(min-width: 768px)");
  /** `(any-pointer: fine)` inclut souris/stylus/trackpad même si `(hover:hover)` est faux sur hybrides. */
  const finePointer = useMediaQuery("(any-pointer: fine)");
  const language = useLanguageStore((s) => s.language);
  const isLanguageMorphing = useLanguageStore((s) => s.isLanguageMorphing);
  const copy = useAppCopy();
  const introVideoPlaying = phase === "intro" && videoStarted;

  /** Palettes du voile langue - alignées acte II minuit sinon doré désert */
  const languageMorphMidnight = phase === "act2" && act2AmbientMidnight;

  phaseRef.current = phase;

  const dismissMenuHint = useCallback(
    (persist = false) => {
      setMenuHintVisible(false);
      if (!persist || menuHintSeen) return;
      setMenuHintSeen(true);
      try {
        window.localStorage.setItem(MENU_HINT_SEEN_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    },
    [menuHintSeen]
  );

  useEffect(() => {
    if (phase !== "act2") {
      setAct2ParcheminTone(null);
      setAct2ScrollFillRatio(undefined);
    }
  }, [phase]);

  useEffect(() => {
    if (
      menuHintSeen ||
      systemMenuOpen ||
      introVideoOpen ||
      chapterDaTransition ||
      phase === "intro"
    ) {
      setMenuHintVisible(false);
      return;
    }
    const t = window.setTimeout(() => setMenuHintVisible(true), 1350);
    return () => window.clearTimeout(t);
  }, [chapterDaTransition, introVideoOpen, menuHintSeen, phase, systemMenuOpen]);

  useEffect(() => {
    if (!menuHintVisible) return;
    const t = window.setTimeout(() => setMenuHintVisible(false), 6800);
    return () => window.clearTimeout(t);
  }, [menuHintVisible]);

  useEffect(() => {
    if (phase !== "intro" && videoStarted) setVideoStarted(false);
  }, [phase, videoStarted]);

  useEffect(() => {
    const theme = act2AmbientMidnight ? "midnight" : "solar";
    setCursorAmbient(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [phase, act2AmbientMidnight, setCursorAmbient]);

  /** Acte I / II : pas de scroll documentaire - évite Lenis + fond body crème qui « fuient » sous la scène fixed. */
  useEffect(() => {
    const rootEl = document.documentElement;
    rootEl.classList.remove("phase-act1-root", "phase-act2-root");
    if (phase === "act1") rootEl.classList.add("phase-act1-root");
    if (phase === "act2") rootEl.classList.add("phase-act2-root");
    return () => {
      rootEl.classList.remove("phase-act1-root", "phase-act2-root");
    };
  }, [phase]);

  useEffect(() => {
    const html = document.documentElement;
    const isArabic = language === "ar-dz";
    html.lang = isArabic ? "ar-DZ" : "fr";
    html.dir = isArabic ? "rtl" : "ltr";
    document.title = isArabic
      ? "الرحلة | تجربة تفاعلية حول جان ساناك"
      : "Al-Rihla | Expérience immersive autour de Jean Sénac";
  }, [language]);

  /** Chunks menu pause + rail Parcours (GSAP) : chargés en idle pour réduire le JS initial sans bloquer le premier rendu. */
  useEffect(() => {
    const prefetch = () => {
      void loadOrientationPanelMod();
      void import("./components/ui/SystemMenu");
      void import("./components/ui/IntroVideoOverlay");
    };
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(prefetch);
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(prefetch, 500);
    return () => clearTimeout(t);
  }, []);

  /** Générique fin de voyage (iframe) : masque le fluide parent et remonte le curseur comme pour l’intro. */
  const [act2VoyageCreditsOpen, setAct2VoyageCreditsOpen] = useState(false);
  /** Aligné synchrone avec les messages iframe (`senac-credits-chrome` avant les `senac-pointer`). */
  const act2VoyageCreditsOpenRef = useRef(false);

  useEffect(() => {
    if (phase !== "act2") {
      setAct2VoyageCreditsOpen(false);
      act2VoyageCreditsOpenRef.current = false;
    }
  }, [phase]);

  act2VoyageCreditsOpenRef.current = act2VoyageCreditsOpen;

  /** Déverrouille l'audio au premier geste utilisateur (autoplay policy navigateur). */
  useEffect(() => {
    if (playbackUnlocked) return;
    const onFirstGesture = () => {
      unlockPlayback();
    };
    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("keydown", onFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [playbackUnlocked, unlockPlayback]);

  useEffect(() => {
    if (!isFullscreenApiSupported()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F11" || e.repeat) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      void (getDocumentFullscreenElement() ? exitDocumentFullscreen() : requestDocumentFullscreen());
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

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
    const t3 = window.setTimeout(post, 3200);
    try {
      iframe.addEventListener("load", post, { once: true });
    } catch {}
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      try {
        iframe.removeEventListener("load", post);
      } catch {}
    };
  }, [phase, masterVolume, playbackUnlocked]);

  /**
   * L’iframe redemande l’état audio une fois prête : le premier postMessage parent part souvent
   * avant que `initChapterTwoAmbience` n’ait enregistré son listener (message perdu).
   */
  useEffect(() => {
    if (phase !== "act2") return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!e.data || e.data.type !== "senac-request-audio") return;
      const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
      if (!(iframe instanceof HTMLIFrameElement)) return;
      if (e.source !== iframe.contentWindow) return;
      const payload = {
        type: "senac-audio" as const,
        volume: Math.min(1, Math.max(0, masterVolumeRef.current)),
        unlocked: playbackUnlockedRef.current,
      };
      try {
        iframe.contentWindow?.postMessage(payload, window.location.origin);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [phase]);

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

  const openIntroVideoOverlayRef = useRef(openIntroVideoOverlay);
  openIntroVideoOverlayRef.current = openIntroVideoOverlay;

  const restartExperience = useCallback(() => {
    try {
      window.localStorage.removeItem(JOURNEY_REPLAY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, []);

  const navigateParcoursPhase = useCallback((next: ParcoursPhaseLabel) => {
    setParcoursOpen(false);
    setSystemMenuOpen(false);
    setPhase(next);
  }, []);

  useEffect(() => {
    const expectedOrigin = window.location.origin;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      const d = e.data as Record<string, unknown>;
      if (d?.type !== "senac-journey-complete") return;
      const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
      if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
      try {
        window.localStorage.setItem(JOURNEY_REPLAY_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setJourneyReplayUnlocked(true);
      setAct1Quest(COMPLETE_ACT1_QUEST);
      setAct2Quest(COMPLETE_ACT2_QUEST);
      setRevelationCount(5);
      setIntroKey((k) => k + 1);
      pendingAct2.current = false;
      setParcoursOpen(false);
      setSystemMenuOpen(false);
      act2VoyageCreditsOpenRef.current = false;
      setAct2VoyageCreditsOpen(false);
      setPhase("intro");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
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
      if (parcoursOpen) {
        e.preventDefault();
        setParcoursOpen(false);
        return;
      }
      if (phase === "intro" && !journeyReplayUnlocked) return;
      e.preventDefault();
      setSystemMenuOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [systemMenuOpen, chapterToast, chapterDaTransition, phase, introVideoOpen, parcoursOpen, journeyReplayUnlocked]);

  /** Rail Parcours ouvert : la molette / le trackpad le referme (comme un clic sur le voile). */
  useEffect(() => {
    if (!parcoursOpen || (phase === "intro" && !journeyReplayUnlocked)) return;
    const onWheel = () => setParcoursOpen(false);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [parcoursOpen, phase, journeyReplayUnlocked]);

  /**
   * Acte II : iframe - relais souris + progression « Défilez » (postMessage).
   */
  useEffect(() => {
    if (phase !== "act2") return;
    const expectedOrigin = window.location.origin;
    let iframeSenacCached: HTMLIFrameElement | null = null;
    let pointerRaf = 0;
    let pendingIframeXY: { x: number; y: number } | null = null;

    const resolveSenacIframe = (): HTMLIFrameElement | null => {
      if (iframeSenacCached?.isConnected) return iframeSenacCached;
      const el = document.querySelector('iframe[src*="parchemin-senac"]');
      iframeSenacCached = el instanceof HTMLIFrameElement ? el : null;
      return iframeSenacCached;
    };

    const invalidateIframeCache = () => {
      iframeSenacCached = null;
    };

    const relayPointerFlush = () => {
      pointerRaf = 0;
      if (!pendingIframeXY) return;
      const { x, y } = pendingIframeXY;
      pendingIframeXY = null;
      const iframe = resolveSenacIframe();
      let gx = x;
      let gy = y;
      if (iframe) {
        const r = iframe.getBoundingClientRect();
        gx = x + r.left;
        gy = y + r.top;
      }
      /** Générique crédits : fluide Splash masqué → pas de faux `mousemove` vers WebGL idle. */
      if (!act2VoyageCreditsOpenRef.current) {
        window.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: gx,
            clientY: gy,
            bubbles: true,
            view: window,
          })
        );
      }
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

    const onMsg = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      const d = e.data as Record<string, unknown>;
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
      if (e.data?.type === "senac-scroll-progress") {
        const ratio = e.data.ratio as number;
        if (typeof ratio === "number" && Number.isFinite(ratio)) {
          setAct2ScrollFillRatio(Math.min(1, Math.max(0, ratio)));
        }
        return;
      }
      if (e.data?.type === "senac-credits-chrome") {
        if (phaseRef.current !== "act2") return;
        const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
        if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
        const openNow = e.data.open === true;
        act2VoyageCreditsOpenRef.current = openNow;
        setAct2VoyageCreditsOpen(openNow);
        return;
      }
      if (d?.type === "senac-navigate") {
        if (phaseRef.current !== "act2") return;
        const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
        if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
        const target = typeof d.target === "string" ? d.target : "";
        if (target === "intro-video") {
          openIntroVideoOverlayRef.current();
          return;
        }
        if (target === "act1-map") {
          setPhase("act1");
          return;
        }
        /** Chapitre III : retour intro sans valider la traversée complète (réservée à la sortie du générique). */
        if (target === "intro") {
          pendingAct2.current = false;
          setParcoursOpen(false);
          setSystemMenuOpen(false);
          act2VoyageCreditsOpenRef.current = false;
          setAct2VoyageCreditsOpen(false);
          setIntroKey((k) => k + 1);
          setPhase("intro");
          return;
        }
        return;
      }
      if (e.data?.type !== "senac-pointer") return;
      const x = e.data.x as number;
      const y = e.data.y as number;
      if (typeof x !== "number" || typeof y !== "number") return;
      pendingIframeXY = { x, y };
      if (pointerRaf !== 0) return;
      pointerRaf = window.requestAnimationFrame(relayPointerFlush);
    };

    window.addEventListener("message", onMsg);
    window.addEventListener("resize", invalidateIframeCache, { passive: true });
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("resize", invalidateIframeCache);
      iframeSenacCached = null;
      if (pointerRaf !== 0) window.cancelAnimationFrame(pointerRaf);
    };
  }, [phase]);

  return (
    <>
    <ReactLenis root options={lenisOptions}>
      <motion.div
        initial={false}
        animate={
          isLanguageMorphing
            ? languageMorphMidnight
              ? {
                  opacity: 0.72,
                  scale: 0.989,
                  filter: "blur(8px) saturate(1.08) brightness(0.88)",
                }
              : phase === "intro"
                ? {
                    opacity: 0.78,
                    scale: 0.987,
                    filter: "blur(5px) saturate(0.88) brightness(0.96) sepia(0.1)",
                  }
                : {
                    opacity: 0.76,
                    scale: 0.987,
                    filter: "blur(6px) saturate(0.9) brightness(0.94)",
                  }
            : {
                opacity: 1,
                scale: 1,
                filter: "blur(0px) saturate(1) brightness(1) sepia(0)",
              }
        }
        transition={{
          duration:
            isLanguageMorphing ? LANGUAGE_MORPH_OUT_MS / 1000 : LANGUAGE_MORPH_IN_MS / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformOrigin: "50% 40%" }}
        className={
          phase === "act1" || phase === "act2"
            ? "isolate h-dvh max-h-dvh min-h-0 w-full overflow-hidden will-change-[opacity,filter,transform]"
            : "isolate min-h-0 w-full will-change-[opacity,filter,transform]"
        }
      >
      <GrainOverlay opacity={phase === "act2" || introVideoPlaying ? 0 : 0.04} />
      {/* Acte II : pas d’overlay ciné (z-[52]) au-dessus de l’iframe - vignette = bande sombre « pied de page ». */}
      {phase !== "act2" && <CinematicOverlay disableGrain={introVideoPlaying} />}
      <Soundscape enabled={phase !== "act2"} />

      <AnimatePresence mode="sync">
        {chapterToast && (
          <Fragment key="ch1-toast">
            <ChapterCompleteToast
              chapterTitle={copy.chapterToastTitle}
              subtitle={copy.chapterToastSubtitle}
            />
          </Fragment>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {chapterDaTransition && <ChapterDaTransition />}
      </AnimatePresence>

      <AnimatePresence>
        {introVideoOpen && (
          <Fragment key={`intro-video-${introVideoNonce}`}>
            <Suspense fallback={null}>
              <IntroVideoOverlay onClose={() => setIntroVideoOpen(false)} />
            </Suspense>
          </Fragment>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {systemMenuOpen && (
          <Fragment key="sysmenu">
            <Suspense
              fallback={
                <div
                  className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[2px]"
                  aria-hidden
                />
              }
            >
              <SystemMenu
                onClose={() => setSystemMenuOpen(false)}
                onReplayIntroVideo={openIntroVideoOverlay}
                onRestartExperience={restartExperience}
                embeddedParcours={
                  !mdUp && (phase !== "intro" || journeyReplayUnlocked) ? (
                    <Suspense fallback={<div className="min-h-[100px] w-full" aria-hidden />}>
                      <ParcoursPanelInnerContent
                        phase={phase}
                        revelationCount={revelationCount}
                        parcoursRailMidnight={
                          phase === "act2" ? (act2ParcheminTone ?? "solar") === "midnight" : false
                        }
                        act2VoyageCreditsOpen={phase === "act2" ? act2VoyageCreditsOpen : false}
                        journeyReplayUnlocked={journeyReplayUnlocked}
                        onNavigatePhase={journeyReplayUnlocked ? navigateParcoursPhase : undefined}
                      />
                    </Suspense>
                  ) : undefined
                }
              />
            </Suspense>
          </Fragment>
        )}
      </AnimatePresence>

      {/* Fermeture du rail uniquement viewport md+ (le rail est masqué sous md). */}
      {mdUp && parcoursOpen && (phase !== "intro" || journeyReplayUnlocked) && (
        <div
          className="fixed inset-0 z-[39] pointer-events-auto"
          onClick={() => setParcoursOpen(false)}
          aria-hidden
        />
      )}

      {(phase !== "intro" || journeyReplayUnlocked) && (
        <>
          <AnimatePresence>
            {menuHintVisible && !systemMenuOpen && (
              <motion.div
                key="menu-discover-hint"
                initial={{ opacity: 0, x: -14, y: 6 }}
                animate={{ opacity: 1, x: 0, y: [0, -2, 0] }}
                exit={{ opacity: 0, x: -10, y: 3 }}
                transition={{
                  opacity: { duration: 0.35 },
                  x: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 3.1, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
                }}
                dir={language === "ar-dz" ? "rtl" : "ltr"}
                className="pointer-events-none fixed z-[39] flex items-center gap-2.5 left-[calc(max(1.25rem,calc(env(safe-area-inset-left)+0.5rem))+3.6rem)] top-[calc(max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))+0.8rem)] md:left-[calc(max(2rem,calc(env(safe-area-inset-left)+1rem))+4rem)] md:top-[calc(max(1.75rem,calc(env(safe-area-inset-top)+0.75rem))+0.85rem)]"
              >
                <span
                  aria-hidden
                  className={
                    "h-2.5 w-2.5 shrink-0 rotate-45 border " +
                    (phase === "act2" && act2AmbientMidnight
                      ? "border-[rgba(155,226,255,0.48)] bg-[rgba(90,168,255,0.08)] shadow-[0_0_14px_rgba(90,168,255,0.22)]"
                      : "border-[rgba(197,160,89,0.52)] bg-[rgba(197,160,89,0.08)] shadow-[0_0_14px_rgba(197,160,89,0.24)]")
                  }
                />
                <span
                  aria-hidden
                  className={
                    "h-px w-10 shrink-0 " +
                    (phase === "act2" && act2AmbientMidnight
                      ? "bg-gradient-to-r from-[rgba(155,226,255,0.52)] to-transparent"
                      : "bg-gradient-to-r from-[rgba(197,160,89,0.56)] to-transparent")
                  }
                />
                <span
                  className={
                    "max-w-[min(32vw,12rem)] text-[9px] uppercase leading-none tracking-[0.26em] " +
                    (language === "ar-dz" ? "font-arabic-ui tracking-[0.08em]" : "") +
                    " " +
                    (phase === "act2" && act2AmbientMidnight
                      ? "text-[rgba(218,238,255,0.78)]"
                      : "text-[rgba(232,212,164,0.8)]")
                  }
                >
                  {copy.menuHintDiscover}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            onClick={() => {
              dismissMenuHint(true);
              setSystemMenuOpen(true);
            }}
            onPointerEnter={() => dismissMenuHint(true)}
            onFocus={() => dismissMenuHint(true)}
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
            aria-label={copy.menuAria}
          >
            {menuHintVisible && (
              <motion.span
                aria-hidden
                className={
                  "pointer-events-none absolute -inset-2 rounded-[4px] border " +
                  (phase === "act2" && act2AmbientMidnight
                    ? "border-[rgba(155,226,255,0.28)]"
                    : "border-[rgba(197,160,89,0.28)]")
                }
                animate={{ opacity: [0.2, 0.62, 0.2], scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              />
            )}
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
                    }
                  : {
                      background: "radial-gradient(circle at 50% 50%, rgba(197,160,89,0.2) 0%, transparent 75%)",
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
              <SettingsIcon className="h-5 w-5" aria-hidden />
            </motion.span>
          </motion.button>
          <Suspense fallback={null}>
            <OrientationPanel
              phase={phase}
              revelationCount={revelationCount}
              expanded={parcoursOpen}
              onExpandedChange={setParcoursOpen}
              parcoursRailMidnight={
                phase === "act2" ? (act2ParcheminTone ?? "solar") === "midnight" : false
              }
              act2VoyageCreditsOpen={phase === "act2" ? act2VoyageCreditsOpen : false}
              journeyReplayUnlocked={journeyReplayUnlocked}
              onNavigatePhase={journeyReplayUnlocked ? navigateParcoursPhase : undefined}
            />
          </Suspense>
        </>
      )}

      {/* HintPanel : acte I uniquement - le parchemin (acte II) gère sa propre navigation (mode Cinéma / Exploration). */}
      {phase !== "act2" && (
        <HintPanel
          phase={phase}
          suppress={systemMenuOpen || introVideoOpen}
          act1Quest={phase === "act1" ? act1Quest : undefined}
        />
      )}

      {/* Nudge scroll - acte I uniquement, masqué dès que le zoom est acquis */}
      {phase === "act1" && !systemMenuOpen && !introVideoOpen && !act1Quest.zoom && (
        <ScrollNudge key="scroll-nudge-act1" />
      )}

      <main
        className={
          phase === "act1"
            ? "relative h-dvh max-h-dvh min-h-0 w-full overflow-hidden"
            : "relative w-full min-h-dvh"
        }
        style={{ background: "#0a0806" }}
      >
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
                isExploring={journeyReplayUnlocked}
                onVideoStart={() => setVideoStarted(true)}
                devChapterJumps={
                  showDevChapterJumps
                    ? {
                        goChapter1: () => setPhase("act1"),
                        goChapter2: () => setPhase("act2"),
                        goChapter3: () => {
                          window.location.assign(parcheminSenacHref("chapitre-3"));
                        },
                        previewCredits: () => {
                          window.location.assign(
                            parcheminSenacHref("chapitre-3", { previewCredits: true })
                          );
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
                completedReplay={journeyReplayUnlocked}
                parcoursRailExpanded={mdUp && parcoursOpen}
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
            <Suspense fallback={<div className="fixed inset-0 bg-[#05080f]" aria-hidden />}>
              <Act2 />
            </Suspense>
          </motion.div>
        )}
      </main>

      {/* Fluide curseur plein viewport : au-dessus scène (~z-20) et HUD carte (~110) ; sous ScrollProgressBar / modales.
          Acte II : désactivé - le canvas fixed en 100vh se superposait mal à l’iframe parchemin (100dvh), bande sombre en bas. */}
      {finePointer && phase !== "act2" && (
        <div
          style={{
            visibility:
              systemMenuOpen ||
              introVideoOpen ||
              act2VoyageCreditsOpen ||
              isLanguageMorphing
                ? "hidden"
                : "visible",
          }}
        >
          <Fragment key={phase === "act1" ? "splash-act1" : "splash-default"}>
            <SplashCursor
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
          </Fragment>
        </div>
      )}

      <ScrollProgressBar
        tone={act2AmbientMidnight ? "midnight" : "solar"}
        iframeFillRatio={phase === "act2" ? act2ScrollFillRatio : undefined}
        aboveChrome={false}
      />
      </motion.div>
      <LanguageMorphHud visible={isLanguageMorphing} midnight={languageMorphMidnight} />
    </ReactLenis>
      {/* Curseur custom (portail body) - au-dessus du fluide. */}
      {finePointer && (
      <CustomCursor
        overlayOpen={
          systemMenuOpen ||
          introVideoOpen ||
          act2VoyageCreditsOpen ||
          isLanguageMorphing
        }
      />
      )}
    </>
  );
}

/** Pastille + voile DA (même vocabulaire que le passage chapitre II : halos, grain, losange). */
function LanguageMorphHud({
  visible,
  midnight,
}: {
  visible: boolean;
  midnight: boolean;
}) {
  const copy = useAppCopy();
  const language = useLanguageStore((s) => s.language);

  const solarBase =
    "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(197,160,89,0.28), transparent 58%), linear-gradient(180deg, #130d07 0%, #070503 100%)";
  const midnightBase =
    "radial-gradient(ellipse 75% 55% at 50% 32%, rgba(90,168,255,0.32), transparent 62%), radial-gradient(ellipse 45% 35% at 70% 58%, rgba(197,160,89,0.12), transparent 64%), linear-gradient(180deg, #041331 0%, #01030a 100%)";

  const cornerCls = midnight
    ? "border-[rgba(139,213,255,0.34)]"
    : "border-solar-gold/[0.34]";
  const kickerClr = midnight ? "text-sky-400/55" : "text-[#ead7a4]/55";
  const lineVia = midnight
    ? "from-transparent via-[rgba(139,213,255,0.38)] to-transparent"
    : "from-transparent via-[rgba(232,212,164,0.38)] to-transparent";
  const serifBody = midnight ? "text-[#d4e9ff]/72" : "text-[#ead7a4]/70";
  const losangeStroke = midnight ? "rgba(186,226,255,0.65)" : "rgba(232,212,164,0.78)";
  const losangeFill = midnight ? "rgba(90,168,255,0.1)" : "rgba(197,160,89,0.12)";
  const ringBorder = midnight ? "border-[rgba(121,183,255,0.16)]" : "border-[rgba(234,215,164,0.16)]";

  return (
    <AnimatePresence mode="sync">
      {visible && (
        <motion.div
          key="lang-morph-overlay"
          role="presentation"
          className="pointer-events-none fixed inset-0 z-[562] flex items-center justify-center overflow-hidden bg-[#02040c]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0"
            animate={{ opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: midnight ? midnightBase : solarBase }}
          />

          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,0,0,0.62)_100%)]"
            aria-hidden
          />

          {/* Grain discret - même donnée que GrainOverlay ; pas de translation (évite moiré / grain « qui glisse »). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.065,
              backgroundImage: `url("${NOISE_DATA_URI}")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
              mixBlendMode: "overlay",
            }}
          />

          {/* Fil de lumière type transition chapitre */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[110vw] origin-left opacity-80"
            style={{
              background:
                "linear-gradient(100deg, transparent 0%, rgba(234,215,164,0.0) 26%, rgba(234,215,164,0.12) 42%, rgba(90,168,255,0.2) 54%, transparent 72%)",
            }}
            initial={{ x: "-108%", skewX: -5 }}
            animate={{ x: ["-108%", "-18%", "-108%"], skewX: [-5, -1, -5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            aria-hidden
            className={`absolute left-8 top-8 h-12 w-12 sm:left-11 sm:top-11 sm:h-14 sm:w-14 ${cornerCls} border-l border-t`}
          />
          <motion.div
            aria-hidden
            className={`absolute right-8 top-8 h-12 w-12 sm:right-11 sm:top-11 sm:h-14 sm:w-14 ${cornerCls} border-r border-t`}
          />
          <motion.div
            aria-hidden
            className={`absolute bottom-8 left-8 h-12 w-12 sm:bottom-11 sm:left-11 sm:h-14 sm:w-14 ${cornerCls} border-b border-l`}
          />
          <motion.div
            aria-hidden
            className={`absolute bottom-8 right-8 h-12 w-12 sm:bottom-11 sm:right-11 sm:h-14 sm:w-14 ${cornerCls} border-b border-r`}
          />

          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ead7a4]"
            animate={{
              boxShadow: midnight
                ? [
                    "0 0 26px rgba(234,215,164,0.45),0 0 58px rgba(90,168,255,0.32)",
                    "0 0 40px rgba(234,215,164,0.55),0 0 80px rgba(90,168,255,0.22)",
                    "0 0 26px rgba(234,215,164,0.45),0 0 58px rgba(90,168,255,0.32)",
                  ]
                : [
                    "0 0 28px rgba(234,215,164,0.5),0 0 50px rgba(197,160,89,0.25)",
                    "0 0 44px rgba(234,215,164,0.62),0 0 72px rgba(197,160,89,0.2)",
                    "0 0 28px rgba(234,215,164,0.5),0 0 50px rgba(197,160,89,0.25)",
                  ],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            aria-hidden
            className={`pointer-events-none absolute left-1/2 top-1/2 h-[min(56vw,18rem)] w-[min(56vw,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringBorder}`}
            animate={{ scale: [1, 1.04, 1], opacity: [0.22, 0.38, 0.22] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            aria-hidden
            className={
              midnight
                ? "pointer-events-none absolute left-1/2 top-1/2 h-[min(78vw,24rem)] w-[min(78vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#79b7ff]/14"
                : "pointer-events-none absolute left-1/2 top-1/2 h-[min(78vw,24rem)] w-[min(78vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ead7a4]/14"
            }
            animate={{
              scale: [1, 1.065, 1],
              opacity: [0.1, 0.26, 0.1],
              rotate: [0, 10, 0],
            }}
            transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
          />

          <span className="sr-only" role="status" aria-live="polite">
            {copy.languageMorphLive}
          </span>

          <motion.div
            className="relative z-10 flex max-w-lg flex-col items-center px-8 text-center"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex w-full max-w-xs items-center gap-2 sm:max-w-sm">
              <div className={`h-px flex-1 bg-gradient-to-r ${lineVia}`} aria-hidden />
              <div
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rotate-45 border ${cornerCls} shadow-[0_0_18px_rgba(197,160,89,0.12)]`}
              />
              <div className={`h-px flex-1 bg-gradient-to-l ${lineVia}`} aria-hidden />
            </div>

            <p
              className={`mt-8 text-[10px] uppercase tracking-[0.6em] ${kickerClr} sm:text-[10px] sm:tracking-[0.62em]`}
            >
              {copy.languageMorphKicker}
            </p>

            <motion.div
              aria-hidden
              className="mt-6 flex items-center justify-center"
              animate={{ filter: ["brightness(0.95)", "brightness(1.12)", "brightness(0.95)"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="56" height="76" viewBox="0 0 22 30" fill="none" className="drop-shadow-[0_0_24px_rgba(90,168,255,0.2)]">
                <polygon
                  points="11,1 21,11 11,21 1,11"
                  fill={losangeFill}
                  stroke={losangeStroke}
                  strokeWidth="1.15"
                />
                <circle cx="11" cy="11" r="1.55" fill="#ead7a4" fillOpacity="0.88" />
                <line x1="11" y1="21" x2="11" y2="27" stroke={losangeStroke} strokeWidth="1" strokeOpacity="0.72" />
                <polyline
                  points="8,24 11,28 14,24"
                  fill="none"
                  stroke={losangeStroke}
                  strokeWidth="1"
                  strokeOpacity="0.72"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>

            {language === "ar-dz" ? (
              <p
                className={`font-serif mt-7 text-sm italic leading-snug sm:text-base ${serifBody}`}
                style={{
                  textShadow: midnight
                    ? "0 0 40px rgba(90,168,255,0.2),0 0 24px rgba(197,160,89,0.1)"
                    : "0 0 36px rgba(197,160,89,0.18)",
                }}
              >
                {copy.languageMorphVisible}
              </p>
            ) : (
              <p
                className="font-bahlull mx-auto mt-7 max-w-[22ch] text-xl italic leading-tight text-transparent sm:text-2xl"
                style={
                  midnight
                    ? {
                        backgroundImage:
                          "linear-gradient(135deg, #e8f6ff 0%, #94c8ff 40%, #5aa8ff 55%, #e0f4ff 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 0 24px rgba(90,168,255,0.22))",
                      }
                    : {
                        backgroundImage:
                          "linear-gradient(135deg, #fdfaf6 0%, #e8d4a8 38%, #c5a059 56%, #fdfaf6 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 0 22px rgba(197,160,89,0.2))",
                      }
                }
              >
                {copy.languageMorphVisible}
              </p>
            )}

            <div className="mt-8 flex w-full max-w-xs items-center gap-2 sm:max-w-sm">
              <div className={`h-px flex-1 bg-gradient-to-r ${lineVia}`} aria-hidden />
              <div
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rotate-45 border ${cornerCls}`}
              />
              <div className={`h-px flex-1 bg-gradient-to-l ${lineVia}`} aria-hidden />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChapterDaTransition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useLayoutEffect(() => {
    const pathCount = 3;
    const pointCount = 9;
    const delayPointsMax = 0.24;
    const delayPerPath = 0.14;
    const coverDuration = 1.12;
    const revealDuration = 0.94;
    const revealStartAt = coverDuration + delayPointsMax + delayPerPath * (pathCount - 1) + 0.08;
    const pathStates = Array.from({ length: pathCount }, () => Array(pointCount).fill(-18));
    let mode: "cover" | "reveal" = "cover";

    const render = () => {
      for (let i = 0; i < pathCount; i += 1) {
        const path = pathRefs.current[i];
        if (!path) continue;
        path.setAttribute("d", buildChapterWavePath(pathStates[i], mode));
      }
    };

    const createPointDelays = () =>
      Array.from({ length: pointCount }, () => Math.random() * delayPointsMax);

    const ctx = gsap.context(() => {
      render();

      gsap
        .timeline({ defaults: { ease: "power2.inOut" }, onUpdate: render })
        .fromTo(
          rootRef.current?.querySelector("[data-sand-base]"),
          { opacity: 0.82, scale: 1.04, filter: "brightness(0.76) blur(12px)" },
          { opacity: 1, scale: 1, filter: "brightness(1) blur(0px)", duration: 1.25, ease: "power2.out" },
          0
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-glow]"),
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1.08, duration: 1.05, ease: "sine.out" },
          0
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-haze]"),
          { opacity: 0 },
          { opacity: 0.92, duration: 1.2, ease: "sine.out" },
          0.08
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-sun]"),
          { opacity: 0, scale: 0.74, yPercent: 16, filter: "blur(24px)" },
          { opacity: 0.78, scale: 1, yPercent: 0, filter: "blur(0px)", duration: 1.28, ease: "sine.out" },
          0.02
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-filament]"),
          { opacity: 0, xPercent: -8 },
          { opacity: 0.55, xPercent: 0, duration: 1.05, ease: "sine.out" },
          0.16
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-dune-back]"),
          { opacity: 0, yPercent: 22, scaleX: 1.06 },
          { opacity: 0.9, yPercent: 0, scaleX: 1, duration: 1.16, ease: "power3.out" },
          0.12
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-dune-front]"),
          { opacity: 0, yPercent: 34, scaleX: 1.12 },
          { opacity: 0.98, yPercent: 0, scaleX: 1, duration: 1.2, ease: "power4.out" },
          0.22
        )
        .fromTo(
          rootRef.current?.querySelector("[data-sand-veil]"),
          { opacity: 0, xPercent: -4, scale: 1.03 },
          { opacity: 0.38, xPercent: 0, scale: 1, duration: 1.35, ease: "power2.out" },
          0
        );

      for (let i = 0; i < pathCount; i += 1) {
        const pointDelays = createPointDelays();
        const pathDelay = delayPerPath * i;
        for (let j = 0; j < pointCount; j += 1) {
          gsap.to(pathStates[i], {
            [j]: 112,
            duration: coverDuration,
            ease: "power2.inOut",
            delay: pointDelays[j] + pathDelay,
            onUpdate: render,
          });
        }
      }

      gsap.delayedCall(revealStartAt, () => {
        mode = "reveal";
        for (let i = 0; i < pathCount; i += 1) {
          pathStates[i].fill(0);
        }
        render();

        for (let i = 0; i < pathCount; i += 1) {
          const pointDelays = createPointDelays();
          const pathDelay = delayPerPath * (pathCount - i - 1);
          for (let j = 0; j < pointCount; j += 1) {
            gsap.to(pathStates[i], {
              [j]: 118,
              duration: revealDuration,
              ease: "power2.inOut",
              delay: pointDelays[j] + pathDelay,
              onUpdate: render,
            });
          }
        }

        gsap.to(rootRef.current?.querySelector("[data-sand-glow]"), {
          opacity: 0,
          scale: 1.28,
          duration: 1.05,
          ease: "sine.out",
        });
        gsap.to(rootRef.current?.querySelector("[data-sand-haze]"), {
          opacity: 0.18,
          duration: 0.95,
          ease: "sine.out",
        });
        gsap.to(rootRef.current?.querySelector("[data-sand-sun]"), {
          opacity: 0.14,
          scale: 1.12,
          yPercent: -8,
          duration: 1.02,
          ease: "sine.out",
        });
        gsap.to(rootRef.current?.querySelector("[data-sand-filament]"), {
          opacity: 0.08,
          xPercent: 6,
          duration: 0.95,
          ease: "sine.out",
        });
        gsap.to(rootRef.current?.querySelector("[data-sand-dune-back]"), {
          opacity: 0.42,
          duration: 0.9,
          ease: "sine.out",
        });
        gsap.to(rootRef.current?.querySelector("[data-sand-dune-front]"), {
          opacity: 0.66,
          duration: 0.92,
          ease: "sine.out",
        });
        gsap.to(rootRef.current?.querySelector("[data-sand-veil]"), {
          opacity: 0.06,
          duration: 0.95,
          ease: "sine.out",
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      ref={rootRef}
      className="pointer-events-auto fixed inset-0 z-[205] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        data-sand-base
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 42% at 50% 42%, rgba(104, 79, 54, 0.18) 0%, transparent 62%), linear-gradient(180deg, #120d09 0%, #1a120d 34%, #120d09 68%, #090706 100%)",
        }}
      />

      <div
        data-sand-glow
        className="pointer-events-none absolute inset-[-10%] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 24% at 50% 54%, rgba(178, 151, 107, 0.18) 0%, rgba(116, 83, 49, 0.1) 44%, transparent 76%)",
          filter: "blur(28px)",
        }}
      />

      <div
        data-sand-sun
        className="pointer-events-none absolute left-1/2 top-[41%] h-[min(34rem,54vw)] w-[min(34rem,54vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle, rgba(210, 188, 150, 0.26) 0%, rgba(162, 126, 83, 0.15) 32%, rgba(78, 53, 31, 0.06) 52%, transparent 72%)",
          mixBlendMode: "screen",
        }}
      />

      <div
        data-sand-filament
        className="pointer-events-none absolute left-1/2 top-[48%] h-px w-[min(74vw,52rem)] -translate-x-1/2 opacity-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(196, 164, 117, 0.08) 18%, rgba(232, 216, 186, 0.34) 50%, rgba(196, 164, 117, 0.08) 82%, transparent 100%)",
          boxShadow: "0 0 18px rgba(201, 173, 129, 0.12)",
        }}
      />

      <div
        data-sand-dune-back
        className="pointer-events-none absolute inset-x-[-10%] bottom-[6%] h-[25vh] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(58, 40, 27, 0.72) 0%, rgba(58, 40, 27, 0.36) 44%, transparent 76%)",
        }}
      />

      <div
        data-sand-dune-front
        className="pointer-events-none absolute inset-x-[-16%] bottom-[-10%] h-[33vh] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(20, 13, 9, 0.96) 0%, rgba(26, 17, 11, 0.7) 42%, transparent 76%)",
        }}
      />

      <div
        data-sand-haze
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(9, 7, 5, 0.02) 0%, rgba(20, 16, 11, 0.12) 38%, rgba(9, 7, 5, 0.03) 100%)",
        }}
      />

      <div
        data-sand-veil
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "linear-gradient(122deg, rgba(255,255,255,0.02) 0%, rgba(214,192,155,0.04) 24%, transparent 48%), repeating-linear-gradient(112deg, transparent 0 24px, rgba(198,171,128,0.018) 24px 25px, transparent 25px 54px)",
          mixBlendMode: "soft-light",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.045,
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          mixBlendMode: "soft-light",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chapter-sand-gradient-edge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#efe4d0" />
            <stop offset="44%" stopColor="#ceb48d" />
            <stop offset="100%" stopColor="#8d6847" />
          </linearGradient>
          <linearGradient id="chapter-sand-gradient-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d8c4a0" />
            <stop offset="52%" stopColor="#a98861" />
            <stop offset="100%" stopColor="#6b4b31" />
          </linearGradient>
          <linearGradient id="chapter-sand-gradient-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e6d7bb" />
            <stop offset="46%" stopColor="#bc9a70" />
            <stop offset="100%" stopColor="#81593a" />
          </linearGradient>
        </defs>
        <path
          ref={(node) => {
            pathRefs.current[0] = node;
          }}
          fill="url(#chapter-sand-gradient-edge)"
          opacity="0.52"
        />
        <path
          ref={(node) => {
            pathRefs.current[1] = node;
          }}
          fill="url(#chapter-sand-gradient-back)"
          opacity="0.88"
        />
        <path
          ref={(node) => {
            pathRefs.current[2] = node;
          }}
          fill="url(#chapter-sand-gradient-front)"
        />
      </svg>
    </motion.div>
  );
}

function buildChapterWavePath(points: number[], mode: "cover" | "reveal") {
  const total = points.length;
  const clampPoint = (value: number) => Math.max(-20, Math.min(120, value));
  const firstPoint = clampPoint(points[0] ?? 0);
  let d = mode === "cover" ? `M 0 0 V ${firstPoint} C` : `M 0 100 V ${firstPoint} C`;

  for (let i = 0; i < total - 1; i += 1) {
    const p = ((i + 1) / (total - 1)) * 100;
    const cp = p - 50 / (total - 1);
    const current = clampPoint(points[i] ?? 0);
    const next = clampPoint(points[i + 1] ?? 0);
    d += ` ${cp} ${current} ${cp} ${next} ${p} ${next}`;
  }

  d += mode === "cover" ? " L 100 0 Z" : " L 100 100 Z";
  return d;
}
