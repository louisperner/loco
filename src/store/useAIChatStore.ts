import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '../components/AIChat/types';

interface AIChatState {
  messages: ChatMessage[];
  isVisible: boolean;
  selectedMessageId: string | null;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
  clearMessages: () => void;
  selectMessage: (id: string | null) => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set) => ({
      messages: [],
      isVisible: false,
      selectedMessageId: null,
      
      addMessage: (message) => set((state) => {
        const newMessage = {
          ...message,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };
        
        return {
          messages: [...state.messages, newMessage],
          selectedMessageId: newMessage.id,
        };
      }),
      
      toggleVisibility: () => set((state) => ({
        isVisible: !state.isVisible
      })),
      
      setVisibility: (visible) => set({
        isVisible: visible
      }),
      
      clearMessages: () => set({
        messages: [],
        selectedMessageId: null
      }),
      
      selectMessage: (id) => set({
        selectedMessageId: id
      })
    }),
    {
      name: 'ai-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        selectedMessageId: state.selectedMessageId
      })
    }
  )
); 