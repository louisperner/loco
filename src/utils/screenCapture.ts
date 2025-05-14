// Define types for using the desktopCapturer API
interface DesktopCapturerSource {
  id: string;
  name: string;
  thumbnail: { toDataURL: () => string }; // More generic type without Electron namespace
  display_id: string;
  appIcon: { toDataURL: () => string } | null; // More generic type without Electron namespace
}

// Access the Electron API exposed by the preload script
interface ElectronAPI {
  getScreenSources: () => Promise<DesktopCapturerSource[]>;
  reloadApp?: () => void; // Optional method to reload the application
  // ... other Electron APIs
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// Add a logger helper
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

// Region selection type
export interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Real implementation of screen capture using Electron's desktopCapturer API
 * @returns Promise that resolves to a data URL containing the screenshot
 */
export const captureScreen = async (): Promise<string> => {
  try {
    logger.log("captureScreen called");
    
    // Check if we have access to the Electron API
    if (!window.electron) {
      logger.error("Electron API not available in window object");
      return captureScreenWithBrowserAPI();
    }
    
    if (!window.electron.getScreenSources) {
      logger.error("getScreenSources function not available in Electron API");
      return captureScreenWithBrowserAPI();
    }

    // We're going directly to screen capture, no need to request camera permission first
    
    logger.log("Requesting screen sources...");
    // Request access to screen capture sources through the preload script
    try {
      const sources = await window.electron.getScreenSources();
      logger.log("Screen sources received:", sources);
      
      if (!sources || !Array.isArray(sources) || sources.length === 0) {
        logger.error("No screen sources found, using browser API");
        return captureScreenWithBrowserAPI();
      }

      // Find the "Entire screen" source first
      // Try different possible names that could represent the entire screen
      const entireScreen = sources.find(
        source => source.name.toLowerCase() === 'entire screen' || 
                  source.name.toLowerCase() === 'all screens' || 
                  source.name.toLowerCase() === 'desktop' || 
                  source.name.toLowerCase().includes('entire') ||
                  source.name.toLowerCase().includes('screen') && source.name.toLowerCase().includes('all')
      );
      
      // If no specific "entire screen" option, try to find the largest screen source
      // This is often the source that captures all screens
      let screenSource = entireScreen;
      
      if (!screenSource && sources.length > 0) {
        logger.log("No 'entire screen' source found, trying to find the best alternative");
        // Log all sources for debugging
        sources.forEach((src, i) => {
          logger.log(`Screen source ${i}:`, src.name, `(ID: ${src.id})`);
        });
        
        // Try to find the first source that has "screen" in its name
        screenSource = sources.find(src => src.name.toLowerCase().includes('screen'));
        
        // If still not found, use the first source
        if (!screenSource) {
          logger.log("Falling back to first available source");
          screenSource = sources[0];
        }
      }
      
      if (!screenSource) {
        logger.error("Could not find any usable screen source");
        return captureScreenWithBrowserAPI();
      }
      
      logger.log("Using source:", screenSource.name, screenSource.id);
      
      // Create a video element to capture the screen content
      const video = document.createElement('video');
      video.style.cssText = 'position:absolute; top:-10000px; left:-10000px;';
      
      // Add the video element to the DOM
      document.body.appendChild(video);
      
      logger.log("Setting up media stream for screen capture...");
      try {
        // Set up a media stream for the screen
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            // @ts-ignore - Electron-specific constraints
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: screenSource.id,
            },
          } as MediaTrackConstraints,
        });
        
        logger.log("Media stream created successfully");
        
        // Connect the media stream to the video element
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          logger.log("Video metadata loaded, starting playback");
          video.play();
        };
        
        // Wait for video to start playing
        await new Promise<void>((resolve) => {
          video.onplay = () => {
            logger.log("Video started playing");
            resolve();
          };
          // Add timeout in case video never plays
          setTimeout(() => {
            logger.log("Video play timeout reached");
            resolve();
          }, 2000);
        });
        
        logger.log("Creating canvas for screenshot");
        // Create a canvas element for the screenshot
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        
        logger.log("Canvas dimensions:", canvas.width, "x", canvas.height);
        
        // Draw the video frame to the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          logger.error("Could not get canvas context");
          throw new Error('Could not get canvas context');
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        logger.log("Video frame drawn to canvas");
        
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL('image/png');
        logger.log("Canvas converted to data URL, length:", dataUrl.length);
        
        // Clean up resources
        stream.getTracks().forEach(track => {
          logger.log("Stopping track:", track.kind);
          track.stop();
        });
        document.body.removeChild(video);
        
        // Validate that we got a valid data URL
        if (!dataUrl || dataUrl.length < 100) {
          logger.error("Generated data URL is invalid, using fallback");
          return getFallbackImage();
        }
        
        logger.log("Screenshot capture successful");
        return dataUrl;
      } catch (mediaError) {
        logger.error("Media stream error with Electron API:", mediaError);
        document.body.removeChild(video);
        return captureScreenWithBrowserAPI();
      }
    } catch (sourcesError) {
      logger.error("Error getting screen sources:", sourcesError);
      return captureScreenWithBrowserAPI();
    }
  } catch (error) {
    logger.error('Error capturing screen with Electron API:', error);
    
    // Try browser API as fallback
    return captureScreenWithBrowserAPI();
  }
};

/**
 * Fallback screen capture implementation using the browser's getDisplayMedia API
 * This is used when the Electron-specific approach fails
 */
async function captureScreenWithBrowserAPI(): Promise<string> {
  logger.log("Attempting to capture screen with browser API");
  try {
    // Request access to screen capture using browser API
    // Explicitly request the monitor and preferCurrentTab:false to encourage capturing all screens
    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: { 
        cursor: "always",
        displaySurface: "monitor",
        // @ts-ignore - This is a non-standard option but helps in some browsers
        preferCurrentTab: false
      } as MediaTrackConstraints 
    });
    
    logger.log("Browser API: Media stream created successfully");
    
    // Create a video element to capture the screen content
    const video = document.createElement('video');
    video.style.cssText = 'position:absolute; top:-10000px; left:-10000px;';
    
    // Add the video element to the DOM
    document.body.appendChild(video);
    
    // Connect the media stream to the video element
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      logger.log("Browser API: Video metadata loaded, starting playback");
      video.play();
    };
    
    // Wait for video to start playing
    await new Promise<void>((resolve) => {
      video.onplay = () => {
        logger.log("Browser API: Video started playing");
        resolve();
      };
      // Add timeout in case video never plays
      setTimeout(() => {
        logger.log("Browser API: Video play timeout reached");
        resolve();
      }, 2000);
    });
    
    logger.log("Browser API: Creating canvas for screenshot");
    // Create a canvas element for the screenshot
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    logger.log("Browser API: Canvas dimensions:", canvas.width, "x", canvas.height);
    
    // Draw the video frame to the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      logger.error("Browser API: Could not get canvas context");
      throw new Error('Could not get canvas context');
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    logger.log("Browser API: Video frame drawn to canvas");
    
    // Convert the canvas to a data URL
    const dataUrl = canvas.toDataURL('image/png');
    logger.log("Browser API: Canvas converted to data URL, length:", dataUrl.length);
    
    // Clean up resources
    stream.getTracks().forEach(track => {
      logger.log("Browser API: Stopping track:", track.kind);
      track.stop();
    });
    document.body.removeChild(video);
    
    // Validate that we got a valid data URL
    if (!dataUrl || dataUrl.length < 100) {
      logger.error("Browser API: Generated data URL is invalid, using fallback");
      return getFallbackImage();
    }
    
    logger.log("Browser API: Screenshot capture successful");
    return dataUrl;
  } catch (error) {
    logger.error('Error capturing screen with browser API:', error);
    return getFallbackImage();
  }
}

/**
 * Provides a fallback image when screen capture fails
 */
function getFallbackImage(): string {
  logger.log("Generating fallback image");
  // Create a fallback canvas with text
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
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Screen capture unavailable', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '18px Arial';
    ctx.fillText('Please try again or use region selection', canvas.width / 2, canvas.height / 2 + 20);
  }
  
  return canvas.toDataURL('image/png');
}

/**
 * Capture a specific region of the screen
 * @param fullScreenDataUrl The data URL of the full screen capture
 * @param region The region to capture
 * @returns Promise that resolves to a data URL containing the region screenshot
 */
export const captureScreenRegion = async (fullScreenDataUrl: string, region: ScreenRegion): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      logger.log("Capturing screen region:", region);
      const img = new Image();
      img.onload = () => {
        logger.log("Region source image loaded, dimensions:", img.width, "x", img.height);
        
        // Check if the region coordinates go beyond image bounds
        const imageRatio = img.width / window.innerWidth;
        logger.log("Image to screen ratio:", imageRatio);
        
        // Adjust region dimensions if they're outside the image bounds
        let adjustedRegion = { ...region };
        
        // Ensure the region is within the image bounds
        if (adjustedRegion.x + adjustedRegion.width > img.width) {
          logger.log("Adjusting region width from", adjustedRegion.width, "to", img.width - adjustedRegion.x);
          adjustedRegion.width = Math.max(10, img.width - adjustedRegion.x);
        }
        
        if (adjustedRegion.y + adjustedRegion.height > img.height) {
          logger.log("Adjusting region height from", adjustedRegion.height, "to", img.height - adjustedRegion.y);
          adjustedRegion.height = Math.max(10, img.height - adjustedRegion.y);
        }
        
        // Create a canvas to crop the image
        const canvas = document.createElement('canvas');
        canvas.width = adjustedRegion.width;
        canvas.height = adjustedRegion.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          logger.error("Could not get canvas context for region capture");
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Safety check to ensure we don't try to draw outside the source image
        try {
          // Draw only the selected region to the canvas
          ctx.drawImage(
            img, 
            Math.min(adjustedRegion.x, img.width - 1),
            Math.min(adjustedRegion.y, img.height - 1),
            Math.min(adjustedRegion.width, img.width),
            Math.min(adjustedRegion.height, img.height),
            // Destination rectangle
            0, 0, adjustedRegion.width, adjustedRegion.height
          );
          
          // Convert the canvas to a data URL
          const regionDataUrl = canvas.toDataURL('image/png');
          logger.log("Region capture successful, data URL length:", regionDataUrl.length);
          resolve(regionDataUrl);
        } catch (drawError) {
          logger.error("Error drawing image region:", drawError, "Falling back to full image");
          // If region drawing fails, just return the full image
          resolve(fullScreenDataUrl);
        }
      };
      
      img.onerror = (error) => {
        logger.error("Failed to load screenshot for region capture:", error);
        reject(new Error('Failed to load screenshot for region capture'));
      };
      
      img.src = fullScreenDataUrl;
    } catch (error) {
      logger.error('Error capturing screen region:', error);
      reject(error);
    }
  });
};

/**
 * Simplified text extraction function that doesn't use tesseract.js
 * 
 * This function returns a message indicating that text extraction is disabled.
 * 
 * @returns Promise that resolves to a message about text extraction being disabled
 */
export const extractTextFromImage = async (): Promise<string> => {
  // Log for debugging purposes
  logger.log('Screenshot captured successfully. Text extraction is disabled.');
  
  // Return a placeholder message
  return "Text extraction has been disabled. To analyze this screenshot with AI, please manually enter the problem text or use the AI service directly with the image.";
}; 