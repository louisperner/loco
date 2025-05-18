import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Brain, History, Loader2, ChevronDown, Check, ServerIcon, CloudIcon } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { useOllamaStore } from '../../store/useOllamaStore';
import { openRouterApi } from '../../lib/openrouter';
import { ollamaApi } from '../../lib/ollama';
import { OPENROUTER_MODELS, isStreamingSupported } from '../../lib/openrouter-constants';
import { DEFAULT_OLLAMA_MODELS } from '../../lib/ollama-constants';

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

const OpenRouterSpotlight: React.FC<OpenRouterSpotlightProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isAutoSelect, setIsAutoSelect] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [customOllamaModels, setCustomOllamaModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  
  // OpenRouter store access
  const { 
    apiKey, 
    defaultModel: openRouterModel, 
    siteName,
    siteUrl,
    history: openRouterHistory,
    addToHistory: addToOpenRouterHistory,
    useStreaming: openRouterStreaming,
    setDefaultModel: setOpenRouterModel
  } = useOpenRouterStore();
  
  // Ollama store access
  const {
    isEnabled: ollamaEnabled,
    endpoint: ollamaEndpoint,
    defaultModel: ollamaModel,
    history: ollamaHistory,
    addToHistory: addToOllamaHistory,
    useStreaming: ollamaStreaming,
    setDefaultModel: setOllamaModel
  } = useOllamaStore();
  
  // Combined state based on which provider is active
  const currentModel = ollamaEnabled ? ollamaModel : openRouterModel;
  const currentUseStreaming = ollamaEnabled ? ollamaStreaming : openRouterStreaming;
  const currentHistory = ollamaEnabled ? ollamaHistory : openRouterHistory;
  const addToCurrentHistory = ollamaEnabled ? addToOllamaHistory : addToOpenRouterHistory;
  
  // State for the controller reference
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Check if streaming is supported for selected model
  const [streamingSupported, setStreamingSupported] = useState(true);
  
  // Check if streaming is supported for the selected model
  useEffect(() => {
    if (!ollamaEnabled) {
      setStreamingSupported(isStreamingSupported(currentModel));
    } else {
      // Ollama generally supports streaming for all models
      setStreamingSupported(true);
    }
  }, [currentModel, ollamaEnabled]);

  // Load dynamic Ollama models from API
  const loadOllamaModels = async () => {
    if (!ollamaEnabled) return;
    
    setIsLoadingModels(true);
    try {
      const response = await ollamaApi.getModels(ollamaEndpoint);
      
      // Extract models from the response, which may have either models or tags array
      let modelsList: { id: string; name: string }[] = [];
      
      if (response.models && response.models.length > 0) {
        // Handle response with models field
        modelsList = response.models.map(model => ({
          id: model.name,
          name: model.name
        }));
      } else if (response.tags && response.tags.length > 0) {
        // Handle response with tags field
        modelsList = response.tags.map(tag => ({
          id: tag.name,
          name: tag.name
        }));
      }
      
      if (modelsList.length > 0) {
        setCustomOllamaModels(modelsList);
        
        // Store models in localStorage for other components to use
        try {
          localStorage.setItem('ollamaModels', JSON.stringify(modelsList));
        } catch (error) {
          console.error('Error storing Ollama models in localStorage:', error);
        }
        
        // If current model is not in the list, select first available
        if (!modelsList.some(model => model.id === ollamaModel)) {
          setOllamaModel(modelsList[0].id);
        }
      } else {
        // Fall back to default models if none found
        setCustomOllamaModels(DEFAULT_OLLAMA_MODELS);
      }
    } catch (error) {
      console.error("Error loading Ollama models:", error);
      // Fall back to defaults on error
      setCustomOllamaModels(DEFAULT_OLLAMA_MODELS);
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  // Load Ollama models when needed
  useEffect(() => {
    if (ollamaEnabled && showModelSelector) {
      loadOllamaModels();
    }
  }, [ollamaEnabled, showModelSelector]);

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
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    if (ollamaEnabled) {
      setOllamaModel(modelId);
    } else {
      setOpenRouterModel(modelId);
    }
    setShowModelSelector(false);
  };
  
  // Handle closing the spotlight with proper cleanup
  const handleCloseSpotlight = useCallback(() => {
    // Cancel any ongoing stream
    if (isStreaming) {
      if (ollamaEnabled) {
        ollamaApi.cancelStream();
      } else {
        openRouterApi.cancelStream();
      }
    }
    
    // Reset state
    setIsOpen(false);
    setSearchQuery('');
    setResponse(null);
    setIsLoading(false);
  }, [isStreaming, ollamaEnabled]);
  
  // Handle API query (either Ollama or OpenRouter)
  const handleApiQuery = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      const recentQueries = [...(localStorage.getItem('recentQueries') 
        ? JSON.parse(localStorage.getItem('recentQueries') || '[]') 
        : [])];
      
      if (!recentQueries.includes(query)) {
        const updatedQueries = [query, ...recentQueries].slice(0, 5);
        localStorage.setItem('recentQueries', JSON.stringify(updatedQueries));
      }

      // Cancel any previous requests
      if (isStreaming) {
        if (ollamaEnabled) {
          ollamaApi.cancelStream();
        } else {
          openRouterApi.cancelStream();
        }
      }
      
      // Create a new controller for this request (for non-streaming requests only)
      abortControllerRef.current = new AbortController();
      
      if (ollamaEnabled) {
        // Use Ollama API
        if (currentUseStreaming) {
          setIsStreaming(true);
          ollamaApi.streamChat(
            ollamaEndpoint,
            {
              model: currentModel,
              messages: [{ role: "user", content: query }],
              stream: true
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
                addToOllamaHistory(query, completeResponse, currentModel);
                setIsStreaming(false);
              },
              onError: () => {
                setResponse("Error: Could not get a streaming response from Ollama. Please check if Ollama is running.");
                setIsStreaming(false);
              }
            }
          );
        } else {
          // Non-streaming approach for Ollama
          const result = await ollamaApi.chat(
            ollamaEndpoint,
            {
              model: currentModel,
              messages: [{ role: "user", content: query }],
              stream: false
            }
          );
          
          const responseContent = result.message?.content || "No response received";
          setResponse(responseContent);
          
          // Add to history
          addToOllamaHistory(query, responseContent, currentModel);
        }
      } else {
        // Use OpenRouter API
        if (currentUseStreaming) {
          setIsStreaming(true);
          openRouterApi.streamChat(
            apiKey,
            {
              model: currentModel,
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
                addToOpenRouterHistory(query, completeResponse, currentModel);
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
          // Non-streaming approach for OpenRouter
          const result = await openRouterApi.chat(
            apiKey,
            {
              model: currentModel,
              messages: [{ role: "user", content: query }]
            },
            { url: siteUrl, title: siteName },
            abortControllerRef.current.signal
          );
          
          const responseContent = result.choices[0]?.message?.content || "No response received";
          setResponse(responseContent);
          
          // Add to history
          addToOpenRouterHistory(query, responseContent, result.model);
        }
      }
    } catch (error) {
      console.error(`${ollamaEnabled ? "Ollama" : "OpenRouter"} API error:`, error);
      setResponse(`Error: Could not get a response from ${ollamaEnabled ? "Ollama" : "OpenRouter"}. ${ollamaEnabled ? "Please check if Ollama is running." : "Please check your API key and try again."}`);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currentModel, siteName, siteUrl, isStreaming, currentUseStreaming, ollamaEnabled, ollamaEndpoint]);
  
  // Toggle spotlight visibility
  const toggleSpotlight = useCallback(() => {
    if (isOpen) {
      handleCloseSpotlight();
    } else {
      setIsOpen(true);
    }
  }, [isOpen, handleCloseSpotlight]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F key opens spotlight if not already open
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen) {
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
        toggleSpotlight();
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
  }, [isOpen, toggleSpotlight, handleCloseSpotlight]);
  
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
  }, [isOpen, toggleSpotlight]);
  
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
            handleApiQuery(searchQuery);
          }
        }
      }
    };
    
    // Use capture to intercept events before they reach other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, results, selectedResultIndex, searchQuery, isLoading, handleApiQuery]);
  
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
  
  const handleKeydownInSpotlight = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        if (ollamaEnabled) {
          ollamaApi.cancelStream();
        } else {
          openRouterApi.cancelStream();
        }
      }
    };
  }, [isStreaming, ollamaEnabled]);
  
  // Cancel the stream if the spotlight is closed while streaming
  useEffect(() => {
    if (!isOpen && isStreaming) {
      if (ollamaEnabled) {
        ollamaApi.cancelStream();
      } else {
        openRouterApi.cancelStream();
      }
      setIsStreaming(false);
    }
  }, [isOpen, isStreaming, ollamaEnabled]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      handleApiQuery(searchQuery);
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
  
  // Get the final list of models based on provider
  const getAvailableModels = () => {
    if (ollamaEnabled) {
      return isLoadingModels 
        ? [] 
        : (customOllamaModels.length > 0 ? customOllamaModels : DEFAULT_OLLAMA_MODELS);
    } else {
      return OPENROUTER_MODELS;
    }
  };

  // Get display name for the current model
  const getModelDisplayName = () => {
    if (ollamaEnabled) {
      return currentModel;
    } else {
      return currentModel.includes('/') 
            ? currentModel.split('/')[1].replace(/-instruct$/, '')
            : currentModel;
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
                  
                  {currentHistory.length > 0 && (
                    <div className="mt-6 w-full max-w-md">
                      <h3 className="text-sm text-white/70 mb-2 px-4">Recent Questions</h3>
                      <div className="space-y-1">
                        {currentHistory.slice(0, 5).map((item, index) => (
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
                {!streamingSupported && currentUseStreaming && (
                  <span className="text-yellow-400">
                    Streaming not supported
                  </span>
                )}
                {currentUseStreaming && streamingSupported && <span className="text-white/60">Streaming enabled</span>}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowModelSelector(!showModelSelector);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-sm ${
                      ollamaEnabled ? 'text-blue-400' : 'text-yellow-400'
                    }`}
                  >
                    {ollamaEnabled ? (
                      <ServerIcon className="w-3 h-3 text-blue-400" />
                    ) : (
                      <CloudIcon className="w-3 h-3 text-yellow-400" />
                    )}
                    <span className="truncate max-w-24">
                      {getModelDisplayName()}
                    </span>
                    <ChevronDown className="w-3 h-3 text-white/60" />
                  </button>
                  
                  {showModelSelector && (
                    <div className="absolute bottom-full right-0 mb-1 bg-[#121212] border border-white/10 rounded-lg shadow-xl w-72 max-h-80 overflow-y-auto z-10">
                      {/* Provider Selector */}
                      <div className="border-b border-white/10">
                        <div className="grid grid-cols-2 gap-1 p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              useOllamaStore.setState({ isEnabled: false });
                            }}
                            className={`flex items-center justify-center gap-1 px-2 py-2 rounded ${
                              !ollamaEnabled 
                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-600/40' 
                                : 'text-white/60 hover:bg-white/5'
                            }`}
                          >
                            <CloudIcon className="w-4 h-4" />
                            <span>OpenRouter</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              useOllamaStore.setState({ isEnabled: true });
                              // If we're switching to Ollama, load the models
                              if (!ollamaEnabled) {
                                loadOllamaModels();
                              }
                            }}
                            className={`flex items-center justify-center gap-1 px-2 py-2 rounded ${
                              ollamaEnabled 
                                ? 'bg-blue-900/30 text-blue-400 border border-blue-600/40' 
                                : 'text-white/60 hover:bg-white/5'
                            }`}
                          >
                            <ServerIcon className="w-4 h-4" />
                            <span>Ollama</span>
                          </button>
                        </div>
                      </div>

                      {/* Settings */}
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

                      {/* Model List */}
                      <div className="py-1">
                        {ollamaEnabled ? (
                          isLoadingModels ? (
                            <div className="flex flex-col items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin mb-2 text-blue-400" />
                              <span className="text-white/60 text-xs">Loading models...</span>
                            </div>
                          ) : getAvailableModels().length > 0 ? (
                            getAvailableModels().map(model => (
                              <button
                                key={model.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModelChange(model.id);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between ${
                                  model.id === currentModel ? 'text-blue-400' : 'text-white/80'
                                }`}
                              >
                                <div className="flex items-center">
                                  <span>{model.name}</span>
                                </div>
                                {model.id === currentModel && (
                                  <Check className="w-4 h-4 text-blue-400" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-4 text-white/60 text-sm">
                              <p>No models found</p>
                              <p className="text-xs mt-1">Try pulling models with:</p>
                              <code className="text-xs bg-black/30 px-1 rounded">ollama pull gemma3:4b</code>
                            </div>
                          )
                        ) : (
                          OPENROUTER_MODELS.map(model => {
                            // Add MAX tag for certain models
                            const hasMaxTag = ['anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct', 'google/gemini-1.5-pro'].includes(model.id);
                            
                            return (
                              <button
                                key={model.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModelChange(model.id);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between ${
                                  model.id === currentModel ? 'text-yellow-400' : 'text-white/80'
                                }`}
                              >
                                <div className="flex items-center">
                                  <span>{model.name}</span>
                                  {hasMaxTag && (
                                    <span className="ml-2 text-xs px-1 rounded bg-white/10 text-white/70">MAX</span>
                                  )}
                                </div>
                                {model.id === currentModel && (
                                  <Check className="w-4 h-4 text-yellow-400" />
                                )}
                              </button>
                            );
                          })
                        )}
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