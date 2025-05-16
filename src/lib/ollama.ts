import axios from 'axios';

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

export interface OllamaModelsResponse {
  models: {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
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
    
    const response = await axios.post(
      `${endpoint}/api/chat`,
      request,
      { 
        headers,
        signal 
      }
    );
    
    return response.data;
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
      
      try {
        const response = await axios.post(
          `${endpoint}/api/chat`,
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
        if (callbacks.onError) {
          callbacks.onError(error);
        }
        activeStreamController = null;
      }
    } catch (error) {
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

  async getModels(endpoint: string): Promise<OllamaModelsResponse> {
    const response = await axios.get(`${endpoint}/api/tags`);
    return response.data;
  }
}; 