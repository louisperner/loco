import * as THREE from 'three';
import { ReactElement } from 'react';

// Reference the global Window type for use in this file
// The actual Window interface is defined in src/types/global.d.ts
// Use TypeScript's typeof window.electron to reference it when needed

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