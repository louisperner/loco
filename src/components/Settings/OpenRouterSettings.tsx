import React, { useState, useEffect } from 'react';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';
import { Bot, Key, Info, Zap } from 'lucide-react';
import { OPENROUTER_MODELS, OPENROUTER_STREAMING_PROVIDERS, isStreamingSupported } from '@/lib/openrouter-constants';

const OpenRouterSettings: React.FC = () => {
  const {
    apiKey,
    defaultModel,
    siteName,
    siteUrl,
    history,
    useStreaming,
    setApiKey,
    setDefaultModel,
    setSiteName,
    setSiteUrl,
    setUseStreaming,
    clearHistory,
  } = useOpenRouterStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [streamingSupported, setStreamingSupported] = useState(true);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (apiKeyCopied) {
      const timeout = setTimeout(() => {
        setApiKeyCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [apiKeyCopied]);

  // Check if streaming is supported for the selected model
  useEffect(() => {
    setStreamingSupported(isStreamingSupported(defaultModel));
  }, [defaultModel]);

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setApiKeyCopied(true);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bot className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-medium">OpenRouter Settings</h2>
      </div>

      <div className="space-y-4">
        {/* API Key */}
        <div className="space-y-2">
          <label htmlFor="apiKey" className="block text-sm font-medium">
            API Key
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
              placeholder="Enter your OpenRouter API key"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-white/60 hover:text-white"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="flex items-center text-xs text-white/60">
            <Info className="w-3 h-3 mr-1" />
            <span>Get an API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">openrouter.ai</a></span>
          </div>
        </div>

        {/* Default Model */}
        <div className="space-y-2">
          <label htmlFor="defaultModel" className="block text-sm font-medium">
            Default Model
          </label>
          <select
            id="defaultModel"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
          >
            {OPENROUTER_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.id})
              </option>
            ))}
          </select>
        </div>

        {/* Streaming Option */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="streaming" className="text-sm font-medium flex items-center">
              <Zap className="w-4 h-4 mr-1 text-yellow-400" />
              Enable Streaming
            </label>
            <div className="relative">
              <input
                type="checkbox"
                id="streaming"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="sr-only"
                disabled={!streamingSupported}
              />
              <div 
                className={`block w-10 h-6 rounded-full transition-colors ${
                  useStreaming && streamingSupported ? 'bg-emerald-400' : 'bg-gray-600'
                } ${!streamingSupported ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (streamingSupported) {
                    setUseStreaming(!useStreaming);
                  }
                }}
              />
              <div 
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  useStreaming && streamingSupported ? 'transform translate-x-full translate-x-[80%]' : ''
                }`}
              />
            </div>
          </div>
          {!streamingSupported && (
            <div className="text-xs text-yellow-400">
              Streaming is not supported for the selected model provider
            </div>
          )}
          <div className="text-xs text-white/60">
            Real-time response generation. Responses appear word by word as they're generated.
          </div>
        </div>

        {/* Site Info for Rankings */}
        <div className="space-y-2">
          <label htmlFor="siteName" className="block text-sm font-medium">
            Site Name (for rankings)
          </label>
          <input
            id="siteName"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
            placeholder="Your site name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="siteUrl" className="block text-sm font-medium">
            Site URL (for rankings)
          </label>
          <input
            id="siteUrl"
            type="text"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
            placeholder="https://your-site.com"
          />
        </div>

        {/* History Management */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Query History</h3>
            <span className="text-xs text-white/60">{history.length} items</span>
          </div>
          <button
            type="button"
            onClick={clearHistory}
            disabled={history.length === 0}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear History
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpenRouterSettings; 