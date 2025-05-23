import { ImageDataType, ModelDataType, VideoDataType } from '../components/Models/types';
import * as THREE from 'three';

// Define a type for primitive models 
interface PrimitiveModelData {
  id: string;
  isPrimitive: boolean;
  primitiveType: 'cube' | 'sphere' | 'plane';
  color?: string;
  textureUrl?: string;
  textureType?: 'image' | 'video';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  [key: string]: unknown;
}

// Type for the electron API
interface ElectronWindowAPI {
  saveModelFile: (file: File, fileName: string) => Promise<string>;
  saveImageFile: (file: File, fileName: string) => Promise<string>;
  saveVideoFile: (fileData: Uint8Array, fileName: string) => Promise<string>;
  testFileAccess: (filePath: string) => Promise<{ success: boolean; exists: boolean }>;
  loadFileAsBlob: (filePath: string) => Promise<{ success: boolean; blobUrl?: string; error?: string }>;
  loadImageFromAppFile: (appFilePath: string) => Promise<{ success: boolean; url: string; error?: string }>;
  loadVideoFromAppFile: (appFilePath: string) => Promise<{ success: boolean; url: string; error?: string }>;
  listVideosFromDisk: () => Promise<{ success: boolean; videos: unknown[]; error?: string }>;
  getScreenSources: () => Promise<unknown[]>;
  reloadApp: () => void;
  onGlobalShortcut: (callback: (command: string) => void) => () => void;
  setAlwaysOnTop: (enabled: boolean) => boolean;
  getAlwaysOnTop: () => Promise<boolean>;
  shortcuts?: {
    register: (shortcutKey: string, actionId: string) => Promise<{ success: boolean; error?: string }>;
    unregister: (shortcutKey: string) => Promise<{ success: boolean; error?: string }>;
    isRegistered: (shortcutKey: string) => Promise<{ success: boolean; isRegistered?: boolean; error?: string }>;
  };
}

// Define IPC renderer interface
interface IpcRenderer {
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
  once(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  removeAllListeners(channel: string): void;
  send(channel: string, ...args: unknown[]): void;
}

// Global window interface
declare global {
  interface Window {
    // Electron API
    electron?: ElectronWindowAPI;
    ipcRenderer?: IpcRenderer;
    
    // Global caches
    _modelFileCache?: Record<string, File>;
    _blobUrlCache?: Record<string, boolean>;
    _imageBlobCache?: Record<string, string>;
    _videoBlobCache?: Record<string, string>;
    
    // Scene/Camera related properties
    mainCamera?: THREE.Camera;
    addImageToScene?: (imageData: unknown) => string;
    addModelToScene?: (modelData: ModelDataType) => string;
    addVideoToScene?: (videoData: VideoDataType) => string;
    addPrimitiveToScene?: (primitiveData: PrimitiveModelData) => string;
    
    // Message system
    addMessage?: (text: string, position?: [number, number, number]) => void;
  }
}

export { ElectronWindowAPI, IpcRenderer }; 