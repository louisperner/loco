import { InventoryItem } from '../utils/inventoryUtils';
import { ImageDataType, ModelDataType, VideoDataType } from '../components/Models/types';
import * as THREE from 'three';
import { ElectronAPI } from './electron-api';

// =====================================================
// GLOBAL TYPE DECLARATIONS - MODULE AUGMENTATION
// =====================================================
// Using module augmentation to avoid conflicts when
// merging Window interface declarations
// =====================================================

// Define a type for primitive models to avoid any
interface PrimitiveModelData {
  id: string;
  isPrimitive: boolean;
  primitiveType: 'cube' | 'sphere' | 'plane';
  color?: string;
  textureUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  [key: string]: unknown;
}

// Extend the Window interface
export {};

declare global {
  // Define Window interface once
  interface Window {
    // Electron API
    electron?: ElectronAPI;
    
    // Global caches
    _modelFileCache?: Record<string, File>;
    _blobUrlCache?: Record<string, boolean>;
    _imageBlobCache?: Record<string, string>;
    _videoBlobCache?: Record<string, string>;
    
    // Scene/Camera related properties
    mainCamera?: THREE.Camera;
    addImageToScene?: (imageData: ImageDataType) => string;
    addModelToScene?: (modelData: ModelDataType) => string;
    addVideoToScene?: (videoData: VideoDataType) => string;
    addPrimitiveToScene?: (primitiveData: PrimitiveModelData) => string;
    
    // Message system
    addMessage?: (text: string, position?: [number, number, number]) => void;
  }
} 