import React, { useState, useEffect } from 'react';
import { useOllamaStore } from '@/store/useOllamaStore';
import { Bot, Info, Zap, ServerIcon, Globe } from 'lucide-react';
import { DEFAULT_OLLAMA_MODELS, testOllamaConnection, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollama-constants';
import { ollamaApi } from '@/lib/ollama';

const OllamaSettings: React.FC = () => {
  const {
    endpoint,
    defaultModel,
    history,
    useStreaming,
    isEnabled,
    setEndpoint,
    setDefaultModel,
    setUseStreaming,
    setIsEnabled,
    clearHistory,
  } = useOllamaStore();

  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [customModels, setCustomModels] = useState<{ id: string; name: string }[]>([]);

  // Test connection and load models on settings open or endpoint change
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('unknown');
      
      const isConnected = await testOllamaConnection(endpoint);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        loadModels();
      }
    };
    
    checkConnection();
  }, [endpoint]);

  // Load available models from the Ollama server
  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await ollamaApi.getModels(endpoint);
      const models = response.models.map(model => ({
        id: model.name,
        name: model.name
      }));
      
      setCustomModels(models);
      setIsLoadingModels(false);
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
      setIsLoadingModels(false);
    }
  };

  // Get the final list of models (default + custom)
  const getAllModels = () => {
    // Use the fetched models, but fall back to default models if none are found
    return customModels.length > 0 ? customModels : DEFAULT_OLLAMA_MODELS;
  };

  const refreshConnection = async () => {
    try {
      setConnectionStatus('unknown');
      const isConnected = await testOllamaConnection(endpoint);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        await loadModels();
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bot className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-medium">Ollama Local Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Enable Ollama */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="enableOllama" className="text-sm font-medium flex items-center">
              <ServerIcon className="w-4 h-4 mr-1 text-blue-400" />
              Enable Ollama Integration
            </label>
            <div className="relative">
              <input
                type="checkbox"
                id="enableOllama"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only"
              />
              <div 
                className={`block w-10 h-6 rounded-full transition-colors ${
                  isEnabled ? 'bg-blue-400' : 'bg-gray-600'
                }`}
                onClick={() => setIsEnabled(!isEnabled)}
              />
              <div 
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  isEnabled ? 'transform translate-x-[80%]' : ''
                }`}
              />
            </div>
          </div>
          <div className="text-xs text-white/60">
            Enable to use locally-running Ollama models instead of OpenRouter
          </div>
        </div>

        {/* Endpoint */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="endpoint" className="block text-sm font-medium">
              Ollama Endpoint
            </label>
            <span className={`px-2 py-1 text-xs rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-300' : 
              connectionStatus === 'disconnected' ? 'bg-red-500/20 text-red-300' : 
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'disconnected' ? 'Disconnected' : 
               'Checking...'}
            </span>
          </div>
          <div className="flex">
            <input
              id="endpoint"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-l-md text-white"
              placeholder="http://localhost:11434"
            />
            <button
              onClick={refreshConnection}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-r-md"
            >
              Refresh
            </button>
          </div>
          <div className="flex items-center text-xs text-white/60">
            <Info className="w-3 h-3 mr-1" />
            <span>Default: {DEFAULT_OLLAMA_ENDPOINT}. Ollama must be running locally.</span>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label htmlFor="defaultModel" className="block text-sm font-medium">
            Default Model
          </label>
          <select
            id="defaultModel"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
            disabled={isLoadingModels || connectionStatus !== 'connected'}
          >
            {isLoadingModels ? (
              <option value="">Loading models...</option>
            ) : (
              getAllModels().map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))
            )}
          </select>
          {connectionStatus === 'disconnected' && (
            <div className="text-xs text-red-300">
              Cannot load models. Check if Ollama is running.
            </div>
          )}
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
              />
              <div 
                className={`block w-10 h-6 rounded-full transition-colors ${
                  useStreaming ? 'bg-blue-400' : 'bg-gray-600'
                }`}
                onClick={() => setUseStreaming(!useStreaming)}
              />
              <div 
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  useStreaming ? 'transform translate-x-[80%]' : ''
                }`}
              />
            </div>
          </div>
          <div className="text-xs text-white/60">
            Real-time response generation. Responses appear word by word as they&apos;re generated.
          </div>
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
      
      {/* Setup Guide */}
      <div className="mt-6 p-4 rounded-md bg-black/20 border border-white/10">
        <h3 className="text-sm font-medium mb-2">Setup Guide</h3>
        <ol className="text-xs text-white/80 space-y-1 list-decimal pl-4">
          <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ollama.ai</a></li>
          <li>Run Ollama locally (it will listen on {DEFAULT_OLLAMA_ENDPOINT})</li>
          <li>Pull models with commands like: <code className="bg-black/30 px-1 rounded">ollama pull llama3</code></li>
          <li>Enable the Ollama integration above</li>
          <li>Refresh connection and select your model</li>
        </ol>
      </div>
    </div>
  );
};

export default OllamaSettings; 