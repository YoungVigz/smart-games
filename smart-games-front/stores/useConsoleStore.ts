import { create } from "zustand";

export type ConsoleView = "commands" | "themes" | "search";

type ConsoleState = {
  view: ConsoleView | null;
  open: (view?: ConsoleView) => void;
  close: () => void;
  toggle: () => void;
};

export const useConsoleStore = create<ConsoleState>()((set) => ({
  view: null,
  open: (view = "commands") => set({ view }),
  close: () => set({ view: null }),
  toggle: () =>
    set((state) => ({
      view: state.view === null ? "commands" : null,
    })),
}));