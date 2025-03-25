import { create } from 'zustand';

interface UXState {
  showEditor: boolean;
  showUx: boolean;
  updateShowEditor: (showEditor: boolean) => void;
  updateShowUx: (showUx: boolean) => void;
}

export const useUXStore = create<UXState>((set) => ({
  showEditor: false,
  showUx: false,
  updateShowEditor: (showEditor: boolean) => set(() => ({ showEditor: showEditor })),
  updateShowUx: (showUx: boolean) => set(() => ({ showUx: showUx })),
})); 