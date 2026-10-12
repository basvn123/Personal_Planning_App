import { create } from "zustand";

/** A short message; with an action (e.g. "Ongedaan maken") it stays a little longer and can be tapped. */
type Toast = { id: number; text: string; action?: { label: string; run: () => void } };

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
  /** Saves the same activity on several days; shows at once the ones this page displays. */
  addMany: (tasks: NewTask[]) => void;
};

export type AddPreset = { day?: string | null; sectionId?: string; time?: string };

type UiState = {
  paletteOpen: boolean;
  openPalette: () => void;
  setPaletteOpen: (open: boolean) => void;
  addOpen: boolean;
  /** Preset for the add sheet, e.g. the day row whose plus was tapped. */
  addPreset: AddPreset | null;
  openAdd: (preset?: AddPreset) => void;
  setAddOpen: (open: boolean) => void;
  /** The start-a-timer sheet, reachable from every page. */
  startOpen: boolean;
  setStartOpen: (open: boolean) => void;
  planner: PlannerHook | null;
  setPlanner: (p: PlannerHook | null) => void;
  toast: Toast | null;
  showToast: (text: string, action?: Toast["action"]) => void;
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
  startOpen: false,
  setStartOpen: (startOpen) => set({ startOpen }),
  planner: null,
  setPlanner: (planner) => set({ planner }),
  toast: null,
  showToast: (text, action) => set({ toast: { id: ++toastId, text, action } }),
  xpPending: 0,
  gainXp: (n) => set((s) => ({ xpPending: s.xpPending + n })),
  resetXp: () => set({ xpPending: 0 }),
}));
