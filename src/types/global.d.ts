import { InventoryItem } from '../utils/inventoryUtils';
import { ImageDataType } from '../components/Models/types';
import * as THREE from 'three';

// Global type declarations
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

export {}; 