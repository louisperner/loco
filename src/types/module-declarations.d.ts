// Declaration file for JavaScript modules without TypeScript declarations

// Store
declare module 'src/store/CodeStore' {
  export function useCodeStore(): {
    code: string;
    updateCode: (code: string) => void;
    updateTranspiledCode: (code: string) => void;
    updateComponents: (components: any[]) => void;
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
  export const SettingsPanel: React.FC<any>;
}

declare module 'src/Scene' {
  export const Crosshair: React.FC<any>;
  export const Floor: React.FC<any>;
  export const PreviewFrame: React.FC<any>;
  export const FrameRateLimiter: React.FC<any>;
  export const CameraExposer: React.FC<any>;
}

// Player components
declare module 'src/components/Player/WebFrames' {
  const WebFrames: React.FC<any>;
  export default WebFrames;
}

declare module 'src/components/Player/Spotlight' {
  const Spotlight: React.FC<any>;
  export default Spotlight;
}

declare module 'src/components/Player/MessageManager' {
  const MessageManager: React.FC<any>;
  export default MessageManager;
}

// Hooks
declare module 'src/hooks/useFileHandling' {
  export function useFileHandling(cameraRef: any): {
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
  export const Button: React.FC<any>;
  export const Switch: React.FC<any>;
  export const Slider: React.FC<any>;
} 