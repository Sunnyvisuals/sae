import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_MASTER_VOLUME = 0.2;

type MasterVolumeState = {
  /** 0-1 · volume principal du son (ambiant, etc.). */
  volume: number;
  /** Débloque la lecture audio après geste utilisateur ou curseur > 0. */
  playbackUnlocked: boolean;
  setVolume: (v: number) => void;
  unlockPlayback: () => void;
};

export const useMasterVolumeStore = create<MasterVolumeState>()(
  persist(
    (set, get) => ({
      volume: DEFAULT_MASTER_VOLUME,
      playbackUnlocked: false,
      setVolume: (v: number) => {
        const volume = Math.min(1, Math.max(0, v));
        const next: Partial<MasterVolumeState> = { volume };
        if (volume > 0) next.playbackUnlocked = true;
        set(next);
      },
      unlockPlayback: () => {
        if (!get().playbackUnlocked) set({ playbackUnlocked: true });
      },
    }),
    {
      name: 'al-rihla-master-volume-v2',
      partialize: (state) => ({ volume: state.volume }),
    }
  )
);
