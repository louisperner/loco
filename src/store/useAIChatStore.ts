import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '../components/AIChat/types';

interface AIChatState {
  messages: ChatMessage[];
  isVisible: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
  clearMessages: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set) => ({
      messages: [],
      isVisible: false,
      
      addMessage: (message) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: Date.now().toString(),
            timestamp: Date.now(),
          }
        ]
      })),
      
      toggleVisibility: () => set((state) => ({
        isVisible: !state.isVisible
      })),
      
      setVisibility: (visible) => set({
        isVisible: visible
      }),
      
      clearMessages: () => set({
        messages: []
      })
    }),
    {
      name: 'ai-chat-storage',
      partialize: (state) => ({
        messages: state.messages
      })
    }
  )
); 