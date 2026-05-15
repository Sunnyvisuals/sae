import { create } from "zustand";
import { persist } from "zustand/middleware";

/** `fluid` : fluide WebGL + curseur personnalisé. `basic` : cercle simple, sans fluide WebGL. */
export type CursorExperienceMode = "fluid" | "basic";

type CursorPrefsState = {
  experience: CursorExperienceMode;
  setExperience: (experience: CursorExperienceMode) => void;
};

export const useCursorPrefsStore = create<CursorPrefsState>()(
  persist(
    (set) => ({
      experience: "fluid",
      setExperience: (experience) => set({ experience }),
    }),
    { name: "al-rihla-cursor-v2" }
  )
);
