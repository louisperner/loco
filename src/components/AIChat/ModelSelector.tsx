import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { OPENROUTER_MODELS } from '../../lib/openrouter-constants';
import { isStreamingSupported } from '../../lib/openrouter-constants';

interface ModelSelectorProps {
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const { defaultModel, setDefaultModel, useStreaming } = useOpenRouterStore();
  const [streamingSupported, setStreamingSupported] = useState(true);
  const selectorRef = useRef<HTMLDivElement>(null);
  
  // Check if streaming is supported for the selected model
  useEffect(() => {
    setStreamingSupported(isStreamingSupported(defaultModel));
  }, [defaultModel]);
  
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
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    setDefaultModel(modelId);
    setShowModelSelector(false);
  };
  
  return (
    <div className={`relative ${className}`} ref={selectorRef}>
      <button 
        onClick={() => setShowModelSelector(!showModelSelector)}
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
          <div className="py-1">
            {OPENROUTER_MODELS.map(model => {
              // Add MAX tag for certain models
              const hasMaxTag = ['anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct', 'google/gemini-1.5-pro'].includes(model.id);
              const displayName = model.name;
              
              return (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
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
          
          {!streamingSupported && useStreaming && (
            <div className="px-3 py-2 text-xs text-yellow-400 border-t border-white/10">
              Note: Streaming not supported with this model
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 