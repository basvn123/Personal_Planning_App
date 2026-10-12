import { create } from "zustand";

type Toast = { id: number; text: string };

export type NewTask = {
  title: string;
  sectionId: string;
  plannedDate: string | null;
  plannedStart: string | null;
  plannedMinutes: number | null;
};

/** What the page's planner offers the add sheet: the day in view, and an instant add. */
export type PlannerHook = {
  day: string | null;
  sectionId: string | null;
  /** Adds optimistically when the task belongs on this page; false means "not mine". */
  add: (task: NewTask) => boolean;
};

type UiState = {
  paletteOpen: boolean;
  openPalette: () => void;
  setPaletteOpen: (open: boolean) => void;
  addOpen: boolean;
  /** Preset for the add sheet, e.g. the day row whose plus was tapped. */
  addPreset: { day?: string | null; sectionId?: string } | null;
  openAdd: (preset?: { day?: string | null; sectionId?: string }) => void;
  setAddOpen: (open: boolean) => void;
  planner: PlannerHook | null;
  setPlanner: (p: PlannerHook | null) => void;
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
  addPreset: null,
  openAdd: (preset) => set({ addOpen: true, addPreset: preset ?? null }),
  setAddOpen: (addOpen) => set(addOpen ? { addOpen } : { addOpen, addPreset: null }),
  planner: null,
  setPlanner: (planner) => set({ planner }),
  toast: null,
  showToast: (text) => set({ toast: { id: ++toastId, text } }),
  xpPending: 0,
  gainXp: (n) => set((s) => ({ xpPending: s.xpPending + n })),
  resetXp: () => set({ xpPending: 0 }),
}));
