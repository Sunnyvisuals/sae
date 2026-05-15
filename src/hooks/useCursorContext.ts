import { create } from 'zustand';

type CursorMode = 'default' | 'halo' | 'feather' | 'pointer' | 'drag' | 'stylus';

type CursorAmbient = 'solar' | 'midnight';

interface CursorStore {
  mode: CursorMode;
  label: string;
  ambient: CursorAmbient;
  setMode: (mode: CursorMode, label?: string) => void;
  setAmbient: (ambient: CursorAmbient) => void;
}

// Zustand store léger pour le curseur global
export const useCursorStore = create<CursorStore>((set) => ({
  mode: 'default',
  label: '',
  ambient: 'solar',
  setMode: (mode, label = '') => set({ mode, label }),
  setAmbient: (ambient) => set({ ambient }),
}));
