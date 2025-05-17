import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollama-constants';

interface OllamaState {
  endpoint: string;
  defaultModel: string;
  useStreaming: boolean;
  isEnabled: boolean;
  history: {
    query: string;
    response: string;
    timestamp: number;
    model: string;
  }[];
  
  // Actions
  setEndpoint: (endpoint: string) => void;
  setDefaultModel: (model: string) => void;
  setUseStreaming: (enabled: boolean) => void;
  setIsEnabled: (enabled: boolean) => void;
  addToHistory: (query: string, response: string, model: string) => void;
  clearHistory: () => void;
}

export const useOllamaStore = create<OllamaState>()(
  persist(
    (set) => ({
      endpoint: "https://192.168.15.57:11434", // Updated to HTTPS to match server configuration
      defaultModel: 'llama3',
      useStreaming: true,
      isEnabled: true,
      history: [],
      
      setEndpoint: (endpoint) => set({ endpoint }),
      setDefaultModel: (model) => set({ defaultModel: model }),
      setUseStreaming: (enabled) => set({ useStreaming: enabled }),
      setIsEnabled: (enabled) => set({ isEnabled: enabled }),
      
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
      name: 'ollama-storage',
      partialize: (state) => ({
        endpoint: state.endpoint,
        defaultModel: state.defaultModel,
        useStreaming: state.useStreaming,
        isEnabled: state.isEnabled,
        history: state.history
      })
    }
  )
); 