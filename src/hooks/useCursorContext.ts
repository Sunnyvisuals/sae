import { create } from 'zustand';

type CursorMode = 'default' | 'halo' | 'feather' | 'pointer' | 'drag';

interface CursorStore {
  mode: CursorMode;
  label: string;
  setMode: (mode: CursorMode, label?: string) => void;
}

// Zustand store léger pour le curseur global
export const useCursorStore = create<CursorStore>((set) => ({
  mode: 'default',
  label: '',
  setMode: (mode, label = '') => set({ mode, label }),
}));
