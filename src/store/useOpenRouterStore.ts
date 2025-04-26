import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OpenRouterState {
  apiKey: string;
  defaultModel: string;
  siteName: string;
  siteUrl: string;
  useStreaming: boolean;
  history: {
    query: string;
    response: string;
    timestamp: number;
    model: string;
  }[];
  
  // Actions
  setApiKey: (key: string) => void;
  setDefaultModel: (model: string) => void;
  setSiteName: (name: string) => void;
  setSiteUrl: (url: string) => void;
  setUseStreaming: (enabled: boolean) => void;
  addToHistory: (query: string, response: string, model: string) => void;
  clearHistory: () => void;
}

export const useOpenRouterStore = create<OpenRouterState>()(
  persist(
    (set) => ({
      apiKey: '',
      defaultModel: 'openai/gpt-4o',
      siteName: 'Loco 3D Environment',
      siteUrl: window.location.origin,
      useStreaming: true,
      history: [],
      
      setApiKey: (key) => set({ apiKey: key }),
      setDefaultModel: (model) => set({ defaultModel: model }),
      setSiteName: (name) => set({ siteName: name }),
      setSiteUrl: (url) => set({ siteUrl: url }),
      setUseStreaming: (enabled) => set({ useStreaming: enabled }),
      
      addToHistory: (query, response, model) => set((state) => ({
        history: [
          {
            query,
            response,
            timestamp: Date.now(),
            model
          },
          ...state.history.slice(0, 19) // Keep last 20 entries
        ]
      })),
      
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'openrouter-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        defaultModel: state.defaultModel,
        siteName: state.siteName,
        siteUrl: state.siteUrl,
        useStreaming: state.useStreaming,
        history: state.history
      })
    }
  )
); 