import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VisitorPlace } from "../lib/visitorGeolocation";

type VisitorPlaceState = {
  place: VisitorPlace | null;
  setPlace: (place: VisitorPlace | null) => void;
  clearPlace: () => void;
};

export const useVisitorPlaceStore = create<VisitorPlaceState>()(
  persist(
    (set) => ({
      place: null,
      setPlace: (place) => set({ place }),
      clearPlace: () => set({ place: null }),
    }),
    { name: "al-rihla-visitor-place" },
  ),
);

export function buildConstellationPrenomVille(
  prenom: string,
  place: VisitorPlace | null,
): string | undefined {
  const p = prenom.trim();
  const label = place?.label?.trim() ?? "";
  if (p && label) return `${p} · ${label}`.slice(0, 80);
  if (p) return p.slice(0, 80);
  if (label) return label.slice(0, 80);
  return undefined;
}
