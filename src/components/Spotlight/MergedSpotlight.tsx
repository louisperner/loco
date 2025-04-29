import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useImageStore } from '@/store/useImageStore';
import { useGameStore } from '@/store/useGameStore';
import { useModelStore } from '@/store/useModelStore';
import { useVideoStore } from '@/store/videoStore';
import { useCodeStore } from '@/store/useCodeStore';
import { MergedSpotlightProps, SearchResult } from './types';
import { getAppCommands } from './commands';
import { 
  handlePrimitiveSelect,
  handleDraw,
  handleCodeAdd,
  handleFileSelect,
  handleVideoSelect,
  handleModelSelect
} from './handlers';
import OpenRouterChat from './OpenRouterChat';
import RegularSpotlight from './RegularSpotlight';

// Main component
const MergedSpotlight: React.FC<MergedSpotlightProps> = ({ onSearch }) => {
  // Common state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [isOpenRouterMode, setIsOpenRouterMode] = useState(false);
  const [_unused, setShowCommandSuggestions] = useState(false);
  
  // Refs
  const spotlightRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  
  // Store access
  const addImage = useImageStore((state) => state.addImage);
  const updateImage = useImageStore((state) => state.updateImage);
  const addVideo = useVideoStore((state) => state.addVideo);
  const updateVideo = useVideoStore((state) => state.updateVideo);
  const addModel = useModelStore((state) => state.addModel);
  const addCodeBlock = useCodeStore((state) => state.addCodeBlock);
  const setShowDrawingOverlay = useGameStore((state) => state.setShowDrawingOverlay);
  const confirmedPosition = useGameStore((state) => state.confirmedPosition);
  
  // Initialize app commands with useMemo to prevent unnecessary recreation
  const appCommands = useMemo(() => getAppCommands(
    (type) => handlePrimitiveSelect(type, addModel, confirmedPosition),
    () => handleDraw(setShowDrawingOverlay),
    () => handleCodeAdd(addCodeBlock),
    setIsOpenRouterMode,
    fileInputRef as React.RefObject<HTMLInputElement>,
    videoInputRef as React.RefObject<HTMLInputElement>,
    modelInputRef as React.RefObject<HTMLInputElement>
  ), [addModel, confirmedPosition, setShowDrawingOverlay, addCodeBlock, setIsOpenRouterMode, fileInputRef, videoInputRef, modelInputRef]);

  // Toggle spotlight visibility
  const toggleSpotlight = useCallback((openRouterMode = false) => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    } else {
      setIsOpen(true);
      setIsOpenRouterMode(openRouterMode);
    }
  }, [isOpen, setIsOpen, setSearchQuery, setIsOpenRouterMode]);
  
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
  }, [isOpen, toggleSpotlight]);
  
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
  }, [isOpen, toggleSpotlight]);

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
          if (!isOpenRouterMode && results.length > 0) {
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
  }, [isOpen, results, selectedResultIndex, searchQuery, onSearch, isOpenRouterMode]);
  
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
  }, [searchQuery, isOpenRouterMode, appCommands]);
  
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
  }, [searchQuery, isOpenRouterMode, appCommands]);
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOpenRouterMode && results.length > 0) {
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
  
  // Handle AI command execution
  const handleCommand = (commandType: string | null) => {
    if (!commandType) return;
    
    switch (commandType) {
      case 'cube':
      case 'sphere':
      case 'plane':
        handlePrimitiveSelect(commandType, addModel, confirmedPosition);
        break;
      case 'draw':
        handleDraw(setShowDrawingOverlay);
        break;
      case 'code':
        handleCodeAdd(addCodeBlock);
        break;
      default:
        // Command not implemented yet
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0], addImage, updateImage).then(() => {
        setIsOpen(false);
      });
    }
  };
  
  // Handle video input change
  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleVideoSelect(files[0], addVideo, updateVideo);
      setIsOpen(false);
    }
  };
  
  // Handle model input change
  const handleModelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleModelSelect(files[0], addModel);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* File input elements - kept outside of conditional rendering */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
        multiple={false}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoInputChange}
        multiple={false}
      />
      <input
        ref={modelInputRef}
        type="file"
        accept=".glb,.gltf,.fbx,.obj"
        className="hidden"
        onChange={handleModelInputChange}
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
              <OpenRouterChat 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setIsOpen={setIsOpen}
                results={results}
                setResults={setResults}
                selectedResultIndex={selectedResultIndex}
                setSelectedResultIndex={setSelectedResultIndex}
                setShowCommandSuggestions={setShowCommandSuggestions}
                commandHandler={handleCommand}
                appCommands={appCommands}
              />
            ) : (
              /* Regular MacOS Spotlight Mode */
              <RegularSpotlight 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                results={results}
                selectedResultIndex={selectedResultIndex}
                onSearch={onSearch}
                handleSearchSubmit={handleSearchSubmit}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MergedSpotlight; 