import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
  useMemo,
  Fragment,
} from "react";
import { ReactLenis } from "lenis/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import Intro, { type DevChapterJumps } from "./components/Intro";
import ChapterAct12Bridge from "./components/ChapterAct12Bridge";
import ChapterAct23Bridge from "./components/ChapterAct23Bridge";
const AlgeriaMap = lazy(() => import("./components/Immersive/AlgeriaMap"));
const Act2 = lazy(() => import("./components/Immersive/Act2"));
const Act3Writing = lazy(() => import("./components/Immersive/Act3Writing"));

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
import type { MainAppPhase, ParcoursPhaseLabel } from "./components/ui/OrientationPanel";
import CustomCursor from "./components/ui/CustomCursor";
import CinematicOverlay from "./components/CinematicOverlay";
import Soundscape from "./components/Soundscape";
import SplashCursor from "./components/SplashCursor";
import ChapterCompleteToast from "./components/ui/ChapterCompleteToast";
import HintPanel from "./components/ui/HintPanel";
import ScrollNudge from "./components/ui/ScrollNudge";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import VoyageCreditsOverlay from "./components/ui/VoyageCreditsOverlay";
import type { Act1QuestProgress, Act2QuestProgress } from "./components/ui/HintPanel";
import type { Act1QuestStep } from "./components/Immersive/AlgeriaMap";
import { useCursorStore } from "./hooks/useCursorContext";
import { useCursorPrefsStore } from "./stores/cursorPrefsStore";
import { useMediaQuery } from "./hooks/useMediaQuery";
import {
  useLanguageStore,
  LANGUAGE_MORPH_IN_MS,
  LANGUAGE_MORPH_OUT_MS,
} from "./stores/languageStore";
import { useAppCopy } from "./hooks/useAppCopy";
import { useMasterVolumeStore } from "./stores/masterVolumeStore";
import {
  exitDocumentFullscreen,
  getDocumentFullscreenElement,
  isFullscreenApiSupported,
  requestDocumentFullscreen,
} from "./lib/fullscreenDocument";
import {
  attachAct1MapPrefetchOnFirstUserGesture,
  prefetchAct2TransitionAssets,
  runWhenIdle,
  scheduleIdleAct1MapPrefetchAfterLoad,
} from "./lib/actTransitionPrefetch";
import { prefetchAct23BridgeVideo } from "./lib/act23Bridge";
import { PARCHEMIN_STATIC_QUERY } from "./lib/parcheminAssetVersion";
import {
  ACT_SAVE_STORAGE_KEY,
  getHydratedActSave,
  JOURNEY_REPLAY_STORAGE_KEY,
  patchActSave,
  readJourneyReplayUnlocked,
  setSessionJourneyReplayUnlocked,
} from "./lib/actSave";
import { REVELATION_WORDS } from "./components/Immersive/mapWordData";
import {
  canonicalizeLegacyActIIIUrlIfNeeded,
  clearLegacyActIIIRewriteBootstrap,
  peekLegacyActIIIRewritePending,
  prepareActIIIEntry,
  SESSION_BOOTSTRAP_ACTIII,
  SESSION_OPEN_VOYAGE_CREDITS,
  SESSION_RESUME_ACT2,
} from "./lib/appRoutes";
import { ACT12_POST_MAP_COMPLETE_DELAY_MS } from "./lib/transitionBridgeReveal";

/** Page statique parchemin (ch. II / III) ; respecte `import.meta.env.BASE_URL` (d?ploiement sous sous-chemin). */
function parcheminSenacHref(hash: string, options?: { previewCredits?: boolean }) {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const h = hash.startsWith("#") ? hash : `#${hash}`;
  const qs = options?.previewCredits
    ? `?previewCredits=1&${PARCHEMIN_STATIC_QUERY}`
    : `?${PARCHEMIN_STATIC_QUERY}`;
  return `${prefix}parchemin-senac.html${qs}${h}`;
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

/** Progression actes / Parcours libre : m?moire de session (`lib/actSave`), F5 repart ? z?ro. */
const MENU_HINT_SEEN_STORAGE_KEY = "al-rihla-menu-hint-seen";
const COMPLETE_ACT1_QUEST: Act1QuestProgress = { hover: true, clickWord: true, zoom: true };
const COMPLETE_ACT2_QUEST: Act2QuestProgress = { scroll: true };

function readMenuHintSeen(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(MENU_HINT_SEEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Cl? `history.state` pour Pr?c?dent / Suivant navigateur ? phase SPA. */
const HISTORY_PHASE_KEY = "alRihlaPhase";

function mergeHistoryPhaseState(phase: MainAppPhase): Record<string, unknown> {
  const prev = typeof window !== "undefined" ? window.history.state : null;
  const base =
    typeof prev === "object" && prev !== null && !Array.isArray(prev)
      ? { ...(prev as Record<string, unknown>) }
      : {};
  base[HISTORY_PHASE_KEY] = phase;
  return base;
}

/** ?cran Suspense entre phases : le temps du t?l?chargement du chunk sert au pr?chargement d?j? lanc? en idle. */
function LazyPhaseFallback({
  message,
  bgClassName,
  arabicUi,
}: {
  message: string;
  bgClassName: string;
  arabicUi: boolean;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`fixed inset-0 z-[21] flex flex-col items-center justify-center gap-3 px-8 ${bgClassName}`}
    >
      <p
        className={
          "max-w-[min(340px,88vw)] text-center text-[11px] font-medium leading-relaxed tracking-wide text-solar-gold/58 sm:text-[12px] " +
          (arabicUi ? "font-arabic-ui" : "")
        }
      >
        {message}
      </p>
    </div>
  );
}

function readBootstrapMainPhase(): MainAppPhase {
  if (typeof window === "undefined") return "intro";
  try {
    canonicalizeLegacyActIIIUrlIfNeeded();
  } catch {
    /* ignore */
  }
  try {
    if (peekLegacyActIIIRewritePending()) {
      prepareActIIIEntry({ resumeAct2: false });
      return "act3";
    }
  } catch {
    /* ignore */
  }
  try {
    if (sessionStorage.getItem(SESSION_BOOTSTRAP_ACTIII) === "1") {
      sessionStorage.removeItem(SESSION_BOOTSTRAP_ACTIII);
      prepareActIIIEntry({ resumeAct2: false });
      return "act3";
    }
  } catch {
    /* ignore */
  }
  try {
    return sessionStorage.getItem(SESSION_RESUME_ACT2) === "1" ? "act2" : "intro";
  } catch {
    return "intro";
  }
}

export default function App() {
  const [phase, setPhase] = useState<MainAppPhase>(() => readBootstrapMainPhase());
  const phaseRef = useRef<MainAppPhase>(phase);
  const [videoStarted, setVideoStarted] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [menuHintSeen, setMenuHintSeen] = useState(readMenuHintSeen);
  const [menuHintVisible, setMenuHintVisible] = useState(false);
  const [introVideoOpen, setIntroVideoOpen] = useState(false);
  const [introVideoNonce, setIntroVideoNonce] = useState(0);
  /** Pont vid?o plein ?cran avant l?acte III (depuis l?acte II). */
  const [act23BridgeOpen, setAct23BridgeOpen] = useState(false);
  const act23ResumeRef = useRef(true);
  const [act3KeywordGateOpen, setAct3KeywordGateOpen] = useState(false);
  const [chapterToast, setChapterToast] = useState(false);
  const [chapterDaTransition, setChapterDaTransition] = useState(false);
  /** R�v�lation du toast chapitre I?II comme le volet langue (voir `transitionBridgeRevealFromTimeRatio`). */
  const [act12BridgeReveal01, setAct12BridgeReveal01] = useState(1);
  const [revelationCount, setRevelationCount] = useState(() => {
    const s = getHydratedActSave();
    if (readJourneyReplayUnlocked() || s.act1.completed) return 5;
    return s.act1.answers.revelationWords.length;
  });
  /** Rail Parcours : ouvert / repli? (animation GSAP dans OrientationPanel). */
  const [parcoursOpen, setParcoursOpen] = useState(false);
  /** Apr?s Ch. III / g?n?rique : retour intro + navigation libre entre actes (Parcours cliquable). */
  const [journeyReplayUnlocked, setJourneyReplayUnlocked] = useState(readJourneyReplayUnlocked);
  const [act1Quest, setAct1Quest] = useState<Act1QuestProgress>(() => getHydratedActSave().act1.answers.quest);
  const [act2Quest, setAct2Quest] = useState<Act2QuestProgress>(() => getHydratedActSave().act2.answers.quest);
  const showDevChapterJumps = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

  const act1Persist = useMemo(
    () => (phase === "act1" ? getHydratedActSave().act1 : null),
    [phase]
  );
  /** Pont carte-m?moire franchi : Parcours doit garder Acte II ouvrable depuis Acte I. */
  const act2UnlockedAfterBridge = useMemo(
    () => getHydratedActSave().act1.completed,
    [phase, revelationCount, journeyReplayUnlocked]
  );
  /**
   * Ligne ? Acte III ? : m?me logique UX que l?Acte II ? d?s le pont Acte I franchi, le fil ? droite montre
   * l??criture comme suite cliquable (sans attendre un premier passage iframe). Parcours libre / d?j? visit? : inchang?.
   */
  const act3RailUnlocked = useMemo(
    () =>
      journeyReplayUnlocked ||
      Boolean(getHydratedActSave().act3Unlocked) ||
      act2UnlockedAfterBridge,
    [phase, revelationCount, journeyReplayUnlocked, act2UnlockedAfterBridge],
  );
  const act2ScrollPersistTimerRef = useRef(0);
  const act2ScrollPersistRatioRef = useRef<number | null>(null);

  const pendingAct2 = useRef(false);
  /** Dernière valeur importée : évite un `useCallback([])` figé au premier rendu (HMR / tweak du délai). */
  const act12PostMapCompleteDelayMsRef = useRef(ACT12_POST_MAP_COMPLETE_DELAY_MS);
  act12PostMapCompleteDelayMsRef.current = ACT12_POST_MAP_COMPLETE_DELAY_MS;
  /** Dev : ms en plus avant le pont I→II (voir panneau raccourcis sur l’acte I). */
  const [devAct12ExtraPrefaceMs, setDevAct12ExtraPrefaceMs] = useState(0);
  const devAct12ExtraPrefaceMsRef = useRef(0);
  devAct12ExtraPrefaceMsRef.current = showDevChapterJumps ? devAct12ExtraPrefaceMs : 0;
  const setCursorAmbient = useCursorStore((s) => s.setAmbient);
  const cursorExperience = useCursorPrefsStore((s) => s.experience);
  const useFluidCursorExperience = cursorExperience === "fluid";
  const setCursorMode = useCursorStore((s) => s.setMode);
  const masterVolume = useMasterVolumeStore((s) => s.volume);
  const playbackUnlocked = useMasterVolumeStore((s) => s.playbackUnlocked);
  const unlockPlayback = useMasterVolumeStore((s) => s.unlockPlayback);
  const masterVolumeRef = useRef(masterVolume);
  const playbackUnlockedRef = useRef(playbackUnlocked);
  masterVolumeRef.current = masterVolume;
  playbackUnlockedRef.current = playbackUnlocked;
  /** Ton UI acte II (iframe parchemin) : solaire en haut, minuit apr?s d?file - via `senac-chrome`. */
  const [act2ParcheminTone, setAct2ParcheminTone] = useState<"solar" | "midnight" | null>(null);
  /** Progression de scroll remont?e par l'iframe parchemin pour la barre parent en haut. */
  const [act2ScrollFillRatio, setAct2ScrollFillRatio] = useState<number | undefined>(undefined);
  /** Overlay choix Cinéma / Exploration (iframe) : masque le bouton menu du shell. */
  const [act2ScrollModeChoiceOpen, setAct2ScrollModeChoiceOpen] = useState(false);

  const act2AmbientMidnight =
    (phase === "act2" && (act2ParcheminTone ?? "solar") === "midnight") || phase === "act3";

  /** Hydrate SplashCursor apr�s 2 cadres paint : �vite de rivaliser avec FCP/LCP (rendu inchang� par la suite). */
  const [splashWebglReady, setSplashWebglReady] = useState(false);
  const splashWebglMountedRef = useRef(false);

  const mdUp = useMediaQuery("(min-width: 768px)");
  /** `(any-pointer: fine)` inclut souris/stylus/trackpad m?me si `(hover:hover)` est faux sur hybrides. */
  const finePointer = useMediaQuery("(any-pointer: fine)");
  const language = useLanguageStore((s) => s.language);
  const isLanguageMorphing = useLanguageStore((s) => s.isLanguageMorphing);
  const copy = useAppCopy();
  const prefersReducedMotion = useReducedMotion();
  const introVideoPlaying = phase === "intro" && videoStarted;

  /** Palettes du voile langue - align?es acte II minuit sinon dor? d?sert */
  const languageMorphMidnight = (phase === "act2" && act2AmbientMidnight) || phase === "act3";

  phaseRef.current = phase;

  useEffect(() => {
    clearLegacyActIIIRewriteBootstrap();
  }, []);

  useEffect(() => {
    setCursorMode(cursorExperience === "fluid" ? "default" : "stylus");
  }, [cursorExperience, setCursorMode]);

  /** Mode basique : masquer le losange CSS global — seul le cercle React reste visible. */
  useEffect(() => {
    const html = document.documentElement;
    const basic = finePointer && cursorExperience === "basic";
    html.classList.toggle("al-rihla-cursor-basic", basic);
    return () => html.classList.remove("al-rihla-cursor-basic");
  }, [finePointer, cursorExperience]);

  /** Historique navigateur : une entr?e par transition de phase (sans changer l?URL). */
  const historyPhaseBootRef = useRef(false);
  const phaseFromHistoryPopRef = useRef(false);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const st = e.state as Record<string, unknown> | null;
      const p = st?.[HISTORY_PHASE_KEY];
      if (p !== "intro" && p !== "act1" && p !== "act2" && p !== "act3") return;
      phaseFromHistoryPopRef.current = true;
      setPhase(p);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!historyPhaseBootRef.current) {
      historyPhaseBootRef.current = true;
      window.history.replaceState(mergeHistoryPhaseState(phase), "", window.location.href);
      return;
    }
    if (phaseFromHistoryPopRef.current) {
      phaseFromHistoryPopRef.current = false;
      return;
    }
    window.history.pushState(mergeHistoryPhaseState(phase), "", window.location.href);
  }, [phase]);

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
      window.clearTimeout(act2ScrollPersistTimerRef.current);
      act2ScrollPersistTimerRef.current = 0;
      setAct2ParcheminTone(null);
      setAct2ScrollFillRatio(undefined);
      setAct2ScrollModeChoiceOpen(false);
    } else {
      const chrome = getHydratedActSave().act2.answers.chromeMode;
      setAct2ParcheminTone(chrome === "midnight" ? "midnight" : "solar");
    }
  }, [phase]);

  useEffect(() => {
    if (
      menuHintSeen ||
      systemMenuOpen ||
      introVideoOpen ||
      chapterDaTransition
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

    const base = import.meta.env.BASE_URL || "/";
    const prefix = base.endsWith("/") ? base : `${base}/`;
    const iconHref =
      theme === "midnight" ? `${prefix}favicon-camel.png` : `${prefix}favicon-camel-solar.png`;
    let link = document.querySelector<HTMLLinkElement>("#app-favicon");
    if (!link) {
      link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    }
    if (link) {
      link.type = "image/png";
      link.href = iconHref;
    }
  }, [phase, act2AmbientMidnight, setCursorAmbient]);

  /** Acte I / II : pas de scroll documentaire - ?vite Lenis + fond body cr?me qui ? fuient ? sous la sc?ne fixed. */
  useEffect(() => {
    const rootEl = document.documentElement;
    rootEl.classList.remove("phase-act1-root", "phase-act2-root", "phase-act3-root");
    if (phase === "act1") rootEl.classList.add("phase-act1-root");
    if (phase === "act2") rootEl.classList.add("phase-act2-root");
    if (phase === "act3") rootEl.classList.add("phase-act3-root");
    return () => {
      rootEl.classList.remove("phase-act1-root", "phase-act2-root", "phase-act3-root");
    };
  }, [phase]);

  useEffect(() => {
    const html = document.documentElement;
    const isArabic = language === "ar-dz";
    html.lang = isArabic ? "ar-DZ" : "fr";
    html.dir = isArabic ? "rtl" : "ltr";
    document.title =
      phase === "act3"
        ? isArabic
          ? "\u0627\u0644\u0631\u062d\u0644\u0629 \u00b7 \u0627\u0644\u0643\u062a\u0627\u0628\u0629"
          : "Al-Rihla \u00b7 L'\u00e9criture"
        : isArabic
          ? "\u0627\u0644\u0631\u062d\u0644\u0629"
          : "Al-Rihla";
  }, [language, phase]);

  /** Chunks menu pause + rail Parcours (GSAP) : charg?s en idle pour r?duire le JS initial sans bloquer le premier rendu. */
  useEffect(() => {
    const prefetch = () => {
      void loadOrientationPanelMod();
      void import("./components/ui/SystemMenu");
      void import("./components/ui/IntroVideoOverlay");
      void import("./components/Immersive/Act3Writing");
    };
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(prefetch);
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(prefetch, 500);
    return () => clearTimeout(t);
  }, []);

  /** Intro : prefetch carte apr?s interaction ou apr?s load idle ? pas de t?l?chargement pr?matur? sans geste utilisateur. */
  useEffect(() => {
    if (phase !== "intro") return;
    const detachGesture = attachAct1MapPrefetchOnFirstUserGesture();
    const cancelIdleFallback = scheduleIdleAct1MapPrefetchAfterLoad();
    return () => {
      detachGesture();
      cancelIdleFallback();
    };
  }, [phase]);

  /** Parcours libre : pr?pare acte II une fois la page stabilis?e (?vite pic r?seau/CPU au premier rendu intro). */
  useEffect(() => {
    if (phase !== "intro" || !journeyReplayUnlocked) return;
    let cancelAct2Prefetch: (() => void) | undefined;
    const onLoad = () => {
      cancelAct2Prefetch = runWhenIdle(() => prefetchAct2TransitionAssets(), 3600);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      cancelAct2Prefetch?.();
    };
  }, [phase, journeyReplayUnlocked]);

  useEffect(() => {
    if (!finePointer || splashWebglMountedRef.current) return;
    let rafTail = 0;
    const rafHead = requestAnimationFrame(() => {
      rafTail = requestAnimationFrame(() => {
        splashWebglMountedRef.current = true;
        setSplashWebglReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(rafHead);
      cancelAnimationFrame(rafTail);
    };
  }, [finePointer]);

  /** Carte : pendant le jeu, pr?pare bundle acte II + HTML parchemin + vid?os de pont (I?II, II?III). */
  useEffect(() => {
    if (phase !== "act1") return;
    const cancel = runWhenIdle(() => prefetchAct2TransitionAssets());
    return cancel;
  }, [phase]);

  /** Acte II : renforce le prefetch de la vid?o II?III une fois le parchemin affich?. */
  useEffect(() => {
    if (phase !== "act2") return;
    const cancel = runWhenIdle(() => prefetchAct23BridgeVideo());
    return cancel;
  }, [phase]);

  /** G?n?rique fin de voyage (iframe) : masque le fluide parent et remonte le curseur comme pour l?intro. */
  const [act2VoyageCreditsOpen, setAct2VoyageCreditsOpen] = useState(false);
  /** Ouverture des crédits depuis la clôture acte III : pas de défilement, bouton fermer tout de suite. */
  const [creditsSkipScroll, setCreditsSkipScroll] = useState(false);
  /** Align? synchrone avec les messages iframe (`senac-credits-chrome` avant les ?v?nements de progression). */
  const act2VoyageCreditsOpenRef = useRef(false);
  /** Pont II→III ou crédits : couper l’oud iframe pour ne pas chevaucher la vidéo / le générique. */
  const act23BridgeOpenRef = useRef(false);

  useEffect(() => {
    /* Acte II ou III : ne pas couper les crédits (générique prolonge l’acte III sans changer de phase). */
    if (phase === "act2" || phase === "act3") return;
    setAct2VoyageCreditsOpen(false);
    act2VoyageCreditsOpenRef.current = false;
    setCreditsSkipScroll(false);
  }, [phase]);

  act2VoyageCreditsOpenRef.current = act2VoyageCreditsOpen;
  act23BridgeOpenRef.current = act23BridgeOpen;

  useEffect(() => {
    if (phase !== "act2") return;
    try {
      if (sessionStorage.getItem(SESSION_RESUME_ACT2) === "1") {
        sessionStorage.removeItem(SESSION_RESUME_ACT2);
      }
      if (sessionStorage.getItem(SESSION_OPEN_VOYAGE_CREDITS) === "1") {
        sessionStorage.removeItem(SESSION_OPEN_VOYAGE_CREDITS);
        act2VoyageCreditsOpenRef.current = true;
        setCreditsSkipScroll(false);
        setAct2VoyageCreditsOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [phase]);

  /** D?verrouille l'audio au premier geste utilisateur (autoplay policy navigateur). */
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

  /** Relais volume menu pause -> iframe acte II (musique locale parchemin). Muet pendant pont II→III ou crédits. */
  useEffect(() => {
    if (phase !== "act2") return;
    const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
    if (!(iframe instanceof HTMLIFrameElement)) return;
    const muteParcheminAmbience = act23BridgeOpen || act2VoyageCreditsOpen;
    const effectiveVolume = muteParcheminAmbience ? 0 : Math.min(1, Math.max(0, masterVolume));
    const payload = {
      type: "senac-audio" as const,
      volume: effectiveVolume,
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
  }, [phase, masterVolume, playbackUnlocked, act23BridgeOpen, act2VoyageCreditsOpen]);

  /**
   * L?iframe redemande l??tat audio une fois pr?te : le premier postMessage parent part souvent
   * avant que `initChapterTwoAmbience` n?ait enregistr? son listener (message perdu).
   */
  useEffect(() => {
    if (phase !== "act2") return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!e.data || e.data.type !== "senac-request-audio") return;
      const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
      if (!(iframe instanceof HTMLIFrameElement)) return;
      if (e.source !== iframe.contentWindow) return;
      const muteParcheminAmbience =
        act23BridgeOpenRef.current || act2VoyageCreditsOpenRef.current;
      const effectiveVolume = muteParcheminAmbience
        ? 0
        : Math.min(1, Math.max(0, masterVolumeRef.current));
      const payload = {
        type: "senac-audio" as const,
        volume: effectiveVolume,
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



  const dismissAct12ChapterToast = useCallback(() => {
    setChapterToast(false);
  }, []);

  const handleAct12BridgeSwapPhase = useCallback(() => {
    if (!pendingAct2.current) return;
    setPhase("act2");
  }, []);

  const handleAct12BridgeFinish = useCallback(() => {
    pendingAct2.current = false;
    setChapterDaTransition(false);
    setAct12BridgeReveal01(1);
  }, []);

  /** S?curit? : d?bloquer si la WebM ne se termine jamais (erreur rare). */
  useEffect(() => {
    if (!chapterDaTransition) return;
    const t = window.setTimeout(() => {
      pendingAct2.current = false;
      setChapterDaTransition(false);
      setChapterToast(false);
      setAct12BridgeReveal01(1);
      setPhase((p) => (p === "act1" ? "act2" : p));
    }, 30000);
    return () => window.clearTimeout(t);
  }, [chapterDaTransition]);

  const handleMemoryMapComplete = useCallback(() => {
    patchActSave((s) => ({
      ...s,
      act1: {
        completed: true,
        answers: {
          ...s.act1.answers,
          revelationWords: [...REVELATION_WORDS],
          quest: COMPLETE_ACT1_QUEST,
          hasZoomed: true,
        },
      },
    }));
    pendingAct2.current = true;
    /** Renforce le pr?chargement (idempotent) : pont WebM + chunk Act2 + page parchemin. */
    prefetchAct2TransitionAssets();
    window.setTimeout(() => {
      setAct12BridgeReveal01(0);
      /** Pas de toast « chapitre accompli » : le pont se termine sur l’écran choix Cinéma / Exploration. */
      setChapterDaTransition(true);
    }, act12PostMapCompleteDelayMsRef.current + devAct12ExtraPrefaceMsRef.current);
  }, [ACT12_POST_MAP_COMPLETE_DELAY_MS, showDevChapterJumps, devAct12ExtraPrefaceMs]);

  /** Surcouche vid?o uniquement : ne change pas la phase, ne recharge pas, garde carte / acte. */
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
      window.localStorage.removeItem(ACT_SAVE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, []);

  /** Acte III dans la SPA : m?me URL que le voyage (sans `/act3`). */
  const goEnterActIII = useCallback((resumeAct2?: boolean) => {
    prepareActIIIEntry({ resumeAct2 });
    setParcoursOpen(false);
    setSystemMenuOpen(false);
    setPhase("act3");
  }, []);

  const beginActIIIEntrance = useCallback(
    (resumeAct2?: boolean) => {
      if (prefersReducedMotion === true) {
        goEnterActIII(resumeAct2);
        return;
      }
      if (phaseRef.current === "act2") {
        act23ResumeRef.current = !!resumeAct2;
        setAct23BridgeOpen(true);
        return;
      }
      goEnterActIII(resumeAct2);
    },
    [goEnterActIII, prefersReducedMotion]
  );

  const devChapterJumpsProps = useMemo((): DevChapterJumps | undefined => {
    if (!showDevChapterJumps) return undefined;
    return {
      goChapter1: () => setPhase("act1"),
      goChapter2: () => setPhase("act2"),
      goChapter3: () => {
        beginActIIIEntrance(false);
      },
      previewCredits: () => {
        window.location.assign(parcheminSenacHref("chapitre-3", { previewCredits: true }));
      },
      devAct12AddPrefaceMs: (deltaMs: number) => {
        setDevAct12ExtraPrefaceMs((n) => Math.max(0, n + deltaMs));
      },
      devAct12ResetPrefaceExtra: () => setDevAct12ExtraPrefaceMs(0),
      devAct12ExtraPrefaceMs: devAct12ExtraPrefaceMs,
      devAct12BasePrefaceDelayMs: ACT12_POST_MAP_COMPLETE_DELAY_MS,
    };
  }, [showDevChapterJumps, devAct12ExtraPrefaceMs, beginActIIIEntrance]);

  const handleAct23BridgeComplete = useCallback(() => {
    goEnterActIII(act23ResumeRef.current);
  }, [goEnterActIII]);

  useEffect(() => {
    if (phase !== "act2") setAct23BridgeOpen(false);
  }, [phase]);

  const exitAct3ToCredits = useCallback(() => {
    act2VoyageCreditsOpenRef.current = true;
    setAct2VoyageCreditsOpen(true);
    /* Phase acte III : les crédits se superposent au voyage (continuité), pas de retour forcé au parchemin. */
  }, []);

  const closeVoyageCreditsOverlay = useCallback(() => {
    act2VoyageCreditsOpenRef.current = false;
    setAct2VoyageCreditsOpen(false);
    setCreditsSkipScroll(false);
  }, []);

  const navigateParcoursPhase = useCallback((next: ParcoursPhaseLabel) => {
    setParcoursOpen(false);
    setSystemMenuOpen(false);
    if (next === "act3") {
      beginActIIIEntrance(phaseRef.current === "act2");
      return;
    }
    setPhase(next);
  }, [beginActIIIEntrance]);

  useEffect(() => {
    const expectedOrigin = window.location.origin;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      const d = e.data as Record<string, unknown>;
      if (d?.type !== "senac-journey-complete") return;
      const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
      if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
      setSessionJourneyReplayUnlocked(true);
      patchActSave((s) => ({
        ...s,
        act1: {
          completed: true,
          answers: {
            ...s.act1.answers,
            revelationWords: [...REVELATION_WORDS],
            quest: COMPLETE_ACT1_QUEST,
            consignesDismissed: true,
            hasZoomed: true,
          },
        },
        act2: {
          completed: true,
          answers: {
            ...s.act2.answers,
            quest: COMPLETE_ACT2_QUEST,
            scrollRatio: 1,
            chromeMode: "midnight",
            entryChosen: true,
          },
        },
        act3Unlocked: true,
      }));
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
    setAct1Quest((p) => {
      if (p[step]) return p;
      const next = { ...p, [step]: true };
      patchActSave((s) => ({
        ...s,
        act1: { ...s.act1, answers: { ...s.act1.answers, quest: next } },
      }));
      return next;
    });
  }, []);

  const onAct1RevelationWords = useCallback((words: string[]) => {
    setRevelationCount(words.length);
    patchActSave((s) => {
      const completed = words.length >= 5 || s.act1.completed;
      return {
        ...s,
        act1: {
          ...s.act1,
          completed,
          answers: { ...s.act1.answers, revelationWords: [...words] },
        },
      };
    });
  }, []);

  const onAct1ConsignesDismissed = useCallback(() => {
    patchActSave((s) => ({
      ...s,
      act1: { ...s.act1, answers: { ...s.act1.answers, consignesDismissed: true } },
    }));
  }, []);

  const onAct1HasZoomedPersist = useCallback(() => {
    patchActSave((s) => ({
      ...s,
      act1: { ...s.act1, answers: { ...s.act1.answers, hasZoomed: true } },
    }));
  }, []);

  /** Acte I carte : Lenis sans lissage molette (zoom molette pr?cis sur le canvas). Autres phases : glide doux. */
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
      e.preventDefault();
      setSystemMenuOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [systemMenuOpen, chapterToast, chapterDaTransition, phase, introVideoOpen, parcoursOpen, journeyReplayUnlocked]);

  /** Fl?ches ? / ? : ? ouvre le rail Parcours (desktop), ? ouvre le menu ; ? referme le Parcours s?il est ouvert. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (isEditableTarget(e.target)) return;
      if (
        systemMenuOpen ||
        introVideoOpen ||
        chapterToast ||
        chapterDaTransition ||
        isLanguageMorphing
      ) {
        return;
      }

      const parcoursEligible = mdUp && (phase !== "intro" || journeyReplayUnlocked);

      if (e.key === "ArrowLeft") {
        if (!parcoursEligible || parcoursOpen) return;
        e.preventDefault();
        dismissMenuHint(true);
        setParcoursOpen(true);
        return;
      }

      if (e.key === "ArrowRight") {
        if (parcoursOpen && parcoursEligible) {
          e.preventDefault();
          setParcoursOpen(false);
          return;
        }
        e.preventDefault();
        dismissMenuHint(true);
        setSystemMenuOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    mdUp,
    phase,
    journeyReplayUnlocked,
    parcoursOpen,
    systemMenuOpen,
    introVideoOpen,
    chapterToast,
    chapterDaTransition,
    isLanguageMorphing,
    dismissMenuHint,
  ]);

  /** Rail Parcours ouvert : la molette / le trackpad le referme (comme un clic sur le voile). */
  useEffect(() => {
    if (!parcoursOpen || (phase === "intro" && !journeyReplayUnlocked)) return;
    const onWheel = () => setParcoursOpen(false);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [parcoursOpen, phase, journeyReplayUnlocked]);

  /**
   * Acte II : iframe ? progression, navigation, et relais pointeur (`senac-pointer`) pour que le curseur
   * fluide + losange React suivent la souris au-dessus du parchemin (sinon seuls le rail Parcours re?oivent les events).
   */
  useEffect(() => {
    if (phase !== "act2") return;
    const expectedOrigin = window.location.origin;

    const onMsg = (e: MessageEvent) => {
      if (e.origin !== expectedOrigin) return;
      const d = e.data as Record<string, unknown>;
      if (d?.type === "senac-pointer") {
        if (phaseRef.current !== "act2") return;
        const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
        if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
        const cx = typeof d.clientX === "number" && Number.isFinite(d.clientX) ? d.clientX : 0;
        const cy = typeof d.clientY === "number" && Number.isFinite(d.clientY) ? d.clientY : 0;
        const r = iframe.getBoundingClientRect();
        const x = r.left + cx;
        const y = r.top + cy;
        if (d.down === true) {
          window.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: x, clientY: y, bubbles: true, cancelable: false }),
          );
        }
        window.dispatchEvent(
          new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true, cancelable: false }),
        );
        return;
      }
      if (e.data?.type === "senac-entry-mode") {
        const mode = e.data.mode as string;
        if (mode !== "cinema" && mode !== "explore") return;
        patchActSave((s) => ({
          ...s,
          act2: {
            ...s.act2,
            answers: { ...s.act2.answers, entryMode: mode, entryChosen: true },
          },
        }));
        return;
      }
      if (d?.type === "senac-scroll-mode-choice-overlay") {
        if (phaseRef.current !== "act2") return;
        const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
        if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
        setAct2ScrollModeChoiceOpen(d.open === true);
        return;
      }
      if (e.data?.type === "senac-quest") {
        const step = e.data.step as string;
        if (step === "scroll") {
          setAct2Quest((p) => {
            if (p.scroll) return p;
            const next = { ...p, scroll: true };
            patchActSave((s) => ({
              ...s,
              act2: { ...s.act2, answers: { ...s.act2.answers, quest: next } },
            }));
            return next;
          });
        }
        return;
      }
      if (e.data?.type === "senac-chrome") {
        const mode = e.data.mode as string;
        if (mode === "midnight" || mode === "solar") {
          setAct2ParcheminTone(mode);
          patchActSave((s) => ({
            ...s,
            act2: {
              ...s.act2,
              answers: {
                ...s.act2.answers,
                chromeMode: mode === "midnight" ? "midnight" : "solar",
              },
            },
          }));
        }
        return;
      }
      if (e.data?.type === "senac-scroll-progress") {
        const ratio = e.data.ratio as number;
        if (typeof ratio === "number" && Number.isFinite(ratio)) {
          const clamped = Math.min(1, Math.max(0, ratio));
          setAct2ScrollFillRatio(clamped);
          act2ScrollPersistRatioRef.current = clamped;
          window.clearTimeout(act2ScrollPersistTimerRef.current);
          act2ScrollPersistTimerRef.current = window.setTimeout(() => {
            const r = act2ScrollPersistRatioRef.current;
            if (r == null || !Number.isFinite(r)) return;
            patchActSave((s) => ({
              ...s,
              act2: { ...s.act2, answers: { ...s.act2.answers, scrollRatio: r } },
            }));
          }, 400);
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
        if (openNow) setCreditsSkipScroll(false);
        return;
      }
      if (d?.type === "senac-navigate") {
        const target = typeof d.target === "string" ? d.target : "";
        if (target === "act3-writing") {
          beginActIIIEntrance(true);
          return;
        }
        if (phaseRef.current !== "act2") return;
        const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
        if (!(iframe instanceof HTMLIFrameElement) || e.source !== iframe.contentWindow) return;
        if (target === "intro-video") {
          openIntroVideoOverlayRef.current();
          return;
        }
        if (target === "act1-map") {
          setPhase("act1");
          return;
        }
        /** Chapitre III : retour intro sans valider la travers?e compl?te (r?serv?e ? la sortie du g?n?rique). */
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
    };

    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearTimeout(act2ScrollPersistTimerRef.current);
      act2ScrollPersistTimerRef.current = 0;
    };
  }, [phase, beginActIIIEntrance]);

  /** R?hydrate le parchemin (scroll + mode d?entr?e) apr?s un premier passage ; premier rendu garde le choix Cin?ma / Exploration. */
  useEffect(() => {
    if (phase !== "act2") return;
    const save = getHydratedActSave();
    if (!save.act2.answers.entryChosen) return;

    const basePayload = {
      entryMode: save.act2.answers.entryMode,
      scrollRatio: save.act2.answers.scrollRatio,
    };

    const send = () => {
      const iframe = document.querySelector('iframe[src*="parchemin-senac"]');
      if (!(iframe instanceof HTMLIFrameElement) || !iframe.contentWindow) return;
      try {
        const payload = {
          ...basePayload,
          suppressArchToAct3: act2VoyageCreditsOpenRef.current === true,
        };
        iframe.contentWindow.postMessage({ type: "senac-hydrate", payload }, window.location.origin);
      } catch {
        /* ignore */
      }
    };

    send();
    const iframeEl = document.querySelector('iframe[src*="parchemin-senac"]');
    if (iframeEl instanceof HTMLIFrameElement) {
      iframeEl.addEventListener("load", send, { once: true });
    }
    const t = window.setTimeout(send, 520);
    const t2 = window.setTimeout(send, 1700);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      if (iframeEl instanceof HTMLIFrameElement) {
        iframeEl.removeEventListener("load", send);
      }
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
          phase === "act1" || phase === "act2" || phase === "act3"
            ? "isolate h-dvh max-h-dvh min-h-0 w-full overflow-hidden will-change-[opacity,filter,transform]"
            : "isolate min-h-0 w-full will-change-[opacity,filter,transform]"
        }
      >
      {/* Acte II : pas d?overlay cin? (z-[52]) au-dessus de l?iframe - vignette = bande sombre ? pied de page ?. */}
      {phase !== "act2" && <CinematicOverlay />}
      <Soundscape enabled={phase !== "act2"} />

      <AnimatePresence mode="sync">
        {chapterToast && (
          <Fragment key="ch1-toast">
            <ChapterCompleteToast
              chapterTitle={copy.chapterToastTitle}
              subtitle={copy.chapterToastSubtitle}
              bridgeReveal01={act12BridgeReveal01}
              blendBridgeBackdrop
            />
          </Fragment>
        )}
        {chapterDaTransition && (
          <ChapterAct12Bridge
            key="act12-bridge"
            onBridgeRevealChange={setAct12BridgeReveal01}
            onDismissChapterToast={dismissAct12ChapterToast}
            onSwapPhase={handleAct12BridgeSwapPhase}
            onFinish={handleAct12BridgeFinish}
          />
        )}
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

      {act23BridgeOpen && phase === "act2" ? (
        <ChapterAct23Bridge open={true} onComplete={handleAct23BridgeComplete} />
      ) : null}

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
                          phase === "act2"
                            ? (act2ParcheminTone ?? "solar") === "midnight"
                            : phase === "act3"
                        }
                        act2VoyageCreditsOpen={
                          act2VoyageCreditsOpen && (phase === "act2" || phase === "act3")
                        }
                        journeyReplayUnlocked={journeyReplayUnlocked}
                        act2UnlockedAfterBridge={act2UnlockedAfterBridge}
                        act3Reachable={act3RailUnlocked}
                        onNavigatePhase={navigateParcoursPhase}
                      />
                    </Suspense>
                  ) : undefined
                }
              />
            </Suspense>
          </Fragment>
        )}
      </AnimatePresence>

      {/* Fermeture du rail uniquement viewport md+ (le rail est masqu? sous md). */}
      {mdUp && parcoursOpen && (phase !== "intro" || journeyReplayUnlocked) && (
        <div
          className="fixed inset-0 z-[39] pointer-events-auto"
          onClick={() => setParcoursOpen(false)}
          aria-hidden
        />
      )}

      {/* Réglages : visibles dès l'intro (volume, langue, plein écran, etc.). */}
      {(phase !== "intro" || journeyReplayUnlocked) && !act3KeywordGateOpen && !act2ScrollModeChoiceOpen && <motion.button
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
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(197,160,89,0.2) 0%, transparent 75%)",
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
      </motion.button>}

      {(phase !== "intro" || journeyReplayUnlocked) && !act3KeywordGateOpen && (
        <>
          {!act2ScrollModeChoiceOpen && (
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
          )}
          <Suspense fallback={null}>
            <OrientationPanel
              phase={phase}
              revelationCount={revelationCount}
              expanded={parcoursOpen}
              onExpandedChange={setParcoursOpen}
              parcoursRailMidnight={
                phase === "act2" ? (act2ParcheminTone ?? "solar") === "midnight" : phase === "act3"
              }
              act2VoyageCreditsOpen={
                act2VoyageCreditsOpen && (phase === "act2" || phase === "act3")
              }
              journeyReplayUnlocked={journeyReplayUnlocked}
              act2UnlockedAfterBridge={act2UnlockedAfterBridge}
              act3Reachable={act3RailUnlocked}
              onNavigatePhase={navigateParcoursPhase}
            />
          </Suspense>
        </>
      )}

      {/* HintPanel : acte I uniquement - le parchemin (acte II) g?re sa propre navigation (mode Cin?ma / Exploration). */}
      {(phase === "intro" || phase === "act1") && (
        <HintPanel
          phase={phase === "act1" ? "act1" : "intro"}
          suppress={systemMenuOpen || introVideoOpen}
          act1Quest={phase === "act1" ? act1Quest : undefined}
        />
      )}

      {/* Rep?re zoom ? acte I ? masqu? d?s que le zoom carte est acquis */}
      {phase === "act1" && !systemMenuOpen && !introVideoOpen && !act1Quest.zoom && (
        <ScrollNudge key="zoom-nudge-act1" />
      )}

      <main
        className={
          (phase === "act1" || phase === "act2" || phase === "act3"
            ? "relative h-dvh max-h-dvh min-h-0 w-full overflow-hidden "
            : "relative w-full min-h-dvh ") +
          (phase === "act2" || phase === "act3" ? "bg-da-depth-night" : "bg-da-depth-intro")
        }
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
                devChapterJumps={devChapterJumpsProps}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "act1" && (
          <motion.div
            key="act1"
            className="fixed inset-0 z-20 overflow-x-hidden will-change-[opacity,transform]"
            initial={{ opacity: 0 }}
            animate={
              chapterDaTransition
                ? {
                    opacity: Math.max(0.42, 1 - 0.58 * act12BridgeReveal01),
                    scale: 1 - 0.008 * act12BridgeReveal01,
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={
              chapterDaTransition
                ? { duration: 0 }
                : { duration: 1.5, ease: "easeInOut" }
            }
          >
            <Suspense
              fallback={
                <LazyPhaseFallback
                  message={copy.lazySuspenseAct1}
                  bgClassName="bg-da-depth-map"
                  arabicUi={language === "ar-dz"}
                />
              }
            >
              <AlgeriaMap
                onRevelationWordsChange={onAct1RevelationWords}
                onMemoryMapComplete={handleMemoryMapComplete}
                onQuestStepComplete={onAct1QuestStep}
                completedReplay={journeyReplayUnlocked || (act1Persist?.completed ?? false)}
                initialRevelationWords={act1Persist?.answers.revelationWords}
                initialQuestProgress={act1Persist?.answers.quest}
                initialHasZoomed={act1Persist?.answers.hasZoomed}
                initialConsignesDismissed={act1Persist?.answers.consignesDismissed}
                onConsignesDismissed={onAct1ConsignesDismissed}
                onHasZoomedPersist={onAct1HasZoomedPersist}
                parcoursRailExpanded={mdUp && parcoursOpen}
              />
            </Suspense>
          </motion.div>
        )}

        {phase === "act2" && (
          <motion.div
            key="act2"
            className="fixed inset-0 z-20 min-h-0 overflow-hidden will-change-[opacity,transform]"
            initial={chapterDaTransition ? false : { opacity: 0 }}
            animate={
              chapterDaTransition
                ? {
                    opacity: 0.04 + 0.96 * act12BridgeReveal01,
                    scale: 1.018 - 0.018 * act12BridgeReveal01,
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={
              chapterDaTransition
                ? { duration: 0 }
                : { duration: 1.05, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <Suspense
              fallback={
                <LazyPhaseFallback
                  message={copy.lazySuspenseAct2}
                  bgClassName="bg-da-depth-night"
                  arabicUi={language === "ar-dz"}
                />
              }
            >
              <Act2 onOpenActIII={() => beginActIIIEntrance(true)} />
            </Suspense>
          </motion.div>
        )}

        {phase === "act3" && (
          <motion.div
            key="act3"
            className="fixed inset-0 z-[25] min-h-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <Suspense
              fallback={
                <LazyPhaseFallback
                  message={copy.lazySuspenseAct3}
                  bgClassName="bg-da-depth-night"
                  arabicUi={language === "ar-dz"}
                />
              }
            >
              <Act3Writing
                onContinueToCredits={exitAct3ToCredits}
                onKeywordGateChange={setAct3KeywordGateOpen}
              />
            </Suspense>
          </motion.div>
        )}

      </main>

      {/* Fluide WebGL : toutes les phases (pointer-events: none, ne bloque pas l'iframe). */}
      {finePointer && splashWebglReady && useFluidCursorExperience && (
        <div
          style={{
            pointerEvents: "none",
            visibility:
              systemMenuOpen ||
              introVideoOpen ||
              act23BridgeOpen ||
              isLanguageMorphing
                ? "hidden"
                : "visible",
          }}
        >
          <Fragment
            key={
              phase === "act1"
                ? "splash-act1"
                : phase === "act2"
                  ? "splash-act2"
                  : "splash-default"
            }
          >
            <SplashCursor
              syncPaletteFromAmbient
              zIndex={
                act2VoyageCreditsOpen ? 532 : phase === "act2" ? 10 : 120
              }
              SIM_RESOLUTION={phase === "act1" || phase === "act2" ? 128 : 160}
              DYE_RESOLUTION={phase === "act1" ? 512 : phase === "act2" ? 640 : 720}
              DENSITY_DISSIPATION={phase === "act1" ? 12 : 10}
              VELOCITY_DISSIPATION={5}
              PRESSURE={0.1}
              CURL={10}
              SPLAT_RADIUS={0.05}
              SPLAT_FORCE={phase === "act1" ? 9000 : 12000}
              COLOR_UPDATE_SPEED={10}
              iframeScrollRatio={phase === "act2" ? act2ScrollFillRatio : undefined}
            />
          </Fragment>
        </div>
      )}

      <VoyageCreditsOverlay
        open={act2VoyageCreditsOpen}
        midnight={(act2ParcheminTone ?? "solar") === "midnight"}
        skipScrollAnimation={creditsSkipScroll}
        fromAct3Finale={phase === "act3"}
        onClose={restartExperience}
      />

      {phase === "act2" && !act2VoyageCreditsOpen && !act23BridgeOpen && !introVideoOpen ? (
        <ScrollProgressBar
          tone={act2AmbientMidnight ? "midnight" : "solar"}
          iframeFillRatio={act2ScrollFillRatio}
          aboveChrome={false}
        />
      ) : null}

      {showDevChapterJumps && phase === "act1" && devChapterJumpsProps != null && (
        <div
          className="pointer-events-auto fixed z-[240] flex flex-col gap-2 rounded-sm border border-solar-gold/25 bg-black/55 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm"
          style={{
            left: "max(0.75rem, env(safe-area-inset-left))",
            bottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <p className="m-0 text-[8px] font-medium uppercase tracking-[0.35em] text-solar-gold/50">
            Pont I→II · dev
          </p>
          <p className="m-0 text-[9px] tabular-nums text-solar-gold/75">
            +{(devAct12ExtraPrefaceMs / 1000).toFixed(1)}s — total{" "}
            {((ACT12_POST_MAP_COMPLETE_DELAY_MS + devAct12ExtraPrefaceMs) / 1000).toFixed(1)}s avant transi
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => devChapterJumpsProps.devAct12AddPrefaceMs?.(1_000)}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
            >
              +1 s
            </button>
            <button
              type="button"
              onClick={() => devChapterJumpsProps.devAct12AddPrefaceMs?.(2_000)}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
            >
              +2 s
            </button>
            <button
              type="button"
              onClick={() => devChapterJumpsProps.devAct12ResetPrefaceExtra?.()}
              className="rounded-sm border border-solar-gold/30 bg-black/40 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-solar-gold/90 transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      </motion.div>
      <LanguageMorphHud visible={isLanguageMorphing} midnight={languageMorphMidnight} />
    </ReactLenis>
      {/* Curseur custom : d?sactiv? en acte II (parchemin = losange dans l?iframe, curseur syst?me sur le shell). */}
      {finePointer && (
      <CustomCursor
        overlayOpen={
          systemMenuOpen ||
          introVideoOpen ||
          act2VoyageCreditsOpen ||
          isLanguageMorphing ||
          act2ScrollModeChoiceOpen
        }
      />
      )}
    </>
  );
}

/** Pastille + voile DA (m?me vocabulaire que le passage chapitre II : halos, grain, losange). */
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
          className="pointer-events-none fixed inset-0 z-[562] flex items-center justify-center overflow-hidden bg-da-depth-abyss"
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

          {/* Fil de lumi?re type transition chapitre */}
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
                <line x1="11" y1="22" x2="11" y2="28" stroke={losangeStroke} strokeWidth="1" strokeOpacity="0.72" strokeLinecap="round" />
                <polyline
                  points="8,25 11,29 14,25"
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
