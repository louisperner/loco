import React, { useState } from 'react';
import { Copy, Check, Bot, User } from 'lucide-react';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';

export interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  model?: string;
}

const ChatMessage: React.FC<MessageProps> = ({ content, role, timestamp, model }) => {
  const [copied, setCopied] = useState(false);
  const { defaultModel } = useOpenRouterStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayModel = model || defaultModel;
  const modelName = displayModel.includes('/')
    ? displayModel.split('/')[1].replace(/-instruct$/, '')
    : displayModel;

  return (
    <div className={`py-4 px-4 ${role === 'assistant' ? 'bg-[#1A1A1A]' : ''} rounded-md border-2 border-[#151515]`}>
      <div className="flex items-start gap-3">
        <div className={`mt-1 p-1.5 rounded-full ${role === 'assistant' ? 'bg-[#42ca75]' : 'bg-[#4A8CCA]'}`}>
          {role === 'assistant' ? (
            <Bot size={14} className="text-black" />
          ) : (
            <User size={14} className="text-white" />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs font-medium text-white/60">
              {role === 'assistant' ? `AI (${modelName})` : 'You'}
            </div>
            <div className="text-xs text-white/40">
              {formatTimestamp(timestamp)}
            </div>
          </div>
          <div className="text-sm text-white/90 whitespace-pre-wrap break-words">
            {content}
          </div>
        </div>
        {role === 'assistant' && (
          <button 
            onClick={handleCopy}
            className="p-1.5 text-white/40 hover:text-white/80 transition-colors hover:bg-[#222222] rounded"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 