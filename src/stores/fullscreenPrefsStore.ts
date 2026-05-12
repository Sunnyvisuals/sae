import { create } from "zustand";
import { persist } from "zustand/middleware";

type FullscreenPrefsState = {
  /** Bandeau « plein écran » au chargement (désactivable dans le menu pause). */
  offerFullscreenOnArrival: boolean;
  setOfferFullscreenOnArrival: (v: boolean) => void;
};

export const useFullscreenPrefsStore = create<FullscreenPrefsState>()(
  persist(
    (set) => ({
      offerFullscreenOnArrival: true,
      setOfferFullscreenOnArrival: (v) => set({ offerFullscreenOnArrival: v }),
    }),
    { name: "al-rihla-fullscreen-prefs" }
  )
);
