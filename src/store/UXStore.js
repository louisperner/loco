import { create } from 'zustand';

export const useUXStore = create((set) => ({
  showEditor: false,
  showUx: false,
  updateShowEditor: (showEditor) => set(() => ({ showEditor: showEditor })),
  updateShowUx: (showUx) => set(() => ({ showUx: showUx })),
}));
