import React, { useEffect } from 'react';
import { Html } from '@react-three/drei';
import BoxFrame from './BoxFrame';

// Define types for frames
interface Frame {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  active?: boolean;
  hasCustomPosition?: boolean;
}

interface MediaData {
  [key: string]: any;
}

interface WebFramesProps {
  frames?: Frame[];
  onMediaDragStart?: (mediaData: MediaData) => void;
  onCloseFrame?: (frameId: string) => void;
  onRestorePosition?: (frameId: string) => void;
  onUpdateFrameUrl?: (frameId: string, newUrl: string) => void;
  onLoadSavedFrames?: (frames: Frame[]) => void;
}

// Define safe storage interface
interface SafeStorage {
  get<T>(key: string, defaultValue?: T | null): T | null;
  set(key: string, value: any): boolean;
  remove(key: string): boolean;
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

  // Create safe localStorage wrapper
  const safeStorage: SafeStorage = {
    get<T>(key: string, defaultValue: T | null = null): T | null {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error(`❌ Error getting ${key} from localStorage:`, error);
        return defaultValue;
      }
    },
    set(key: string, value: any): boolean {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`❌ Error setting ${key} in localStorage:`, error);
        return false;
      }
    },
    remove(key: string): boolean {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error(`❌ Error removing ${key} from localStorage:`, error);
        return false;
      }
    }
  };

  // Cleanup old/duplicate keys
  const cleanupDuplicateKeys = (): void => {
    try {
      // Handle transition from old keys to new standardized keys
      const oldKeys = ['webFrames'];
      
      // Migrate data from old keys if needed
      oldKeys.forEach(oldKey => {
        const oldData = safeStorage.get<Frame[]>(oldKey);
        if (oldData && oldData.length > 0) {
          // console.log(`🔄 Migrating data from ${oldKey} to ${STORAGE_KEYS.FRAMES}`);
          safeStorage.set(STORAGE_KEYS.FRAMES, oldData);
          safeStorage.remove(oldKey);
        }
      });
    } catch (error) {
      console.error('❌ Error during storage cleanup:', error);
    }
  };

  // Load saved frames from localStorage on mount
  useEffect(() => {
    try {
      // First cleanup any duplicate keys
      cleanupDuplicateKeys();
      
      // Then load from our standardized key
      const savedFrames = safeStorage.get<Frame[]>(STORAGE_KEYS.FRAMES, []);
      
      // Only restore if we have saved frames and current frames are empty
      if (savedFrames && savedFrames.length > 0 && frames.length === 0 && onLoadSavedFrames) {
        // console.log(`📋 Loading ${savedFrames.length} saved frames from localStorage`);
        onLoadSavedFrames(savedFrames);
      }
    } catch (error) {
      console.error('❌ Error loading saved frames:', error);
    }
  }, []);

  // Save frames to localStorage whenever they change
  useEffect(() => {
    if (frames.length > 0) {
      // Only save non-empty frame arrays
      safeStorage.set(STORAGE_KEYS.FRAMES, frames);
      
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
      safeStorage.remove(STORAGE_KEYS.FRAMES);
      localStorage.removeItem('currentWebviewUrl');
    }
  }, [frames]);

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