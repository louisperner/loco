import { Screenshot } from "./InterviewAssistantTypes";
import { captureScreen, extractTextFromImage, captureScreenRegion, ScreenRegion } from "../../utils/screenCapture";
import { logger } from "./InterviewAssistantLogger";
import { useInterviewAssistantStore } from "../../store/interviewAssistantStore";

// Function to capture a full screenshot
export const captureFullScreenshot = async (
  setCapturing: (capturing: boolean) => void,
  setVisible: (visible: boolean) => void,
  addScreenshot: (screenshot: Screenshot) => void,
  setProblemText: (text: string) => void,
  isVisible: boolean
): Promise<void> => {
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

// Function to start region selection
export const startRegionCapture = async (
  setSelectingRegion: (selecting: boolean) => void,
  setVisible: (visible: boolean) => void,
  isVisible: boolean,
  addScreenshot: (screenshot: Screenshot) => void,
  setProblemText: (text: string) => void
): Promise<void> => {
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

// Function to refresh screenshots from store
export const refreshFromStore = () => {
  const storeScreenshots = useInterviewAssistantStore.getState().screenshots;
  logger.log("Manual refresh, store has", storeScreenshots.length, "screenshots");
}; 