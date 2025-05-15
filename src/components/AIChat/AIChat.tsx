import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Bot, Loader2 } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { openRouterApi } from '../../lib/openrouter';
import { isStreamingSupported } from '../../lib/openrouter-constants';
import { useAIChatStore } from '../../store/useAIChatStore';
import { useModelStore } from '../../store/useModelStore';
import { useImageStore } from '../../store/useImageStore';
import { useVideoStore } from '../../store/videoStore';
import ModelSelector from './ModelSelector';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { AIChatProps } from './types';
import * as THREE from 'three';

// Parse position from a string like "0,0,0" or "x:0 y:0 z:0"
const parsePosition = (posStr: string): [number, number, number] | null => {
  if (!posStr) return null;
  
  // Try x:0 y:0 z:0 format
  if (posStr.includes('x:') || posStr.includes('y:') || posStr.includes('z:')) {
    const xMatch = posStr.match(/x:(-?\d+(\.\d+)?)/);
    const yMatch = posStr.match(/y:(-?\d+(\.\d+)?)/);
    const zMatch = posStr.match(/z:(-?\d+(\.\d+)?)/);
    
    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const z = zMatch ? parseFloat(zMatch[1]) : 0;
    
    return [x, y, z];
  }
  
  // Try comma-separated format
  const parts = posStr.split(',').map(part => parseFloat(part.trim()));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return [parts[0], parts[1], parts[2]];
  }
  
  return null;
};

// Extract number from string like "create 5 cubes"
const extractNumber = (str: string): number => {
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

const AIChat: React.FC<AIChatProps> = ({ isVisible, toggleVisibility }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  
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

  // Store access for commands
  const { addModel } = useModelStore();
  const { addImage } = useImageStore();
  const { addVideo } = useVideoStore();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamContent, commandFeedback]);
  
  // Process commands like "create cube at 0,0,0"
  const processCommand = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    
    // Check if it's a command
    if (lowerContent.startsWith('create') || lowerContent.startsWith('add')) {
      // Handle cube creation
      if (lowerContent.includes('cube') || lowerContent.includes('box')) {
        const count = extractNumber(lowerContent);
        let position: [number, number, number] = [0, 1, 0];
        
        // Extract position
        const posMatch = lowerContent.match(/at\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
        if (posMatch) {
          const parsedPos = parsePosition(posMatch[1]);
          if (parsedPos) {
            position = parsedPos;
          }
        } else if (window.mainCamera) {
          // Use camera position if available
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // Place 3 units in front of camera
          pos.add(direction);
          
          // Round to nearest integer for grid alignment
          position = [
            Math.round(pos.x), 
            Math.max(0, Math.round(pos.y)), // Ensure y is not below ground
            Math.round(pos.z)
          ];
        }
        
        // Create multiple cubes if count > 1
        for (let i = 0; i < count; i++) {
          const posOffset: [number, number, number] = [
            position[0] + (i % 3), 
            position[1] + Math.floor(i / 9), 
            position[2] + Math.floor((i % 9) / 3)
          ];
          
          createPrimitive('cube', posOffset);
        }
        
        setCommandFeedback(`Created ${count} cube${count > 1 ? 's' : ''} at position [${position.join(', ')}]`);
        return true;
      }
      
      // Handle sphere creation
      else if (lowerContent.includes('sphere') || lowerContent.includes('ball')) {
        const count = extractNumber(lowerContent);
        let position: [number, number, number] = [0, 1, 0];
        
        // Extract position
        const posMatch = lowerContent.match(/at\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
        if (posMatch) {
          const parsedPos = parsePosition(posMatch[1]);
          if (parsedPos) {
            position = parsedPos;
          }
        } else if (window.mainCamera) {
          // Use camera position if available
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3);
          pos.add(direction);
          
          position = [pos.x, pos.y, pos.z];
        }
        
        // Create multiple spheres if count > 1
        for (let i = 0; i < count; i++) {
          const posOffset: [number, number, number] = [
            position[0] + (i % 3), 
            position[1] + Math.floor(i / 9), 
            position[2] + Math.floor((i % 9) / 3)
          ];
          
          createPrimitive('sphere', posOffset);
        }
        
        setCommandFeedback(`Created ${count} sphere${count > 1 ? 's' : ''} at position [${position.join(', ')}]`);
        return true;
      }
      
      // Handle plane creation
      else if (lowerContent.includes('plane') || lowerContent.includes('floor')) {
        const count = extractNumber(lowerContent);
        let position: [number, number, number] = [0, 0, 0];
        
        // Extract position
        const posMatch = lowerContent.match(/at\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
        if (posMatch) {
          const parsedPos = parsePosition(posMatch[1]);
          if (parsedPos) {
            position = parsedPos;
          }
        } else if (window.mainCamera) {
          // Use camera position if available
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3);
          pos.add(direction);
          
          position = [pos.x, pos.y, pos.z];
        }
        
        // Create multiple planes if count > 1
        for (let i = 0; i < count; i++) {
          const posOffset: [number, number, number] = [
            position[0] + (i % 3) * 2, 
            position[1], 
            position[2] + Math.floor(i / 3) * 2
          ];
          
          createPrimitive('plane', posOffset);
        }
        
        setCommandFeedback(`Created ${count} plane${count > 1 ? 's' : ''} at position [${position.join(', ')}]`);
        return true;
      }
    }
    
    // Check for teleport command
    if (lowerContent.startsWith('teleport') || lowerContent.startsWith('goto') || lowerContent.startsWith('tp')) {
      const posMatch = lowerContent.match(/to\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
      if (posMatch) {
        const position = parsePosition(posMatch[1]);
        if (position && window.mainCamera) {
          window.mainCamera.position.set(position[0], position[1], position[2]);
          setCommandFeedback(`Teleported to position [${position.join(', ')}]`);
          return true;
        }
      }
    }
    
    // Check for help command
    if (lowerContent === 'help' || lowerContent === 'commands') {
      const helpText = `
Available commands:
- create cube at x:0 y:0 z:0
- create 5 cubes at 0,0,0
- create sphere at 1,2,3
- create plane at 0,0,0
- teleport to 10,5,10

You can also just chat with the AI normally!
      `.trim();
      
      addMessage({
        content: helpText,
        role: 'assistant',
        model: 'system',
      });
      
      return true;
    }
    
    return false;
  };
  
  // Create a primitive shape (cube, sphere, plane)
  const createPrimitive = (type: 'cube' | 'sphere' | 'plane', position: [number, number, number]) => {
    const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a simple SVG thumbnail
    const svgString = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#1A1A1A"/>
        ${
          type === 'cube'
            ? '<rect x="20" y="20" width="60" height="60" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
            : type === 'sphere'
              ? '<circle cx="50" cy="50" r="30" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
              : '<rect x="20" y="40" width="60" height="20" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
        }
      </svg>
    `;

    // Add primitive to the model store
    addModel({
      id,
      url: `primitive://${type}`,
      fileName: `${type}.${type === 'plane' ? 'glb' : 'gltf'}`,
      position,
      rotation: [0, 0, 0],
      scale: 1,
      isInScene: true,
      isPrimitive: true,
      primitiveType: type,
      color: '#4ade80',
      thumbnailUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    });
  };
  
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
    if (processCommand(content)) {
      return;
    }
    
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
      { role: 'system', content: 'You are a helpful AI assistant in a 3D environment. You can help create objects using commands like "create cube at 0,0,0" or answer questions.' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="bg-[#2C2C2C] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border-2 border-[#151515]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 bg-[#2C2C2C] border-b-4 border-[#222222]">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-yellow-400" />
            <h2 className="text-white/90 font-medium">AI Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="p-1.5 rounded hover:bg-[#222222] text-white/60 hover:text-white/90 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
            <ModelSelector className="mx-2" />
            <button 
              onClick={toggleVisibility}
              className="w-10 h-10 bg-[#bb2222] text-white hover:bg-[#D46464] text-12 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center rounded-md transition-colors border-2 border-[#151515]"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
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
              
              {commandFeedback && (
                <div className="py-3 px-4 bg-[#1E2D3D] rounded-md border border-[#2A3F50] text-teal-400 text-sm">
                  {commandFeedback}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t-4 border-[#222222] bg-[#2C2C2C]">
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