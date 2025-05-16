import axios from 'axios';
import { normalizeEndpoint } from './ollama-constants';

// Ollama API client
export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
}

// Updated to match the actual API response format
export interface OllamaModelsResponse {
  models: { 
    name: string;
  }[];
}

// Alternate format that might be returned 
export interface OllamaTagsResponse {
  models?: { name: string }[];
  tags?: { 
    name: string;
    modified_at?: string;
    size?: number;
    digest?: string;
  }[];
}

export type MessageContent = string;

export interface OllamaRequest {
  model: string;
  messages: {
    role: string;
    content: MessageContent;
  }[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error | unknown) => void;
}

// Track active stream for cancellation
let activeStreamController: AbortController | null = null;

export const ollamaApi = {
  async chat(
    endpoint: string,
    request: OllamaRequest,
    signal?: AbortSignal
  ): Promise<OllamaResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    
    try {
      const response = await axios.post(
        `${normalizedEndpoint}/api/chat`,
        request,
        { 
          headers,
          signal
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Ollama chat error: ${error}`);
      // Include the URL that was attempted in the error to help debug
      if (error instanceof Error) {
        error.message = `Error with Ollama API at ${normalizedEndpoint}/api/chat: ${error.message}`;
      }
      throw error;
    }
  },

  async streamChat(
    endpoint: string,
    request: OllamaRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      // Cancel any existing stream before starting a new one
      if (activeStreamController) {
        this.cancelStream();
      }

      // Create a new abort controller for this stream
      activeStreamController = new AbortController();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Ensure stream is set to true
      const streamRequest = { ...request, stream: true };
      
      if (callbacks.onStart) {
        callbacks.onStart();
      }

      const fullResponse: string[] = [];
      
      const normalizedEndpoint = normalizeEndpoint(endpoint);
      
      try {
        const response = await axios.post(
          `${normalizedEndpoint}/api/chat`,
          streamRequest,
          { 
            headers,
            responseType: 'stream',
            signal: activeStreamController.signal
          }
        );

        let buffer = '';
        
        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString();
          buffer += chunkStr;
          
          let lineEnd = buffer.indexOf('\n');
          while (lineEnd !== -1) {
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            
            if (line) {
              try {
                const parsed = JSON.parse(line) as OllamaStreamResponse;
                
                if (parsed.response) {
                  if (callbacks.onToken) {
                    callbacks.onToken(parsed.response);
                  }
                  fullResponse.push(parsed.response);
                }
                
                if (parsed.done) {
                  if (callbacks.onComplete) {
                    callbacks.onComplete(fullResponse.join(''));
                  }
                  activeStreamController = null;
                  return;
                }
              } catch (error) {
                // Skip invalid JSON
              }
            }
            
            lineEnd = buffer.indexOf('\n');
          }
        });
        
        response.data.on('end', () => {
          if (callbacks.onComplete) {
            callbacks.onComplete(fullResponse.join(''));
          }
          activeStreamController = null;
        });
        
        response.data.on('error', (err: Error | unknown) => {
          if (callbacks.onError) {
            callbacks.onError(err);
          }
          activeStreamController = null;
        });
        
      } catch (error) {
        console.error(`Ollama stream error: ${error}`);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
        activeStreamController = null;
      }
    } catch (error) {
      console.error(`Ollama stream setup error: ${error}`);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
      activeStreamController = null;
      throw error;
    }
  },

  async cancelStream(): Promise<void> {
    if (activeStreamController) {
      activeStreamController.abort();
      activeStreamController = null;
    }
  },

  async getModels(endpoint: string): Promise<OllamaTagsResponse> {
    try {
      const normalizedEndpoint = normalizeEndpoint(endpoint);
      
      // Try the newer API format first
      const response = await axios.get(`${normalizedEndpoint}/api/tags`);
      return response.data;
    } catch (error) {
      console.error("Error fetching models:", error);
      // Return an empty response that matches expected format
      return { models: [], tags: [] };
    }
  }
}; 