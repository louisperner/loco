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

// Combined interface for Ollama models/tags response
export interface OllamaModelsResponse {
  models?: { 
    name: string;
  }[];
  tags?: { 
    name: string;
    modified_at?: string;
    size?: number;
    digest?: string;
  }[];
}

// Keeping OllamaTagsResponse as an alias for backward compatibility
export type OllamaTagsResponse = OllamaModelsResponse;

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
          signal,
          responseType: 'text'
        }
      );
      
      // Handle different response formats
      let data = response.data;
      
      // Check if the response is a string (stream output) instead of a JSON object
      if (typeof data === 'string') {
        try {
          // Try to parse it as JSON
          data = JSON.parse(data);
        } catch (parseError) {
          // If it's not valid JSON, it might be a stream format
          // Try to extract the last JSON object from the stream if it contains valid JSON lines
          const lines = data.split('\n').filter(Boolean);
          const lastLine = lines[lines.length - 1];
          
          try {
            data = JSON.parse(lastLine);
          } catch (lineParseError) {
            // If still can't parse, create a response object with the raw string
            data = {
              model: request.model,
              created_at: new Date().toISOString(),
              message: {
                role: 'assistant',
                content: data
              },
              done: true
            };
          }
        }
      }
      
      // Ensure the response has all required fields for downstream components
      if (data && !data.message && data.response) {
        // Convert older API format to newer format
        data.message = {
          role: 'assistant',
          content: data.response
        };
      }
      
      // If message exists but content is missing, construct it
      if (data?.message && data.message.content === undefined && data.response) {
        data.message.content = data.response;
      }
      
      return data;
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

    console.log("[DEBUG] Ollama Stream Request:", endpoint, request, callbacks);

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
        // Use fetch API instead of axios for better compatibility with streaming responses
        console.log("[DEBUG] Sending fetch request to:", `${normalizedEndpoint}/api/chat`);
        
        const response = await fetch(`${normalizedEndpoint}/api/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify(streamRequest),
          signal: activeStreamController.signal
        });

        console.log("[DEBUG] Fetch response received:", { 
          status: response.status, 
          ok: response.ok, 
          contentType: response.headers.get('content-type') 
        });

        if (!response.ok) {
          throw new Error(`Ollama API returned ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // Create a reader from the response body stream
        const reader = response.body.getReader();
        let buffer = '';

        // Function to process text chunks
        const processChunk = (text: string) => {
          buffer += text;
          
          let lineEnd = buffer.indexOf('\n');
          while (lineEnd !== -1) {
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            
            if (line) {
              try {
                const parsed = JSON.parse(line) as OllamaStreamResponse;
                
                // Extract content from different possible locations in the response
                let content: string | undefined = undefined;
                
                // Check for direct 'response' field (older API style)
                if (parsed.response !== undefined) {
                  content = parsed.response;
                } 
                // Check for nested content in message (newer API style)
                else if (parsed.message?.content !== undefined) {
                  content = parsed.message.content;
                }
                
                if (content !== undefined) {
                  if (callbacks.onToken) {
                    callbacks.onToken(content);
                  }
                  fullResponse.push(content);
                }
                
                if (parsed.done) {
                  if (callbacks.onComplete) {
                    callbacks.onComplete(fullResponse.join(''));
                  }
                  activeStreamController = null;
                  return;
                }
              } catch (error) {
                console.log("Error parsing JSON stream response:", error, "Line:", line);
                // Skip invalid JSON
              }
            }
            
            lineEnd = buffer.indexOf('\n');
          }
        };

        // Read the stream
        const decoder = new TextDecoder();
        let reading = true;
        while (reading) {
          const { done, value } = await reader.read();
          if (done) {
            if (callbacks.onComplete) {
              callbacks.onComplete(fullResponse.join(''));
            }
            activeStreamController = null;
            reading = false;
          } else {
            // Decode the chunk and process it
            const chunk = decoder.decode(value, { stream: true });
            processChunk(chunk);
          }
        }
        
      } catch (error) {
        console.error(`Ollama stream error:`, error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
        activeStreamController = null;
      }
    } catch (error) {
      console.error(`Ollama stream setup error:`, error);
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
    try {
      const normalizedEndpoint = normalizeEndpoint(endpoint);
      
      try {
        // Try the newer API endpoint first (tags)
        const response = await axios.get(`${normalizedEndpoint}/api/tags`);
        return response.data;
      } catch (firstError) {
        console.log("Failed to fetch tags, trying models endpoint:", firstError);
        
        // If tags endpoint fails, try the models endpoint
        try {
          const modelResponse = await axios.get(`${normalizedEndpoint}/api/models`);
          return { models: modelResponse.data.models || [] };
        } catch (secondError) {
          console.error("Both tags and models endpoints failed:", secondError);
          throw secondError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
      // Return an empty response that matches expected format
      return { models: [], tags: [] };
    }
  },

  // Add a specialized function for interview assistant to ensure JSON parsing works
  async interviewAssistantChat(
    endpoint: string,
    request: OllamaRequest
  ): Promise<{ content: string; model: string }> {
    try {
      const normalizedEndpoint = normalizeEndpoint(endpoint);
      
      console.log("[DEBUG] Interview Assistant request to:", normalizedEndpoint, request.model);
      
      const response = await axios.post(
        `${normalizedEndpoint}/api/chat`,
        {
          ...request,
          format: "json" // Try to explicitly request JSON format if the model supports it
        },
        { 
          headers: { 'Content-Type': 'application/json' },
          responseType: 'text'
        }
      );
      
      console.log("[DEBUG] Interview Assistant raw response:", 
        typeof response.data === 'string' ? response.data.substring(0, 100) : 'Not a string');
      
      // Handle different response formats
      let data = response.data;
      
      // Check if the response is a string instead of a JSON object
      if (typeof data === 'string') {
        try {
          // Try to parse it as JSON
          data = JSON.parse(data);
        } catch (parseError) {
          // If it's not valid JSON, it might be a stream format or raw text
          // Return the raw string for custom handling at the application level
          return {
            content: data,
            model: request.model
          };
        }
      }
      
      // Ensure the response has expected fields
      if (data && !data.message && data.response) {
        // Convert older API format to newer format
        data.message = {
          role: 'assistant',
          content: data.response
        };
      }
      
      return {
        content: data.message?.content || data.response || '',
        model: data.model || request.model
      };
    } catch (error) {
      console.error(`Ollama interview assistant error:`, error);
      throw error;
    }
  },
}; 