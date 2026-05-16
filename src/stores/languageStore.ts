import { create } from "zustand";

export type AppLanguage = "fr" | "ar-dz";

/** Durée avant bascule localeStorage + state (texte) - le flou atteint alors presque son maximum. */
export const LANGUAGE_MORPH_OUT_MS = 220;
/** Durée du retour visuel après application de la nouvelle langue */
export const LANGUAGE_MORPH_IN_MS = 440;

type LanguageState = {
  language: AppLanguage;
  /** True pendant le fondu / pastille (changement depuis le menu pause). */
  isLanguageMorphing: boolean;
  setLanguageInstant: (language: AppLanguage) => void;
  setLanguageWithTransition: (language: AppLanguage) => void;
  confirmLanguage: (language: AppLanguage) => void;
};

const STORAGE_KEY = "al-rihla-language";

let morphT1: ReturnType<typeof setTimeout> | null = null;
let morphT2: ReturnType<typeof setTimeout> | null = null;

function clearMorphTimers() {
  if (morphT1 != null) {
    clearTimeout(morphT1);
    morphT1 = null;
  }
  if (morphT2 != null) {
    clearTimeout(morphT2);
    morphT2 = null;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function readInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "fr";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "ar-dz" ? "ar-dz" : "fr";
}

function persistLanguage(language: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: readInitialLanguage(),
  isLanguageMorphing: false,

  setLanguageInstant: (language) => {
    clearMorphTimers();
    persistLanguage(language);
    set({ language, isLanguageMorphing: false });
  },

  setLanguageWithTransition: (language) => {
    if (get().language === language) return;
    if (prefersReducedMotion()) {
      get().setLanguageInstant(language);
      return;
    }
    clearMorphTimers();
    set({ isLanguageMorphing: true });
    morphT1 = setTimeout(() => {
      morphT1 = null;
      persistLanguage(language);
      set({ language });
      morphT2 = setTimeout(() => {
        morphT2 = null;
        set({ isLanguageMorphing: false });
      }, LANGUAGE_MORPH_IN_MS);
    }, LANGUAGE_MORPH_OUT_MS);
  },

  confirmLanguage: (language) => {
    clearMorphTimers();
    persistLanguage(language);
    set({ language, isLanguageMorphing: false });
  },
}));
