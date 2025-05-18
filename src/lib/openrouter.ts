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

// Define types for content in messages
export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: string; // Add optional detail property that can be 'high', 'low', or 'auto'
  };
};

// Combined content can be either a string (legacy) or an array of content items for multimodal
export type MessageContent = string | (TextContent | ImageContent)[];

export interface OpenRouterRequest {
  model: string;
  messages: {
    role: string;
    content: MessageContent;
  }[];
  stream?: boolean;
  response_format?: { type: string };
  temperature?: number;
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
        // Use fetch instead of axios for proper streaming
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(streamRequest),
          signal: activeStreamController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        let reading = true;
        while (reading) {
          const { done, value } = await reader.read();
          
          if (done) {
            reading = false;
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          let lineEnd = buffer.indexOf('\n');
          while (lineEnd !== -1) {
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
        }
        
        // If we reached here, the stream is complete
        if (callbacks.onComplete) {
          callbacks.onComplete(fullResponse.join(''));
        }
        activeStreamController = null;
        
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