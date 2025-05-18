import React from 'react';
import { Bot, Trash2, History, ChevronLeft, X } from 'lucide-react';
import ModelSelector from './ModelSelector';

interface AIChatHeaderProps {
  showHistory: boolean;
  toggleHistory: () => void;
  clearMessages: () => void;
  toggleViewMode: () => void;
  toggleVisibility: () => void;
  isMinimal?: boolean;
}

const AIChatHeader: React.FC<AIChatHeaderProps> = ({
  showHistory,
  toggleHistory,
  clearMessages,
  toggleViewMode,
  toggleVisibility,
  isMinimal = false,
}) => {
  if (isMinimal) {
    return (
      <div className="flex items-center mt-2 px-2">
        <div className="flex-1 flex items-center space-x-1 text-xs text-white/50">
          <span className="bg-[#333333] text-xs px-1 rounded text-white/50">AI</span>
          <ModelSelector className="inline-block text-xs" />
        </div>
        
        {/* Buttons aligned to the right */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHistory}
            className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
            title="View message history"
          >
            <History size={14} />
          </button>
          <button
            onClick={clearMessages}
            className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
            title="Clear messages"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={toggleViewMode}
            className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
            title="Expand Chat"
          >
            <ChevronLeft size={14} className="rotate-180" />
          </button>
          <button 
            onClick={toggleVisibility}
            className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-3 bg-[#2C2C2C] border-b-4 border-[#222222]">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-yellow-400" />
        <h2 className="text-white/90 font-medium">AI Chat</h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleHistory}
          className={`p-1.5 rounded hover:bg-[#222222] ${showHistory ? 'text-yellow-400' : 'text-white/60 hover:text-white/90'} transition-colors`}
          title="Message History"
        >
          <History size={16} />
        </button>
        <button
          onClick={clearMessages}
          className="p-1.5 rounded hover:bg-[#222222] text-white/60 hover:text-white/90 transition-colors"
          title="Clear chat"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={toggleViewMode}
          className="p-1.5 rounded hover:bg-[#222222] text-white/60 hover:text-white/90 transition-colors"
          title="Minimize Chat"
        >
          <ChevronLeft size={16} />
        </button>
        <ModelSelector className="mx-2" />
        <button 
          onClick={toggleVisibility}
          className="w-10 h-10 bg-[#bb2222] text-white hover:bg-[#D46464] text-12 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center rounded-md transition-colors border-2 border-[#151515]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default AIChatHeader; 