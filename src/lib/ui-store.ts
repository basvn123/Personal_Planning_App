import { create } from "zustand";

type Toast = { id: number; text: string };

type UiState = {
  paletteOpen: boolean;
  openPalette: () => void;
  setPaletteOpen: (open: boolean) => void;
  addOpen: boolean;
  setAddOpen: (open: boolean) => void;
  toast: Toast | null;
  showToast: (text: string) => void;
  /** Points earned in this tab since the server last counted them. */
  xpPending: number;
  gainXp: (n: number) => void;
  resetXp: () => void;
};

let toastId = 0;

/** UI-only state. Domain data never lives here. */
export const useUi = create<UiState>((set) => ({
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  addOpen: false,
  setAddOpen: (addOpen) => set({ addOpen }),
  toast: null,
  showToast: (text) => set({ toast: { id: ++toastId, text } }),
  xpPending: 0,
  gainXp: (n) => set((s) => ({ xpPending: s.xpPending + n })),
  resetXp: () => set({ xpPending: 0 }),
}));
