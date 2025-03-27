import React, { useEffect, useMemo, useCallback } from 'react';
import { Html } from '@react-three/drei';
import BoxFrame from './BoxFrame';

// Define types for the WebFrames component
interface Frame {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  originalPosition: [number, number, number];
  originalRotation: [number, number, number];
  active?: boolean;
  hasCustomPosition?: boolean;
}

interface MediaData {
  [key: string]: unknown;
}

interface WebFramesProps {
  frames: Frame[];
  onMediaDragStart?: (mediaData: MediaData) => void;
  onCloseFrame: (frameId: string) => void;
  onRestorePosition: (frameId: string) => void;
  onUpdateFrameUrl: (frameId: string, newUrl: string) => void;
  onLoadSavedFrames?: (frames: Frame[]) => void;
}

// Define type for safeStorage
interface SafeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const WebFrames: React.FC<WebFramesProps> = ({ 
  frames = [], 
  onMediaDragStart, 
  onCloseFrame, 
  onRestorePosition, 
  onUpdateFrameUrl, 
  onLoadSavedFrames
}) => {
  // Constants for localStorage keys
  const STORAGE_KEYS = {
    FRAMES: 'webview-frames', // Use this as the single source of truth
  };

  // Create safe localStorage wrapper with useMemo to prevent recreation on each render
  const safeStorage = useMemo<SafeStorage>(() => ({
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error(`❌ Error getting ${key} from localStorage:`, error);
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`❌ Error setting ${key} in localStorage:`, error);
      }
    },
    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`❌ Error removing ${key} from localStorage:`, error);
      }
    }
  }), []);

  // Cleanup old/duplicate keys with useCallback to prevent recreation on each render
  const cleanupDuplicateKeys = useCallback((): void => {
    try {
      // Handle transition from old keys to new standardized keys
      const oldKeys = ['webFrames'];
      
      // Migrate data from old keys if needed
      oldKeys.forEach(oldKey => {
        const oldData = safeStorage.getItem(oldKey);
        if (oldData && oldData.length > 0) {
          // console.log(`🔄 Migrating data from ${oldKey} to ${STORAGE_KEYS.FRAMES}`);
          safeStorage.setItem(STORAGE_KEYS.FRAMES, oldData);
          safeStorage.removeItem(oldKey);
        }
      });
    } catch (error) {
      console.error('❌ Error during storage cleanup:', error);
    }
  }, [safeStorage, STORAGE_KEYS.FRAMES]);

  // Load saved frames from localStorage on mount
  useEffect(() => {
    try {
      // First cleanup any duplicate keys
      cleanupDuplicateKeys();
      
      // Then load from our standardized key
      const savedFrames = safeStorage.getItem(STORAGE_KEYS.FRAMES);
      
      // Only restore if we have saved frames and current frames are empty
      if (savedFrames && savedFrames.length > 0 && frames.length === 0 && onLoadSavedFrames) {
        // console.log(`📋 Loading ${savedFrames.length} saved frames from localStorage`);
        onLoadSavedFrames(JSON.parse(savedFrames));
      }
    } catch (error) {
      console.error('❌ Error loading saved frames:', error);
    }
  }, [frames.length, onLoadSavedFrames, STORAGE_KEYS.FRAMES, safeStorage, cleanupDuplicateKeys]);

  // Save frames to localStorage whenever they change
  useEffect(() => {
    if (frames.length > 0) {
      // Only save non-empty frame arrays
      safeStorage.setItem(STORAGE_KEYS.FRAMES, JSON.stringify(frames));
      
      // Update currentWebviewUrl for the active frame (if any)
      const activeFrame = frames.find(frame => frame.active);
      if (activeFrame && activeFrame.url) {
        try {
          localStorage.setItem('currentWebviewUrl', activeFrame.url);
        } catch (error) {
          console.error('❌ Error saving current webview URL:', error);
        }
      }
    } else if (frames.length === 0) {
      // If frames array is empty, cleanup related localStorage data
      safeStorage.removeItem(STORAGE_KEYS.FRAMES);
      localStorage.removeItem('currentWebviewUrl');
    }
  }, [frames, STORAGE_KEYS.FRAMES, safeStorage]);

  return (
    <>
      {frames.map((frame) => (
        <group 
          key={frame.id} 
          position={frame.position}
          rotation={frame.rotation}
        >
          <Html transform scale={0.2} position={[0, 0, 2.4]} distanceFactor={1}>
            <BoxFrame 
              url={frame.url} 
              frameId={frame.id}
              onMediaDragStart={(mediaData) => {
                if (onMediaDragStart) {
                  // Add the frame information to the media data
                  onMediaDragStart({
                    ...mediaData,
                    frameId: frame.id,
                    framePosition: frame.position,
                    frameRotation: frame.rotation
                  });
                }
              }}
              onClose={() => {
                if (onCloseFrame) {
                  onCloseFrame(frame.id);
                }
              }}
              onRestorePosition={() => {
                if (onRestorePosition) {
                  onRestorePosition(frame.id);
                }
              }}
              hasCustomPosition={frame.hasCustomPosition}
              onUrlChange={(frameId, newUrl) => {
                if (onUpdateFrameUrl) {
                  onUpdateFrameUrl(frameId, newUrl);
                } else {
                  console.warn('No method available to update frame URL');
                  // Save directly to localStorage as fallback
                  localStorage.setItem(`frame_${frameId}_url`, newUrl);
                }
              }}
            />
          </Html>
        </group>
      ))}
    </>
  );
};

export default WebFrames; 