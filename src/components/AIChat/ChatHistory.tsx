import React from 'react';
import { User, ChevronRight } from 'lucide-react';
import { ChatMessage } from './types';
import { formatMessagePreview } from './utils/aiChatUtils';

interface ChatHistoryProps {
  messages: ChatMessage[];
  selectedMessageId: string | null;
  handleSelectMessage: (id: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  selectedMessageId,
  handleSelectMessage,
}) => {
  // Group messages by conversation context
  const groupMessagesByContext = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };

  return (
    <div className="w-64 border-r border-[#222222] bg-[#252525] overflow-y-auto
      [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
      [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
    >
      <div className="p-3 border-b border-[#222222] bg-[#2A2A2A] sticky top-0 z-10">
        <h3 className="text-sm font-medium text-white/80">Conversation History</h3>
      </div>
      <div className="py-2">
        {groupMessagesByContext().map((group, groupIndex) => (
          <div key={groupIndex} className="mb-3">
            <div className="px-3 py-1 text-xs text-white/50 bg-[#2A2A2A]">
              {group.date}
            </div>
            <div className="divide-y divide-[#333333]">
              {group.messages.filter(message => message.role === 'user').map((message) => {
                const isSelected = message.id === selectedMessageId;
                // Find the assistant response that follows this message
                const nextIndex = group.messages.findIndex(msg => msg.id === message.id) + 1;
                const hasResponse = nextIndex < group.messages.length && group.messages[nextIndex].role === 'assistant';
                
                return (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message.id)}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 
                              hover:bg-[#333333] transition-colors
                              ${isSelected ? 'bg-[#333333]' : ''}`}
                  >
                    <div className="mt-0.5 p-1 rounded-full flex-shrink-0 bg-[#4A8CCA]">
                      <User size={10} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/70 flex items-center justify-between mb-0.5">
                        <span>Conversation {group.messages.length > 2 ? `(${Math.ceil(group.messages.length/2)} msgs)` : ''}</span>
                        <span className="text-white/40 text-[10px]">
                          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 truncate">
                        {formatMessagePreview(message.content)}
                      </p>
                      {hasResponse && (
                        <p className="text-xs text-green-400/60 truncate mt-1">
                          {formatMessagePreview(group.messages[nextIndex].content, 30)}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <ChevronRight size={14} className="text-yellow-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;