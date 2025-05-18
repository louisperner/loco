import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Bot, Loader2, Image as ImageIcon, Video, Code, Box, Maximize, Square, Circle, Slash, User, History, ChevronRight, ChevronLeft } from 'lucide-react';
import { useOpenRouterStore } from '../../store/useOpenRouterStore';
import { openRouterApi } from '../../lib/openrouter';
import { isStreamingSupported } from '../../lib/openrouter-constants';
import { useAIChatStore } from '../../store/useAIChatStore';
import { useModelStore } from '../../store/useModelStore';
import { useImageStore } from '../../store/useImageStore';
import { useVideoStore } from '../../store/videoStore';
import { useCodeStore } from '../../store/useCodeStore';
import { useGameStore } from '../../store/useGameStore';
import { useOllamaStore } from '@/store/useOllamaStore';
import { ollamaApi } from '@/lib/ollama';
import ModelSelector from './ModelSelector';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { AIChatProps, ChatMessage as ChatMessageType } from './types';
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
    selectedMessageId,
    selectMessage,
  } = useAIChatStore();

  // Store access for commands
  const { addModel } = useModelStore();
  const { addImage, updateImage } = useImageStore();
  const { addVideo } = useVideoStore();
  const { addCodeBlock } = useCodeStore();
  const { setShowDrawingOverlay } = useGameStore();
  
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
      // Check if Ollama is enabled
      const ollamaStore = useOllamaStore.getState();
      
      // Determine if streaming should be used
      let shouldStream = false;
      
      if (ollamaStore.isEnabled) {
        // For Ollama, always use streaming if enabled in settings
        shouldStream = ollamaStore.useStreaming;
        console.log("[DEBUG] Ollama streaming check:", { 
          ollamaEnabled: ollamaStore.isEnabled,
          ollamaModel: ollamaStore.defaultModel, 
          useStreaming: ollamaStore.useStreaming, 
          shouldStream 
        });
      } else {
        // For OpenRouter, check if the model supports streaming
        const supportsStreaming = isStreamingSupported(defaultModel);
        shouldStream = useStreaming && supportsStreaming;
        console.log("[DEBUG] OpenRouter streaming check:", { 
          defaultModel, 
          useStreaming, 
          supportsStreaming, 
          shouldStream 
        });
      }
      
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
      // Check if Ollama is enabled
      const ollamaStore = useOllamaStore.getState();
      
      if (ollamaStore.isEnabled) {
        console.log("[DEBUG] Using Ollama:", ollamaStore.endpoint, ollamaStore.defaultModel, messages);

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
              setCurrentStreamContent((prev) => prev + token);
            },
            onComplete: (fullResponse) => {
              // Add the complete response to chat history
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
              console.error('Stream error:', error);
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
      addMessage({
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        role: 'assistant',
        model: defaultModel || 'unknown',
      });
      setIsStreaming(false);
      setCurrentStreamContent('');
    }
  };
  
  // Handle standard non-streaming response
  const handleStandardResponse = async (userMessage: string) => {
    try {
      // Check if Ollama is enabled
      const ollamaStore = useOllamaStore.getState();
      
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
      addMessage({
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        role: 'assistant',
        model: defaultModel || 'unknown',
      });
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
  
  // Command palette options
  const commandOptions = [
    { id: 'image', label: 'Image', icon: ImageIcon, command: 'add image', action: () => fileInputRef.current?.click() },
    { id: 'video', label: 'Video', icon: Video, command: 'add video', action: () => videoInputRef.current?.click() },
    { id: 'screenshot', label: 'Screenshot', icon: Maximize, command: 'add screenshot', action: () => handleScreenshot() },
    { id: '3d-model', label: '3D Model', icon: Box, command: 'add model', action: () => modelInputRef.current?.click() },
    { id: 'cube', label: 'Cube', icon: Square, command: 'create cube', action: () => handlePrimitiveSelect('cube') },
    { id: 'sphere', label: 'Sphere', icon: Circle, command: 'create sphere', action: () => handlePrimitiveSelect('sphere') },
    { id: 'plane', label: 'Plane', icon: Square, command: 'create plane', action: () => handlePrimitiveSelect('plane') },
    { id: 'draw', label: 'Draw', icon: Slash, command: 'draw', action: () => setShowDrawingOverlay(true) },
    { id: 'code', label: 'Code', icon: Code, command: 'add code', action: () => handleCodeAdd() },
  ];
  
  // Filter command options based on input
  const getFilteredCommands = () => {
    if (!inputValue || inputValue === '/') {
      return commandOptions;
    }
    
    const searchTerm = inputValue.slice(1).toLowerCase();
    return commandOptions.filter(option => 
      option.label.toLowerCase().includes(searchTerm) || 
      option.command.toLowerCase().includes(searchTerm)
    );
  };
  
  // Handle file select for images
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Close command palette immediately
      setShowCommandPalette(false);
      
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);

      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const scale =
          aspectRatio > 1
            ? ([aspectRatio, 1, 1] as [number, number, number])
            : ([1, 1 / aspectRatio, 1] as [number, number, number]);

        // Get camera position if available
        let position: [number, number, number] = [0, 1, 0];
        let rotation: [number, number, number] = [0, 0, 0];
        
        if (window.mainCamera) {
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // Place 3 units in front of camera
          pos.add(direction);
          position = [pos.x, pos.y, pos.z];
          rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
        }

        // Add image to the store
        const imageId = addImage({
          id: `image-${Date.now()}`,
          src: objectUrl,
          fileName: file.name,
          width: img.width,
          height: img.height,
          position,
          rotation,
          scale,
          isInScene: true,
        });

        // Save the file to disk if in Electron environment
        const electron = (window as unknown as { electron?: { saveImageFile: (file: File, fileName: string) => Promise<string> } }).electron;
        if (electron?.saveImageFile) {
          electron
            .saveImageFile(file, file.name)
            .then((savedPath: string) => {
              // Update image with the new file path
              updateImage(imageId, { src: savedPath });
              
              // Clean up the blob URL after saving
              URL.revokeObjectURL(objectUrl);
            })
            .catch((error: Error) => {
              console.error('Error saving image file:', error);
              alert(`Error saving image file: ${error.message}`);
            });
        }
        
        // Add feedback message
        setCommandFeedback(`Added image ${file.name}`);
      };

      img.onerror = () => {
        console.error('Failed to load image');
        setCommandFeedback('Failed to load image');
      };

      img.src = objectUrl;
      
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
      const objectUrl = URL.createObjectURL(file);
      
      // Get camera position if available
      let position: [number, number, number] = [0, 1, 0];
      let rotation: [number, number, number] = [0, 0, 0];
      
      if (window.mainCamera) {
        const camera = window.mainCamera;
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);

        const pos = new THREE.Vector3();
        pos.copy(camera.position);
        direction.multiplyScalar(3);
        pos.add(direction);
        position = [pos.x, pos.y, pos.z];
        rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
      }
      
      // Add video to store
      addVideo({
        src: objectUrl,
        fileName: file.name,
        position,
        rotation,
        scale: 3,
        isPlaying: true,
        volume: 0.5,
        loop: true,
        isInScene: true,
      });
      
      // Add feedback
      setCommandFeedback(`Added video ${file.name}`);
      
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
      const objectUrl = URL.createObjectURL(file);
      
      // Get camera position if available
      let position: [number, number, number] = [0, 1, 0];
      let rotation: [number, number, number] = [0, 0, 0];
      
      if (window.mainCamera) {
        const camera = window.mainCamera;
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);

        const pos = new THREE.Vector3();
        pos.copy(camera.position);
        direction.multiplyScalar(3);
        pos.add(direction);
        position = [pos.x, pos.y, pos.z];
        rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
      }
      
      // Store the file in the model cache
      window._modelFileCache = window._modelFileCache || {};
      window._modelFileCache[objectUrl] = file;
      
      // Store in the blob URL cache
      window._blobUrlCache = window._blobUrlCache || {};
      window._blobUrlCache[objectUrl] = true;
      
      // Add model to the store
      addModel({
        url: objectUrl,
        fileName: file.name,
        position,
        rotation,
        scale: 1,
        isInScene: true,
      });
      
      // Add feedback
      setCommandFeedback(`Added 3D model ${file.name}`);
      
      // Reset input
      e.target.value = '';
    }
  };
  
  // Handle primitive shapes (cube, sphere, plane)
  const handlePrimitiveSelect = (type: 'cube' | 'sphere' | 'plane') => {
    // Get camera position if available
    let position: [number, number, number] = [0, 1, 0];
    let rotation: [number, number, number] = [0, 0, 0];
    
    if (window.mainCamera) {
      const camera = window.mainCamera;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      const pos = new THREE.Vector3();
      pos.copy(camera.position);
      direction.multiplyScalar(3);
      pos.add(direction);
      
      // For cubes, snap to grid
      if (type === 'cube') {
        position = [
          Math.round(pos.x),
          Math.max(0, Math.round(pos.y)),
          Math.round(pos.z)
        ];
      } else {
        position = [pos.x, pos.y, pos.z];
      }
      
      rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
    }
    
    const id = `${type}-${Date.now()}`;
    
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
      rotation,
      scale: 1,
      isInScene: true,
      isPrimitive: true,
      primitiveType: type,
      color: '#4ade80',
      thumbnailUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    });
    
    // Close command palette
    setShowCommandPalette(false);
    
    // Add feedback
    setCommandFeedback(`Created ${type} at position [${position.join(', ')}]`);
  };
  
  // Handle code block creation
  const handleCodeAdd = () => {
    // Get camera position if available
    let position: [number, number, number] = [0, 1, 0];
    let rotation: [number, number, number] = [0, 0, 0];
    
    if (window.mainCamera) {
      const camera = window.mainCamera;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      const pos = new THREE.Vector3();
      pos.copy(camera.position);
      direction.multiplyScalar(3);
      pos.add(direction);
      position = [pos.x, pos.y, pos.z];
      rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
    }
    
    // Create default code
    const defaultCode = `// Write your React code here
function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem' }}>
      <h3>Counter: {count}</h3>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#4ade80', 
          border: 'none', 
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
    </div>
  );
}

render(<Counter />);`;
    
    // Add code block to the store
    addCodeBlock({
      code: defaultCode,
      fileName: 'Code Block',
      position,
      rotation,
      scale: 1,
      isInScene: true,
      noInline: true,
      language: 'jsx',
    });
    
    // Close command palette
    setShowCommandPalette(false);
    
    // Add feedback
    setCommandFeedback('Added code block');
  };
  
  // Handle screenshot
  const handleScreenshot = () => {
    // Trigger screenshot if available
    const takeScreenshot = (window as unknown as { takeScreenshot?: () => void }).takeScreenshot;
    if (takeScreenshot) {
      takeScreenshot();
      
      // Close command palette
      setShowCommandPalette(false);
      
      // Add feedback
      setCommandFeedback('Screenshot taken');
    } else {
      setCommandFeedback('Screenshot functionality not available');
    }
  };
  
  // Handle command selection
  const handleCommandSelect = (action: () => void) => {
    // Execute the action
    action();
    
    // Clear input and close command palette
    setInputValue('');
    setShowCommandPalette(false);
  };
  
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

  // Get selected message or the most recent one
  const getSelectedMessage = () => {
    if (!selectedMessageId) {
      return messages.length > 0 ? messages[messages.length - 1] : null;
    }
    return messages.find(msg => msg.id === selectedMessageId) || null;
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
  
  // Group messages by conversation context
  const groupMessagesByContext = () => {
    const groups: { date: string; messages: ChatMessageType[] }[] = [];
    
    let currentDate = '';
    let currentGroup: ChatMessageType[] = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };
  
  // Format message preview (truncate long messages)
  const formatMessagePreview = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
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
                {(isLoading || isStreaming) && (
                  <div className="flex items-center gap-2 mt-2 text-white/60">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-xs">AI is thinking...</span>
                  </div>
                )}
              </div>
            )}
            
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSlashKeyPress={handleSlashKeyPress}
              value={inputValue}
              onChange={setInputValue}
            />
            
            {/* Model selector below input */}
            <div className="flex items-center mt-2 px-2">
              <div className="flex-1 flex items-center space-x-1 text-xs text-white/50">
                <span className="bg-[#333333] text-xs px-1 rounded text-white/50">AI</span>
                <ModelSelector className="inline-block text-xs" />
              </div>
              
              {/* Buttons aligned to the right */}
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={toggleHistory}
                      className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
                      title="View message history"
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={clearMessages}
                      className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
                      title="Clear messages"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={toggleViewMode}
                  className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
                  title="Expand Chat"
                >
                  <Maximize size={14} />
                </button>
                <button 
                  onClick={toggleVisibility}
                  className="p-1 rounded hover:bg-[#333333] text-white/40 hover:text-white/70 transition-colors"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            
            
            
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
              <div className="absolute bottom-[calc(100%+0.4rem)] left-0 right-0 bg-[#1A1A1A] rounded-xl shadow-xl border border-[#333333] overflow-hidden z-10 animate-in fade-in duration-200">
                <div className="p-2 text-xs text-white/70 border-b border-[#333333] bg-[#222222] flex items-center">
                  <Slash size={14} className="mr-1.5 text-yellow-400" />
                  <span>Commands</span>
                </div>
                <div className="grid grid-cols-9 gap-2 p-3">
                  {getFilteredCommands().map((option, index) => (
                    <button
                      key={option.id}
                      className="flex flex-col items-center justify-center gap-1.5 p-2 hover:bg-[#333333] rounded-lg text-center transition-colors border border-[#333333] hover:border-[#444444] animate-in fade-in zoom-in-95 duration-300"
                      onClick={() => handleCommandSelect(option.action)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg text-yellow-400">
                        <option.icon size={18} />
                      </div>
                    </button>
                  ))}
                </div>
                {getFilteredCommands().length === 0 && (
                  <div className="p-3 text-center text-white/50 text-sm">
                    No commands match &apos;{inputValue}&apos;
                  </div>
                )}
              </div>
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
        <div className="flex justify-between items-center p-3 bg-[#2C2C2C] border-b-4 border-[#222222]">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-yellow-400" />
            <h2 className="text-white/90 font-medium">AI Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleHistory}
              className={`p-1.5 rounded hover:bg-[#222222] ${showHistory ? 'text-yellow-400' : 'text-white/60 hover:text-white/90'} transition-colors`}
              title="Message History"
            >
              <History size={16} />
            </button>
            <button
              onClick={clearMessages}
              className="p-1.5 rounded hover:bg-[#222222] text-white/60 hover:text-white/90 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={toggleViewMode}
              className="p-1.5 rounded hover:bg-[#222222] text-white/60 hover:text-white/90 transition-colors"
              title="Minimize Chat"
            >
              <ChevronLeft size={16} />
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
        
        {/* Main content with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* History sidebar */}
          {showHistory && (
            <div className="w-64 border-r border-[#222222] bg-[#252525] overflow-y-auto
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
              [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
            >
              <div className="p-3 border-b border-[#222222] bg-[#2A2A2A] sticky top-0 z-10">
                <h3 className="text-sm font-medium text-white/80">Conversation History</h3>
              </div>
              <div className="py-2">
                {groupMessagesByContext().map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-3">
                    <div className="px-3 py-1 text-xs text-white/50 bg-[#2A2A2A]">
                      {group.date}
                    </div>
                    <div className="divide-y divide-[#333333]">
                      {group.messages.filter(message => message.role === 'user').map((message) => {
                        const isSelected = message.id === selectedMessageId;
                        // Find the assistant response that follows this message
                        const nextIndex = group.messages.findIndex(msg => msg.id === message.id) + 1;
                        const hasResponse = nextIndex < group.messages.length && group.messages[nextIndex].role === 'assistant';
                        
                        return (
                          <button
                            key={message.id}
                            onClick={() => handleSelectMessage(message.id)}
                            className={`w-full text-left px-3 py-2 flex items-start gap-2 
                                      hover:bg-[#333333] transition-colors
                                      ${isSelected ? 'bg-[#333333]' : ''}`}
                          >
                            <div className="mt-0.5 p-1 rounded-full flex-shrink-0 bg-[#4A8CCA]">
                              <User size={10} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white/70 flex items-center justify-between mb-0.5">
                                <span>Conversation {group.messages.length > 2 ? `(${Math.ceil(group.messages.length/2)} msgs)` : ''}</span>
                                <span className="text-white/40 text-[10px]">
                                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <p className="text-xs text-white/60 truncate">
                                {formatMessagePreview(message.content)}
                              </p>
                              {hasResponse && (
                                <p className="text-xs text-green-400/60 truncate mt-1">
                                  {formatMessagePreview(group.messages[nextIndex].content, 30)}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <ChevronRight size={14} className="text-yellow-400 flex-shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  
                  {isLoading && !isStreaming && !selectedMessageId && (
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
                  
                  {commandFeedback && !selectedMessageId && (
                    <div className="py-3 px-4 bg-[#1E2D3D] rounded-md border border-[#2A3F50] text-teal-400 text-sm">
                      {commandFeedback}
                    </div>
                  )}
                  
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
                <div className="absolute top-0 left-0 right-0 bg-[#2A2A2A] rounded-lg shadow-xl border border-[#333333] overflow-hidden z-10 animate-in fade-in duration-200">
                  <div className="p-2 text-xs text-white/70 border-b border-[#333333] bg-[#333333] flex items-center">
                    <Slash size={14} className="mr-1.5 text-yellow-400" />
                    <span>Commands</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {getFilteredCommands().map((option, index) => (
                      <button
                        key={option.id}
                        className="flex flex-col items-center justify-center gap-1.5 p-2 hover:bg-[#3A3A3A] rounded-lg text-center transition-colors border border-[#444444] hover:border-[#555555] animate-in fade-in zoom-in-95 duration-300"
                        onClick={() => handleCommandSelect(option.action)}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#333333] text-yellow-400 border border-[#555555]">
                          <option.icon size={18} />
                        </div>
                        <span className="text-xs text-white/80 font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {getFilteredCommands().length === 0 && (
                    <div className="p-3 text-center text-white/50 text-sm">
                      No commands match &apos;{inputValue}&apos;
                    </div>
                  )}
                </div>
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