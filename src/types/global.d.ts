import { InventoryItem } from '../utils/inventoryUtils';
import { ImageDataType } from '../components/Models/types';
import * as THREE from 'three';

// =====================================================
// GLOBAL TYPE DECLARATIONS - MODULE AUGMENTATION
// =====================================================
// Using module augmentation to avoid conflicts when
// merging Window interface declarations
// =====================================================

// Extend the Window interface
export {};

declare global {
  // Define Window interface once
  interface Window {
    // Electron API
    electron?: {
      // Index signature for additional properties
      [key: string]: unknown;
      
      // File operations
      loadFileAsBlob?: (url: string) => Promise<{
        success: boolean;
        blobUrl?: string;
        error?: string;
      }>;
      saveModelFile?: (file: File, filename: string) => Promise<string>;
      saveImageFile?: (file: File, filename: string) => Promise<string>;
      saveVideoFile?: (file: File, filename: string) => Promise<string>;
      loadImageFromAppFile?: (src: string) => Promise<{ 
        success: boolean; 
        url?: string; 
        error?: string 
      }>;
      loadVideoFromAppFile?: (url: string) => Promise<{
        success: boolean;
        url?: string;
        error?: string;
      }>;
      
      // Inventory operations
      listImagesFromDisk?: () => Promise<{ 
        success: boolean; 
        images: InventoryItem[]; 
        error?: string 
      }>;
      listModelsFromDisk?: () => Promise<{ 
        success: boolean; 
        models: InventoryItem[]; 
        error?: string 
      }>;
      listVideosFromDisk?: () => Promise<{
        success: boolean;
        videos: InventoryItem[];
        error?: string
      }>;
      
      // File cleanup
      deleteFile?: (path: string) => Promise<{ 
        success: boolean; 
        error?: string 
      }>;
      cleanAllFiles: () => Promise<{ 
        success: boolean; 
        message?: string; 
        error?: string 
      }>;
    };
    
    // Global caches
    _modelFileCache?: Record<string, File>;
    _blobUrlCache?: Record<string, any>;
    _imageBlobCache?: Record<string, any>;
    _videoBlobCache?: Record<string, any>;
    
    // Other global properties
    mainCamera?: THREE.Camera;
    addImageToScene?: (imageData: ImageDataType) => string;
  }
} 