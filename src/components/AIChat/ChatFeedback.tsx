import React from 'react';
import { Loader2, Bot } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

interface ChatFeedbackProps {
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamContent: string;
  commandFeedback: string | null;
  selectedMessageId: string | null;
}

const ChatFeedback: React.FC<ChatFeedbackProps> = ({
  isLoading,
  isStreaming,
  commandFeedback,
  selectedMessageId,
}) => {
  // Don't show feedback or loading indicators if a message is selected
  if (selectedMessageId) return null;

  // Show command feedback if available
  if (commandFeedback) {
    return (
      <div className="py-3 px-4 bg-[#1E2D3D] rounded-md border border-[#2A3F50] text-teal-400 text-sm">
        {commandFeedback}
      </div>
    );
  }

  // Show typing indicator when loading (non-streaming)
  if (isLoading && !isStreaming) {
    return (
      <div className="py-4 px-4 bg-[#1A1A1A] rounded-md">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-1.5 rounded-full bg-yellow-500">
            <Bot size={14} className="text-black" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs font-medium text-white/60">
                AI
              </div>
              <Loader2 size={12} className="animate-spin text-white/40" />
            </div>
            <TypingIndicator />
          </div>
        </div>
      </div>
    );
  }

  // Show loading indicator in minimal view
  if (isLoading || isStreaming) {
    return (
      <div className="flex items-center gap-2 mt-2 text-white/60">
        <Loader2 size={12} className="animate-spin" />
        <span className="text-xs">AI is thinking...</span>
      </div>
    );
  }

  return null;
};

export default ChatFeedback; 