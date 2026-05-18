import {
  ACT_SAVE_STORAGE_KEY,
  JOURNEY_REPLAY_STORAGE_KEY,
  resetSessionProgress,
} from "./actSave";
import { clearConstellationVote } from "./act3ConstellationVote";
import {
  SESSION_BOOTSTRAP_ACTIII,
  SESSION_OPEN_VOYAGE_CREDITS,
  SESSION_RESUME_ACT2,
} from "./appRoutes";

/** Clés localStorage (Zustand persist + progression legacy). */
const EXPERIENCE_LOCAL_STORAGE_KEYS = [
  ACT_SAVE_STORAGE_KEY,
  JOURNEY_REPLAY_STORAGE_KEY,
  "al-rihla-language",
  "al-rihla-cursor-v2",
  "al-rihla-master-volume-v2",
  "al-rihla-fullscreen-prefs",
  "al-rihla-geolocation-prefs",
  "al-rihla-visitor-place",
  "al-rihla-constellation-vote",
  "al-rihla-consignes-vues",
  "al-rihla-menu-hint-seen",
] as const;

/** Flags de reprise (SPA + parchemin). */
const EXPERIENCE_SESSION_STORAGE_KEYS = [
  SESSION_RESUME_ACT2,
  SESSION_OPEN_VOYAGE_CREDITS,
  SESSION_BOOTSTRAP_ACTIII,
  "al-rihla-bootstrap-act3",
  "al-rihla-dev-jumps-open",
] as const;

/** Efface toute progression / préférences d’expérience (session + stockage navigateur). */
export function clearAllExperienceStorage(): void {
  resetSessionProgress();
  clearConstellationVote();

  if (typeof window === "undefined") return;

  try {
    for (const key of EXPERIENCE_LOCAL_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    for (const key of EXPERIENCE_SESSION_STORAGE_KEYS) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    /* private mode / quota */
  }
}

/** Recharge à la racine SPA (intro), sans hash ni reprise d’acte. */
export function navigateToExperienceStart(): void {
  if (typeof window === "undefined") return;
  const base = import.meta.env.BASE_URL || "/";
  const path = base.endsWith("/") ? base : `${base}/`;
  window.location.replace(`${window.location.origin}${path}`);
}

/** Recommencer depuis le début : reset complet puis rechargement. */
export function restartExperienceFromScratch(): void {
  clearAllExperienceStorage();
  navigateToExperienceStart();
}
