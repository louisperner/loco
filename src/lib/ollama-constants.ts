// Ollama shared constants

// Common Ollama models
export const DEFAULT_OLLAMA_MODELS = [
  { id: 'gemma3:1b', name: 'Gemma 3 1B' },
  { id: 'gemma3:4b', name: 'Gemma 3 4B' },
  { id: 'gemma3:12b', name: 'Gemma 3 12B' },
  { id: 'gemma3:27b', name: 'Gemma 3 27B' },
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

// Default Ollama endpoint with explicit protocol to avoid URL issues
export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';

// Helper function to normalize endpoint URLs consistently
export const normalizeEndpoint = (endpoint: string): string => {
  // Remove trailing slashes
  let normalizedEndpoint = endpoint.trim().replace(/\/+$/, '');
  
  // Ensure it has http:// or https:// prefix
  if (!normalizedEndpoint.startsWith('http://') && !normalizedEndpoint.startsWith('https://')) {
    normalizedEndpoint = `http://${normalizedEndpoint}`;
  }
  
  return normalizedEndpoint;
};

// Test if Ollama is running on the default local endpoint
export const testOllamaConnection = async (endpoint = DEFAULT_OLLAMA_ENDPOINT): Promise<boolean> => {
  try {
    // Normalize the endpoint before using it
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    
    // First check if we can actually reach the server at all
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${normalizedEndpoint}/api/version`, {
        signal: controller.signal,
        // Add headers to help with potential CORS issues
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Ollama server responded with status: ${response.status}`);
        return false;
      }
      
      // Try to parse the response to make sure it's valid
      const data = await response.json();
      if (!data || !data.version) {
        console.error("Invalid response from Ollama server (missing version):", data);
        return false;
      }
      
      console.log("Ollama connected successfully. Version:", data.version);
      return true;
    } catch (error: unknown) {
      // Type guard to check properties safely
      const errorWithName = error as { name?: string; message?: string };
      
      if (errorWithName.name === 'AbortError') {
        console.error("Connection to Ollama timed out");
      } else if (errorWithName.message?.includes('Failed to fetch')) {
        console.error("Failed to fetch from Ollama API (network error)");
      } else {
        console.error("Error testing Ollama connection:", error);
      }
      return false;
    }
  } catch (error: unknown) {
    console.error("Error in testOllamaConnection:", error);
    return false;
  }
}; 