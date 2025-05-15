// Chat message type
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  model: string;
}

// Chat history type
export interface ChatHistory {
  messages: ChatMessage[];
}

// AI Chat component props
export interface AIChatProps {
  isVisible: boolean;
  toggleVisibility: () => void;
} 