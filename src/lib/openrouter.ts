import axios from 'axios';

// OpenRouter API client
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
  }[];
}

export interface OpenRouterRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  stream?: boolean;
}

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error | unknown) => void;
}

// Track active stream for cancellation
let activeStreamController: AbortController | null = null;

export const openRouterApi = {
  async chat(
    apiKey: string,
    request: OpenRouterRequest,
    siteInfo?: { url?: string, title?: string },
    signal?: AbortSignal
  ): Promise<OpenRouterResponse> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    
    // Add optional headers for rankings
    if (siteInfo?.url) {
      headers['HTTP-Referer'] = siteInfo.url;
    }
    
    if (siteInfo?.title) {
      headers['X-Title'] = siteInfo.title;
    }
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      request,
      { 
        headers,
        signal 
      }
    );
    
    return response.data;
  },

  async streamChat(
    apiKey: string,
    request: OpenRouterRequest,
    callbacks: StreamCallbacks,
    siteInfo?: { url?: string, title?: string }
  ): Promise<void> {
    try {
      // Cancel any existing stream before starting a new one
      if (activeStreamController) {
        this.cancelStream();
      }

      // Create a new abort controller for this stream
      activeStreamController = new AbortController();
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      
      // Add optional headers for rankings
      if (siteInfo?.url) {
        headers['HTTP-Referer'] = siteInfo.url;
      }
      
      if (siteInfo?.title) {
        headers['X-Title'] = siteInfo.title;
      }

      // Ensure stream is set to true
      const streamRequest = { ...request, stream: true };
      
      if (callbacks.onStart) {
        callbacks.onStart();
      }

      const fullResponse: string[] = [];
      
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
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
            // Find the next complete SSE line
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Stream completed
                if (callbacks.onComplete) {
                  callbacks.onComplete(fullResponse.join(''));
                }
                activeStreamController = null;
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                
                if (content) {
                  if (callbacks.onToken) {
                    callbacks.onToken(content);
                  }
                  fullResponse.push(content);
                }
              } catch (error) {
                // Skip invalid JSON (like comments)
                // OpenRouter sends ": OPENROUTER PROCESSING" as comments
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
  }
}; 