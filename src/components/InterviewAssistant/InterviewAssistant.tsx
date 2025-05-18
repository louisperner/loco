import React, { useEffect, useRef, useState } from "react";
import { FiEyeOff, FiCamera, FiSend, FiRefreshCw, FiMove, FiCopy, FiCheck, FiCrop, FiX, FiServer, FiCloud, FiAlertCircle } from "react-icons/fi";
import { useInterviewAssistantStore, Screenshot } from "../../store/interviewAssistantStore";
import { captureScreen, extractTextFromImage, captureScreenRegion, ScreenRegion } from "../../utils/screenCapture";
import { generateSolution as generateAiSolution, getAvailableModels } from "../../services/aiService";
import { useOpenRouterStore } from "../../store/useOpenRouterStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { OPENROUTER_MODELS } from "../../lib/openrouter-constants";
import { DEFAULT_OLLAMA_MODELS, testOllamaConnection, normalizeEndpoint } from "../../lib/ollama-constants";
import { ollamaApi } from "../../lib/ollama";

const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      // console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};

const InterviewAssistant: React.FC = () => {
  // Get state and actions from the store
  const {
    screenshots,
    solution,
    isVisible,
    isCapturing,
    isGenerating,
    isSelectingRegion,
    position,
    problemText,
    setVisible,
    addScreenshot,
    setSolution,
    setCapturing,
    setGenerating,
    setSelectingRegion,
    setPosition,
    setProblemText,
    resetAll
  } = useInterviewAssistantStore();
  
  // OpenRouter store for models
  const { defaultModel: openRouterModel, setDefaultModel: setOpenRouterModel } = useOpenRouterStore();
  
  // Ollama store
  const { 
    isEnabled: ollamaEnabled, 
    defaultModel: ollamaModel, 
    setDefaultModel: setOllamaModel,
    endpoint: ollamaEndpoint,
    setEndpoint: setOllamaEndpoint
  } = useOllamaStore();
  
  // Local state for drag functionality and language selection
  const [isDragging, setIsDragging] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedModel, setSelectedModel] = useState(ollamaEnabled ? ollamaModel : openRouterModel);
  const [customOllamaModels, setCustomOllamaModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [typedSolution, setTypedSolution] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [editedProblemText, setEditedProblemText] = useState("");
  const [isCode, setIsCode] = useState(true);
  
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [ollamaConnectionError, setOllamaConnectionError] = useState<string | null>(null);
  
  // Initialize edited problem text when problem text changes
  useEffect(() => {
    setEditedProblemText(problemText);
  }, [problemText]);
  
  // Focus the textarea when editing mode is enabled
  useEffect(() => {
    if (isEditingProblem && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditingProblem]);
  
  // Handle typing animation effect for the solution
  useEffect(() => {
    if (solution && solution.code) {
      setIsTyping(true);
      setTypedSolution("");
      
      let i = 0;
      const typingSpeed = 10; // characters per interval
      const typingInterval = setInterval(() => {
        if (i < solution.code.length) {
          setTypedSolution(prev => prev + solution.code.substring(i, i + typingSpeed));
          i += typingSpeed;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30);
      
      return () => clearInterval(typingInterval);
    }
    
    // Add explicit return for the code path when solution or solution.code is not defined
    return undefined;
  }, [solution]);
  
  // Reset selection state when exiting region selection mode
  useEffect(() => {
    if (!isSelectingRegion) {
      // Just in case we need to clean up anything from the region selection
      const overlay = document.getElementById('region-selection-overlay');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      
      const sizeInfo = document.getElementById('selection-size-info');
      if (sizeInfo && sizeInfo.parentNode) {
        sizeInfo.parentNode.removeChild(sizeInfo);
      }
    }
  }, [isSelectingRegion]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use Command+B to toggle visibility
      if (e.key === "b") {
        e.preventDefault();
        setVisible(!isVisible);
      }
      
      // Use Command+H to capture screenshot
      if (e.metaKey && e.key === "h") {
        e.preventDefault();
        captureScreenshot();
      }
      
      // Use Command+4 to enter region selection mode (changed from R to 4)
      if (e.metaKey && e.key === "4") {
        e.preventDefault();
        startRegionSelection();
      }
      
      // Use Command+Enter to generate solution
      if (e.metaKey && e.key === "Enter") {
        e.preventDefault();
        generateSolution();
      }
      
      // Use Command+G to reset context
      if (e.metaKey && e.key === "g") {
        e.preventDefault();
        resetAll();
      }
      
      // Use Command+Arrow keys to move the window
      if (e.metaKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        moveWindow(e.key);
      }
      
      // Use Command+E to toggle editing mode for problem text
      if (e.metaKey && e.key === "e") {
        e.preventDefault();
        toggleProblemEditing();
      }
      
      // Use Escape to cancel region selection
      if (e.key === "Escape" && isSelectingRegion) {
        e.preventDefault();
        cancelRegionSelection();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, isEditingProblem, isSelectingRegion]);
  
  // Function to toggle problem text editing mode
  const toggleProblemEditing = () => {
    if (isEditingProblem) {
      // Save the edited text
      setProblemText(editedProblemText);
      
      // Auto-detect language if we have problem text but no screenshots
      if (editedProblemText && editedProblemText.trim() !== "" && screenshots.length === 0) {
        // Try to auto-detect language from the problem text
        const detectedLanguage = detectLanguageFromText(editedProblemText);
        if (detectedLanguage) {
          setSelectedLanguage(detectedLanguage);
        }
      }
    } else {
      // Enter editing mode
      setEditedProblemText(problemText);
    }
    setIsEditingProblem(!isEditingProblem);
  };
  
  // Helper function to detect language from text
  const detectLanguageFromText = (text: string): string | null => {
    // Simple language detection based on keywords and syntax
    const lowerCaseText = text.toLowerCase();
    
    // Check for specific language indicators
    if (lowerCaseText.includes('def ') && lowerCaseText.includes(':') || 
        lowerCaseText.includes('import ') && lowerCaseText.includes('print(')) {
      return 'python';
    } else if (lowerCaseText.includes('func ') && lowerCaseText.includes('package ')) {
      return 'go';
    } else if (lowerCaseText.includes('public class ') || lowerCaseText.includes('public static void main')) {
      return 'java';
    } else if (lowerCaseText.includes('console.log') || lowerCaseText.includes('function') || 
               lowerCaseText.includes('const ') || lowerCaseText.includes('let ') ||
               lowerCaseText.includes('var ')) {
      return 'javascript';
    } else if (lowerCaseText.includes('interface ') || lowerCaseText.includes(': string') || 
               lowerCaseText.includes(': number') || lowerCaseText.includes('<T>')) {
      return 'typescript';
    } else if (lowerCaseText.includes('#include') || lowerCaseText.includes('int main()')) {
      return 'c++';
    } else if (lowerCaseText.includes('namespace ') || lowerCaseText.includes('using System;')) {
      return 'c#';
    } else if (lowerCaseText.includes('fn ') && lowerCaseText.includes('->')) {
      return 'rust';
    } else if (lowerCaseText.includes('fun ') && lowerCaseText.includes('val ')) {
      return 'kotlin';
    } else if (lowerCaseText.includes('func ') && lowerCaseText.includes('import Foundation')) {
      return 'swift';
    } else if (lowerCaseText.includes('<?php') || lowerCaseText.includes('echo ')) {
      return 'php';
    } else if (lowerCaseText.includes('def ') && lowerCaseText.includes('end')) {
      return 'ruby';
    }
    
    // Default to javascript if no language is detected
    return null;
  };
  
  // Function to start region selection
  const startRegionSelection = async () => {
    try {
      setSelectingRegion(true);
      
      // Always hide the assistant UI during selection
      const wasVisible = isVisible;
      setVisible(false);
      
      // Add a small delay to ensure the UI is hidden
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show a cursor overlay that indicates region selection is active
      const overlay = document.createElement('div');
      overlay.id = 'region-selection-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'crosshair';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      document.body.appendChild(overlay);
      
      // Create a helper to handle the selection process
      const selectRegion = (): Promise<{ dataUrl: string, region: ScreenRegion }> => {
        return new Promise((resolve, reject) => {
          let startX = 0;
          let startY = 0;
          let selectionRect: HTMLDivElement | null = null;
          
          const onMouseDown = (e: MouseEvent) => {
            startX = e.clientX;
            startY = e.clientY;
            
            // Create selection rectangle
            selectionRect = document.createElement('div');
            selectionRect.style.position = 'fixed';
            selectionRect.style.border = '1px solid #42ca75';
            selectionRect.style.backgroundColor = 'rgba(66, 202, 117, 0.2)';
            selectionRect.style.zIndex = '10000';
            selectionRect.style.left = `${startX}px`;
            selectionRect.style.top = `${startY}px`;
            selectionRect.style.width = '0';
            selectionRect.style.height = '0';
            document.body.appendChild(selectionRect);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          };
          
          const onMouseMove = (e: MouseEvent) => {
            if (!selectionRect) return;
            
            const width = e.clientX - startX;
            const height = e.clientY - startY;
            
            // Set position based on direction of drag
            const left = width < 0 ? e.clientX : startX;
            const top = height < 0 ? e.clientY : startY;
            
            selectionRect.style.left = `${left}px`;
            selectionRect.style.top = `${top}px`;
            selectionRect.style.width = `${Math.abs(width)}px`;
            selectionRect.style.height = `${Math.abs(height)}px`;
            
            // Show dimensions
            const sizeInfo = document.createElement('div');
            sizeInfo.id = 'selection-size-info';
            sizeInfo.style.position = 'fixed';
            sizeInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            sizeInfo.style.color = 'white';
            sizeInfo.style.padding = '4px 8px';
            sizeInfo.style.borderRadius = '4px';
            sizeInfo.style.fontSize = '12px';
            sizeInfo.style.fontFamily = 'monospace';
            sizeInfo.style.pointerEvents = 'none';
            sizeInfo.style.zIndex = '10001';
            sizeInfo.textContent = `${Math.abs(width)} × ${Math.abs(height)}`;
            
            // Position the size info
            const infoLeft = left + Math.abs(width) / 2;
            const infoTop = top + Math.abs(height) + 10;
            sizeInfo.style.left = `${infoLeft}px`;
            sizeInfo.style.top = `${infoTop}px`;
            sizeInfo.style.transform = 'translateX(-50%)';
            
            // Remove existing size info if it exists
            const existingInfo = document.getElementById('selection-size-info');
            if (existingInfo && existingInfo.parentNode) {
              existingInfo.parentNode.removeChild(existingInfo);
            }
            
            document.body.appendChild(sizeInfo);
          };
          
          const onMouseUp = async (e: MouseEvent) => {
            if (!selectionRect) {
              reject(new Error('Selection was cancelled'));
              cleanup();
              return;
            }
            
            try {
              // Calculate the region
              const width = Math.abs(e.clientX - startX);
              const height = Math.abs(e.clientY - startY);
              const x = Math.min(startX, e.clientX);
              const y = Math.min(startY, e.clientY);
              
              if (width < 10 || height < 10) {
                // Selection too small, discard
                reject(new Error('Selection too small'));
                cleanup();
                return;
              }
              
              // Briefly highlight the selected area
              selectionRect.style.backgroundColor = 'rgba(66, 202, 117, 0.4)';
              selectionRect.style.border = '2px solid #42ca75';
              
              // Add a small delay to show the highlighted region before capture
              await new Promise(r => setTimeout(r, 200));
              
              // First hide the selection UI elements before capturing
              if (selectionRect && selectionRect.parentNode) {
                selectionRect.style.display = 'none';
              }
              
              const sizeInfo = document.getElementById('selection-size-info');
              if (sizeInfo && sizeInfo.parentNode) {
                sizeInfo.style.display = 'none';
              }
              
              // Capture the entire screen
              const dataUrl = await captureScreen();
              
              // Process the region with appropriate scaling
              // Create a region object with the selected coordinates
              const devicePixelRatio = window.devicePixelRatio || 1;
              const region: ScreenRegion = { 
                x: Math.round(x * devicePixelRatio), 
                y: Math.round(y * devicePixelRatio), 
                width: Math.round(width * devicePixelRatio), 
                height: Math.round(height * devicePixelRatio) 
              };
              
              logger.log("Region selection with devicePixelRatio:", devicePixelRatio, "Region:", region);
              
              // Resolve with both the full screenshot and region data
              resolve({ dataUrl, region });
            } catch (error) {
              reject(error);
            } finally {
              cleanup();
            }
          };
          
          const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              reject(new Error('Selection was cancelled'));
              cleanup();
            }
          };
          
          const cleanup = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('keydown', onKeyDown);
            
            if (selectionRect && selectionRect.parentNode) {
              selectionRect.parentNode.removeChild(selectionRect);
            }
            
            const sizeInfo = document.getElementById('selection-size-info');
            if (sizeInfo && sizeInfo.parentNode) {
              sizeInfo.parentNode.removeChild(sizeInfo);
            }
            
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          };
          
          document.addEventListener('mousedown', onMouseDown, { once: true });
          document.addEventListener('keydown', onKeyDown);
        });
      };
      
      // Perform the selection
      const { dataUrl, region } = await selectRegion();
      
      // Process the captured region
      const regionDataUrl = await captureScreenRegion(dataUrl, region);
      
      // Create a new screenshot entry
      const newScreenshot: Screenshot = {
        id: Date.now().toString(),
        dataUrl: regionDataUrl,
        timestamp: Date.now(),
        region
      };
      
      // Add the screenshot
      addScreenshot(newScreenshot);
      
      // Try to extract text from the region
      try {
        const extractedText = await extractTextFromImage();
        setProblemText(extractedText);
      } catch (error) {
        logger.error("Error extracting text:", error);
      }
      
      // Show the UI again and exit selection mode
      setSelectingRegion(false);
      setVisible(wasVisible);
    } catch (error) {
      logger.error("Error during region selection:", error);
      // Show the UI again in case of error
      setSelectingRegion(false);
      setVisible(true);
    }
  };
  
  // Function to capture screenshot
  const captureScreenshot = async () => {
    try {
      setCapturing(true);
      
      // Always hide the application UI before capturing the screen
      const wasVisible = isVisible;
      setVisible(false);
      
      // Add a small delay to ensure the UI is hidden
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use our screen capture utility
      logger.log("Trying to capture screen from InterviewAssistant");
      const dataUrl = await captureScreen();
      logger.log("Screen capture complete, checking result...");
      
      // Check if we got the fallback image (which means capture failed)
      if (dataUrl && dataUrl.includes('Screen capture unavailable')) {
        logger.error("Screen capture failed - got fallback image");
        setProblemText("Screen capture failed. Please make sure you have granted screen recording permissions to the application. On macOS, go to System Preferences > Security & Privacy > Privacy > Screen Recording and ensure this application is checked.");
        setCapturing(false);
        
        // Restore UI visibility
        setVisible(wasVisible);
        return;
      }
      
      logger.log("Creating new screenshot object");
      const newScreenshot: Screenshot = {
        id: Date.now().toString(),
        dataUrl,
        timestamp: Date.now()
      };
      
      logger.log("Adding screenshot to store");
      addScreenshot(newScreenshot);
      
      // Ensure the state is updated before proceeding
      const storeScreenshots = useInterviewAssistantStore.getState().screenshots;
      logger.log("Screenshot added, store now has:", storeScreenshots.length, "screenshots");
      
      // Try to extract text from the screenshot
      try {
        const extractedText = await extractTextFromImage();
        setProblemText(extractedText);
      } catch (error) {
        logger.error("Error extracting text:", error);
      }
      
      // Add a delay before setting capturing to false to ensure UI updates properly
      setTimeout(() => {
        logger.log("Setting capturing to false");
        setCapturing(false);
        
        // Restore UI visibility
        setVisible(wasVisible);
        
        // Force another check to make sure screenshots are properly loaded
        setTimeout(refreshFromStore, 100);
      }, 200);
    } catch (error) {
      logger.error("Error capturing screenshot:", error);
      setProblemText("Screen capture failed. Please make sure you have granted screen recording permissions to the application. On macOS, go to System Preferences > Security & Privacy > Privacy > Screen Recording and ensure this application is checked.");
      setCapturing(false);
      
      // Restore UI visibility if there was an error
      setVisible(true);
    }
  };
  
  // Function to generate solution
  const generateSolution = async () => {
    // Get current screenshots directly from the store to ensure we have the latest state
    const currentScreenshots = useInterviewAssistantStore.getState().screenshots;
    logger.log("Generate solution called, component screenshots:", screenshots.length, 
              "store screenshots:", currentScreenshots.length);
    
    // Check if there's a valid screenshot or problem text
    if (currentScreenshots.length === 0 && (!problemText || problemText.trim() === "")) {
      alert("Please capture a screenshot or enter problem text first");
      return;
    }
    
    // If there's no screenshot but we have problem text, create a placeholder screenshot
    if (currentScreenshots.length === 0 && problemText && problemText.trim() !== "") {
      // Create a canvas for a placeholder screenshot
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Manual problem entry (no screenshot)', canvas.width / 2, canvas.height / 2);
        
        // Add the problem text preview
        ctx.font = '14px Arial';
        const previewText = problemText.length > 50 ? problemText.substring(0, 50) + '...' : problemText;
        ctx.fillText(previewText, canvas.width / 2, canvas.height / 2 + 30);
        
        // Add indicator of mode - code or question
        ctx.font = 'italic 14px Arial';
        if (isCode) {
          // Add the selected language as an indicator
          ctx.fillText(`Language: ${selectedLanguage}`, canvas.width / 2, canvas.height / 2 + 60);
        } else {
          ctx.fillText('General Question Mode', canvas.width / 2, canvas.height / 2 + 60);
        }
      }
      
      // Create a new screenshot
      const newScreenshot: Screenshot = {
        id: Date.now().toString(),
        dataUrl: canvas.toDataURL('image/png'),
        timestamp: Date.now()
      };
      
      addScreenshot(newScreenshot);
      logger.log("Added placeholder screenshot, store now has:", 
                useInterviewAssistantStore.getState().screenshots.length, "screenshots");
    }
    
    if (isGenerating) return;
    
    setGenerating(true);
    
    try {
      // Update the model selection in the respective store
      if (ollamaEnabled) {
        setOllamaModel(selectedModel);
      } else {
        setOpenRouterModel(selectedModel);
      }
      
      // Call the AI service to generate a solution
      console.log("Generating solution with model:", selectedModel);
      
      const generatedSolution = await generateAiSolution(
        problemText,
        selectedLanguage,
        selectedModel,
        isCode
      );
      
      // Add debug logging for solution parsing
      console.log("Solution received from AI:", typeof generatedSolution, 
        generatedSolution.code ? generatedSolution.code.substring(0, 100) + "..." : "No code");
      
      // Update state with the generated solution
      setSolution(generatedSolution);
    } catch (error) {
      console.error("Error generating solution:", error);
      
      // Create fallback solution to display the error to the user
      const errorSolution = {
        code: `// Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
        explanation: "There was a problem generating a solution. Please try again with different settings or a different model.",
        complexity: {
          time: "N/A",
          space: "N/A"
        }
      };
      
      setSolution(errorSolution);
    } finally {
      setGenerating(false);
    }
  };
  
  // Function to copy code to clipboard
  const copyCodeToClipboard = () => {
    if (solution) {
      navigator.clipboard.writeText(solution.code)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          logger.error('Failed to copy: ', err);
        });
    }
  };
  
  // Function to move window with arrow keys
  const moveWindow = (direction: string) => {
    const step = 20;
    switch (direction) {
      case "ArrowUp":
        setPosition({ ...position, y: position.y - step });
        break;
      case "ArrowDown":
        setPosition({ ...position, y: position.y + step });
        break;
      case "ArrowLeft":
        setPosition({ ...position, x: position.x - step });
        break;
      case "ArrowRight":
        setPosition({ ...position, x: position.x + step });
        break;
    }
  };
  
  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = { 
      startX: e.clientX - position.x, 
      startY: e.clientY - position.y 
    };
  };
  
  // Handle drag move
  const handleDragMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY
      });
    }
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Function to handle the app restart (in Electron environment)
  const handleRestartApp = () => {
    if (window.electron && window.electron.reloadApp) {
      // Use the Electron API to reload the app if available
      window.electron.reloadApp();
    } else {
      // Fallback for browser environment: just reload the current page
      window.location.reload();
    }
  };
  
  // Monitor screenshots state changes
  useEffect(() => {
    logger.log("Component: Screenshots state updated, now has", screenshots.length, "items");
  }, [screenshots]);
  
  // Function to refresh screenshots from store
  const refreshFromStore = () => {
    const storeScreenshots = useInterviewAssistantStore.getState().screenshots;
    logger.log("Manual refresh, store has", storeScreenshots.length, "screenshots");
    // This will force a re-render with the latest state
    if (storeScreenshots.length > 0 && screenshots.length === 0) {
      // Force update by calling setCapturing and then immediately turning it off
      setCapturing(true);
      setTimeout(() => setCapturing(false), 10);
    }
  };
  
  // Update selected model when provider changes and test connection if using Ollama
  useEffect(() => {
    setSelectedModel(ollamaEnabled ? ollamaModel : openRouterModel);
    
    // Load Ollama models if needed and test connection
    if (ollamaEnabled) {
      testOllamaConnection(ollamaEndpoint).then(isConnected => {
        if (isConnected) {
          setOllamaConnectionError(null);
          loadOllamaModels();
        } else {
          setOllamaConnectionError(`Could not connect to Ollama at ${ollamaEndpoint}. Make sure Ollama is running.`);
        }
      });
    } else {
      setOllamaConnectionError(null);
    }
  }, [ollamaEnabled, ollamaModel, openRouterModel, ollamaEndpoint]);
  
  // Load dynamic Ollama models from API
  const loadOllamaModels = async () => {
    if (!ollamaEnabled) return;
    
    // Clear any previous models and set loading state
    setCustomOllamaModels([]);
    setIsLoadingModels(true);
    
    try {
      // Ensure the endpoint is normalized
      const normalizedEndpoint = normalizeEndpoint(ollamaEndpoint);
      
      // Check if the current endpoint in store is normalized, if not update it
      if (normalizedEndpoint !== ollamaEndpoint) {
        console.log(`Updating Ollama endpoint from ${ollamaEndpoint} to ${normalizedEndpoint}`);
        setOllamaEndpoint(normalizedEndpoint);
      }
      
      const response = await ollamaApi.getModels(normalizedEndpoint);
      
      // Extract models from the response, which may have either models or tags array
      let modelsList: { id: string; name: string }[] = [];
      
      if (response.models && response.models.length > 0) {
        // Handle response with models field
        modelsList = response.models.map(model => ({
          id: model.name,
          name: model.name
        }));
      } else if (response.tags && response.tags.length > 0) {
        // Handle response with tags field
        modelsList = response.tags.map(tag => ({
          id: tag.name,
          name: tag.name
        }));
      }
      
      if (modelsList.length > 0) {
        setCustomOllamaModels(modelsList);
        
        // Store models in localStorage for other components to use
        try {
          localStorage.setItem('ollamaModels', JSON.stringify(modelsList));
        } catch (error) {
          console.error('Error storing Ollama models in localStorage:', error);
        }
        
        // If current model is not in the list, select first available
        if (!modelsList.some(model => model.id === ollamaModel)) {
          setOllamaModel(modelsList[0].id);
        }
        
        // Clear any connection error if we successfully loaded models
        setOllamaConnectionError(null);
      } else {
        // Fall back to default models if none found
        setCustomOllamaModels(DEFAULT_OLLAMA_MODELS);
        setOllamaConnectionError("No models found. You may need to pull models with 'ollama pull gemma3:4b'");
      }
    } catch (error) {
      console.error("Error loading Ollama models:", error);
      // Fall back to defaults on error
      setCustomOllamaModels(DEFAULT_OLLAMA_MODELS);
      setOllamaConnectionError(`Error loading models: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Get the available models list based on the active provider
  const getModelsForCurrentProvider = () => {
    if (ollamaEnabled) {
      return customOllamaModels.length > 0 ? customOllamaModels : DEFAULT_OLLAMA_MODELS;
    } else {
      return OPENROUTER_MODELS;
    }
  };

  // Handle model change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    
    // Update the appropriate store
    if (ollamaEnabled) {
      setOllamaModel(newModel);
    } else {
      setOpenRouterModel(newModel);
    }
  };
  
  // Toggle the provider (Ollama or OpenRouter)
  const toggleProvider = () => {
    // Toggle the Ollama enabled state
    useOllamaStore.setState({ isEnabled: !ollamaEnabled });
    
    // If switching to Ollama, load models
    if (!ollamaEnabled) {
      loadOllamaModels();
    }
  };
  
  // Function to cancel region selection
  const cancelRegionSelection = () => {
    const wasVisible = isVisible;
    setSelectingRegion(false);
    
    // Small delay before restoring visibility
    setTimeout(() => {
      setVisible(wasVisible);
    }, 100);
  };
  
  // If not visible, render nothing
  if (!isVisible) return null;
  
  // If in region selection mode, render the selection overlay
  if (isSelectingRegion) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg text-center">
            <p className="font-medium">Click and drag to select a region.</p>
            <p className="text-xs mt-1 text-gray-300">Press ESC to cancel</p>
          </div>
        </div>
        
        <div 
          className="relative w-full h-full cursor-crosshair"
          style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        >
          {/* The actual overlay is now created in the startRegionSelection function */}
        </div>
        
        <button 
          className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
          onClick={cancelRegionSelection}
        >
          Cancel
        </button>
      </div>
    );
  }
  
  // Update this part in the return section where you render the problem text
  // Look for where you render the problem text and add this conditional rendering
  
  // const renderProblemText = () => {
  //   if (problemText && problemText.includes("Screen capture failed")) {
  //     return (
  //       <div className="flex flex-col space-y-4">
  //         <p className="text-red-400">{problemText}</p>
  //         <button
  //           onClick={handleRestartApp}
  //           className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
  //         >
  //           Restart Application
  //         </button>
  //       </div>
  //     );
  //   }
    
  //   if (isEditingProblem) {
  //     return (
  //       <div className="flex flex-col space-y-2">
  //         <textarea
  //           ref={textareaRef}
  //           className="w-full h-48 p-2 bg-gray-900 border border-gray-700 rounded-md"
  //           value={editedProblemText}
  //           onChange={(e) => setEditedProblemText(e.target.value)}
  //           placeholder="Enter your problem description or code here..."
  //         />
  //         <div className="text-xs text-gray-400 italic">
  //           Press ⌘+E again to save your changes
  //         </div>
  //       </div>
  //     );
  //   }
    
  //   // If there's no problem text and no screenshot
  //   if (!problemText && screenshots.length === 0) {
  //     return (
  //       <div className="flex flex-col space-y-2">
  //         <div className="text-gray-400">
  //           Capture a screenshot or <button onClick={toggleProblemEditing} className="text-blue-400 hover:underline">click here</button> to enter problem text manually
  //         </div>
  //       </div>
  //     );
  //   }
    
  //   return (
  //     <div className="whitespace-pre-wrap">{problemText || "Capture a screenshot to start"}</div>
  //   );
  // };
  
  return (
    <div
      className="fixed text-white rounded-lg shadow-lg overflow-hidden z-50 p-1"
      style={{ 
        width: "500px", 
        height: "auto",
        maxHeight: "90vh",
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transition: "all 0.3s ease",
        backdropFilter: "blur(8px)",
        backgroundColor: "#2C2C2C",
        display: "flex",
        flexDirection: "column"
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-2 bg-[#2C2C2C] border-b-4 border-[#222222] font-minecraft">
        <div className="flex items-center space-x-2">
          <FiMove className="cursor-move text-white/60 hover:text-white" />
          {/* <h3 className="font-medium text-white/90 text-sm">Interview Assistant</h3> */}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="text-white/60 hover:text-white transition-colors duration-200"
            onClick={() => setVisible(false)}
            title="Hide (⌘+B)"
          >
            <FiEyeOff size={16} />
          </button>
          <button
            className={`text-white/60 hover:text-white transition-colors duration-200 ${isCapturing ? "animate-pulse text-[#42ca75]" : ""}`}
            onClick={captureScreenshot}
            disabled={isCapturing}
            title="Capture Screenshot (⌘+H)"
          >
            <FiCamera size={16} />
          </button>
          <button
            className={`text-white/60 hover:text-white transition-colors duration-200 ${isSelectingRegion ? "animate-pulse text-[#42ca75]" : ""}`}
            onClick={startRegionSelection}
            disabled={isSelectingRegion}
            title="Select Region (⌘+4)"
          >
            <FiCrop size={16} />
          </button>
          <button
            className="text-white/60 hover:text-white transition-colors duration-200"
            onClick={resetAll}
            title="Reset (⌘+G)"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {/* FIRST: Screenshots section */}
      <div className="p-2 bg-[#2C2C2C] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-xs font-medium font-minecraft text-white/90">Screenshots ({screenshots.length})</h4>
          <div className="flex space-x-1">
            {screenshots.length > 0 && (
              <button 
                className="text-xs text-white/60 hover:text-white bg-[#222222] rounded px-1 py-0.5 transition-colors duration-200 text-[10px]"
                onClick={() => resetAll()}
                title="Clear Screenshots"
              >
                Clear
              </button>
            )}
            <button 
              className={`text-xs text-white/60 hover:text-white bg-[#222222] rounded px-1 py-0.5 transition-colors duration-200 text-[10px]`}
              onClick={captureScreenshot}
              disabled={isCapturing}
            >
              Capture
            </button>
          </div>
        </div>
        {screenshots.length > 0 ? (
          <div className="h-[180px] overflow-y-auto
            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
            [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
            <div className="grid grid-cols-1 gap-1">
              {screenshots.map((ss, index) => (
                <div 
                  key={ss.id} 
                  className="relative rounded overflow-hidden border-2 border-[#151515] shadow-md group hover:border-[#555555] transition-colors duration-200"
                  style={{ height: '200px' }}
                >
                  <div className="absolute top-0 left-0 bg-[#151515] bg-opacity-70 text-xs text-white py-0.5 px-1 rounded-br">
                    #{screenshots.length - index}
                  </div>
                  <img 
                    src={ss.dataUrl} 
                    alt={`Screenshot ${new Date(ss.timestamp).toLocaleTimeString()}`} 
                    className="w-full h-full object-contain bg-[#222222]"
                    onError={(e) => {
                      console.error("Error loading image", e);
                      (e.target as HTMLImageElement).src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
                      (e.target as HTMLImageElement).style.opacity = "0.3";
                    }}
                  />
                  {ss.region && (
                    <div className="absolute bottom-1 right-1 bg-[#151515] bg-opacity-70 text-xs text-white py-0.5 px-1 rounded">
                      {Math.round(ss.region.width)} × {Math.round(ss.region.height)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="bg-[#bb2222] hover:bg-[#D46464] text-white text-xs rounded-full p-1 transition-colors duration-200"
                      onClick={() => {
                        // Filter out this screenshot
                        const updatedScreenshots = screenshots.filter(s => s.id !== ss.id);
                        if (updatedScreenshots.length === 0) {
                          resetAll();
                        } else {
                          useInterviewAssistantStore.setState({ screenshots: updatedScreenshots });
                        }
                      }}
                      title="Remove Screenshot"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[180px] bg-[#222222] rounded-md text-white/40 text-xs text-center px-2">
            Capture a screenshot using ⌘+H or select a region with ⌘+4
          </div>
        )}
      </div>
      
      {/* SECOND: Problem Text Section - shorter, can be toggled */}
      {
        !isCode ? (
          <div className="p-2 bg-[#2C2C2C] border-t-2 border-[#222222]">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <h4 className="text-xs font-medium font-minecraft text-white/90 mr-2">{isCode ? "Problem Text" : "Question"}</h4>
            <button
              className={`text-[10px] px-1 rounded border text-white/60 ${isEditingProblem ? "bg-[#42ca75] text-white border-[#42ca75]" : "border-[#333333]"}`}
              onClick={toggleProblemEditing}
              title="Toggle Edit Mode (⌘+E)"
            >
              {isEditingProblem ? "Save" : "Edit"}
            </button>
          </div>
          <button
            className="text-[10px] px-1 rounded border border-[#333333] text-white/60"
            onClick={() => setProblemText("")}
            title="Clear Problem Text"
          >
            Clear
          </button>
        </div>
        
        {isEditingProblem ? (
          <textarea
            ref={textareaRef}
            className="w-full h-24 p-2 bg-[#151515] border-2 border-[#333333] rounded-md text-white/90 placeholder-white/40 focus:outline-none focus:border-[#666666] text-sm resize-none"
            value={editedProblemText}
            onChange={(e) => setEditedProblemText(e.target.value)}
            placeholder={isCode ? "Enter your problem description or code here..." : "Enter your question here..."}
          />
        ) : (
          <div className="whitespace-pre-wrap text-white/90 text-sm h-24 overflow-y-auto p-2 bg-[#222222] rounded-md
            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
            [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
            {problemText || (
              <div className="text-white/40 text-xs">
                Capture a screenshot or click the Edit button to enter {isCode ? "problem text" : "your question"} manually
              </div>
            )}
          </div>
        )}
      </div>
        ) : <></>
      }
      
      {/* THIRD: Mode selection, Language and Model selection in a compact row */}
      <div className="flex flex-col gap-2 p-2 border-t-2 border-b-2 border-[#222222] bg-[#2C2C2C]">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Mode:</span>
          <div className="flex bg-[#222222] border-2 border-[#151515] rounded-md p-0.5">
            <button
              className={`text-xs px-2 py-1 rounded ${isCode ? 'bg-[#42ca75] text-white' : 'text-white/60'}`}
              onClick={() => setIsCode(true)}
            >
              Code
            </button>
            <button
              className={`text-xs px-2 py-1 rounded ${!isCode ? 'bg-[#42ca75] text-white' : 'text-white/60'}`}
              onClick={() => setIsCode(false)}
            >
              Question
            </button>
          </div>
          {/* Provider toggle */}
          <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Provider:</span>
                <button 
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                    ollamaEnabled 
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-600/20' 
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-600/20'
                  }`}
                  onClick={toggleProvider}
                >
                  {ollamaEnabled ? (
                    <>
                      <FiServer className="w-3 h-3" />
                      Ollama (Local)
                    </>
                  ) : (
                    <>
                      <FiCloud className="w-3 h-3" />
                      OpenRouter (Cloud)
                    </>
                  )}
                </button>
              </div>
        </div>

        
        
        {/* Language and Model selection */}
        <div className="flex gap-2">
          {/* Show language dropdown only if in code mode */}
          {isCode ? (
            <div className="w-1/2">
              <div className="flex items-center">
                <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Language:</span>
                <select
                  className="w-full bg-[#222222] text-white/90 rounded p-1 text-xs border-2 border-[#151515] focus:outline-none focus:border-[#666666] transition-colors duration-200"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="c++">C++</option>
                  <option value="c#">C#</option>
                  <option value="go">Go</option>
                  <option value="ruby">Ruby</option>
                  <option value="php">PHP</option>
                  <option value="swift">Swift</option>
                  <option value="kotlin">Kotlin</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="w-1/2">
              <div className="flex items-center">
                <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Type:</span>
                <div className="text-xs p-1 bg-[#222222] rounded border-2 border-[#151515] text-white/90 w-full">
                  General Question
                </div>
              </div>
            </div>
          )}
          
          <div className="w-1/2">
            <div className="flex flex-col">
              
              
              {/* Show Ollama connection error if any */}
              {ollamaEnabled && ollamaConnectionError && (
                <div className="flex items-center text-red-400 text-[10px] mb-1 bg-red-900/20 px-1 py-0.5 rounded">
                  <FiAlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{ollamaConnectionError}</span>
                </div>
              )}
              
              {/* Model selector */}
              <div className="flex items-center">
                <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Model:</span>
                <select
                  className={`w-full rounded p-1 text-xs border-2 focus:outline-none focus:border-[#666666] transition-colors duration-200 ${
                    ollamaEnabled 
                      ? 'bg-[#222222] text-blue-100 border-[#151515]' 
                      : 'bg-[#222222] text-yellow-100 border-[#151515]'
                  }`}
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={isLoadingModels || (ollamaEnabled && ollamaConnectionError !== null)}
                >
                  {isLoadingModels ? (
                    <option value="">Loading models...</option>
                  ) : (
                    getModelsForCurrentProvider().map((model) => (
                      <option key={model.id} value={model.id} className="bg-[#222222]">
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* FOURTH: Solution or Generate button */}
      <div className="flex-1 overflow-auto">
        {isGenerating ? (
          // AI Thinking animation
          <div className="flex flex-col items-center justify-center h-full bg-[#222222] p-4">
            <div className="w-10 h-10 border-4 border-[#42ca75] border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-center">
              <p className="text-white/90 font-minecraft mb-1">AI is thinking...</p>
              <p className="text-white/60 text-xs">Analyzing the problem and generating a solution</p>
            </div>
          </div>
        ) : solution ? (
          // Solution display
          <div className="p-2 bg-[#2C2C2C] overflow-auto h-full">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-medium font-minecraft text-white/90">{isCode ? "Solution" : "Answer"}</h4>
              <div className="flex space-x-1">
                <button 
                  className="text-white/60 hover:text-white flex items-center gap-1 text-[10px] p-1 rounded bg-[#222222] border-2 border-[#151515] transition-colors duration-200"
                  onClick={copyCodeToClipboard}
                >
                  {isCopied ? (
                    <>
                      <FiCheck className="text-[#42ca75]" size={12} /> Copied
                    </>
                  ) : (
                    <>
                      <FiCopy size={12} /> Copy
                    </>
                  )}
                </button>
                <button 
                  className="text-white/60 hover:text-white flex items-center gap-1 text-[10px] p-1 rounded bg-[#222222] border-2 border-[#151515] transition-colors duration-200"
                  onClick={() => setSolution(null)}
                  title="Back to Generation"
                >
                  <FiX size={12} /> Back
                </button>
              </div>
            </div>
            
            {/* Solution code */}
            <div className="bg-[#222222] rounded p-2 text-xs font-mono whitespace-pre overflow-x-auto border-2 border-[#151515] h-[66%] overflow-y-auto shadow-inner text-white/90
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
              [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
              {isTyping ? 'Loading...' : JSON.parse(solution.code).code}
              {isTyping && <span className="animate-pulse">|</span>}
            </div>
            
            <div className="flex mt-2 justify-between">
              <div className="flex-1 mr-2">
                <h4 className="text-xs font-medium font-minecraft text-white/90 mb-1">Explanation</h4>
                <div className="bg-[#222222] rounded p-1.5 text-xs border-2 border-[#151515] h-20 overflow-y-auto shadow-inner
                  [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
                  [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
                  <p className="text-white/90">{JSON.parse(solution.code).explanation}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Generate Solution Button
          <div className='flex justify-center items-center h-auto p-2 bg-[#222222]'>
            <button
              className='w-full bg-[#42ca75] text-white rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-[#666666] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-[#151515]'
              onClick={generateSolution}
              disabled={isGenerating || (screenshots.length === 0 && (!problemText || problemText.trim() === ""))}
            >
              <FiSend size={16} className="mr-1" />
              <span>{isCode ? "Generate Solution" : "Answer Question"}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Footer with keyboard shortcuts */}
      <div className="p-1 bg-[#222222] text-[10px] text-white/60 border-t-2 border-[#151515] font-minecraft flex justify-between">
        <div className="flex space-x-2">
          <span>⌘+B: Toggle</span>
          <span>⌘+H: Screenshot</span>
          <span>⌘+4: Region</span>
        </div>
        <div className="flex space-x-2">
          <span>⌘+↵: {isCode ? "Solution" : "Answer"}</span>
          <span>⌘+E: Edit</span>
        </div>
      </div>
    </div>
  );
};

export default InterviewAssistant; 