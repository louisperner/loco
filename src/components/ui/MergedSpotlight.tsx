import React, { useState, useEffect, useRef } from 'react';
import { Search, Bot, Brain, Layers, FileText, Settings, Gamepad2, Image, Code, Box, Square, PenTool, Video, CircleIcon, History, Loader2, ChevronDown, Check, Send, ArrowRight, Trash2 } from 'lucide-react';
import { useImageStore } from '../../store/useImageStore';
import { useGameStore } from '@/store/useGameStore';
import { useModelStore } from '@/store/useModelStore';
import { useVideoStore } from '@/store/videoStore';
import { useCodeStore } from '@/store/useCodeStore';
import { useOpenRouterStore } from '@/store/useOpenRouterStore';
import { openRouterApi } from '@/lib/openrouter';
import { OPENROUTER_MODELS, isStreamingSupported } from '@/lib/openrouter-constants';
import * as THREE from 'three';
import { generateVideoThumbnail } from '@/components/Models/utils';

// Common result interface
interface SearchResult {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface MergedSpotlightProps {
  onSearch?: (query: string) => void;
}

// Chat message interface
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

// Fix the interface for OpenRouter messages
interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Main component
const MergedSpotlight: React.FC<MergedSpotlightProps> = ({ onSearch }) => {
  // Common state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // OpenRouter specific state
  const [isOpenRouterMode, setIsOpenRouterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isAutoSelect, setIsAutoSelect] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [shownResponse, setShownResponse] = useState<string>('');
  const [fullResponse, setFullResponse] = useState<string>('');
  const [streamInterval, setStreamInterval] = useState<NodeJS.Timeout | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  // Store access
  const addImage = useImageStore((state) => state.addImage);
  const addVideo = useVideoStore((state) => state.addVideo);
  const addModel = useModelStore((state) => state.addModel);
  const addCodeBlock = useCodeStore((state) => state.addCodeBlock);
  const setShowDrawingOverlay = useGameStore((state) => state.setShowDrawingOverlay);

  // OpenRouter store access
  const { 
    apiKey, 
    defaultModel, 
    siteName,
    siteUrl,
    history,
    addToHistory,
    setDefaultModel
  } = useOpenRouterStore();
  
  // Check if streaming is supported for selected model
  const [streamingSupported, setStreamingSupported] = useState(true);
  
  // Check if streaming is supported for the selected model
  useEffect(() => {
    setStreamingSupported(isStreamingSupported(defaultModel));
  }, [defaultModel]);
  
  // List of available commands for regular spotlight mode
  const appCommands: SearchResult[] = [
    { 
      id: 'cube', 
      title: 'Add Cube', 
      category: '3D Objects', 
      icon: <Box className="w-5 h-5" />,
      action: () => handlePrimitiveSelect('cube')   
    },
    { 
      id: 'sphere', 
      title: 'Add Sphere', 
      category: '3D Objects', 
      icon: <CircleIcon className="w-5 h-5" />,
      action: () => handlePrimitiveSelect('sphere')
    },
    { 
      id: 'plane', 
      title: 'Add Plane', 
      category: '3D Objects', 
      icon: <Square className="w-5 h-5" />,
      action: () => handlePrimitiveSelect('plane')
    },
    { 
      id: 'image', 
      title: 'Add Image', 
      category: 'Media', 
      icon: <Image className="w-5 h-5" />,
      action: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
      }
    },
    { 
      id: 'video', 
      title: 'Add Video', 
      category: 'Media', 
      icon: <Video className="w-5 h-5" />,
      action: () => {
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
          videoInputRef.current.click();
        }
      }
    },
    { 
      id: 'model', 
      title: 'Add 3D Model', 
      category: '3D Objects', 
      icon: <Layers className="w-5 h-5" />,
      action: () => {
        if (modelInputRef.current) {
          modelInputRef.current.value = '';
          modelInputRef.current.click();
        }
      }
    },
    { 
      id: 'draw', 
      title: 'Drawing Mode', 
      category: 'Tools', 
      icon: <PenTool className="w-5 h-5" />,
      action: () => handleDraw()
    },
    { 
      id: 'code', 
      title: 'Add Code Block', 
      category: 'Development', 
      icon: <Code className="w-5 h-5" />,
      action: () => handleCodeAdd()
    },
    { 
      id: 'settings', 
      title: 'Open Settings', 
      category: 'App', 
      icon: <Settings className="w-5 h-5" />,
      action: () => console.log('Open settings')
    },
    {
      id: 'ai',
      title: 'AI Assistant (OpenRouter)',
      category: 'Tools',
      icon: <Bot className="w-5 h-5" />,
      action: () => {
        setIsOpenRouterMode(true);
        setSearchQuery('');
        setAiResponse(null);
      }
    }
  ];

  // Toggle spotlight visibility
  const toggleSpotlight = (openRouterMode = false) => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
      setAiResponse(null);
      setIsOpenRouterMode(false);
      
      // Clean up any streaming simulation
      if (streamInterval) {
        clearInterval(streamInterval);
        setStreamInterval(null);
        setIsStreaming(false);
        setFullResponse('');
        setShownResponse('');
      }
    } else {
      setIsOpen(true);
      setIsOpenRouterMode(openRouterMode);
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F key opens normal spotlight, / key opens OpenRouter mode
      if ((e.key.toLowerCase() === 'f' || e.key === '/') && 
          !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen) {
        
        // Check if the target is an input, textarea, or any editor-related element
        const target = e.target as HTMLElement;
        const isEditorActive = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.closest('.editor-container') !== null ||
          target.closest('.safe-live-editor') !== null ||
          target.closest('[data-no-pointer-lock]') !== null ||
          target.closest('.react-live') !== null ||
          target.classList.contains('CodeMirror') ||
          /editor|code-editor|monaco-editor/.test(target.className || '');
          
        // Don't open spotlight if we're in a text editor
        if (isEditorActive) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        toggleSpotlight(e.key === '/');
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        toggleSpotlight();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);
  
  // Handle mouse middle button
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button 1) for normal mode
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        toggleSpotlight(false);
      }
      // Alt+Click for OpenRouter mode
      else if (e.altKey && e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        toggleSpotlight(true);
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => window.removeEventListener('mousedown', handleMouseDown, true);
  }, [isOpen]);

  // Handle arrow key navigation through results
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.key === 'ArrowDown') {
          setSelectedResultIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          setSelectedResultIndex(prev => 
            prev > 0 ? prev - 1 : prev
          );
        } else if (e.key === 'Enter') {
          if (isOpenRouterMode) {
            if (!isLoading) {
              handleOpenRouterQuery();
            }
          } else if (results.length > 0) {
            const selectedResult = results[selectedResultIndex];
            selectedResult.action();
            if (onSearch) {
              onSearch(searchQuery);
            }
            setIsOpen(false);
            setSearchQuery('');
          }
        }
      }
    };
    
    // Use capture to intercept events before they reach other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, results, selectedResultIndex, searchQuery, onSearch, isOpenRouterMode, isLoading]);
  
  // Focus the input when spotlight opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedResultIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedResultIndex, results]);
  
  // Filter results based on search query (for regular mode)
  useEffect(() => {
    if (isOpenRouterMode || !searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    const filtered = appCommands.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setResults(filtered);
    setSelectedResultIndex(0);
  }, [searchQuery, isOpenRouterMode]);
  
  // Scroll to bottom of chat messages
  useEffect(() => {
    if (chatMessagesRef.current && isOpenRouterMode) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isOpenRouterMode, shownResponse]);

  // Handle searching OpenRouter
  const handleOpenRouterQuery = async () => {
    if (!apiKey) {
      const errorMessage = "Please set your OpenRouter API key in settings first.";
      setChatMessages(prev => [...prev, { 
        role: 'system', 
        content: errorMessage,
        timestamp: Date.now()
      }]);
      return;
    }
    
    if (!searchQuery.trim()) {
      return;
    }
    
    // Check if query starts with a / to trigger commands
    if (searchQuery.startsWith('/')) {
      // Look for command matches
      const command = searchQuery.slice(1).toLowerCase().trim();
      const matchedCommand = appCommands.find(cmd => 
        cmd.id.toLowerCase() === command || 
        cmd.title.toLowerCase().includes(command)
      );
      
      if (matchedCommand) {
        // Add user message to chat
        setChatMessages(prev => [...prev, { 
          role: 'user', 
          content: searchQuery,
          timestamp: Date.now()
        }]);
        
        // Execute the command
        matchedCommand.action();
        
        // Add system message about executed command
        setChatMessages(prev => [...prev, { 
          role: 'system', 
          content: `Executed command: ${matchedCommand.title}`,
          timestamp: Date.now()
        }]);
        
        setSearchQuery('');
        return;
      } else {
        // No matching command found
        setChatMessages(prev => [...prev, { 
          role: 'user', 
          content: searchQuery,
          timestamp: Date.now()
        }]);
        
        setChatMessages(prev => [...prev, { 
          role: 'system', 
          content: `Command not found: ${command}. Try one of: ${appCommands.map(c => c.id).join(', ')}`,
          timestamp: Date.now()
        }]);
        
        setSearchQuery('');
        return;
      }
    }
    
    // Regular chat message
    setIsLoading(true);
    setAiResponse(null);
    setShownResponse('');
    setFullResponse('');
    setIsStreaming(false);
    
    // Add user message to chat history
    setChatMessages(prev => [...prev, { 
      role: 'user', 
      content: searchQuery,
      timestamp: Date.now()
    }]);
    
    // Clean up any existing interval
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
    }
    
    // Prepare the messages for OpenRouter API
    // Include chat history for context (limited to last few exchanges)
    const recentChatMessages = chatMessages.slice(-6); // Get last few messages
    const promptMessages: OpenRouterMessage[] = recentChatMessages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role as 'user' | 'assistant', // Convert system messages to user for API compatibility
      content: msg.content
    }));
    
    // Add system message about available commands
    if (!promptMessages.some(msg => msg.role === 'system')) {
      promptMessages.unshift({
        role: 'system',
        content: `You are an assistant with access to execute app commands. To execute a command, include [command:name] in your response. 
Available commands: ${appCommands.map(cmd => cmd.id).join(', ')}. 
Example usage: "Let me add a cube for you [command:cube]" or "I'll show you an image picker [command:image]".
Only use commands when explicitly asked by the user.`
      });
    }
    
    // Add the current question
    promptMessages.push({ role: 'user', content: searchQuery });
    
    try {
      const result = await openRouterApi.chat(
        apiKey,
        {
          model: defaultModel,
          messages: promptMessages
        },
        { url: siteUrl, title: siteName }
      );
      
      const responseContent = result.choices[0]?.message?.content || "No response received";
      
      // Add to history
      addToHistory(searchQuery, responseContent, result.model);
      
      // Check if streaming is supported, if not, simulate it
      const supportsStreaming = isStreamingSupported(defaultModel);
      
      if (!supportsStreaming && !isThinking) {
        // Set full response in state but don't display it yet
        setFullResponse(responseContent);
        
        // Split response into words
        const words = responseContent.split(/(\s+)/); // Split by whitespace but keep separators
        let currentIndex = 0;
        
        // Clear any previous interval
        if (streamInterval) {
          clearInterval(streamInterval);
        }
        
        // Set loading to false but we're still "streaming"
        setIsLoading(false);
        setIsStreaming(true);
        
        // Add empty assistant message that will be filled in
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '', 
          timestamp: Date.now(),
          model: result.model
        }]);
        
        // Start a new interval to add words one by one
        const interval = setInterval(() => {
          if (currentIndex < words.length) {
            const newWord = words[currentIndex];
            setShownResponse(prev => prev + newWord);
            
            // Update the last message in the chat array
            setChatMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content += newWord;
                }
              }
              return newMessages;
            });
            
            currentIndex++;
          } else {
            // We've shown all words, stop the interval
            clearInterval(interval);
            setStreamInterval(null);
            setIsStreaming(false);
            
            // Parse for commands after response is complete
            parseAIResponseForCommands(responseContent);
            
            // No need to set aiResponse since we're using chatMessages now
            setSearchQuery('');
          }
        }, 30); // Adjust speed as needed
        
        setStreamInterval(interval);
      } else {
        // For models that support streaming or when in thinking mode, just show the response immediately
        // Process response for commands before displaying
        const processedResponse = parseAIResponseForCommands(responseContent);
        
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: processedResponse, 
          timestamp: Date.now(),
          model: result.model
        }]);
        
        setIsLoading(false);
        setSearchQuery('');
      }
      
    } catch (error) {
      console.error("OpenRouter API error:", error);
      
      setChatMessages(prev => [...prev, { 
        role: 'system', 
        content: "Error: Could not get a response from OpenRouter. Please check your API key and try again.",
        timestamp: Date.now()
      }]);
      
      setIsLoading(false);
    }
  };
  
  // Parse AI response for command execution
  const parseAIResponseForCommands = (response: string) => {
    // Look for command patterns like [command:cube], [action:add_image], etc.
    const commandRegex = /\[(command|action|execute):(\w+)(?:\s(.+?))?\]/gi;
    let match;
    let foundCommands = false;
    
    while ((match = commandRegex.exec(response)) !== null) {
      foundCommands = true;
      const [fullMatch, _, commandName, args] = match;
      
      console.log(`Detected command from AI: ${commandName} with args: ${args || 'none'}`);
      
      // Find matching command
      const matchedCommand = appCommands.find(cmd => 
        cmd.id.toLowerCase() === commandName.toLowerCase() || 
        cmd.title.toLowerCase().includes(commandName.toLowerCase())
      );
      
      if (matchedCommand) {
        // Execute the command
        setTimeout(() => {
          matchedCommand.action();
          
          // Add system message about executed command
          setChatMessages(prev => [...prev, { 
            role: 'system', 
            content: `AI executed command: ${matchedCommand.title}`,
            timestamp: Date.now()
          }]);
        }, 1000); // Slight delay for better UX
      } else {
        // No matching command found
        setChatMessages(prev => [...prev, { 
          role: 'system', 
          content: `AI tried to execute unknown command: ${commandName}`,
          timestamp: Date.now()
        }]);
      }
    }
    
    // If commands were found, return a cleaned response without the command syntax
    if (foundCommands) {
      return response.replace(commandRegex, '');
    }
    
    return response;
  };
  
  // Clear chat history
  const clearChat = () => {
    setChatMessages([]);
    setAiResponse(null);
    setShownResponse('');
    setFullResponse('');
    setIsStreaming(false);
    
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
    }
  };
  
  // Check for command suggestions as user types
  useEffect(() => {
    if (isOpenRouterMode && searchQuery.startsWith('/')) {
      const query = searchQuery.slice(1).toLowerCase().trim();
      if (query) {
        const matches = appCommands.filter(cmd => 
          cmd.id.toLowerCase().includes(query) || 
          cmd.title.toLowerCase().includes(query)
        );
        if (matches.length > 0) {
          setResults(matches);
          setShowCommandSuggestions(true);
        } else {
          setShowCommandSuggestions(false);
        }
      } else {
        // Show all commands when just typing '/'
        setResults(appCommands);
        setShowCommandSuggestions(true);
      }
    } else {
      setShowCommandSuggestions(false);
    }
  }, [searchQuery, isOpenRouterMode]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpenRouterMode) {
      if (!isLoading) {
        handleOpenRouterQuery();
      }
    } else if (results.length > 0) {
      const selectedResult = results[selectedResultIndex];
      selectedResult.action();
      
      if (onSearch && searchQuery.trim()) {
        onSearch(searchQuery);
      }
      
      setIsOpen(false);
      setSearchQuery('');
    }
  };
  
  // Prevent event propagation to canvas when spotlight is open
  const handleKeydownInSpotlight = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };
  
  // Group results by category
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((groups, result) => {
    if (!groups[result.category]) {
      groups[result.category] = [];
    }
    groups[result.category].push(result);
    return groups;
  }, {});

  // Handle primitive selections (cube, sphere, plane)
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
      direction.multiplyScalar(3); // Place 3 units in front of camera
      pos.add(direction);
      
      // For cubes, snap to grid (Minecraft-like behavior)
      if (type === 'cube') {
        // Round to nearest integer for grid alignment
        position = [
          Math.round(pos.x), 
          Math.max(0, Math.round(pos.y)), // Ensure y is not below ground
          Math.round(pos.z)
        ];
      } else {
        position = [pos.x, pos.y, pos.z];
      }
      
      rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
    }

    // Create a unique ID for the primitive
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
    
    // Close spotlight
    setIsOpen(false);
  };
  
  // Handle drawing mode
  const handleDraw = () => {
    setShowDrawingOverlay(true);
    setIsOpen(false); // Close spotlight after activating drawing mode
  };
  
  // Handle adding code blocks
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
      direction.multiplyScalar(3); // Place 3 units in front of camera
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
    
    // Close spotlight
    setIsOpen(false);
  };

  // Handle file changes for images
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);

      // Create an image to get dimensions
      const img = new window.Image();
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
        addImage({
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

        // Close spotlight if it's open
        setIsOpen(false);
      };

      img.onerror = () => {
        // Add image without dimensions if loading fails
        addImage({
          id: `image-${Date.now()}`,
          src: objectUrl,
          fileName: file.name,
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: 1,
          isInScene: true,
        });
        
        // Close spotlight if it's open
        setIsOpen(false);
      };

      img.src = objectUrl;
    }
  };
  
  // Handle video file select 
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      
      // Check file extension for supported formats
      const fileName = file.name.toLowerCase();
      const isSupportedFormat = 
        fileName.endsWith('.mp4') || 
        fileName.endsWith('.webm') || 
        fileName.endsWith('.ogg') || 
        fileName.endsWith('.mov');
      
      if (!isSupportedFormat) {
        console.warn(`Video format may not be supported: ${fileName}`);
      }

      try {
        // Try to generate thumbnail for the video
        let thumbnailUrl = '';
        try {
          thumbnailUrl = await generateVideoThumbnail(objectUrl);
        } catch (thumbnailError) {
          console.warn('Could not generate video thumbnail:', thumbnailError);
          // Continue without thumbnail
        }

        // Check for specific demuxer error during thumbnail generation
        const video = document.createElement('video');
        video.src = objectUrl;
        
        // Set up event handlers to check for demuxer error
        const videoErrorPromise = new Promise<boolean>((resolve) => {
          video.onerror = () => {
            const errorMessage = video.error?.message || '';
            if (errorMessage.includes('DEMUXER_ERROR_NO_SUPPORTED_STREAMS') || 
                errorMessage.includes('FFmpegDemuxer: no supported streams')) {
              console.error('Unsupported video format detected:', errorMessage);
              alert(`This video format is not supported by your browser. Please try a different format like MP4, WebM, or OGG.`);
              URL.revokeObjectURL(objectUrl);
              resolve(true); // Error occurred
            } else {
              resolve(false); // Other error or no error
            }
          };
          
          // If video loads metadata, assume it's playable
          video.onloadedmetadata = () => resolve(false);
          
          // Set a timeout in case neither event fires
          setTimeout(() => resolve(false), 3000);
        });
        
        // Load the video to trigger error if format is not supported
        video.load();
        
        // Wait to see if demuxer error occurs
        const hasError = await videoErrorPromise;
        if (hasError) {
          // Clean up and exit
          video.src = '';
          video.load();
          return;
        }
        
        // Clean up test video element
        video.src = '';
        video.load();

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

        // Add video to the store
        addVideo({
          src: objectUrl,
          fileName: file.name,
          thumbnailUrl, // This might be empty string if thumbnail generation failed
          position,
          rotation,
          scale: 3,
          isPlaying: true,
          volume: 0.5,
          loop: true,
          isInScene: true,
        });
        
        // If format is not supported but didn't trigger demuxer error, show a warning
        if (!isSupportedFormat) {
          setTimeout(() => {
            alert(`Note: The video format '${fileName.split('.').pop()}' may not play correctly in all browsers. For best compatibility, use MP4, WebM, or OGG formats.`);
          }, 500);
        }
        
        // Close spotlight if it's open
        setIsOpen(false);
      } catch (error) {
        console.error('Error processing video:', error);
        
        // Check if this is the specific demuxer error
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('DEMUXER_ERROR_NO_SUPPORTED_STREAMS') || 
            errorMsg.includes('FFmpegDemuxer: no supported streams')) {
          alert(`This video format is not supported by your browser. Please try a different format like MP4, WebM, or OGG.`);
          URL.revokeObjectURL(objectUrl);
          return; // Exit without adding video
        }
        
        // For other errors, try to add the video anyway
        try {
          addVideo({
            src: objectUrl,
            fileName: file.name,
            position: [0, 1, 0],
            rotation: [0, 0, 0],
            scale: 3,
            isPlaying: true,
            volume: 0.5,
            loop: true,
            isInScene: true,
          });
          
          // Close spotlight if it's open
          setIsOpen(false);
        } catch (addError) {
          console.error('Fatal error adding video:', addError);
          alert('Could not add video: ' + (addError instanceof Error ? addError.message : 'Unknown error'));
        }
      }
    }
  };
  
  // Handle model file select
  const handleModelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);

      try {
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

        // Add model to the store
        addModel({
          url: objectUrl,
          fileName: file.name,
          position,
          rotation,
          scale: 1,
          isInScene: true,
        });
        
        // Close spotlight if it's open
        setIsOpen(false);
      } catch (error) {
        console.error('Error handling model upload:', error);
      }
    }
  };

  // Toggle auto-select mode
  const toggleAutoSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoSelect(!isAutoSelect);
    // Auto-select can't be on at the same time as thinking
    if (!isAutoSelect) {
      setIsThinking(false);
    }
  };
  
  // Toggle thinking mode
  const toggleThinking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsThinking(!isThinking);
    // Thinking can't be on at the same time as auto-select
    if (!isThinking) {
      setIsAutoSelect(false);
    }
  };
  
  // Close model selector when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      if (showModelSelector) {
        setShowModelSelector(false);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showModelSelector, isOpen]);
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    // If we're in the middle of fake streaming, stop it
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
      setIsStreaming(false);
      
      // If we have a full response stored, show it immediately
      if (fullResponse) {
        setAiResponse(fullResponse);
        setFullResponse('');
      }
    }
    
    setDefaultModel(modelId);
    setShowModelSelector(false);
  };

  // Clean up interval on unmount or component close
  useEffect(() => {
    return () => {
      if (streamInterval) {
        clearInterval(streamInterval);
      }
    };
  }, [streamInterval]);

  return (
    <>
      {/* File input elements - kept outside of conditional rendering */}
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

      {/* Spotlight UI (conditionally rendered) */}
      {isOpen && (
        <div 
          ref={spotlightRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
          onKeyDown={handleKeydownInSpotlight}
        >
          <div 
            className="w-[600px] max-h-[80vh] bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* OpenRouter Chat Mode */}
            {isOpenRouterMode ? (
              <>
                {/* Chat Messages */}
                <div 
                  ref={chatMessagesRef}
                  className="overflow-y-auto flex-1 max-h-[calc(80vh-100px)] p-4 space-y-4"
                >
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-white/50">
                      <Brain className="w-12 h-12 mb-4 opacity-50" />
                      <p>Start a conversation with OpenRouter</p>
                      <p className="text-xs mt-2">Use / commands to control the app</p>
                      
                      {history.length > 0 && (
                        <div className="mt-6 w-full max-w-md">
                          <h3 className="text-sm text-white/70 mb-2 px-4">Recent Chats</h3>
                          <div className="space-y-1">
                            {history.slice(0, 5).map((item, index) => (
                              <div 
                                key={index}
                                className="px-4 py-2 cursor-pointer hover:bg-white/10 text-sm text-white/80"
                                onClick={() => {
                                  setChatMessages([
                                    { role: 'user', content: item.query, timestamp: item.timestamp },
                                    { role: 'assistant', content: item.response, timestamp: item.timestamp, model: item.model }
                                  ]);
                                }}
                              >
                                <div className="flex items-center">
                                  <History className="w-4 h-4 mr-2 opacity-50" />
                                  <span className="truncate">{item.query}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((message, index) => (
                        <div 
                          key={index} 
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === 'user' 
                                ? 'bg-emerald-500/30 text-white' 
                                : message.role === 'system'
                                  ? 'bg-yellow-500/20 text-white/90'
                                  : 'bg-white/20 text-white'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                              {message.role === 'assistant' && index === chatMessages.length - 1 && isStreaming && (
                                <span className="animate-pulse">▌</span>
                              )}
                            </div>
                            
                            {message.role === 'assistant' && message.model && (
                              <div className="text-xs text-white/40 mt-1">
                                {message.model.split('/')[1] || message.model}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white/20 text-white">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Command suggestions */}
                {showCommandSuggestions && (
                  <div className="max-h-60 overflow-y-auto border-t border-white/10">
                    <div className="p-2 text-xs text-white/60">Command suggestions</div>
                    {results.map((result, index) => (
                      <div
                        key={result.id}
                        className={`flex items-center px-4 py-2 cursor-pointer ${
                          selectedResultIndex === index ? 'bg-white/20' : 'hover:bg-white/10'
                        }`}
                        onClick={() => {
                          setSearchQuery(`/${result.id}`);
                          setShowCommandSuggestions(false);
                          handleOpenRouterQuery();
                        }}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                          {result.icon}
                        </div>
                        <div>
                          <span className="text-white">{result.title}</span>
                          <div className="text-xs text-white/50">/{result.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Chat Input */}
                <div className="border-t border-white/10 p-3">
                  <div className="flex items-center relative">
                    <button
                      className="absolute left-3 text-white/50 hover:text-white"
                      onClick={clearChat}
                      title="Clear chat"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Message OpenRouter or type / for commands..."
                      className="w-full px-12 py-3 bg-white/5 rounded-lg text-white outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          e.preventDefault();
                          handleOpenRouterQuery();
                        }
                      }}
                      disabled={isLoading}
                    />
                    
                    <button
                      className="absolute right-3 text-white/50 hover:text-white disabled:opacity-50"
                      onClick={handleOpenRouterQuery}
                      disabled={isLoading || !searchQuery.trim()}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Regular MacOS Spotlight Mode */
              <>
                <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-white/10">
                  <Search className="w-5 h-5 text-white/70 mr-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for commands or type '/' for a list..."
                    className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/50"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </form>
                
                <div ref={resultsRef} className="overflow-y-auto flex-1 max-h-[60vh]">
                  {searchQuery && results.length > 0 ? (
                    <div>
                      {Object.entries(groupedResults).map(([category, categoryResults]) => (
                        <div key={category} className="mb-2">
                          <div className="px-4 py-2 text-xs font-medium text-white/50 uppercase">
                            {category}
                          </div>
                          <div>
                            {categoryResults.map((result) => {
                              const resultIndex = results.findIndex(r => r.id === result.id);
                              const isSelected = selectedResultIndex === resultIndex;
                              
                              return (
                                <div
                                  key={result.id}
                                  data-index={resultIndex}
                                  className={`flex items-center px-4 py-2 cursor-pointer ${
                                    isSelected ? 'bg-white/20' : 'hover:bg-white/10'
                                  }`}
                                  onClick={() => {
                                    result.action();
                                    if (onSearch) {
                                      onSearch(searchQuery);
                                    }
                                    setIsOpen(false);
                                    setSearchQuery('');
                                  }}
                                >
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                                    {result.icon}
                                  </div>
                                  <div>
                                    <span className="text-white">{result.title}</span>
                                    <div className="text-xs text-white/50">Type &ldquo;{result.id}&rdquo; or select this option</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="flex flex-col items-center justify-center py-10 text-white/50">
                      <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-white/50">
                      <Search className="w-12 h-12 mb-4 opacity-50" />
                      <p>Type to search for commands</p>
                      <p className="text-xs mt-2">Try &ldquo;cube&rdquo;, &ldquo;image&rdquo;, &ldquo;code&rdquo;, etc.</p>
                      <div className="mt-6 text-center">
                        <p className="text-xs">Press <kbd className="bg-white/20 rounded px-1 mx-1">/</kbd> to switch to AI Assistant mode</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Footer with info */}
            <div className="p-2 text-xs text-white/40 border-t border-white/10 flex justify-between items-center">
              <div>
                Press <kbd className="bg-white/20 rounded px-1">Esc</kbd> to close
              </div>
              <div>
                {isOpenRouterMode ? (
                  <div className="flex items-center gap-2 relative">
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModelSelector(!showModelSelector);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-sm text-white/80"
                      >
                        <span className="truncate max-w-24">
                          {defaultModel.includes('/') 
                            ? defaultModel.split('/')[1].replace(/-instruct$/, '')
                            : defaultModel}
                        </span>
                        <ChevronDown className="w-3 h-3 text-white/60" />
                      </button>
                      
                      {showModelSelector && (
                        <div className="absolute bottom-full right-0 mb-1 bg-[#121212] border border-white/10 rounded-lg shadow-xl w-72 max-h-80 overflow-y-auto z-10">
                          <div className="py-2 border-b border-white/10">
                            <div 
                              className="flex items-center justify-between px-3 py-2 hover:bg-white/5 cursor-pointer"
                              onClick={toggleAutoSelect}
                            >
                              <span className="text-sm text-white/80">Auto-select</span>
                              <div className={`w-5 h-5 rounded-full ${isAutoSelect ? 'bg-yellow-400' : 'bg-white/10'}`}></div>
                            </div>
                            <div 
                              className="flex items-center justify-between px-3 py-2 hover:bg-white/5 cursor-pointer"
                              onClick={toggleThinking}
                            >
                              <span className="text-sm text-white/80">Thinking</span>
                              <div className={`w-5 h-5 rounded-full ${isThinking ? 'bg-yellow-400' : 'bg-white/10'}`}></div>
                            </div>
                          </div>
                          <div className="py-1">
                            {OPENROUTER_MODELS.map(model => {
                              // Add MAX tag for certain models
                              const hasMaxTag = ['anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct', 'google/gemini-1.5-pro'].includes(model.id);
                              const displayName = model.name;
                              
                              return (
                                <button
                                  key={model.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleModelChange(model.id);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between ${model.id === defaultModel ? 'text-yellow-400' : 'text-white/80'}`}
                                >
                                  <div className="flex items-center">
                                    <span>{displayName}</span>
                                    {hasMaxTag && (
                                      <span className="ml-2 text-xs px-1 rounded bg-white/10 text-white/70">MAX</span>
                                    )}
                                  </div>
                                  {model.id === defaultModel && (
                                    <Check className="w-4 h-4 text-yellow-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  `Press F or Middle click to open`
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MergedSpotlight; 