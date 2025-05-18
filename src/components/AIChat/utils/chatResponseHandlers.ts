import { openRouterApi } from '@/lib/openrouter';
import { ollamaApi } from '@/lib/ollama';
import { useAIChatStore } from '@/store/useAIChatStore';
import { useOllamaStore } from '@/store/useOllamaStore';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';

// Get recent messages for context (last 10 messages)
export const getRecentMessages = () => {
  const { messages } = useAIChatStore.getState();
  return messages.slice(-10).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

// Handle streaming response
export const handleStreamResponse = async (
  userMessage: string,
  setIsStreaming: (isStreaming: boolean) => void,
  setCurrentStreamContent: React.Dispatch<React.SetStateAction<string>>,
  setIsLoading: (isLoading: boolean) => void
) => {
  setIsStreaming(true);
  setCurrentStreamContent('');
  
  const messages = [
    { role: 'system', content: 'You are a helpful AI assistant in a 3D environment. You can help create objects using commands like "create cube at 0,0,0" or answer questions.' },
    ...getRecentMessages(),
    { role: 'user', content: userMessage }
  ];
  
  try {
    // Check if Ollama is enabled
    const ollamaStore = useOllamaStore.getState();
    
    if (ollamaStore.isEnabled) {
      // console.log("[DEBUG] Using Ollama:", ollamaStore.endpoint, ollamaStore.defaultModel, messages);

      // Use Ollama API for streaming
      await ollamaApi.streamChat(
        ollamaStore.endpoint,
        {
          model: ollamaStore.defaultModel,
          messages,
          stream: true,
          options: {
            temperature: 0.7,
          }
        },
        {
          onStart: () => {
            // Code execution started
          },
          onToken: (token) => {
            setCurrentStreamContent(prev => prev + token);
          },
          onComplete: (fullResponse) => {
            // Add the complete response to chat history
            const { addMessage } = useAIChatStore.getState();
            addMessage({
              content: fullResponse,
              role: 'assistant',
              model: ollamaStore.defaultModel,
            });
            
            // Add to Ollama history
            ollamaStore.addToHistory(userMessage, fullResponse, ollamaStore.defaultModel);
            
            setIsStreaming(false);
            setCurrentStreamContent('');
          },
          onError: (error) => {
            console.error('Ollama streaming error:', error);
            const { addMessage } = useAIChatStore.getState();
            addMessage({
              content: `Error: Could not connect to Ollama at ${ollamaStore.endpoint}. Please check if Ollama is running.`,
              role: 'assistant',
              model: ollamaStore.defaultModel,
            });
            setIsStreaming(false);
            setCurrentStreamContent('');
          }
        }
      );
    } else {
      // Use OpenRouter API for streaming
      const openRouterStore = useOpenRouterStore.getState();
      const { apiKey, defaultModel, siteName, siteUrl, addToHistory } = openRouterStore;
      
      await openRouterApi.streamChat(
        apiKey,
        {
          model: defaultModel,
          messages,
          temperature: 0.7,
        },
        {
          onStart: () => {
            // Code execution started
          },
          onToken: (token) => {
            setCurrentStreamContent(prev => prev + token);
          },
          onComplete: (fullResponse) => {
            // Add the complete response to chat history
            const { addMessage } = useAIChatStore.getState();
            addMessage({
              content: fullResponse,
              role: 'assistant',
              model: defaultModel,
            });
            
            // Add to OpenRouter history
            addToHistory(userMessage, fullResponse, defaultModel);
            
            setIsStreaming(false);
            setCurrentStreamContent('');
          },
          onError: (error) => {
            console.error('Stream error:', error);
            const { addMessage } = useAIChatStore.getState();
            addMessage({
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
              role: 'assistant',
              model: defaultModel || 'unknown',
            });
            setIsStreaming(false);
            setCurrentStreamContent('');
          }
        },
        {
          url: siteUrl,
          title: siteName
        }
      );
    }
  } catch (error) {
    console.error('Stream error:', error);
    const { addMessage } = useAIChatStore.getState();
    const openRouterStore = useOpenRouterStore.getState();
    addMessage({
      content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      role: 'assistant',
      model: openRouterStore.defaultModel || 'unknown',
    });
    setIsStreaming(false);
    setCurrentStreamContent('');
    setIsLoading(false);
  }
};

// Handle standard non-streaming response
export const handleStandardResponse = async (
  userMessage: string,
  setIsLoading: (isLoading: boolean) => void
) => {
  try {
    // Check if Ollama is enabled
    const ollamaStore = useOllamaStore.getState();
    const { addMessage } = useAIChatStore.getState();
    
    if (ollamaStore.isEnabled) {
      // Use Ollama API for non-streaming
      const response = await ollamaApi.chat(
        ollamaStore.endpoint,
        {
          model: ollamaStore.defaultModel,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant in a 3D environment. You can help create objects using commands like "create cube at 0,0,0" or answer questions.' },
            ...getRecentMessages(),
            { role: 'user', content: userMessage }
          ],
          options: {
            temperature: 0.7,
          }
        }
      );
      
      const responseContent = response.message.content;
      
      // Add the AI response to chat
      addMessage({
        content: responseContent,
        role: 'assistant',
        model: ollamaStore.defaultModel,
      });
      
      // Add to Ollama history
      ollamaStore.addToHistory(userMessage, responseContent, ollamaStore.defaultModel);
    } else {
      // Use OpenRouter API for non-streaming
      const openRouterStore = useOpenRouterStore.getState();
      const { apiKey, defaultModel, siteName, siteUrl, addToHistory } = openRouterStore;
      
      const response = await openRouterApi.chat(
        apiKey,
        {
          model: defaultModel,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant in a 3D environment. You can help create objects using commands like "create cube at 0,0,0" or answer questions.' },
            ...getRecentMessages(),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
        },
        {
          url: siteUrl,
          title: siteName
        }
      );
      
      const responseContent = response.choices[0].message.content;
      
      // Add the AI response to chat
      addMessage({
        content: responseContent,
        role: 'assistant',
        model: defaultModel,
      });
      
      // Add to OpenRouter history
      addToHistory(userMessage, responseContent, defaultModel);
    }
  } catch (error) {
    console.error('Standard response error:', error);
    const { addMessage } = useAIChatStore.getState();
    const openRouterStore = useOpenRouterStore.getState();
    
    addMessage({
      content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      role: 'assistant',
      model: openRouterStore.defaultModel || 'unknown',
    });
  } finally {
    setIsLoading(false);
  }
}; 