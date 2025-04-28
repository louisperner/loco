import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Settings, Image, Code, Box, Square, PenTool, Video, CircleIcon } from 'lucide-react';
import { useImageStore } from '../../store/useImageStore';
import { useGameStore } from '@/store/useGameStore';
import { useModelStore } from '@/store/useModelStore';
import { useVideoStore } from '@/store/videoStore';
import { useCodeStore } from '@/store/useCodeStore';
import * as THREE from 'three';
import { generateVideoThumbnail } from '@/components/Models/utils';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface MacOsSpotlightProps {
  onSearch?: (query: string) => void;
}

const MacOsSpotlight: React.FC<MacOsSpotlightProps> = ({ onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  
  // Store access
  const addImage = useImageStore((state) => state.addImage);
  const addVideo = useVideoStore((state) => state.addVideo);
  const addModel = useModelStore((state) => state.addModel);
  const addCodeBlock = useCodeStore((state) => state.addCodeBlock);
  const setShowDrawingOverlay = useGameStore((state) => state.setShowDrawingOverlay);
  
  // List of available commands
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
  ];
  
  // Toggle spotlight visibility
  const toggleSpotlight = () => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    } else {
      setIsOpen(true);
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If only F key is pressed (without modifiers)
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen) {
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
        setIsOpen(true);
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);
  
  // Handle mouse middle button
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button 1)
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        toggleSpotlight();
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
        } else if (e.key === 'Enter' && results.length > 0) {
          const selectedResult = results[selectedResultIndex];
          selectedResult.action();
          if (onSearch) {
            onSearch(searchQuery);
          }
          setIsOpen(false);
          setSearchQuery('');
        }
      }
    };
    
    // Use capture to intercept events before they reach other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, results, selectedResultIndex, searchQuery, onSearch]);
  
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
  
  // Filter results based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
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
  }, [searchQuery]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      const selectedResult = results[selectedResultIndex];
      selectedResult.action();
    }
    
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
    
    setIsOpen(false);
    setSearchQuery('');
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
            className="w-[600px] bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
            
            <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MacOsSpotlight; 