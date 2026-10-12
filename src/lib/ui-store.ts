import { create } from "zustand";

type UiState = {
  paletteOpen: boolean;
  openPalette: () => void;
  setPaletteOpen: (open: boolean) => void;
};

/** UI-only state. Domain data never lives here. */
export const useUi = create<UiState>((set) => ({
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
