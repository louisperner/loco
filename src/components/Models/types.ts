import { ReactElement } from 'react';
import * as THREE from 'three';
import { InventoryItem } from '../../utils/inventoryUtils';

// Model types
export interface ModelDataType {
  id: string;
  url: string;
  fileName?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isInScene?: boolean;
  [key: string]: unknown; // For any additional properties
}

export interface ModelProps {
  url: string;
  scale: number;
}

export interface ModelFallbackProps {
  fileName?: string;
  scale: number;
  errorDetails?: string;
}

export interface ModelInSceneProps {
  modelData: ModelDataType;
  onRemove: (id: string) => void;
  onUpdate: (data: ModelDataType) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export interface ModelErrorBoundaryProps {
  children: React.ReactNode;
  fallback: ReactElement<ModelFallbackProps>;
}

export interface ModelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ModelManagerProps {
  onSelect?: (model: ModelDataType & { type: string }) => void;
}

export interface RemoveObjectEvent extends CustomEvent {
  detail: {
    type: string;
    id: string;
  };
}

// Image types
export interface ImageDataType {
  id: string;
  src: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  lookAtUser?: boolean;
  invertColors?: boolean;
  removeBackground?: boolean;
  removeBorder?: boolean;
  scale?: number;
  alt?: string;
  isInScene?: boolean;
  fileName?: string;
  type?: string;
  aspectRatio?: number;
  thumbnailUrl?: string;
}

export interface ImageInSceneProps {
  imageData: ImageDataType;
  onRemove: () => void;
  onUpdate: (data: ImageDataType) => void;
  onSelect?: (data: ImageDataType & { type: string }) => void;
}

export interface ImageCloneManagerProps {
  onSelect?: (data: ImageDataType & { type: string }) => void;
}

export interface InternalImageProps {
  src: string;
  onLoad?: (texture: THREE.Texture) => void;
  onError?: (error: ErrorEvent) => void;
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

// Add Electron API type declaration
declare global {
  interface Window {
    electron?: {
      loadFileAsBlob: (url: string) => Promise<{
        success: boolean;
        blobUrl?: string;
        error?: string;
      }>;
      listImagesFromDisk?: () => Promise<{ success: boolean; images: InventoryItem[]; error?: string }>;
      listModelsFromDisk?: () => Promise<{ success: boolean; models: InventoryItem[]; error?: string }>;
      deleteFile?: (path: string) => Promise<{ success: boolean; error?: string }>;
      cleanAllFiles: () => Promise<{ success: boolean; message?: string; error?: string }>;
      loadImageFromAppFile?: (src: string) => Promise<{ success: boolean; url?: string; error?: string }>;
    };
    _blobUrlCache?: Record<string, string>;
    _imageBlobCache?: Record<string, string>;
    mainCamera?: THREE.Camera;
    addImageToScene?: (imageData: ImageDataType) => string;
  }
} 