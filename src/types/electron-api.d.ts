import { InventoryItem } from '../utils/inventoryUtils';

/**
 * Type definitions for Electron APIs
 */

// Define ElectronAPI interface to be used by the window.electron property
export interface ElectronAPI {
  // File operations
  loadFileAsBlob: (url: string) => Promise<{
    success: boolean;
    blobUrl?: string;
    error?: string;
  }>;
  saveModelFile: (file: File, filename: string) => Promise<string>;
  saveImageFile: (file: File, filename: string) => Promise<string>;
  saveVideoFile: (file: File, filename: string) => Promise<string>;
  loadImageFromAppFile: (src: string) => Promise<{ 
    success: boolean; 
    url?: string; 
    error?: string 
  }>;
  loadVideoFromAppFile: (url: string) => Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }>;
  
  // Inventory operations
  listImagesFromDisk: () => Promise<{ 
    success: boolean; 
    images: InventoryItem[]; 
    error?: string 
  }>;
  listModelsFromDisk: () => Promise<{ 
    success: boolean; 
    models: InventoryItem[]; 
    error?: string 
  }>;
  listVideosFromDisk: () => Promise<{
    success: boolean;
    videos: InventoryItem[];
    error?: string
  }>;
  
  // File cleanup
  deleteFile: (path: string) => Promise<{ 
    success: boolean; 
    error?: string 
  }>;
  cleanAllFiles: () => Promise<{ 
    success: boolean; 
    message?: string; 
    error?: string 
  }>;

  // Allow for additional properties
  [key: string]: unknown;
} 