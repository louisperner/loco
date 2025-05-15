import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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
    <div className={`relative flex items-end ${className}`}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type / for commands or start typing a message..."
        className="w-full resize-none bg-[#222222] rounded-md px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-[#666666] min-h-[40px] max-h-[150px] border-2 border-[#151515] placeholder-white/40"
        disabled={isLoading}
        rows={1}
      />
      <button
        onClick={handleSendMessage}
        disabled={!message.trim() || isLoading}
        className={`ml-2 p-2 rounded-md ${
          !message.trim() || isLoading
            ? 'bg-[#333333] text-white/40 border-2 border-[#151515]'
            : 'bg-[#42ca75] text-white hover:bg-[#666666] border-2 border-[#151515]'
        } transition-colors`}
      >
        <Send size={16} />
      </button>
    </div>
  );
};

export default ChatInput; 