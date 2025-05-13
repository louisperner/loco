import { create } from 'zustand';

// Add a logger helper
const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }
};

export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
  region?: { x: number; y: number; width: number; height: number };
}

export interface Solution {
  code: string;
  explanation: string;
  complexity: {
    time: string;
    space: string;
  };
}

interface InterviewAssistantState {
  screenshots: Screenshot[];
  solution: Solution | null;
  isVisible: boolean;
  isCapturing: boolean;
  isGenerating: boolean;
  isSelectingRegion: boolean;
  position: { x: number; y: number };
  problemText: string;
  
  // Actions
  setVisible: (visible: boolean) => void;
  addScreenshot: (screenshot: Screenshot) => void;
  setSolution: (solution: Solution | null) => void;
  setCapturing: (capturing: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setSelectingRegion: (selecting: boolean) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setProblemText: (text: string) => void;
  resetAll: () => void;
}

export const useInterviewAssistantStore = create<InterviewAssistantState>((set) => ({
  screenshots: [],
  solution: null,
  isVisible: true,
  isCapturing: false,
  isGenerating: false,
  isSelectingRegion: false,
  position: { x: 20, y: 20 },
  problemText: "",
  
  // Actions
  setVisible: (visible) => set({ isVisible: visible }),
  addScreenshot: (screenshot) => {
    logger.log("Store: Adding new screenshot");
    set((state) => {
      const newScreenshots = [...state.screenshots, screenshot].slice(-3); // Keep last three for better debugging
      logger.log("Store: Updated screenshots array, now has", newScreenshots.length, "items");
      return { screenshots: newScreenshots };
    });
  },
  setSolution: (solution) => set({ solution }),
  setCapturing: (capturing) => set({ isCapturing: capturing }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  setSelectingRegion: (selecting) => set({ isSelectingRegion: selecting }),
  setPosition: (position) => set({ position }),
  setProblemText: (problemText) => set({ problemText }),
  resetAll: () => set({ 
    screenshots: [], 
    solution: null, 
    problemText: "" 
  }),
})); 