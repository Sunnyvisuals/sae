import { create } from "zustand";
import { persist } from "zustand/middleware";

type GeolocationPrefsState = {
  offerGeolocationOnArrival: boolean;
  setOfferGeolocationOnArrival: (v: boolean) => void;
};

export const useGeolocationPrefsStore = create<GeolocationPrefsState>()(
  persist(
    (set) => ({
      offerGeolocationOnArrival: true,
      setOfferGeolocationOnArrival: (v) => set({ offerGeolocationOnArrival: v }),
    }),
    { name: "al-rihla-geolocation-prefs" },
  ),
);
