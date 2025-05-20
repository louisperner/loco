import React, { useEffect, useRef, useState } from "react";
import { useInterviewAssistantStore } from "../../store/interviewAssistantStore";
import { useOpenRouterStore } from "../../store/useOpenRouterStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { DEFAULT_OLLAMA_MODELS, testOllamaConnection, normalizeEndpoint } from "../../lib/ollama-constants";
import { OPENROUTER_MODELS } from "../../lib/openrouter-constants";
import { ollamaApi } from "../../lib/ollama";
import { Model, Solution, Screenshot } from "./InterviewAssistantTypes";
import { logger } from "./InterviewAssistantLogger";
import { detectLanguageFromText } from "./InterviewAssistantUtils";
import { InterviewAssistantHeader } from "./InterviewAssistantHeader";
import { InterviewAssistantScreenshots } from "./InterviewAssistantScreenshots";
import { InterviewAssistantProblem } from "./InterviewAssistantProblem";
import { InterviewAssistantSettings } from "./InterviewAssistantSettings";
import { InterviewAssistantSolution } from "./InterviewAssistantSolution";
import { InterviewAssistantFooter } from "./InterviewAssistantFooter";
import { InterviewAssistantRegionSelector } from "./InterviewAssistantRegionSelector";
import { captureFullScreenshot, startRegionCapture } from "./InterviewAssistantCapture";
import { generateSolution as generateAiSolution } from "./InterviewAssistantAI";
import { useImageStore } from "../../store/useImageStore";
import * as THREE from "three";

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
  const [customOllamaModels, setCustomOllamaModels] = useState<Model[]>([]);
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
  
  // Add event listener for the global shortcut trigger
  useEffect(() => {
    const handleGenerateEvent = () => {
      handleGenerateSolution();
    };
    
    window.addEventListener('interview-assistant-generate', handleGenerateEvent);
    
    return () => {
      window.removeEventListener('interview-assistant-generate', handleGenerateEvent);
    };
  }, [selectedLanguage, selectedModel, problemText, isCode]); // Dependencies that affect the generation
  
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
      if (e.metaKey && e.key === "b") {
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
        handleGenerateSolution();
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
  }, [isVisible, isEditingProblem, isSelectingRegion, isGenerating, resetAll]);
  
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
  
  // Function to start region selection
  const startRegionSelection = async () => {
    await startRegionCapture(
      setSelectingRegion,
      setVisible,
      isVisible,
      addScreenshot,
      setProblemText
    );
  };
  
  // Function to capture screenshot
  const captureScreenshot = async () => {
    await captureFullScreenshot(
      setCapturing,
      setVisible,
      addScreenshot,
      setProblemText,
      isVisible
    );
  };
  
  // Function to generate solution
  const handleGenerateSolution = async () => {
    await generateAiSolution(
        problemText,
        selectedLanguage,
        selectedModel,
      isCode,
      setGenerating,
      setSolution as (solution: Solution | null) => void,
      ollamaEnabled,
      setOllamaModel,
      setOpenRouterModel
    );
  };
  
  // Function to add the current screenshots to the 3D scene
  const addScreenshotToScene = (
    screenshots: Screenshot[], 
    setVisible: (visible: boolean) => void
  ) => {
    if (!screenshots || screenshots.length === 0) return;

    // Get the most recent screenshot
    const screenshot = screenshots[screenshots.length - 1];
    const { addImage } = useImageStore.getState();
    
    try {
      // Create a unique filename
      const fileName = `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      
      // Use the blob URL directly
      const imageUrl = screenshot.dataUrl;
      
      // Create a temp image to get dimensions
      const img = new Image();
      img.onload = () => {
        // This is the format used in HotbarTopNav.tsx
        const scale = 1;
        
        // Get camera position from window.mainCamera if available
        let position: [number, number, number] = [0, 1.5, -3]; // Default position
        let rotation: [number, number, number] = [0, 0, 0];   // Default rotation
        
        if (window.mainCamera) {
          const camera = window.mainCamera;
          // Get camera direction vector
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);
          
          // Set position in front of camera
          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // 3 units in front of camera
          pos.add(direction);
          
          // Update position and rotation
          position = [pos.x, pos.y, pos.z];
          rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
        }
        
        // Add image to the 3D scene
        addImage({
          id: `screenshot-${Date.now()}`,
          src: imageUrl,
          fileName,
          width: img.width,
          height: img.height,
          position,
          rotation,
          scale,
          isInScene: true
        });
        
        // Hide the Interview Assistant after adding to scene
        setVisible(false);
        
        // Optional: Show a notification or feedback
        console.log('Screenshot added to 3D scene');
      };
      
      // Start loading the image
      img.src = imageUrl;
      
    } catch (error) {
      console.error('Error adding screenshot to scene:', error);
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
        setOllamaEndpoint(normalizedEndpoint);
      }
      
      const response = await ollamaApi.getModels(normalizedEndpoint);
      
      // Extract models from the response, which may have either models or tags array
      let modelsList: Model[] = [];
      
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
    return <InterviewAssistantRegionSelector cancelRegionSelection={cancelRegionSelection} />;
  }
  
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
      <InterviewAssistantHeader 
        isCapturing={isCapturing}
        isSelectingRegion={isSelectingRegion}
        captureScreenshot={captureScreenshot}
        startRegionSelection={startRegionSelection}
        resetAll={resetAll}
        setVisible={setVisible}
        addToScene={() => addScreenshotToScene(screenshots, setVisible)}
        hasScreenshots={screenshots.length > 0}
      />
      
      {/* Screenshots section */}
      <InterviewAssistantScreenshots
        screenshots={screenshots}
        captureScreenshot={captureScreenshot}
        isCapturing={isCapturing}
        resetAll={resetAll}
      />
      
      {/* Problem Text Section - hide when not in code mode */}
      {!isCode && (
        <InterviewAssistantProblem
          isCode={isCode}
          isEditingProblem={isEditingProblem}
          problemText={problemText}
          editedProblemText={editedProblemText}
          textareaRef={textareaRef}
          toggleProblemEditing={toggleProblemEditing}
          setEditedProblemText={setEditedProblemText}
          setProblemText={setProblemText}
        />
      )}
      
      {/* Mode, Language and Model selection */}
      <InterviewAssistantSettings
        isCode={isCode}
        setIsCode={setIsCode}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedModel={selectedModel}
        handleModelChange={handleModelChange}
        ollamaEnabled={ollamaEnabled}
        toggleProvider={toggleProvider}
        ollamaConnectionError={ollamaConnectionError}
        getModelsForCurrentProvider={getModelsForCurrentProvider}
        isLoadingModels={isLoadingModels}
      />
      
      {/* Solution or Generate button */}
      <div className="flex-1 overflow-auto">
        <InterviewAssistantSolution
          isCode={isCode}
          isGenerating={isGenerating}
          solution={solution as Solution | null}
          screenshots={screenshots}
          problemText={problemText}
          generateSolution={handleGenerateSolution}
          setSolution={setSolution as (solution: Solution | null) => void}
          isCopied={isCopied}
          copyCodeToClipboard={copyCodeToClipboard}
          isTyping={isTyping}
          typedSolution={typedSolution}
        />
      </div>
      
      {/* Footer with keyboard shortcuts */}
      <InterviewAssistantFooter isCode={isCode} />
    </div>
  );
};

export default InterviewAssistant; 