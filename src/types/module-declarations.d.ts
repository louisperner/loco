// Declaration file for JavaScript modules without TypeScript declarations

// Store
declare module 'src/store/CodeStore' {
  export function useCodeStore(): {
    code: string;
    updateCode: (code: string) => void;
    updateTranspiledCode: (code: string) => void;
    updateComponents: (components: unknown[]) => void;
  };
}

declare module 'src/store/ThemeStore' {
  export function useThemeStore(): {
    gridColor: string;
    backgroundColor: string;
    floorPlaneColor: string;
    gridOpacity: number;
    backgroundOpacity: number;
    floorPlaneOpacity: number;
    setGridColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setFloorPlaneColor: (color: string) => void;
    setGridOpacity: (opacity: number) => void;
    setBackgroundOpacity: (opacity: number) => void;
    setFloorPlaneOpacity: (opacity: number) => void;
    getColorWithOpacity: (color: string, opacity: number) => string;
    resetColors: () => void;
    groundSize: number;
    isGroundInfinite: boolean;
    setGroundSize: (size: number) => void;
    setGroundInfinite: (infinite: boolean) => void;
    setTheme: (theme: string) => void;
  };
}

// Components
declare module 'src/Components/Settings' {
  export const SettingsPanel: React.FC<Record<string, unknown>>;
}

declare module 'src/Scene' {
  export const Crosshair: React.FC<Record<string, unknown>>;
  export const Floor: React.FC<Record<string, unknown>>;
  export const PreviewFrame: React.FC<Record<string, unknown>>;
  export const FrameRateLimiter: React.FC<Record<string, unknown>>;
  export const CameraExposer: React.FC<Record<string, unknown>>;
}

// Player components
declare module 'src/components/Player/WebFrames' {
  const WebFrames: React.FC<Record<string, unknown>>;
  export default WebFrames;
}

declare module 'src/components/Player/Spotlight' {
  const Spotlight: React.FC<Record<string, unknown>>;
  export default Spotlight;
}

declare module 'src/components/Player/MessageManager' {
  const MessageManager: React.FC<Record<string, unknown>>;
  export default MessageManager;
}

// Hooks
declare module 'src/hooks/useFileHandling' {
  import { RefObject } from 'react';
  import * as THREE from 'three';
  
  export function useFileHandling(cameraRef: RefObject<THREE.Camera>): {
    isDragging: boolean;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    handleModelDrop: (file: File) => void;
    handleImageDrop: (file: File) => void;
  };
}

// UI components
declare module 'src/ui/index' {
  interface ButtonProps {
    onClick?: () => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  
  interface SwitchProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    [key: string]: unknown;
  }
  
  interface SliderProps {
    value?: number;
    onChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    [key: string]: unknown;
  }
  
  export const Button: React.FC<ButtonProps>;
  export const Switch: React.FC<SwitchProps>;
  export const Slider: React.FC<SliderProps>;
} 