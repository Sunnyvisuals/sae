import { create } from "zustand";

/**
 * Après montage du SplashCursor shell : le fluide « background » d’Aurora s’arrête
 * pour éviter deux simulations WebGL (même rendu que la pile acte I).
 */
type ShellRuntimeState = {
  fluidHandoff: boolean;
  setFluidHandoff: (fluidHandoff: boolean) => void;
};

export const useShellRuntimeStore = create<ShellRuntimeState>()((set) => ({
  fluidHandoff: false,
  setFluidHandoff: (fluidHandoff) => set({ fluidHandoff }),
}));
