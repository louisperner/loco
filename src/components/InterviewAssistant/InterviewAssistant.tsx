import React, { useEffect, useRef, useState } from "react";
import { FiEyeOff, FiCamera, FiSend, FiRefreshCw, FiMove, FiCopy, FiCheck, FiEdit, FiCrop, FiX } from "react-icons/fi";
import { useInterviewAssistantStore, Screenshot } from "../../store/interviewAssistantStore";
import { captureScreen, extractTextFromImage, captureScreenRegion, ScreenRegion } from "../../utils/screenCapture";
import { generateSolution as generateAiSolution, getAvailableModels } from "../../services/aiService";
import { useOpenRouterStore } from "../../store/useOpenRouterStore";

const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(...args);
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
  const { defaultModel, setDefaultModel } = useOpenRouterStore();
  
  // Local state for drag functionality and language selection
  const [isDragging, setIsDragging] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [availableModels, setAvailableModels] = useState(getAvailableModels());
  const [isCopied, setIsCopied] = useState(false);
  const [typedSolution, setTypedSolution] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [editedProblemText, setEditedProblemText] = useState("");
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<ScreenRegion | null>(null);
  const [fullScreenshot, setFullScreenshot] = useState<string | null>(null);
  
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectionRect(null);
      setFullScreenshot(null);
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
      
      // Use Command+R to enter region selection mode
      if (e.metaKey && e.key === "r") {
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
    } else {
      // Enter editing mode
      setEditedProblemText(problemText);
    }
    setIsEditingProblem(!isEditingProblem);
  };
  
  // Function to start region selection
  const startRegionSelection = async () => {
    try {
      setCapturing(true);
      // Temporarily hide the assistant UI
      setVisible(false);
      
      // Capture the full screen
      const dataUrl = await captureScreen();
      setFullScreenshot(dataUrl);
      
      // Show the UI again and enter selection mode
      setVisible(true);
      setSelectingRegion(true);
      setCapturing(false);
    } catch (error) {
      logger.error("Error starting region selection:", error);
      setCapturing(false);
      setSelectingRegion(false);
      setVisible(true);
    }
  };
  
  // Function to handle mouse down in selection mode
  const handleSelectionMouseDown = (e: React.MouseEvent) => {
    if (!isSelectingRegion) return;
    
    // Get position relative to the selection overlay
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  };
  
  // Function to handle mouse move in selection mode
  const handleSelectionMouseMove = (e: React.MouseEvent) => {
    if (!isSelectingRegion || !selectionStart) return;
    
    // Get position relative to the selection overlay
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionEnd({ x, y });
    
    // Calculate the selection rectangle
    const selRect = calculateSelectionRect(selectionStart, { x, y });
    setSelectionRect(selRect);
  };
  
  // Function to handle mouse up in selection mode
  const handleSelectionMouseUp = async () => {
    if (!isSelectingRegion || !selectionStart || !selectionEnd || !selectionRect || !fullScreenshot) return;
    
    try {
      logger.log("Region selection complete, capturing region");
      // Capture the selected region
      const regionDataUrl = await captureScreenRegion(fullScreenshot, selectionRect);
      
      // Create a new screenshot entry
      const newScreenshot: Screenshot = {
        id: Date.now().toString(),
        dataUrl: regionDataUrl,
        timestamp: Date.now(),
        region: selectionRect
      };
      
      logger.log("Adding region screenshot to store");
      // Add the screenshot and exit selection mode
      addScreenshot(newScreenshot);
      
      // Ensure the state is updated before proceeding
      const storeScreenshots = useInterviewAssistantStore.getState().screenshots;
      logger.log("Region screenshot added, store now has:", storeScreenshots.length, "screenshots");
      
      // Try to extract text from the region
      try {
        const extractedText = await extractTextFromImage();
        setProblemText(extractedText);
      } catch (error) {
        logger.error("Error extracting text:", error);
      }
      
      // Reset selection state with a small delay to ensure state updates first
      setTimeout(() => {
        setSelectingRegion(false);
        // Force another check to make sure screenshots are properly loaded
        setTimeout(refreshFromStore, 100);
      }, 200);
    } catch (error) {
      logger.error("Error capturing region:", error);
      setSelectingRegion(false);
    }
  };
  
  // Function to calculate the selection rectangle
  const calculateSelectionRect = (start: { x: number; y: number }, end: { x: number; y: number }): ScreenRegion => {
    // Calculate the top-left corner and dimensions
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    return { x, y, width, height };
  };
  
  // Function to cancel region selection
  const cancelRegionSelection = () => {
    setSelectingRegion(false);
  };
  
  // Function to capture screenshot
  const captureScreenshot = async () => {
    try {
      setCapturing(true);
      
      // Use our screen capture utility
      logger.log("Trying to capture screen from InterviewAssistant");
      const dataUrl = await captureScreen();
      logger.log("Screen capture complete, checking result...");
      
      // Check if we got the fallback image (which means capture failed)
      if (dataUrl && dataUrl.includes('Screen capture unavailable')) {
        logger.error("Screen capture failed - got fallback image");
        setProblemText("Screen capture failed. Please make sure you have granted screen recording permissions to the application. On macOS, go to System Preferences > Security & Privacy > Privacy > Screen Recording and ensure this application is checked.");
        setCapturing(false);
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
        // Force another check to make sure screenshots are properly loaded
        setTimeout(refreshFromStore, 100);
      }, 200);
    } catch (error) {
      logger.error("Error capturing screenshot:", error);
      setProblemText("Screen capture failed. Please make sure you have granted screen recording permissions to the application. On macOS, go to System Preferences > Security & Privacy > Privacy > Screen Recording and ensure this application is checked.");
      setCapturing(false);
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
    
    setGenerating(true);
    
    try {
      // Use our AI service to generate a solution - pass the selected model
      const generatedSolution = await generateAiSolution(problemText, selectedLanguage, selectedModel);
      setSolution(generatedSolution);
      setGenerating(false);
    } catch (error) {
      logger.error("Error generating solution:", error);
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
  
  // Use the selected model from the OpenRouter store as the default
  useEffect(() => {
    setSelectedModel(defaultModel);
  }, [defaultModel]);
  
  // Handle model change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    // Optionally update the default model in the store
    setDefaultModel(newModel);
  };
  
  // If not visible, render nothing
  if (!isVisible) return null;
  
  // If in region selection mode, render the selection overlay
  if (isSelectingRegion && fullScreenshot) {
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
          onMouseDown={handleSelectionMouseDown}
          onMouseMove={handleSelectionMouseMove}
          onMouseUp={handleSelectionMouseUp}
        >
          <img 
            src={fullScreenshot} 
            alt="Screen Capture" 
            className="max-w-full max-h-full object-contain border border-gray-700 shadow-lg"
            draggable={false}
          />
          {selectionRect && (
            <div 
              className="absolute border-2 border-blue-500 bg-blue-400 bg-opacity-20 pointer-events-none"
              style={{
                left: `${selectionRect.x}px`,
                top: `${selectionRect.y}px`,
                width: `${selectionRect.width}px`,
                height: `${selectionRect.height}px`
              }}
            />
          )}
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
  
  // For example:
  const renderProblemText = () => {
    if (problemText && problemText.includes("Screen capture failed")) {
      return (
        <div className="flex flex-col space-y-4">
          <p className="text-red-400">{problemText}</p>
          <button
            onClick={handleRestartApp}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            Restart Application
          </button>
        </div>
      );
    }
    
    if (isEditingProblem) {
      return (
        <div className="flex flex-col space-y-2">
          <textarea
            ref={textareaRef}
            className="w-full h-48 p-2 bg-gray-900 border border-gray-700 rounded-md"
            value={editedProblemText}
            onChange={(e) => setEditedProblemText(e.target.value)}
            placeholder="Enter your problem description or code here..."
          />
          <div className="text-xs text-gray-400 italic">
            Press ⌘+E again to save your changes
          </div>
        </div>
      );
    }
    
    // If there's no problem text and no screenshot
    if (!problemText && screenshots.length === 0) {
      return (
        <div className="flex flex-col space-y-2">
          <div className="text-gray-400">
            Capture a screenshot or <button onClick={toggleProblemEditing} className="text-blue-400 hover:underline">click here</button> to enter problem text manually
          </div>
        </div>
      );
    }
    
    return (
      <div className="whitespace-pre-wrap">{problemText || "Capture a screenshot to start"}</div>
    );
  };
  
  return (
    <div
      className="fixed bg-black bg-opacity-80 text-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-700"
      style={{ 
        width: "400px", 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transition: "background-color 0.3s ease",
        backdropFilter: "blur(8px)"
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <FiMove className="cursor-move text-gray-400 hover:text-white" />
          <h3 className="font-medium">Interview Assistant</h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setVisible(false)}
            title="Hide (⌘+B)"
          >
            <FiEyeOff />
          </button>
          <button
            className={`text-gray-400 hover:text-white ${isCapturing ? "animate-pulse text-blue-400" : ""}`}
            onClick={captureScreenshot}
            disabled={isCapturing}
            title="Capture Screenshot (⌘+H)"
          >
            <FiCamera />
          </button>
          <button
            className={`text-gray-400 hover:text-white ${isSelectingRegion ? "animate-pulse text-blue-400" : ""}`}
            onClick={startRegionSelection}
            disabled={isSelectingRegion}
            title="Select Region (⌘+R)"
          >
            <FiCrop />
          </button>
          <button
            className={`text-gray-400 hover:text-white ${isGenerating ? "animate-pulse text-green-400" : ""}`}
            onClick={generateSolution}
            disabled={isGenerating || screenshots.length === 0}
            title="Generate Solution (⌘+Enter)"
          >
            <FiSend />
          </button>
          <button
            className="text-gray-400 hover:text-white"
            onClick={resetAll}
            title="Reset (⌘+G)"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>
      
      {/* Screenshots section */}
      {screenshots.length > 0 && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Screenshots ({screenshots.length})</h4>
            <button 
              className="text-xs text-gray-400 hover:text-white bg-gray-800 rounded px-2 py-1"
              onClick={() => resetAll()}
              title="Clear Screenshots"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {screenshots.map((ss, index) => (
              <div 
                key={ss.id} 
                className="relative rounded overflow-hidden border border-gray-600 shadow-md group hover:border-blue-500 transition-colors"
                style={{ height: '150px' }}
              >
                <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-xs text-white py-0.5 px-1 rounded-br">
                  #{screenshots.length - index}
                </div>
                <img 
                  src={ss.dataUrl} 
                  alt={`Screenshot ${new Date(ss.timestamp).toLocaleTimeString()}`} 
                  className="w-full h-full object-contain bg-gray-900"
                  onError={(e) => {
                    console.error("Error loading image", e);
                    (e.target as HTMLImageElement).src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
                    (e.target as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
                {ss.region && (
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-xs text-white py-0.5 px-1 rounded">
                    {Math.round(ss.region.width)} × {Math.round(ss.region.height)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-full p-1"
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
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Problem Text Section */}
      <div className="p-4 bg-gray-900 rounded-md mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">Problem Text</h3>
            <span className="text-xs text-gray-400">(⌘+E to edit)</span>
          </div>
          <button
            className="text-gray-400 hover:text-white"
            onClick={toggleProblemEditing}
            title="Edit Problem Text (⌘+E)"
          >
            <FiEdit />
          </button>
        </div>
        {renderProblemText()}
      </div>
      
      {/* Language and Model selection */}
      {screenshots.length > 0 && (
        <div className="p-3 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Language</h4>
              <select
                className="w-full bg-gray-900 text-gray-300 rounded p-1 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <div>
              <h4 className="text-sm font-medium mb-2">AI Model</h4>
              <select
                className="w-full bg-gray-900 text-gray-300 rounded p-1 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedModel}
                onChange={handleModelChange}
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Solution section */}
      {solution && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Solution</h4>
            <button 
              className="text-gray-400 hover:text-white flex items-center gap-1 text-xs p-1 rounded bg-gray-800 border border-gray-700"
              onClick={copyCodeToClipboard}
            >
              {isCopied ? (
                <>
                  <FiCheck className="text-green-400" /> Copied!
                </>
              ) : (
                <>
                  <FiCopy /> Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-900 rounded p-2 text-sm font-mono whitespace-pre overflow-x-auto border border-gray-700 max-h-60 overflow-y-auto">
            {isTyping ? typedSolution : solution.code}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>
          
          <h4 className="text-sm font-medium mt-3 mb-2">Explanation</h4>
          <div className="bg-gray-900 rounded p-2 text-sm border border-gray-700 max-h-40 overflow-y-auto">
            <p className="text-gray-300">{solution.explanation}</p>
          </div>
          
          <div className="flex justify-between mt-3">
            <div>
              <span className="text-xs text-gray-400">Time Complexity:</span>
              <span className="text-xs ml-1 text-green-400">{solution.complexity.time}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400">Space Complexity:</span>
              <span className="text-xs ml-1 text-green-400">{solution.complexity.space}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer with keyboard shortcuts */}
      <div className="p-2 bg-gray-800 text-xs text-gray-400 border-t border-gray-700">
        <div className="flex justify-between flex-wrap">
          <span>⌘+B: Toggle</span>
          <span>⌘+H: Screenshot</span>
          <span>⌘+R: Region</span>
          <span>⌘+↵: Generate</span>
          <span>⌘+E: Edit</span>
        </div>
        {/* Small debug indicator for screenshot counts */}
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Screenshots: {screenshots.length}</span>
          <span>Store: {useInterviewAssistantStore.getState().screenshots.length}</span>
          <button 
            onClick={refreshFromStore} 
            className="text-blue-500 hover:underline"
            title="Refresh from store"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewAssistant; 