import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  className?: string;
  onSlashKeyPress?: () => void;
  value?: string;
  onChange?: (value: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  className,
  onSlashKeyPress,
  value,
  onChange
}) => {
  const [localMessage, setLocalMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Determine if component is controlled or uncontrolled
  const isControlled = value !== undefined && onChange !== undefined;
  const message = isControlled ? value : localMessage;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (isControlled) {
      onChange(newValue);
    } else {
      setLocalMessage(newValue);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      if (isControlled) {
        onChange('');
      } else {
        setLocalMessage('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle slash key to show command palette
    if (e.key === '/' && message === '' && onSlashKeyPress) {
      e.preventDefault();
      onSlashKeyPress();
      
      // Also update input value with the slash character
      if (isControlled && onChange) {
        onChange('/');
      } else {
        setLocalMessage('/');
      }
      return;
    }
    
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
    <div className={`relative flex flex-col ${className}`}>
      <div className="relative flex items-center w-full">
        {/* Search icon */}
        <div className="absolute left-3 flex items-center justify-center text-gray-400">
          <Search size={16} className="text-white/30" />
        </div>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Plan, search, build anything"
          className="w-full resize-none bg-[#1A1A1A] rounded-xl px-10 py-2.5 text-sm text-white/90 
                    focus:outline-none focus:ring-1 focus:ring-[#444444] min-h-[42px] max-h-[150px] 
                    border border-[#333333] placeholder-white/40 shadow-lg transition-all duration-150"
          disabled={isLoading}
          rows={1}
        />
        
        {/* AI icon on the right */}
        <div className="absolute right-3 flex items-center justify-center">
          <Sparkles size={16} className="text-white/30" />
        </div>
      </div>
      
      {/* Send button is hidden but still functional for keyboard Enter */}
      <button
        onClick={handleSendMessage}
        disabled={!message.trim() || isLoading}
        className="hidden"
        aria-label="Send message"
      >
        <Send />
      </button>
    </div>
  );
};

export default ChatInput; 