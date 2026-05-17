import type { Act1QuestProgress, Act2QuestProgress } from "../components/ui/HintPanel";
import { REVELATION_WORDS } from "../components/Immersive/mapWordData";

export const ACT_SAVE_STORAGE_KEY = "al-rihla-act-save";
export const JOURNEY_REPLAY_STORAGE_KEY = "al-rihla-journey-complete";

const ACT_SAVE_VERSION = 1;

type Act1Answers = {
  revelationWords: string[];
  quest: Act1QuestProgress;
  consignesDismissed: boolean;
  hasZoomed: boolean;
};

type Act2Answers = {
  quest: Act2QuestProgress;
  scrollRatio: number;
  entryMode: "cinema" | "explore";
  chromeMode: "solar" | "midnight";
  /** Après le premier choix Cinéma / Exploration dans le parchemin : autorise la réhydratation parent → iframe. */
  entryChosen: boolean;
  /** Ligne complétée pour la clôture « traversée » (avant crédits). */
  traversalLine?: string;
  /** Accès au générique après la clôture. */
  finaleComplete?: boolean;
};

type ActSaveState = {
  version: number;
  act1: { completed: boolean; answers: Act1Answers };
  act2: { completed: boolean; answers: Act2Answers };
  /** Parcours : Acte III aussi marqué ouvert après entrée depuis le parchemin (le rail se base aussi sur le pont Acte I). */
  act3Unlocked?: boolean;
};

const EMPTY_ACT1_QUEST: Act1QuestProgress = { hover: false, clickWord: false, zoom: false };
const EMPTY_ACT2_QUEST: Act2QuestProgress = { scroll: false };

/**
 * Progression actes & « Parcours libre » : mémoire de session seulement.
 * Rechargement (F5) ou nouvel onglet → état par défaut (plus de persistance localStorage).
 */
let sessionSave: ActSaveState | null = null;
let sessionJourneyReplayUnlocked = false;

if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(ACT_SAVE_STORAGE_KEY);
    window.localStorage.removeItem(JOURNEY_REPLAY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readJourneyReplayUnlocked(): boolean {
  return sessionJourneyReplayUnlocked;
}

export function setSessionJourneyReplayUnlocked(unlocked: boolean): void {
  sessionJourneyReplayUnlocked = unlocked;
}

function defaultAct1Answers(): Act1Answers {
  return {
    revelationWords: [],
    quest: { ...EMPTY_ACT1_QUEST },
    consignesDismissed: false,
    hasZoomed: false,
  };
}

function defaultAct2Answers(): Act2Answers {
  return {
    quest: { ...EMPTY_ACT2_QUEST },
    scrollRatio: 0,
    entryMode: "explore",
    chromeMode: "solar",
    entryChosen: false,
  };
}

function defaultActSave(): ActSaveState {
  return {
    version: ACT_SAVE_VERSION,
    act1: { completed: false, answers: defaultAct1Answers() },
    act2: { completed: false, answers: defaultAct2Answers() },
    act3Unlocked: false,
  };
}

function loadActSave(): ActSaveState {
  if (typeof window === "undefined") return defaultActSave();
  if (!sessionSave) {
    sessionSave = defaultActSave();
  }
  return sessionSave;
}

function writeActSave(state: ActSaveState): void {
  if (typeof window === "undefined") return;
  sessionSave = state;
}

export function patchActSave(mutator: (prev: ActSaveState) => ActSaveState): ActSaveState {
  const prev = loadActSave();
  const next = mutator(prev);
  writeActSave(next);
  return next;
}

/** Sauvegarde fusionnée avec le drapeau « traversée complète » (Parcours libre), session uniquement. */
export function getHydratedActSave(): ActSaveState {
  const base = loadActSave();
  if (!readJourneyReplayUnlocked()) return base;

  return {
    ...base,
    act1: {
      completed: true,
      answers: {
        ...base.act1.answers,
        revelationWords: [...REVELATION_WORDS],
        quest: { hover: true, clickWord: true, zoom: true },
        consignesDismissed: true,
        hasZoomed: true,
      },
    },
    act2: {
      completed: true,
      answers: {
        ...base.act2.answers,
        entryChosen: true,
        quest: { scroll: true },
        scrollRatio: 0.8,
        chromeMode: "midnight",
        finaleComplete: true,
      },
    },
    act3Unlocked: true,
  };
}

/** Drapeaux pour les raccourcis iframe (hero + frise) - alignés sur le rail Parcours. */
export function getSenacCrossNavFlags(): {
  act1Completed: boolean;
  act3Unlocked: boolean;
} {
  const s = getHydratedActSave();
  const journeyReplay = readJourneyReplayUnlocked();
  const act1Completed = journeyReplay || s.act1.completed;
  return {
    act1Completed,
    act3Unlocked: journeyReplay || Boolean(s.act3Unlocked) || act1Completed,
  };
}
