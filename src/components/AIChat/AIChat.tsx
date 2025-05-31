import React, { useState, useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';
import { useAIChatStore } from '@/store/useAIChatStore';
import { useOllamaStore } from '@/store/useOllamaStore';
import { isStreamingSupported } from '@/lib/openrouter-constants';

// Import components
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import AIChatHeader from './AIChatHeader';
import ChatHistory from './ChatHistory';
import CommandPalette from './CommandPalette';
import ChatFeedback from './ChatFeedback';

// Import types
import { AIChatProps } from './types';

// Import utilities
import { handleImageUpload, handleVideoUpload, handleModelUpload } from './utils/fileHandlers';
import { processCommand } from './utils/commandHandlers';
import { handleStreamResponse, handleStandardResponse } from './utils/chatResponseHandlers';

const AIChat: React.FC<AIChatProps> = ({ isVisible, toggleVisibility }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'minimal' | 'expanded'>('minimal');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  
  // Store access
  const { apiKey, defaultModel, useStreaming } = useOpenRouterStore();
  
  const {
    messages,
    addMessage,
    clearMessages,
    selectedMessageId,
    selectMessage,
  } = useAIChatStore();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamContent, commandFeedback]);
  
  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    // Clear any previous command feedback
    setCommandFeedback(null);
    
    // Add user message to chat
    addMessage({
      content,
      role: 'user',
      model: defaultModel,
    });
    
    // Check if it's a command
    if (processCommand(content, setCommandFeedback)) {
      return;
    }
    
    // Start generating AI response
    setIsLoading(true);
    
    try {
      // Check if Ollama is enabled
      const ollamaStore = useOllamaStore.getState();
      
      // Determine if streaming should be used
      let shouldStream = false;
      
      if (ollamaStore.isEnabled) {
        // For Ollama, always use streaming if enabled in settings
        shouldStream = ollamaStore.useStreaming;
      } else {
        // For OpenRouter, check if the model supports streaming
        const supportsStreaming = isStreamingSupported();
        shouldStream = useStreaming && supportsStreaming;
      }
      
      if (shouldStream) {
        await handleStreamResponse(content, setIsStreaming, setCurrentStreamContent, setIsLoading);
      } else {
        await handleStandardResponse(content, setIsLoading);
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
  
  // Handle file select for images
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Close command palette immediately
      setShowCommandPalette(false);
      
      const file = files[0];
      handleImageUpload(file, setCommandFeedback);
      
      // Reset the input element
      e.target.value = '';
    }
  };
  
  // Handle file select for videos
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Close command palette immediately
      setShowCommandPalette(false);
      
      const file = files[0];
      handleVideoUpload(file, setCommandFeedback);
      
      // Reset input
      e.target.value = '';
    }
  };
  
  // Handle file select for 3D models
  const handleModelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Close command palette immediately
      setShowCommandPalette(false);
      
      const file = files[0];
      handleModelUpload(file, setCommandFeedback);
      
      // Reset input
      e.target.value = '';
    }
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
  
  // Handle slash key press to show command palette
  const handleSlashKeyPress = () => {
    setShowCommandPalette(true);
    if (!inputValue.startsWith('/')) {
      setInputValue('/');
    }
  };
  
  // Watch for input changes to hide command palette when / is removed
  useEffect(() => {
    if (!inputValue.startsWith('/') && showCommandPalette) {
      setShowCommandPalette(false);
    }
  }, [inputValue, showCommandPalette]);
  
  // Close command palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCommandPalette && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCommandPalette(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCommandPalette]);
  
  // Toggle expanded/minimal view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'minimal' ? 'expanded' : 'minimal');
    if (viewMode === 'minimal') {
      // Reset selected message when expanding
      selectMessage(null);
    }
  };

  // Get the conversation related to a selected message
  const getSelectedConversation = () => {
    if (!selectedMessageId) {
      return messages;
    }

    // Find the index of the selected message
    const index = messages.findIndex(msg => msg.id === selectedMessageId);
    if (index === -1) return [];

    // If the selected message is a user message, find the corresponding AI response
    if (messages[index].role === 'user' && index + 1 < messages.length && messages[index + 1].role === 'assistant') {
      return [messages[index], messages[index + 1]];
    }
    
    // If the selected message is an AI response, find the corresponding user message
    if (messages[index].role === 'assistant' && index > 0 && messages[index - 1].role === 'user') {
      return [messages[index - 1], messages[index]];
    }
    
    // Fallback to just showing the selected message
    return [messages[index]];
  };
  
  // Toggle history sidebar
  const toggleHistory = () => {
    if (viewMode === 'minimal') {
      // If in minimal mode, switch to expanded first
      setViewMode('expanded');
    }
    setShowHistory(!showHistory);
  };

  // Handle message selection
  const handleSelectMessage = (id: string) => {
    // If already selected, deselect it (showing full conversation)
    if (id === selectedMessageId) {
      selectMessage(null);
    } else {
      selectMessage(id);
    }
    
    if (viewMode === 'minimal') {
      // If in minimal mode, switch to expanded
      setViewMode('expanded');
    }
  };
  
  if (!isVisible) return null;
  
  // Render minimal spotlight-style interface
  if (viewMode === 'minimal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
        <div 
          ref={containerRef}
          className="bg-[#2C2C2C] rounded-lg shadow-xl w-full max-w-xl flex flex-col border border-[#333333]"
        >
          {/* Input area with model selector */}
          <div className="p-3 relative">
            
            {/* Messages container - updated to show conversation thread */}
            {(messages.length > 0 || commandFeedback) && (
              <div className="mt-2 mb-2 max-h-auto min-h-[300px] overflow-y-auto bg-[#222222] rounded border border-[#333333] p-2
                [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
                [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
              >
                {commandFeedback ? (
                  <div className="text-sm text-teal-400">
                    {commandFeedback}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Display conversation based on selection */}
                    {getSelectedConversation().map((message) => (
                      <div key={message.id} className="flex items-start gap-2">
                        <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${message.role === 'assistant' ? 'bg-[#42ca75]' : 'bg-[#4A8CCA]'}`}>
                          {message.role === 'assistant' ? (
                            <Bot size={10} className="text-black" />
                          ) : (
                            <User size={10} className="text-white" />
                          )}
                        </div>
                        <div className="text-sm text-white/80 flex-1">
                          {message.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
                <ChatFeedback 
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  currentStreamContent={currentStreamContent}
                  commandFeedback={commandFeedback}
                  selectedMessageId={selectedMessageId}
                />
              </div>
            )}
            
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSlashKeyPress={handleSlashKeyPress}
              value={inputValue}
              onChange={setInputValue}
            />
            
            {/* Header with model selector below input */}
            <AIChatHeader
              showHistory={showHistory}
              toggleHistory={toggleHistory}
              clearMessages={clearMessages}
              toggleViewMode={toggleViewMode}
              toggleVisibility={toggleVisibility}
              isMinimal={true}
            />
            
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              multiple={false}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
              multiple={false}
            />
            <input
              ref={modelInputRef}
              type="file"
              accept=".glb,.gltf,.fbx,.obj"
              className="hidden"
              onChange={handleModelSelect}
              multiple={false}
            />
            
            {/* Command Palette */}
            {showCommandPalette && (
              <CommandPalette
                inputValue={inputValue}
                setShowCommandPalette={setShowCommandPalette}
                setCommandFeedback={setCommandFeedback}
                setInputValue={setInputValue}
                fileInputRef={fileInputRef}
                videoInputRef={videoInputRef}
                modelInputRef={modelInputRef}
              />
            )}
            
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
  }
  
  // Render expanded view with full chat and history
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="bg-[#2C2C2C] rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] min-h-[500px] flex flex-col overflow-hidden border-2 border-[#151515]"
      >
        {/* Header */}
        <AIChatHeader
          showHistory={showHistory}
          toggleHistory={toggleHistory}
          clearMessages={clearMessages}
          toggleViewMode={toggleViewMode}
          toggleVisibility={toggleVisibility}
        />
        
        {/* Main content with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* History sidebar */}
          {showHistory && (
            <ChatHistory
              messages={messages}
              selectedMessageId={selectedMessageId}
              handleSelectMessage={handleSelectMessage}
            />
          )}
          
          {/* Chat content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 bg-[#2C2C2C]
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
              [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40 p-6">
                  <Bot size={24} className="mb-2" />
                  <p className="text-center text-sm">No messages yet. Start a conversation!</p>
                  <p className="text-center text-xs mt-2">Try commands like: <span className="text-yellow-400">create cube at 0,0,0</span></p>
                  <p className="text-center text-xs mt-1">Type <span className="text-yellow-400">help</span> to see all commands.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Show conversation related to selected message or full conversation */}
                  {getSelectedConversation().map((message) => (
                    <ChatMessage
                      key={message.id}
                      content={message.content}
                      role={message.role}
                      timestamp={message.timestamp}
                      model={message.model}
                    />
                  ))}
                  
                  {isStreaming && currentStreamContent && !selectedMessageId && (
                    <ChatMessage
                      content={currentStreamContent}
                      role="assistant"
                      timestamp={Date.now()}
                      model={defaultModel}
                    />
                  )}
                  
                  <ChatFeedback 
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                    currentStreamContent={currentStreamContent}
                    commandFeedback={commandFeedback}
                    selectedMessageId={selectedMessageId}
                  />
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t-4 border-[#222222] bg-[#2C2C2C] relative">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onSlashKeyPress={handleSlashKeyPress}
                value={inputValue}
                onChange={setInputValue}
              />
              
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                multiple={false}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
                multiple={false}
              />
              <input
                ref={modelInputRef}
                type="file"
                accept=".glb,.gltf,.fbx,.obj"
                className="hidden"
                onChange={handleModelSelect}
                multiple={false}
              />
              
              {/* Command Palette in expanded view */}
              {showCommandPalette && (
                <CommandPalette
                  inputValue={inputValue}
                  setShowCommandPalette={setShowCommandPalette}
                  setCommandFeedback={setCommandFeedback}
                  setInputValue={setInputValue}
                  fileInputRef={fileInputRef}
                  videoInputRef={videoInputRef}
                  modelInputRef={modelInputRef}
                />
              )}
              
              {/* API key warning */}
              {!apiKey && (
                <div className="mt-2 text-xs text-yellow-400 p-2 bg-yellow-900/20 rounded">
                  No API key found. Please add your OpenRouter API key in Settings.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 