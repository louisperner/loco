import * as THREE from 'three';
import { ReactElement } from 'react';

// Reference the global Window type for use in this file
// The actual Window interface is defined in src/types/global.d.ts
// Use TypeScript's typeof window.electron to reference it when needed

// Model types
export type PrimitiveType = 'cube' | 'sphere' | 'plane';
export type TextureType = 'image' | 'video';

export interface BaseModelData {
  id: string;
  url: string;
  fileName: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface PrimitiveModelData extends Omit<BaseModelData, 'url' | 'fileName'> {
  isPrimitive: true;
  primitiveType: PrimitiveType;
  color?: string;
  textureUrl?: string;
  textureType?: TextureType;
  url?: string;
  fileName?: string;
}

export interface LoadedModelData extends BaseModelData {
  isPrimitive?: false;
}

export type ModelDataType = PrimitiveModelData | LoadedModelData;

export interface ModelProps {
  url: string;
  scale: number;
}

export interface ModelFallbackProps {
  fileName: string;
  scale: number;
  errorDetails?: string;
}

export interface ModelInSceneProps {
  modelData: ModelDataType;
  onRemove: (id: string) => void;
  onUpdate: (modelData: ModelDataType) => void;
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
  alt?: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  lookAtUser?: boolean;
  invertColors?: boolean;
  removeBackground?: boolean;
  removeBorder?: boolean;
  scale?: number;
  isInScene?: boolean;
  camera?: THREE.Camera;
  [key: string]: unknown;
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

// Video types
export interface VideoDataType {
  id: string;
  src: string;
  fileName?: string;
  thumbnailUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  lookAtUser?: boolean;
  isPlaying?: boolean;
  volume?: number;
  loop?: boolean;
  isInScene?: boolean;
  [key: string]: unknown;
}

export interface VideoInSceneProps {
  videoData: VideoDataType;
  onRemove: () => void;
  onUpdate: (data: VideoDataType) => void;
  onSelect?: (data: VideoDataType & { type: string }) => void;
}

export interface VideoCloneManagerProps {
  onSelect?: (data: VideoDataType & { type: string }) => void;
}

export interface InternalVideoProps {
  src: string;
  isPlaying?: boolean;
  volume?: number;
  loop?: boolean;
  onLoad?: (video: HTMLVideoElement) => void;
  onError?: (error: ErrorEvent) => void;
}

export interface PrimitiveModelProps {
  type: PrimitiveType;
  scale: number;
  color?: string;
  texture?: THREE.Texture | THREE.VideoTexture;
}

export interface StoreImageData {
  id: string;
  fileName: string;
  thumbnailUrl?: string;
  url?: string;
}

export interface StoreVideoData {
  id: string;
  fileName: string;
  thumbnailUrl: string;
  url?: string;
}

// Code block types
export interface CodeBlockDataType {
  id: string;
  code: string;
  fileName?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isInScene?: boolean;
  noInline?: boolean;
  language?: string;
  [key: string]: unknown;
}

export interface CodeInSceneProps {
  codeData: CodeBlockDataType;
  onRemove: () => void;
  onUpdate: (data: CodeBlockDataType) => void;
  onSelect?: (data: CodeBlockDataType & { type: string }) => void;
}

export interface CodeCloneManagerProps {
  onSelect?: (data: CodeBlockDataType & { type: string }) => void;
}
