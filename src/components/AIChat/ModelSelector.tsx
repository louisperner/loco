import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, ServerIcon, CloudIcon, Loader2 } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { useOllamaStore } from '../../store/useOllamaStore';
import { OPENROUTER_MODELS } from '../../lib/openrouter-constants';
import { DEFAULT_OLLAMA_MODELS } from '../../lib/ollama-constants';
import { isStreamingSupported } from '../../lib/openrouter-constants';
import { ollamaApi } from '../../lib/ollama';

// Custom scrollbar styles as a CSS class
const scrollbarStyles = `
  .model-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #444444 #1A1A1A;
  }
  .model-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .model-scrollbar::-webkit-scrollbar-track {
    background: #1A1A1A;
  }
  .model-scrollbar::-webkit-scrollbar-thumb {
    background-color: #444444;
    border-radius: 20px;
  }
`;

interface ModelSelectorProps {
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  // Add CSS to document head on component mount
  useEffect(() => {
    // Add scrollbar styles to head
    const styleEl = document.createElement('style');
    styleEl.innerHTML = scrollbarStyles;
    document.head.appendChild(styleEl);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  const [showModelSelector, setShowModelSelector] = useState(false);
  const { defaultModel: openRouterModel, setDefaultModel: setOpenRouterModel, useStreaming: openRouterStreaming } = useOpenRouterStore();
  const { defaultModel: ollamaModel, setDefaultModel: setOllamaModel, isEnabled: ollamaEnabled, useStreaming: ollamaStreaming, endpoint: ollamaEndpoint } = useOllamaStore();
  const [streamingSupported, setStreamingSupported] = useState(true);
  const [customOllamaModels, setCustomOllamaModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Current model and streaming based on which provider is active
  const currentModel = ollamaEnabled ? ollamaModel : openRouterModel;
  const currentStreaming = ollamaEnabled ? ollamaStreaming : openRouterStreaming;
  
  // Check if streaming is supported for the selected model
  useEffect(() => {
    if (!ollamaEnabled) {
      setStreamingSupported(isStreamingSupported());
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
    if (ollamaEnabled) {
      loadOllamaModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ollamaEnabled, ollamaEndpoint]);
  
  // Also load models when selector is opened if using Ollama
  useEffect(() => {
    if (showModelSelector && ollamaEnabled) {
      loadOllamaModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModelSelector, ollamaEnabled]);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModelSelector) {
        setShowModelSelector(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModelSelector]);
  
  // Handle model change based on which provider is active
  const handleModelChange = (modelId: string) => {
    if (ollamaEnabled) {
      setOllamaModel(modelId);
    } else {
      setOpenRouterModel(modelId);
    }
    setShowModelSelector(false);
  };
  
  // Get the display name for the current model
  const getDisplayName = () => {
    if (ollamaEnabled) {
      const ollamaModelObj = customOllamaModels.find(model => model.id === currentModel);
      if (ollamaModelObj) return ollamaModelObj.name;
      return currentModel; // Use ID as fallback
    } else {
      const model = OPENROUTER_MODELS.find(model => model.id === currentModel);
      if (model) return model.name;
      
      // Fallback to ID parsing
      const parts = currentModel.split('/');
      return parts.length > 1 ? parts[1].replace(/-instruct$/, '') : currentModel;
    }
  };
  
  return (
    <div className={`relative inline-block ${className}`} ref={selectorRef}>
      <button 
        ref={buttonRef}
        onClick={() => setShowModelSelector(!showModelSelector)}
        className={`flex items-center justify-between gap-1 px-3 py-1.5 rounded-md text-sm
                   border transition-colors duration-150 ${
                     ollamaEnabled 
                     ? "text-blue-100 border-blue-600/50 bg-blue-950 hover:bg-blue-900/60" 
                     : "text-white/90 border-yellow-600/50 bg-[#222222] hover:bg-[#2A2A2A]"
                   }`}
        aria-haspopup="listbox"
        aria-expanded={showModelSelector}
      >
        {ollamaEnabled ? 
          <ServerIcon className="w-3.5 h-3.5 mr-1 text-blue-400" /> : 
          <CloudIcon className="w-3.5 h-3.5 mr-1 text-yellow-400" />
        }
        <span className="truncate">{getDisplayName()}</span>
        <ChevronDown 
          className={`w-4 h-4 text-white/70 flex-shrink-0 transition-transform duration-150 
                     ${showModelSelector ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {showModelSelector && (
        <div 
          className="fixed z-50 bg-[#222222] rounded-xl shadow-xl 
                    border border-[#333333] overflow-hidden fade-in duration-200"
          style={{
            width: '280px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`sticky top-0 px-4 py-3 border-b border-[#333333] 
                          font-medium text-base text-white/90 text-center ${
                            ollamaEnabled ? 'bg-blue-950' : 'bg-[#2A2A2A]'
                          }`}>
            {ollamaEnabled ? (
              <div className="flex items-center justify-center gap-2">
                <ServerIcon className="w-4 h-4 text-blue-400" />
                <span>Ollama Models (Local)</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CloudIcon className="w-4 h-4 text-yellow-400" />
                <span>OpenRouter Models (Cloud)</span>
              </div>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[380px] py-2 model-scrollbar">
            {ollamaEnabled ? (
              // Show loading state or Ollama models
              isLoadingModels ? (
                <div className="flex flex-col items-center justify-center py-6 text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Loading models...</p>
                </div>
              ) : customOllamaModels.length > 0 ? (
                // Show Ollama models when loaded
                customOllamaModels.map(model => {
                  const isSelected = model.id === currentModel;
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full text-left px-4 py-3 text-base flex items-center justify-between
                                  transition-colors duration-100 outline-none
                                  ${isSelected 
                                    ? 'bg-blue-900/40 text-blue-400' 
                                    : 'text-white/90 hover:bg-[#2A2A2A]'}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        )}
                        <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>{model.name}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                // Show message if no models found
                <div className="flex flex-col items-center justify-center py-6 text-white/60">
                  <p className="text-sm">No models found.</p>
                  <p className="text-xs mt-1">Try pulling models with: ollama pull gemma3:4b</p>
                </div>
              )
            ) : (
              // Show OpenRouter models when Ollama is disabled
              OPENROUTER_MODELS.map(model => {
                // Add MAX tag for certain models
                const hasMaxTag = ['anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct', 'google/gemini-1.5-pro'].includes(model.id);
                const isSelected = model.id === currentModel;
                
                return (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`w-full text-left px-4 py-3 text-base flex items-center justify-between
                                transition-colors duration-100 outline-none
                                ${isSelected 
                                  ? 'bg-[#2A2A2A] text-yellow-400' 
                                  : 'text-white/90 hover:bg-[#2A2A2A]'}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {isSelected && (
                        <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      )}
                      <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>{model.name}</span>
                      {hasMaxTag && (
                        <span className="ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded bg-[#493D10] text-yellow-400 font-medium">
                          MAX
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          {!streamingSupported && currentStreaming && (
            <div className="px-4 py-2 text-xs text-yellow-400 border-t border-[#333333] bg-yellow-900/20">
              Note: Streaming not supported with this model
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 