import React, { useState, useRef, useEffect } from 'react';
import { Brain, History, Loader2, ChevronDown, Check, Send, Trash2 } from 'lucide-react';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';
import { openRouterApi } from '@/lib/openrouter';
import { OPENROUTER_MODELS, isStreamingSupported } from '@/lib/openrouter-constants';
import { ChatMessage, OpenRouterMessage, SearchResult } from './types';
import { parseAIResponseForCommands } from './utils';
import { cn } from '@/lib/utils';

interface OpenRouterChatProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  results: SearchResult[];
  setResults: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  selectedResultIndex: number;
  setSelectedResultIndex: React.Dispatch<React.SetStateAction<number>>;
  setShowCommandSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  commandHandler: (commandType: string | null) => void;
  appCommands: SearchResult[];
}

const OpenRouterChat: React.FC<OpenRouterChatProps> = ({
  searchQuery,
  setSearchQuery,
  setIsOpen,
  results,
  setResults,
  selectedResultIndex,
  setSelectedResultIndex,
  setShowCommandSuggestions,
  commandHandler,
  appCommands
}) => {
  // OpenRouter specific state
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isAutoSelect, setIsAutoSelect] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [shownResponse, setShownResponse] = useState<string>('');
  const [fullResponse, setFullResponse] = useState<string>('');
  const [streamInterval, setStreamInterval] = useState<NodeJS.Timeout | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  // OpenRouter store access
  const { 
    apiKey, 
    defaultModel, 
    siteName,
    siteUrl,
    history,
    addToHistory,
    setDefaultModel
  } = useOpenRouterStore();
  
  // Scroll to bottom of chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, shownResponse]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (streamInterval) {
        clearInterval(streamInterval);
      }
    };
  }, [streamInterval]);
  
  // Close model selector when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      if (showModelSelector) {
        setShowModelSelector(false);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showModelSelector]);
  
  // Toggle auto-select mode
  const toggleAutoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAutoSelect(e.target.checked);
    // Auto-select can't be on at the same time as thinking
    if (e.target.checked) {
      setIsThinking(false);
    }
  };
  
  // Toggle thinking mode
  const toggleThinking = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsThinking(e.target.checked);
    // Thinking can't be on at the same time as auto-select
    if (e.target.checked) {
      setIsAutoSelect(false);
    }
  };
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    // If we're in the middle of fake streaming, stop it
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
      setIsStreaming(false);
      
      // If we have a full response stored, show it immediately
      if (fullResponse) {
        setFullResponse('');
      }
    }
    
    setDefaultModel(modelId);
    setShowModelSelector(false);
  };
  
  // Clear chat history
  const clearChat = () => {
    setChatMessages([]);
    setShownResponse('');
    setFullResponse('');
    setIsStreaming(false);
    
    if (streamInterval) {
      clearInterval(streamInterval);
    }
  };
  
  // Handle searching OpenRouter
  const handleOpenRouterQuery = async () => {
    if (!apiKey) {
      const errorMessage = "Please set your OpenRouter API key in settings first.";
      setChatMessages(prev => [...prev, { 
        role: 'system', 
        content: errorMessage,
        timestamp: Date.now()
      }]);
      return;
    }
    
    if (!searchQuery.trim()) {
      return;
    }
    
    // Check if query starts with a / to trigger commands
    if (searchQuery.startsWith('/')) {
      // Look for command matches
      const command = searchQuery.slice(1).toLowerCase().trim();
      const matchedCommand = appCommands.find(cmd => 
        cmd.id.toLowerCase() === command || 
        cmd.title.toLowerCase().includes(command)
      );
      
      if (matchedCommand) {
        // Add user message to chat
        setChatMessages(prev => [...prev, { 
          role: 'user', 
          content: searchQuery,
          timestamp: Date.now()
        }]);
        
        // Execute the command
        matchedCommand.action();
        
        // Add system message about executed command
        setChatMessages(prev => [...prev, { 
          role: 'system', 
          content: `Executed command: ${matchedCommand.title}`,
          timestamp: Date.now()
        }]);
        
        setSearchQuery('');
        return;
      } else {
        // No matching command found
        setChatMessages(prev => [...prev, { 
          role: 'user', 
          content: searchQuery,
          timestamp: Date.now()
        }]);
        
        setChatMessages(prev => [...prev, { 
          role: 'system', 
          content: `Command not found: ${command}. Try one of: ${appCommands.map(c => c.id).join(', ')}`,
          timestamp: Date.now()
        }]);
        
        setSearchQuery('');
        return;
      }
    }
    
    // Regular chat message
    setIsLoading(true);
    setShownResponse('');
    setFullResponse('');
    setIsStreaming(false);
    
    // Add user message to chat history
    setChatMessages(prev => [...prev, { 
      role: 'user', 
      content: searchQuery,
      timestamp: Date.now()
    }]);
    
    // Clean up any existing interval
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
    }
    
    // Prepare the messages for OpenRouter API
    // Include chat history for context (limited to last few exchanges)
    const recentChatMessages = chatMessages.slice(-6); // Get last few messages
    const promptMessages: OpenRouterMessage[] = recentChatMessages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role as 'user' | 'assistant', // Convert system messages to user for API compatibility
      content: msg.content
    }));
    
    // Add system message about available commands
    if (!promptMessages.some(msg => msg.role === 'system')) {
      promptMessages.unshift({
        role: 'system',
        content: `You are an assistant with access to execute app commands. To execute a command, include [command:name] in your response. 
          Available commands: ${appCommands.map(cmd => cmd.id).join(', ')}. 
          Example usage: "Let me add a cube for you [command:cube]" or "I'll show you an image picker [command:image]".
          Only use commands when explicitly asked by the user.`
      });
    }
    
    // Add the current question
    promptMessages.push({ role: 'user', content: searchQuery });
    
    try {
      const result = await openRouterApi.chat(
        apiKey,
        {
          model: defaultModel,
          messages: promptMessages
        },
        { url: siteUrl, title: siteName }
      );
      
      const responseContent = result.choices[0]?.message?.content || "No response received";
      const responseModel = result.model;
      
      // Process response for commands before displaying
      const commandType = parseAIResponseForCommands(responseContent);
      if (commandType) {
        commandHandler(commandType);
      }
      
      // Add message to chat
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseContent,
        timestamp: Date.now(),
        model: responseModel
      }]);
      
      // Add to history
      addToHistory(searchQuery, responseContent, result.model);
      
      // Check if streaming is supported, if not, simulate it
      const supportsStreaming = isStreamingSupported(defaultModel);
      
      if (!supportsStreaming && !isThinking) {
        // Set full response in state but don't display it yet
        setFullResponse(responseContent);
        
        // Split response into words
        const words = responseContent.split(/(\s+)/); // Split by whitespace but keep separators
        let currentIndex = 0;
        
        // Clear any previous interval
        if (streamInterval) {
          clearInterval(streamInterval);
        }
        
        // Set loading to false but we're still "streaming"
        setIsLoading(false);
        setIsStreaming(true);
        
        // Add empty assistant message that will be filled in
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '', 
          timestamp: Date.now(),
          model: result.model
        }]);
        
        // Start a new interval to add words one by one
        const interval = setInterval(() => {
          if (currentIndex < words.length) {
            const newWord = words[currentIndex];
            setShownResponse(prev => prev + newWord);
            
            // Update the last message in the chat array
            setChatMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content += newWord;
                }
              }
              return newMessages;
            });
            
            currentIndex++;
          } else {
            // We've shown all words, stop the interval
            clearInterval(interval);
            setStreamInterval(null);
            setIsStreaming(false);
            
            // Parse for commands after response is complete
            const commandType = parseAIResponseForCommands(responseContent);
            if (commandType) {
              commandHandler(commandType);
            }
            
            // No need to set aiResponse since we're using chatMessages now
            setSearchQuery('');
          }
        }, 30); // Adjust speed as needed
        
        setStreamInterval(interval);
      } else {
        // For models that support streaming or when in thinking mode, just show the response immediately
        // Process response for commands before displaying
        const commandType = parseAIResponseForCommands(responseContent);
        if (commandType) {
          commandHandler(commandType);
        }
        
        // Add message to chat with string content only
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: responseContent, // This is a string
          timestamp: Date.now(),
          model: result.model
        }]);
        
        setIsLoading(false);
        setSearchQuery('');
      }
      
    } catch (error) {
      console.error("OpenRouter API error:", error);
      
      setChatMessages(prev => [...prev, { 
        role: 'system', 
        content: "Error: Could not get a response from OpenRouter. Please check your API key and try again.",
        timestamp: Date.now()
      }]);
      
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {/* Header with search bar */}
      <div className='p-3 bg-[#2C2C2C] border-b-4 border-[#222222]'>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!isLoading && searchQuery.trim()) {
                handleOpenRouterQuery();
              }
            }}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Check for commands as user types
                  if (e.target.value.startsWith('/')) {
                    const query = e.target.value.slice(1).toLowerCase().trim();
                    if (query) {
                      const matches = appCommands.filter(cmd => 
                        cmd.id.toLowerCase().includes(query) || 
                        cmd.title.toLowerCase().includes(query)
                      );
                      if (matches.length > 0) {
                        setResults(matches);
                        setShowCommandSuggestions(true);
                        setSelectedResultIndex(0); // Reset selection
                      } else {
                        setShowCommandSuggestions(false);
                      }
                    } else {
                      // Show all commands when just typing '/'
                      setResults(appCommands);
                      setShowCommandSuggestions(true);
                      setSelectedResultIndex(0); // Reset selection
                    }
                  } else {
                    setShowCommandSuggestions(false);
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  
                  // Navigate command suggestions with arrow keys
                  if (results.length > 0 && ['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
                    e.preventDefault();
                    
                    if (e.key === 'ArrowDown') {
                      setSelectedResultIndex((prev: number) => 
                        prev < results.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === 'ArrowUp') {
                      setSelectedResultIndex((prev: number) => 
                        prev > 0 ? prev - 1 : results.length - 1
                      );
                    } else if (e.key === 'Enter' && results.length > 0) {
                      const selectedCommand = results[selectedResultIndex];
                      if (selectedCommand) {
                        // Add user message to chat
                        setChatMessages(prev => [...prev, { 
                          role: 'user', 
                          content: searchQuery,
                          timestamp: Date.now()
                        }]);
                        
                        // Execute the command and add system message
                        selectedCommand.action();
                        setChatMessages(prev => [...prev, { 
                          role: 'system', 
                          content: `Executed command: ${selectedCommand.title}`,
                          timestamp: Date.now()
                        }]);
                        
                        setSearchQuery('');
                        setShowCommandSuggestions(false);
                      }
                    }
                  }
                }}
                disabled={isLoading || isStreaming}
                placeholder={isLoading ? "Processing..." : "Type a message or '/command'..."}
                className="w-full bg-[#222222] text-white/90 placeholder-white/40 border-2 border-[#151515] px-3 py-2 text-sm focus:outline-none focus:border-[#666666] rounded-md"
              />
            </form>
          </div>
          
          {/* Model selector button */}
          <div 
            className="p-1 bg-[#222222] border-2 border-[#151515] rounded-md flex items-center cursor-pointer hover:border-[#666666] relative"
            onClick={(e) => {
              e.stopPropagation();
              setShowModelSelector(!showModelSelector);
            }}
          >
            <Brain className="h-5 w-5 text-white/70" />
            <ChevronDown className="h-4 w-4 text-white/70 ml-1" />
            
            {/* Model dropdown */}
            {showModelSelector && (
              <div 
                className="absolute top-full right-0 mt-1 w-[280px] bg-[#222222] border-2 border-[#151515] rounded-md shadow-xl z-50 max-h-[300px] overflow-y-auto
                  [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
                  [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
                onClick={(e) => e.stopPropagation()}
              >
                {OPENROUTER_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      'flex items-center justify-between p-2 hover:bg-[#333333] cursor-pointer',
                      defaultModel === model.id ? 'bg-[#3F3F3F]' : ''
                    )}
                    onClick={() => handleModelChange(model.id)}
                  >
                    <div className="flex items-center">
                      <span className="text-sm text-white/90">{model.name}</span>
                    </div>
                    {defaultModel === model.id && (
                      <Check className="h-4 w-4 text-[#42ca75]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Clear chat button */}
          <button
            className="p-1 bg-[#222222] border-2 border-[#151515] rounded-md flex items-center hover:border-[#666666]"
            onClick={clearChat}
            title="Clear chat history"
          >
            <Trash2 className="h-5 w-5 text-white/70" />
          </button>
          
          {/* Chat history button */}
          <button
            className="p-1 bg-[#222222] border-2 border-[#151515] rounded-md flex items-center hover:border-[#666666]"
            onClick={() => null} // Toggle history view (placeholder)
            title="View history"
          >
            <History className="h-5 w-5 text-white/70" />
          </button>
        </div>
        
        {/* Command suggestions */}
        {results.length > 0 && (
          <div className='flex flex-wrap gap-1 -mb-3 relative z-10'>
            {results.slice(0, 5).map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  // Execute command
                  cmd.action();
                  // Add to chat history
                  setChatMessages(prev => [...prev, {
                    role: 'user',
                    content: `/${cmd.id}`,
                    timestamp: Date.now()
                  }]);
                  setChatMessages(prev => [...prev, {
                    role: 'system',
                    content: `Executed command: ${cmd.title}`,
                    timestamp: Date.now()
                  }]);
                  // Clear search and suggestions
                  setSearchQuery('');
                  setShowCommandSuggestions(false);
                }}
                className={cn(
                  'px-4 py-1.5 text-sm transition-colors duration-100 border-t-2 border-x-2 border-b-0 flex items-center gap-1 rounded-t-md',
                  selectedResultIndex === index 
                    ? 'bg-[#3F3F3F] text-white/90 border-[#555555]' 
                    : 'bg-[#2A2A2A] text-white/60 border-[#151515] hover:bg-[#333333]'
                )}
                title={cmd.title}
              >
                <span className="hidden sm:inline">{cmd.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Chat messages */}
      <div 
        ref={chatMessagesRef} 
        className="bg-[#2C2C2C] flex-1 flex flex-col p-2 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
          [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
      >
        {/* Welcome message if no messages */}
        {chatMessages.length === 0 && !isLoading && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-10 text-white/50 bg-[#222222] min-h-[200px] h-full rounded-md">
            <Brain className="w-12 h-12 mb-4 opacity-50" />
            <p>Ask me anything or use commands</p>
            <p className="text-xs mt-2">Type <kbd className="bg-[#151515] rounded px-1 mx-1">/</kbd> to see available commands</p>
            {!apiKey && (
              <p className="text-xs mt-4 text-red-400">⚠️ OpenRouter API key not set. Please configure in settings.</p>
            )}
          </div>
        )}
        
        {/* Chat message history */}
        <div className="flex flex-col gap-3">
          {chatMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`rounded-md max-w-[80%] overflow-hidden border-2 ${
                  message.role === 'user'
                    ? 'bg-[#42ca75]/20 border-[#42ca75]/30 text-white'
                    : message.role === 'system'
                      ? 'bg-[#bb2222]/20 border-[#bb2222]/30 text-white'
                      : 'bg-[#222222] border-[#151515] text-white/90'
                }`}
              >
                <div className="p-3 text-sm">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {/* Current response stream */}
          {(isLoading || shownResponse || isStreaming) && (
            <div className="flex justify-start">
              <div className="rounded-md max-w-[80%] overflow-hidden bg-[#222222] border-2 border-[#151515]">
                <div className="p-3 text-sm text-white/90">
                  {isLoading && !shownResponse && !isStreaming ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 text-white/50 animate-spin mr-2" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <>
                      {shownResponse || ''}
                      {isStreaming && <span className="inline-block w-2 h-4 bg-white/50 ml-1 animate-pulse"></span>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer with keyboard shortcuts and modes */}
      <div className="p-2 text-xs text-white/40 border-t-2 border-[#151515] bg-[#222222] flex justify-between items-center">
        <div className="flex space-x-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-select"
              checked={isAutoSelect}
              onChange={toggleAutoSelect}
              className="mr-1 h-3 w-3"
            />
            <label htmlFor="auto-select">Auto-select</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="thinking"
              checked={isThinking}
              onChange={toggleThinking}
              className="mr-1 h-3 w-3"
            />
            <label htmlFor="thinking">Thinking mode</label>
          </div>
        </div>
        
        <div>
          Press <kbd className="bg-[#151515] rounded px-1">F</kbd> for commands
        </div>
      </div>
    </>
  );
};

export default OpenRouterChat; 