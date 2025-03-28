import React from 'react';

/**
 * Processes a URL to handle various protocols (file://, app-file://, blob:)
 * @param url The source URL to process
 * @returns Promise with the processed URL
 */
export const processFileUrl = async (url: string): Promise<{ 
  processedUrl: string, 
  error: Error | null 
}> => {
  try {
    // Handle different URL protocols
    if (url.startsWith('file://') || url.startsWith('app-file://')) {
      // In Electron environment
      if (window.electron && typeof window.electron.loadFileAsBlob === 'function') {
        try {
          const result = await window.electron.loadFileAsBlob(url);
          if (result.success && result.blobUrl) {
            // Cache the blob URL
            window._blobUrlCache = window._blobUrlCache || {};
            window._blobUrlCache[result.blobUrl] = result.blobUrl;
            
            return { processedUrl: result.blobUrl, error: null };
          } else {
            const error = new Error(`Failed to load file: ${result.error || 'Unknown error'}`);
            console.error('Electron API returned error:', result.error);
            return { processedUrl: '/placeholder.glb', error };
          }
        } catch (electronError) {
          const error = electronError instanceof Error 
            ? electronError 
            : new Error(`Error with Electron API: ${electronError}`);
          console.error('Error with Electron API:', electronError);
          return { processedUrl: '/placeholder.glb', error };
        }
      } else {
        // Browser environment
        const error = new Error('File system access not available in browser');
        console.warn('Electron API not available for file:// or app-file:// protocol');
        return { processedUrl: '/placeholder.glb', error };
      }
    } else if (url.startsWith('blob:')) {
      // Already a blob URL
      window._blobUrlCache = window._blobUrlCache || {};
      window._blobUrlCache[url] = url;
      return { processedUrl: url, error: null };
    } else {
      // Normal http/https URL
      return { processedUrl: url, error: null };
    }
  } catch (error) {
    console.error('Error processing URL:', error);
    return { 
      processedUrl: '/placeholder.glb', 
      error: error instanceof Error ? error : new Error('Unknown error processing URL') 
    };
  }
};

/**
 * Processes an image URL specifically for handling app-file:// protocol
 * @param src The image source URL
 * @returns Promise with the processed image URL
 */
export const processImageUrl = async (src: string): Promise<string> => {
  if (src && (src.startsWith('app-file://') || src.startsWith('file://'))) {
    try {
      if (window.electron && window.electron.loadImageFromAppFile) {
        const result = await window.electron.loadImageFromAppFile(src);
        if (result.success && result.url) {
          window._imageBlobCache = window._imageBlobCache || {};
          window._imageBlobCache[result.url] = result.url;
          return result.url;
        } else {
          console.error('Failed to load image from app-file URL:', result.error);
          return src; // Fallback to original source
        }
      } else {
        console.warn('electron.loadImageFromAppFile not available, using original src');
        return src;
      }
    } catch (error) {
      console.error('Error loading image from app-file URL:', error);
      return src;
    }
  } else if (src.startsWith('blob:')) {
    window._imageBlobCache = window._imageBlobCache || {};
    window._imageBlobCache[src] = src;
    return src;
  } else {
    return src;
  }
};

/**
 * Processes a video URL specifically for handling app-file:// protocol
 * @param src The video source URL
 * @returns Promise with the processed video URL
 */
export const processVideoUrl = async (src: string): Promise<string> => {
  if (src && (src.startsWith('app-file://') || src.startsWith('file://'))) {
    try {
      if (window.electron && window.electron.loadVideoFromAppFile) {
        const result = await window.electron.loadVideoFromAppFile(src);
        if (result.success && result.url) {
          window._videoBlobCache = window._videoBlobCache || {};
          window._videoBlobCache[result.url] = result.url;
          return result.url;
        } else {
          console.error('Failed to load video from app-file URL:', result.error);
          return src; // Fallback to original source
        }
      } else if (window.electron && window.electron.loadImageFromAppFile) {
        // Fall back to the image loader if video loader is not available
        // This might work for some video formats in Electron
        const result = await window.electron.loadImageFromAppFile(src);
        if (result.success && result.url) {
          window._videoBlobCache = window._videoBlobCache || {};
          window._videoBlobCache[result.url] = result.url;
          return result.url;
        } else {
          console.error('Failed to load video using image loader:', result.error);
          return src;
        }
      } else {
        console.warn('No suitable video loader available, using original src');
        return src;
      }
    } catch (error) {
      console.error('Error loading video from app-file URL:', error);
      return src;
    }
  } else if (src.startsWith('blob:')) {
    window._videoBlobCache = window._videoBlobCache || {};
    window._videoBlobCache[src] = src;
    return src;
  } else {
    return src;
  }
};

/**
 * Cleanly revokes a blob URL if it's no longer needed
 * @param blobUrl The blob URL to revoke
 * @param originalUrl The original URL for comparison
 */
export const revokeBlobUrl = (blobUrl: string, originalUrl: string): void => {
  if (blobUrl && blobUrl.startsWith('blob:') && blobUrl !== originalUrl) {
    try {
      // Check if this blob URL is in the cache before revoking
      const blobCache = window._blobUrlCache || {};
      const imageCache = window._imageBlobCache || {};
      const videoCache = window._videoBlobCache || {};
      
      if (!blobCache[blobUrl] && !imageCache[blobUrl] && !videoCache[blobUrl]) {
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }
};

/**
 * Creates a CSS style object for control buttons
 */
export const controlButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid white',
  borderRadius: '4px',
  color: 'white',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Creates a CSS style object for icon buttons
 */
export const iconButtonStyle: React.CSSProperties = {
  backgroundColor: '#444',
  border: 'none',
  color: 'white',
  padding: '6px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
};

/**
 * Generates a thumbnail for a video by capturing a frame
 * @param videoUrl The URL of the video to generate a thumbnail from
 * @returns Promise with the thumbnail URL (data URL)
 */
export const generateVideoThumbnail = async (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!videoUrl) {
      reject(new Error('No video URL provided'));
      return;
    }

    // Create a hidden video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // Handle CORS issues
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    
    // Create a canvas to capture the frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Listen for metadata to load
    video.addEventListener('loadedmetadata', () => {
      // Set video to a specific time (4 seconds in, or middle of video if shorter)
      video.currentTime = Math.min(4, video.duration / 2);
    });
    
    // Once we can actually get a frame
    video.addEventListener('seeked', () => {
      // Set canvas size to match video dimensions (with max dimensions)
      const maxWidth = 320;
      const width = Math.min(video.videoWidth, maxWidth);
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      canvas.width = width;
      canvas.height = width / aspectRatio;
      
      // Draw the video frame on the canvas
      ctx.drawImage(video, 0, 0, width, canvas.height);
      
      // Convert canvas to data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Clean up
        video.removeAttribute('src');
        video.load();
        
        resolve(dataUrl);
      } catch (e) {
        reject(new Error(`Failed to generate thumbnail: ${e instanceof Error ? e.message : String(e)}`));
      }
    });
    
    // Handle errors
    video.addEventListener('error', () => {
      reject(new Error(`Error loading video for thumbnail: ${video.error?.message || 'Unknown error'}`));
    });
    
    // Set the source last
    video.src = videoUrl;
  });
}; 