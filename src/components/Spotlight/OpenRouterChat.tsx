import React, { useState, useRef, useEffect } from 'react';
import { Brain, History, Loader2, ChevronDown, Check, Send, Trash2 } from 'lucide-react';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';
import { openRouterApi } from '@/lib/openrouter';
import { OPENROUTER_MODELS, isStreamingSupported } from '@/lib/openrouter-constants';
import { ChatMessage, OpenRouterMessage, SearchResult } from './types';
import { parseAIResponseForCommands } from './utils';

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
  results,
  selectedResultIndex,
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
  const toggleAutoSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoSelect(!isAutoSelect);
    // Auto-select can't be on at the same time as thinking
    if (!isAutoSelect) {
      setIsThinking(false);
    }
  };
  
  // Toggle thinking mode
  const toggleThinking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsThinking(!isThinking);
    // Thinking can't be on at the same time as auto-select
    if (!isThinking) {
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
      {/* Chat Messages */}
      <div 
        ref={chatMessagesRef}
        className="overflow-y-auto flex-1 max-h-[calc(80vh-100px)] p-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-white/50">
            <Brain className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-xs mt-2">Use / commands to control the app</p>
            
            {history.length > 0 && (
              <div className="mt-6 w-full max-w-md">
                <div className="space-y-1">
                  {history.slice(0, 5).map((item, index) => (
                    <div 
                      key={index}
                      className="px-4 py-2 cursor-pointer hover:bg-white/10 text-sm text-white/80"
                      onClick={() => {
                        setChatMessages([
                          { role: 'user', content: item.query, timestamp: item.timestamp },
                          { role: 'assistant', content: item.response, timestamp: item.timestamp, model: item.model }
                        ]);
                      }}
                    >
                      <div className="flex items-center">
                        <History className="w-4 h-4 mr-2 opacity-50" />
                        <span className="truncate">{item.query}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {chatMessages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-emerald-500/30 text-white' 
                      : message.role === 'system'
                        ? 'bg-yellow-500/20 text-white/90'
                        : 'bg-white/20 text-white'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                    {message.role === 'assistant' && index === chatMessages.length - 1 && isStreaming && (
                      <span className="animate-pulse">▌</span>
                    )}
                  </div>
                  
                  {message.role === 'assistant' && message.model && (
                    <div className="text-xs text-white/40 mt-1">
                      {message.model.split('/')[1] || message.model}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white/20 text-white">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Command suggestions */}
      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto border-t border-white/10">
          <div className="p-2 text-xs text-white/60">Command suggestions</div>
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`flex items-center px-4 py-2 cursor-pointer ${
                selectedResultIndex === index ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              onClick={() => {
                setSearchQuery(`/${result.id}`);
                setShowCommandSuggestions(false);
                handleOpenRouterQuery();
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                {result.icon}
              </div>
              <div>
                <span className="text-white">{result.title}</span>
                <div className="text-xs text-white/50">/{result.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Chat Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center relative">
          <button
            className="absolute left-3 text-white/50 hover:text-white"
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Message OpenRouter or type / for commands..."
            className="w-full px-12 py-3 bg-white/5 rounded-lg text-white outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                handleOpenRouterQuery();
              }
            }}
            disabled={isLoading}
          />
          
          <button
            className="absolute right-3 text-white/50 hover:text-white disabled:opacity-50"
            onClick={handleOpenRouterQuery}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Model selector button */}
      <div className="p-2 text-xs text-white/40 border-t border-white/10 flex justify-between items-center">
        <div>
          Press <kbd className="bg-white/20 rounded px-1">Esc</kbd> to close
        </div>
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowModelSelector(!showModelSelector);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-sm text-white/80"
            >
              <span className="truncate max-w-24">
                {defaultModel.includes('/') 
                  ? defaultModel.split('/')[1].replace(/-instruct$/, '')
                  : defaultModel}
              </span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>
            
            {showModelSelector && (
              <div className="absolute bottom-full right-0 mb-1 bg-[#121212] border border-white/10 rounded-lg shadow-xl w-72 max-h-80 overflow-y-auto z-10">
                <div className="py-2 border-b border-white/10">
                  <div 
                    className="flex items-center justify-between px-3 py-2 hover:bg-white/5 cursor-pointer"
                    onClick={toggleAutoSelect}
                  >
                    <span className="text-sm text-white/80">Auto-select</span>
                    <div className={`w-5 h-5 rounded-full ${isAutoSelect ? 'bg-yellow-400' : 'bg-white/10'}`}></div>
                  </div>
                  <div 
                    className="flex items-center justify-between px-3 py-2 hover:bg-white/5 cursor-pointer"
                    onClick={toggleThinking}
                  >
                    <span className="text-sm text-white/80">Thinking</span>
                    <div className={`w-5 h-5 rounded-full ${isThinking ? 'bg-yellow-400' : 'bg-white/10'}`}></div>
                  </div>
                </div>
                <div className="py-1">
                  {OPENROUTER_MODELS.map(model => {
                    // Add MAX tag for certain models
                    const hasMaxTag = ['anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct', 'google/gemini-1.5-pro'].includes(model.id);
                    const displayName = model.name;
                    
                    return (
                      <button
                        key={model.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModelChange(model.id);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between ${model.id === defaultModel ? 'text-yellow-400' : 'text-white/80'}`}
                      >
                        <div className="flex items-center">
                          <span>{displayName}</span>
                          {hasMaxTag && (
                            <span className="ml-2 text-xs px-1 rounded bg-white/10 text-white/70">MAX</span>
                          )}
                        </div>
                        {model.id === defaultModel && (
                          <Check className="w-4 h-4 text-yellow-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OpenRouterChat; 