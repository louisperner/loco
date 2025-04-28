// Common interfaces and types for the Spotlight components

// Common result interface
export interface SearchResult {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface MergedSpotlightProps {
  onSearch?: (query: string) => void;
}

// Chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

// Interface for OpenRouter messages
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
} 