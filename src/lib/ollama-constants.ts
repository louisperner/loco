// Ollama shared constants

// Common Ollama models
export const DEFAULT_OLLAMA_MODELS = [
  { id: 'llama3', name: 'Llama 3 8B' },
  { id: 'llama3:70b', name: 'Llama 3 70B' },
  { id: 'mistral', name: 'Mistral 7B' },
  { id: 'mixtral', name: 'Mixtral 8x7B' },
  { id: 'phi3', name: 'Phi-3 Small' },
  { id: 'phi3:medium', name: 'Phi-3 Medium' },
  { id: 'gemma', name: 'Gemma 7B' },
  { id: 'gemma:2b', name: 'Gemma 2B' },
  { id: 'codellama', name: 'CodeLlama 7B' },
  { id: 'codellama:34b', name: 'CodeLlama 34B' },
  { id: 'llava', name: 'Llava 7B (vision)' },
  { id: 'neural-chat', name: 'Neural Chat 7B' },
];

// Default Ollama endpoint
export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';

// Test if Ollama is running on the default local endpoint
export const testOllamaConnection = async (endpoint = DEFAULT_OLLAMA_ENDPOINT): Promise<boolean> => {
  try {
    const response = await fetch(`${endpoint}/api/version`);
    return response.ok;
  } catch (error) {
    return false;
  }
}; 