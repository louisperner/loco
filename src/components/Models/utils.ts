import type { CSSProperties } from 'react';
import { ElectronAPI } from '../../types/electron-api';

// Use type assertions when accessing window.electron
// This avoids having to extend the Window interface here

// Helper function to safely access electron API
const getElectron = (): ElectronAPI | undefined => {
  return (window as { electron?: ElectronAPI }).electron;
};

// Use type assertions instead of extending Window
// This will prevent conflicts with declarations in other files

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
      const electron = getElectron();
      if (electron && typeof electron.loadFileAsBlob === 'function') {
        try {
          const result = await electron.loadFileAsBlob(url);
          if (result.success && result.blobUrl) {
            // Cache the blob URL
            window._blobUrlCache = window._blobUrlCache || {};
            window._blobUrlCache[result.blobUrl] = true;
            
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
      window._blobUrlCache[url] = true;
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
      const electron = getElectron();
      if (electron && electron.loadImageFromAppFile) {
        const result = await electron.loadImageFromAppFile(src);
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
      const electron = getElectron();
      if (electron && electron.loadVideoFromAppFile) {
        const result = await electron.loadVideoFromAppFile(src);
        if (result.success && result.url) {
          window._videoBlobCache = window._videoBlobCache || {};
          window._videoBlobCache[result.url] = result.url;
          return result.url;
        } else {
          console.error('Failed to load video from app-file URL:', result.error);
          return src; // Fallback to original source
        }
      } else if (electron && electron.loadImageFromAppFile) {
        // Fall back to the image loader if video loader is not available
        // This might work for some video formats in Electron
        const result = await electron.loadImageFromAppFile(src);
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
export const controlButtonStyle: CSSProperties = {
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
export const iconButtonStyle: CSSProperties = {
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
    
    // Check for common unsupported formats
    const lowerCaseUrl = videoUrl.toLowerCase();
    const potentiallyUnsupportedFormat = 
      !lowerCaseUrl.endsWith('.mp4') && 
      !lowerCaseUrl.endsWith('.webm') && 
      !lowerCaseUrl.endsWith('.ogg') &&
      !lowerCaseUrl.endsWith('.mov');
    
    // For blob URLs or potentially unsupported formats, we need to check formats more carefully
    if (lowerCaseUrl.startsWith('blob:') || potentiallyUnsupportedFormat) {
      // Format may not be supported natively, using fallback method
    }

    // Set a timeout for the thumbnail generation - shorter for potentially problematic formats
    const timeoutId = setTimeout(() => {
      // If we timeout, clean up and provide a fallback thumbnail
      cleanupVideo();
      // Video thumbnail generation timed out
      resolve(generateFallbackThumbnail());
    }, potentiallyUnsupportedFormat ? 2000 : 5000); // Shorter timeout for potentially unsupported formats

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
      clearTimeout(timeoutId);
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Function to clean up resources
    const cleanupVideo = () => {
      clearTimeout(timeoutId);
      video.removeAttribute('src');
      video.load();
      // Remove event listeners to prevent memory leaks
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
    };
    
    // Generate a generic fallback thumbnail
    const generateFallbackThumbnail = (): string => {
      // Create a simple SVG for video thumbnail
      const svgString = `
        <svg width="320" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="180" fill="#1A1A1A"/>
          <rect x="135" y="65" width="50" height="50" rx="25" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>
          <polygon points="145,90 145,65 170,90" fill="white"/>
          <text x="160" y="150" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Video Preview</text>
        </svg>
      `;
      return `data:image/svg+xml;base64,${btoa(svgString)}`;
    };
    
    // Listen for metadata to load
    video.onloadedmetadata = () => {
      try {
        // Check if video has valid dimensions
        if (!video.videoWidth || !video.videoHeight) {
          console.warn('Video has invalid dimensions, using fallback');
          cleanupVideo();
          resolve(generateFallbackThumbnail());
          return;
        }
        
        // Set video to a specific time (4 seconds in, or middle of video if shorter)
        video.currentTime = Math.min(4, video.duration / 2);
      } catch (err) {
        console.warn('Error setting video currentTime:', err);
        // If setting currentTime fails, try to generate thumbnail anyway
        captureFrame();
      }
    };
    
    // Function to capture a frame from the video
    const captureFrame = () => {
      try {
        // Check if video has valid dimensions before capturing
        if (!video.videoWidth || !video.videoHeight) {
          console.warn('Cannot capture frame: video has no dimensions');
          cleanupVideo();
          resolve(generateFallbackThumbnail());
          return;
        }
        
        // Set canvas size to match video dimensions (with max dimensions)
        const maxWidth = 320;
        const width = Math.min(video.videoWidth, maxWidth);
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        canvas.width = width;
        canvas.height = width / aspectRatio;
        
        // Draw the video frame on the canvas
        ctx.drawImage(video, 0, 0, width, canvas.height);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Clean up
        cleanupVideo();
        
        resolve(dataUrl);
      } catch (e) {
        console.error('Error capturing video frame:', e);
        cleanupVideo();
        resolve(generateFallbackThumbnail());
      }
    };
    
    // Once we can actually get a frame
    video.onseeked = captureFrame;
    
    // Handle errors
    video.onerror = () => {
      const errorMessage = video.error?.message || 'Unknown error';
      console.error('Video error:', errorMessage);
      
      // If we get the DEMUXER_ERROR_NO_SUPPORTED_STREAMS error, log more specific information
      if (errorMessage.includes('DEMUXER_ERROR_NO_SUPPORTED_STREAMS') || 
          errorMessage.includes('FFmpegDemuxer')) {
        console.warn('Browser cannot demux this video format. Using fallback thumbnail.');
      }
      
      cleanupVideo();
      resolve(generateFallbackThumbnail());
    };
    
    // Set the source last
    try {
      video.src = videoUrl;
      // Try to load at least the first frame
      video.load();
    } catch (err) {
      console.error('Error loading video:', err);
      cleanupVideo();
      resolve(generateFallbackThumbnail());
    }
  });
};

export const loadBlobFromUrl = async (url: string): Promise<string> => {
  if (window._blobUrlCache && window._blobUrlCache[url]) {
    return url; // Already cached with boolean flag, return original URL
  }
  
  try {
    if (url.startsWith('file://') || url.startsWith('app-file://')) {
      // In Electron environment
      const electron = getElectron();
      if (electron && typeof electron.loadFileAsBlob === 'function') {
        try {
          const result = await electron.loadFileAsBlob(url);
          if (result && result.success && result.blobUrl) {
            // Cache the blob URL
            window._blobUrlCache = window._blobUrlCache || {};
            window._blobUrlCache[url] = true;
            return result.blobUrl;
          }
          throw new Error(result?.error || 'Failed to load blob');
        } catch (error) {
          console.error('Error loading blob in Electron:', error);
          throw error;
        }
      }
    }
    
    // For regular HTTP URLs, fetch and create a blob URL
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Cache the blob URL
    window._blobUrlCache = window._blobUrlCache || {};
    window._blobUrlCache[url] = true;
    
    return blobUrl;
  } catch (error) {
    console.error('Error loading blob:', error);
    throw error;
  }
}; 