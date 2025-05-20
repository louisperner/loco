/// <reference types="vite/client" />

interface Window {
  electron?: {
    saveModelFile: (file: File, fileName: string) => Promise<string>;
    saveImageFile: (file: File, fileName: string) => Promise<string>;
    saveVideoFile: (fileData: Uint8Array, fileName: string) => Promise<string>;
    testFileAccess: (filePath: string) => Promise<{ success: boolean; exists: any }>;
    loadFileAsBlob: (filePath: string) => Promise<{ success: boolean; blobUrl?: string; error?: string }>;
    loadImageFromAppFile: (appFilePath: string) => Promise<{ success: boolean; url: string; error?: string }>;
    loadVideoFromAppFile: (appFilePath: string) => Promise<{ success: boolean; url: string; error?: string }>;
    listVideosFromDisk: () => Promise<{ success: boolean; videos: any[]; error?: string }>;
    getScreenSources: () => Promise<any[]>;
    reloadApp: () => void;
    onGlobalShortcut: (callback: (command: string) => void) => () => void;
  };
  mainCamera?: THREE.Camera;
  addImageToScene?: (imageData: any) => string;
}

declare namespace THREE {
  interface Camera {
    position: { x: number; y: number; z: number; copy: (v: any) => void };
    rotation: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
    getWorldDirection: (target: any) => void;
  }
  
  interface Vector3 {
    x: number;
    y: number;
    z: number;
    copy: (v: any) => Vector3;
    add: (v: Vector3) => Vector3;
    applyQuaternion: (q: any) => Vector3;
    multiplyScalar: (scalar: number) => Vector3;
  }
}
