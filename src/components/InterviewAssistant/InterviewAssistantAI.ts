import { generateSolution as generateAiSolution } from "../../services/aiService";
import { useInterviewAssistantStore } from "../../store/interviewAssistantStore";
import { logger } from "./InterviewAssistantLogger";
import { Solution } from "./InterviewAssistantTypes";

// Function to generate a solution with AI
export const generateSolution = async (
  problemText: string,
  selectedLanguage: string,
  selectedModel: string,
  isCode: boolean,
  setGenerating: (generating: boolean) => void,
  setSolution: (solution: Solution | null) => void,
  ollamaEnabled: boolean,
  setOllamaModel: (model: string) => void,
  setOpenRouterModel: (model: string) => void
): Promise<void> => {
  // Get current screenshots directly from the store to ensure we have the latest state
  const currentScreenshots = useInterviewAssistantStore.getState().screenshots;
  logger.log("Generate solution called, screenshots:", currentScreenshots.length);
  
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
    const newScreenshot = {
      id: Date.now().toString(),
      dataUrl: canvas.toDataURL('image/png'),
      timestamp: Date.now()
    };
    
    useInterviewAssistantStore.getState().addScreenshot(newScreenshot);
    logger.log("Added placeholder screenshot, store now has:", 
              useInterviewAssistantStore.getState().screenshots.length, "screenshots");
  }
  
  setGenerating(true);
  
  try {
    // Update the model selection in the respective store
    if (ollamaEnabled) {
      setOllamaModel(selectedModel);
    } else {
      setOpenRouterModel(selectedModel);
    }
    
    // Call the AI service to generate a solution
    const generatedSolution = await generateAiSolution(
      problemText,
      selectedLanguage,
      selectedModel,
      isCode
    );
    
    // Update state with the generated solution
    setSolution(generatedSolution);
  } catch (error) {
    console.error("Error generating solution:", error);
    
    // Create fallback solution to display the error to the user
    const errorSolution: Solution = {
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