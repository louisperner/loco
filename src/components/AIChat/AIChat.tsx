import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Bot, Loader2 } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { openRouterApi } from '../../lib/openrouter';
import { isStreamingSupported } from '../../lib/openrouter-constants';
import { useAIChatStore } from '../../store/useAIChatStore';
import ModelSelector from './ModelSelector';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { AIChatProps } from './types';

const AIChat: React.FC<AIChatProps> = ({ isVisible, toggleVisibility }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store access
  const { 
    apiKey, 
    defaultModel, 
    siteName,
    siteUrl,
    useStreaming,
    addToHistory,
  } = useOpenRouterStore();
  
  const {
    messages,
    addMessage,
    clearMessages,
  } = useAIChatStore();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamContent]);
  
  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    // Add user message to chat
    addMessage({
      content,
      role: 'user',
      model: defaultModel,
    });
    
    // Start generating AI response
    setIsLoading(true);
    
    try {
      // Check if streaming is supported for this model
      const supportsStreaming = isStreamingSupported(defaultModel);
      const shouldStream = useStreaming && supportsStreaming;
      
      if (shouldStream) {
        await handleStreamResponse(content);
      } else {
        await handleStandardResponse(content);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add error message to chat
      addMessage({
        content: 'Sorry, there was an error generating a response. Please try again.',
        role: 'assistant',
        model: defaultModel,
      });
      
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamContent('');
    }
  };
  
  // Handle streaming response
  const handleStreamResponse = async (userMessage: string) => {
    setIsStreaming(true);
    setCurrentStreamContent('');
    
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...getRecentMessages(),
      { role: 'user', content: userMessage }
    ];
    
    try {
      await openRouterApi.streamChat(
        apiKey,
        {
          model: defaultModel,
          messages,
          temperature: 0.7,
        },
        {
          onStart: () => {
            console.log('Stream started');
          },
          onToken: (token) => {
            setCurrentStreamContent((prev) => prev + token);
          },
          onComplete: (fullResponse) => {
            // Add the complete response to chat history
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
            console.error('Streaming error:', error);
            throw error;
          }
        },
        {
          url: siteUrl,
          title: siteName
        }
      );
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    }
  };
  
  // Handle standard non-streaming response
  const handleStandardResponse = async (userMessage: string) => {
    try {
      const response = await openRouterApi.chat(
        apiKey,
        {
          model: defaultModel,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
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
      
    } catch (error) {
      console.error('Standard response error:', error);
      throw error;
    }
  };
  
  // Get recent messages for context (last 10 messages)
  const getRecentMessages = () => {
    return messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close with Escape
      if (e.key === 'Escape' && isVisible) {
        toggleVisibility();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, toggleVisibility]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="bg-[#121212] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-white/10"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-yellow-400" />
            <h2 className="text-white font-medium">AI Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
            <ModelSelector className="mx-2" />
            <button
              onClick={toggleVisibility}
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 p-6">
              <Bot size={24} className="mb-2" />
              <p className="text-center text-sm">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={message.timestamp}
                  model={message.model}
                />
              ))}
              
              {isStreaming && currentStreamContent && (
                <ChatMessage
                  content={currentStreamContent}
                  role="assistant"
                  timestamp={Date.now()}
                  model={defaultModel}
                />
              )}
              
              {isLoading && !isStreaming && (
                <div className="py-4 px-4 bg-[#1A1A1A] rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded-full bg-yellow-500">
                      <Bot size={14} className="text-black" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs font-medium text-white/60">
                          AI
                        </div>
                        <Loader2 size={12} className="animate-spin text-white/40" />
                      </div>
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
          
          {/* API key warning */}
          {!apiKey && (
            <div className="mt-2 text-xs text-yellow-400 p-2 bg-yellow-900/20 rounded">
              No API key found. Please add your OpenRouter API key in Settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat; 