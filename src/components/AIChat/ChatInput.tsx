import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, className }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-adjust height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [message]);

  return (
    <div className={`relative flex items-end ${className}`}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="w-full resize-none bg-[#1A1A1A] rounded-md px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[40px] max-h-[150px] border border-white/10"
        disabled={isLoading}
        rows={1}
      />
      <button
        onClick={handleSendMessage}
        disabled={!message.trim() || isLoading}
        className={`ml-2 p-2 rounded-full ${
          !message.trim() || isLoading
            ? 'bg-white/5 text-white/40'
            : 'bg-yellow-500 text-black hover:bg-yellow-400'
        } transition-colors`}
      >
        <Send size={16} />
      </button>
    </div>
  );
};

export default ChatInput; 