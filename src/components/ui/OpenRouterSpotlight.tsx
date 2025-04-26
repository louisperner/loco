import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bot, Settings, Brain, History, Loader2, ChevronDown, Check } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { openRouterApi } from '../../lib/openrouter';
import { OPENROUTER_MODELS, isStreamingSupported } from '../../lib/openrouter-constants';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface OpenRouterSpotlightProps {
  onSearch?: (query: string) => void;
}

const OpenRouterSpotlight: React.FC<OpenRouterSpotlightProps> = ({ onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isAutoSelect, setIsAutoSelect] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  
  // Store access
  const { 
    apiKey, 
    defaultModel, 
    siteName,
    siteUrl,
    history,
    addToHistory,
    useStreaming,
    setDefaultModel
  } = useOpenRouterStore();
  
  // State for the controller reference
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Check if streaming is supported for selected model
  const [streamingSupported, setStreamingSupported] = useState(true);
  
  // Check if streaming is supported for the selected model
  useEffect(() => {
    setStreamingSupported(isStreamingSupported(defaultModel));
  }, [defaultModel]);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (showModelSelector) {
        setShowModelSelector(false);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showModelSelector]);
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    setDefaultModel(modelId);
    setShowModelSelector(false);
  };
  
  // Toggle spotlight visibility
  const toggleSpotlight = () => {
    if (isOpen) {
      handleCloseSpotlight();
    } else {
      setIsOpen(true);
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If only slash key is pressed (without modifiers)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen) {
        // Check if the target is an input, textarea, or any editor-related element
        const target = e.target as HTMLElement;
        const isEditorActive = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.closest('.editor-container') !== null ||
          target.closest('.safe-live-editor') !== null ||
          target.closest('[data-no-pointer-lock]') !== null ||
          target.closest('.react-live') !== null ||
          target.classList.contains('CodeMirror') ||
          /editor|code-editor|monaco-editor/.test(target.className || '');
          
        // Don't open spotlight if we're in a text editor
        if (isEditorActive) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        handleCloseSpotlight();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);
  
  // Handle mouse middle button
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Alt+Click to open
      if (e.altKey && e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        toggleSpotlight();
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => window.removeEventListener('mousedown', handleMouseDown, true);
  }, [isOpen]);
  
  // Handle arrow key navigation through results
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.key === 'ArrowDown') {
          setSelectedResultIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          setSelectedResultIndex(prev => 
            prev > 0 ? prev - 1 : prev
          );
        } else if (e.key === 'Enter' && searchQuery && !isLoading) {
          if (results.length > 0) {
            const selectedResult = results[selectedResultIndex];
            selectedResult.action();
          } else {
            // If no results but we have a query, run OpenRouter query
            handleOpenRouterQuery(searchQuery);
          }
        }
      }
    };
    
    // Use capture to intercept events before they reach other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, results, selectedResultIndex, searchQuery, isLoading]);
  
  // Focus the input when spotlight opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedResultIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedResultIndex, results]);
  
  // Handle closing the spotlight with proper cleanup
  const handleCloseSpotlight = useCallback(() => {
    // Cancel any ongoing stream
    if (isStreaming) {
      openRouterApi.cancelStream();
    }
    
    // Reset state
    setIsOpen(false);
    setSearchQuery('');
    setResponse(null);
    setIsLoading(false);
  }, [isStreaming]);
  
  const handleKeydownInSpotlight = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        openRouterApi.cancelStream();
      }
    };
  }, [isStreaming]);
  
  // Handle OpenRouter API query
  const handleOpenRouterQuery = async (query: string) => {
    try {
      setIsLoading(true);
      const recentQueries = [...(localStorage.getItem('recentQueries') 
        ? JSON.parse(localStorage.getItem('recentQueries') || '[]') 
        : [])];
      
      if (!recentQueries.includes(query)) {
        const updatedQueries = [query, ...recentQueries].slice(0, 5);
        localStorage.setItem('recentQueries', JSON.stringify(updatedQueries));
        setRecentQueries(updatedQueries);
      }

      // Cancel any previous requests
      if (isStreaming) {
        openRouterApi.cancelStream();
      }
      
      // Create a new controller for this request (for non-streaming requests only)
      abortControllerRef.current = new AbortController();
      
      if (useStreaming) {
        setIsStreaming(true);
        openRouterApi.streamChat(
          apiKey,
          {
            model: defaultModel,
            messages: [{ role: "user", content: query }]
          },
          {
            onStart: () => {
              // Stream started
            },
            onToken: (token: string) => {
              setResponse((prev) => (prev || "") + token);
            },
            onComplete: (completeResponse: string) => {
              // Add to history when streaming completes
              addToHistory(query, completeResponse, defaultModel);
              setIsStreaming(false);
            },
            onError: () => {
              setResponse("Error: Could not get a streaming response from OpenRouter. Please check your API key and try again.");
              setIsStreaming(false);
            }
          },
          { url: siteUrl, title: siteName }
        );
      } else {
        // Non-streaming approach
        const result = await openRouterApi.chat(
          apiKey,
          {
            model: defaultModel,
            messages: [{ role: "user", content: query }]
          },
          { url: siteUrl, title: siteName },
          abortControllerRef.current.signal
        );
        
        const responseContent = result.choices[0]?.message?.content || "No response received";
        setResponse(responseContent);
        
        // Add to history
        addToHistory(query, responseContent, result.model);
      }
    } catch (error) {
      console.error("OpenRouter API error:", error);
      setResponse("Error: Could not get a response from OpenRouter. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel the stream if the spotlight is closed while streaming
  useEffect(() => {
    if (!isOpen && isStreaming) {
      openRouterApi.cancelStream();
      setIsStreaming(false);
    }
  }, [isOpen, isStreaming]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      handleOpenRouterQuery(searchQuery);
    }
  };
  
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
  
  return (
    <>
      {isOpen && (
        <div 
          ref={spotlightRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm" 
          onClick={handleCloseSpotlight}
          onKeyDown={handleKeydownInSpotlight}
        >
          <div 
            className="w-[600px] max-h-[80vh] bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-white/10">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white/70 mr-3 animate-spin" />
              ) : (
                <Bot className="w-5 h-5 text-white/70 mr-3" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask OpenRouter anything..."
                className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/50"
                onKeyDown={(e) => e.stopPropagation()}
                disabled={isLoading}
              />
            </form>
            
            <div className="overflow-y-auto flex-1 max-h-[60vh]">
              {response ? (
                <div className="p-4 text-white whitespace-pre-wrap">
                  {response}
                  {isStreaming && <span className="animate-pulse">▌</span>}
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-white">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                  <p>Thinking...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-white/50">
                  <Brain className="w-12 h-12 mb-4 opacity-50" />
                  <p>Ask OpenRouter a question</p>
                  <p className="text-xs mt-2">Press Enter to search</p>
                  
                  {history.length > 0 && (
                    <div className="mt-6 w-full max-w-md">
                      <h3 className="text-sm text-white/70 mb-2 px-4">Recent Questions</h3>
                      <div className="space-y-1">
                        {history.slice(0, 5).map((item, index) => (
                          <div 
                            key={index}
                            className="px-4 py-2 cursor-pointer hover:bg-white/10 text-sm text-white/80"
                            onClick={() => {
                              setSearchQuery(item.query);
                              setResponse(item.response);
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
              )}
            </div>
            
            {/* Footer with model info and stream indicator */}
            <div className="p-2 text-xs text-white/40 border-t border-white/10 flex justify-between items-center">
              <div>
                Press <kbd className="bg-white/20 rounded px-1">Esc</kbd> to close
              </div>
              <div className="flex items-center gap-2 relative">
                {!streamingSupported && useStreaming && (
                  <span className="text-yellow-400">
                    Streaming not supported
                  </span>
                )}
                {useStreaming && streamingSupported && <span className="text-white/60">Streaming enabled</span>}
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
          </div>
        </div>
      )}
    </>
  );
};

export default OpenRouterSpotlight; 