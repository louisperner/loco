import { Camera } from 'three';
import { ImageDataType } from '../components/Models/ImageCloneManager';

// Define the electron interface
interface ElectronAPI {
  loadImageFromAppFile?: (src: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  cleanAllFiles?: () => Promise<{ success: boolean; message?: string; error?: string }>;
  listImagesFromDisk?: () => Promise<{ success: boolean; images: any[]; error?: string }>;
  listModelsFromDisk?: () => Promise<{ success: boolean; models: any[]; error?: string }>;
  deleteFile?: (path: string) => Promise<{ success: boolean; error?: string }>;
  [key: string]: any;
}

// Extend the global Window interface
declare global {
  interface Window {
    electron?: ElectronAPI;
    _imageBlobCache?: Record<string, string>;
    mainCamera?: Camera;
    addImageToScene?: (imageData: ImageDataType) => string;
  }
}

export {}; 