import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import WebFrames from './WebFrames';
import Spotlight from './Spotlight';
import FPSControls from './FPSControls';
import ImageCloneManager from '../Models/ImageCloneManager';
import MessageManager from './MessageManager';
import { useImageStore } from '../../store/useImageStore';
import { useModelStore } from '../../store/useModelStore';
import ModelManager from '../Models/ModelManager';
import { SettingsPanel } from '@/components/Settings';
import { useThemeStore } from '../../store/ThemeStore';
import Inventory from '../Inventory/Inventory';

// TODO: Replace 'any' with proper types throughout this component

// Import separated components
import { 
  Crosshair, 
  Floor, 
  PreviewFrame, 
  FrameRateLimiter,
  CameraExposer 
} from '../Scene';

// Import utilities
import { 
  rgbaToString, 
} from '../../utils/colorUtils';

// Import hooks
import { useFileHandling } from '../../hooks/useFileHandling';

// Define types
export interface WebFrame {
  id: number;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  originalPosition: [number, number, number];
  originalRotation: [number, number, number];
}

export interface CrosshairSettings {
  visible: boolean;
  size: number;
  color: string;
  thickness: number;
  style: string;
}

export interface VisibilitySettings {
  floorVisible: boolean;
  gridVisible: boolean;
  floorPlaneVisible: boolean;
  backgroundVisible: boolean;
}

export interface EnvironmentSettings {
  skyVisible: boolean;
  skyDistance: number;
  skySunPosition: [number, number, number];
  skyInclination: number;
  skyAzimuth: number;
  skyTurbidity: number;
  skyRayleigh: number;
  skyOpacity: number;
  starsVisible: boolean;
  starsRadius: number;
  starsDepth: number;
  starsCount: number;
  starsFactor: number;
  starsSaturation: number;
  starsFade: boolean;
}

export interface HotbarItem {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface HotbarContextType {
  selectedHotbarItem: HotbarItem | null;
  setSelectedHotbarItem: (item: HotbarItem | null) => void;
}

// Create a context for the hotbar selection
export const HotbarContext = React.createContext<HotbarContextType>({
  selectedHotbarItem: null,
  setSelectedHotbarItem: () => {},
});

// Define Frame interface for WebFrames component
interface Frame {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  originalPosition: [number, number, number];
  originalRotation: [number, number, number];
}

// Types for inventory
interface InventoryItem {
  id: string;
  type: 'image' | 'model';
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

const Player: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.Camera>(null) as React.MutableRefObject<THREE.Camera>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const colorPickerRefs = useRef<Record<string, HTMLDivElement | null>>({}) as React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  
  // Define InventoryRefHandle interface with reloadInventory method
  interface InventoryRefHandle {
    reloadInventory: () => void;
  }
  const inventoryRef = useRef<InventoryRefHandle>(null);
  
  // UI visibility state
  const [uiVisible, setUiVisible] = useState<boolean>(true);
  
  // Hotbar state
  const [selectedHotbarItem, setSelectedHotbarItem] = useState<HotbarItem | null>(null);
  
  
  // States
  const [frames, setFrames] = useState<WebFrame[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [confirmedPosition, setConfirmedPosition] = useState<[number, number, number] | null>(null);
  const [confirmedRotation, setConfirmedRotation] = useState<[number, number, number] | null>(null);
  const [currentMode, setCurrentMode] = useState<string>('live');
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [movementEnabled, setMovementEnabled] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState<string | null>(null);
  // @ts-ignore
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('cores');
  const [isResetAnimating, setIsResetAnimating] = useState<boolean>(false);
  const [colorChanged, setColorChanged] = useState<string | null>(null);
  const [canvasInteractive, setCanvasInteractive] = useState<boolean>(true);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  // @ts-ignore
  const [mouseOverSettings, setMouseOverSettings] = useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  
  // Visibility states
  const [floorVisible, setFloorVisible] = useState<boolean>(true);
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [floorPlaneVisible, setFloorPlaneVisible] = useState<boolean>(true);
  const [backgroundVisible, setBackgroundVisible] = useState<boolean>(true);
  
  // Crosshair states
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [crosshairSize, setCrosshairSize] = useState<number>(10);
  const [crosshairColor, setCrosshairColor] = useState<string>('white');
  const [crosshairThickness, setCrosshairThickness] = useState<number>(2);
  const [crosshairStyle, setCrosshairStyle] = useState<string>('circle');
  
  // Ground states
  const [gravityEnabled, setGravityEnabled] = useState<boolean>(false);
  const [groundShape, setGroundShape] = useState<string>('circle');
  
  // Environment settings
  const [environmentSettings, setEnvironmentSettings] = useState<EnvironmentSettings>({
    skyVisible: false,
    skyDistance: 450000,
    skySunPosition: [0, 1, 0],
    skyInclination: 0,
    skyAzimuth: 0.25,
    skyTurbidity: 10,
    skyRayleigh: 2.5,
    skyOpacity: 1,
    starsVisible: true,
    starsRadius: 100,
    starsDepth: 50,
    starsCount: 5000,
    starsFactor: 4,
    starsSaturation: 0,
    starsFade: true
  });

  // Get theme store functions and states
  const { 
    gridColor, 
    backgroundColor,
    floorPlaneColor,
    gridOpacity,
    backgroundOpacity,
    floorPlaneOpacity,
    setGridColor,
    setBackgroundColor,
    setFloorPlaneColor,
    setGridOpacity,
    setBackgroundOpacity,
    setFloorPlaneOpacity,
    getColorWithOpacity,
    resetColors,
    groundSize,
    isGroundInfinite,
    setGroundSize,
    setGroundInfinite,
    setTheme,
  } = useThemeStore();

  // Get file handling functions
  const {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleModelDrop,
    handleImageDrop
  } = useFileHandling(cameraRef, () => {
    // Reload inventory when files are dropped
    // console.log('File drop callback triggered, attempting to reload inventory');
    setTimeout(() => {
      if (inventoryRef.current) {
        // console.log('Reloading inventory after file drop');
        inventoryRef.current.reloadInventory();
      } else {
        console.warn('inventoryRef.current is null, cannot reload inventory');
      }
    }, 100); // Small delay to ensure component is ready
  });

  const addImage = useImageStore(state => state.addImage);

  // Load saved settings on mount
  useEffect(() => {
    // Load frames
    const savedFrames = localStorage.getItem('webview-frames');
    if (savedFrames) {
      try {
        const parsedFrames = JSON.parse(savedFrames);
        setFrames(parsedFrames);
      } catch (error) {
        console.error('Error loading frames from localStorage:', error);
      }
    }
    
    // Load ground shape
    const savedGroundShape = localStorage.getItem('ground-shape');
    if (savedGroundShape) {
      setGroundShape(savedGroundShape);
    }
    
    // Load gravity setting
    const savedGravity = localStorage.getItem('gravity-enabled');
    if (savedGravity !== null) {
      setGravityEnabled(savedGravity === 'true');
    }
    
    // Load crosshair settings
    const savedCrosshairSettings = localStorage.getItem('crosshair-settings');
    if (savedCrosshairSettings) {
      try {
        const parsedSettings = JSON.parse(savedCrosshairSettings);
        setShowCrosshair(parsedSettings.visible);
        setCrosshairSize(parsedSettings.size);
        setCrosshairColor(parsedSettings.color);
        setCrosshairThickness(parsedSettings.thickness);
        setCrosshairStyle(parsedSettings.style);
      } catch (error) {
        console.error('Error loading crosshair settings:', error);
      }
    }
    
    // Load visibility settings
    const savedVisibility = localStorage.getItem('visibility-settings');
    if (savedVisibility) {
      try {
        const parsedVisibility = JSON.parse(savedVisibility);
        setFloorVisible(parsedVisibility.floorVisible);
        setGridVisible(parsedVisibility.gridVisible);
        setFloorPlaneVisible(parsedVisibility.floorPlaneVisible);
        setBackgroundVisible(parsedVisibility.backgroundVisible);
      } catch (error) {
        console.error('Error loading visibility settings:', error);
      }
    }
    
    // Load selected theme
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('webview-frames', JSON.stringify(frames));
  }, [frames]);

  useEffect(() => {
    localStorage.setItem('ground-shape', groundShape);
  }, [groundShape]);

  useEffect(() => {
    localStorage.setItem('gravity-enabled', gravityEnabled.toString());
  }, [gravityEnabled]);

  useEffect(() => {
    const crosshairSettings: CrosshairSettings = {
      visible: showCrosshair,
      size: crosshairSize,
      color: crosshairColor,
      thickness: crosshairThickness,
      style: crosshairStyle
    };
    localStorage.setItem('crosshair-settings', JSON.stringify(crosshairSettings));
  }, [showCrosshair, crosshairSize, crosshairColor, crosshairThickness, crosshairStyle]);

  useEffect(() => {
    const visibilitySettings: VisibilitySettings = {
      floorVisible,
      gridVisible,
      floorPlaneVisible,
      backgroundVisible
    };
    localStorage.setItem('visibility-settings', JSON.stringify(visibilitySettings));
  }, [floorVisible, gridVisible, floorPlaneVisible, backgroundVisible]);

  // Handlers with useCallback to prevent dependency changes on every render
  const handleModeChange = useCallback((mode: string): void => {
    setCurrentMode(mode);
    setMovementEnabled(mode === 'live');
    
    if (mode === 'build') {
      setShowPreview(true);
      setConfirmedPosition(null);
      setConfirmedRotation(null);
    } else {
      setShowPreview(false);
      if (pendingWebsiteUrl) {
        setPendingWebsiteUrl(null);
      }
      setConfirmedPosition(null);
      setConfirmedRotation(null);
    }
  }, [pendingWebsiteUrl]);

  const handleToggleHelp = useCallback((): void => {
    setShowHelp(!showHelp);
    setMovementEnabled(showHelp);
  }, [showHelp]);

  const handleCancel = useCallback((): void => {
    if (currentMode === 'build') {
      if (pendingWebsiteUrl) {
        setPendingWebsiteUrl(null);
        setConfirmedPosition(null);
        setConfirmedRotation(null);
      } else {
        handleModeChange('live');
      }
    }
  }, [currentMode, pendingWebsiteUrl, handleModeChange]);

  const handleAddFrame = (url: string, pos?: [number, number, number], rot?: [number, number, number]): void => {
    const position = pos || confirmedPosition;
    const rotation = rot || confirmedRotation;
    
    if (!position || !rotation) return;

    setFrames(prevFrames => [...prevFrames, {
      id: Date.now(),
      url: url,
      position: position,
      rotation: rotation,
      originalPosition: position,
      originalRotation: rotation
    }]);
    
    setConfirmedPosition(null);
    setConfirmedRotation(null);
    setShowPreview(false);
    setPendingWebsiteUrl(null);
  };

  const handleSpotlightVisibility = (isVisible: boolean): void => {
    setShowPreview(isVisible);
    setIsSpotlightOpen(isVisible);
    if (!isVisible) {
      setConfirmedPosition(null);
      setConfirmedRotation(null);
    }
  };

  const handlePositionConfirm = (position: [number, number, number], rotation: [number, number, number]): void => {
    setConfirmedPosition(position);
    setConfirmedRotation(rotation);
    
    if (pendingWebsiteUrl) {
      setTimeout(() => {
        handleAddFrame(pendingWebsiteUrl, position, rotation);
      }, 300);
    }
  };

  const handleCloseFrame = (frameId: number): void => {
    setFrames(prevFrames => prevFrames.filter(frame => frame.id !== frameId));
  };

  const handleRestoreFramePosition = (frameId: number): void => {
    setFrames(prevFrames => prevFrames.map(frame => {
      if (frame.id === frameId && frame.originalPosition && frame.originalRotation) {
        return {
          ...frame,
          position: frame.originalPosition,
          rotation: frame.originalRotation
        };
      }
      return frame;
    }));
  };

  const handleColorChange = (type: string, color: { r: number; g: number; b: number; a: number } | string): void => {
    // If color is an RgbaColor object, convert it to string
    const colorValue = typeof color === 'object' ? rgbaToString(color) : color;
    const opacity = typeof color === 'object' ? color.a : 1;
    
    if (type === 'grid') {
      setGridColor(colorValue);
      setGridOpacity(Math.round(opacity * 100));
    } else if (type === 'floorPlane') {
      setFloorPlaneColor(colorValue);
      setFloorPlaneOpacity(Math.round(opacity * 100));
    } else if (type === 'background') {
      setBackgroundColor(colorValue);
      setBackgroundOpacity(Math.round(opacity * 100));
    } else if (type === 'crosshair') {
      setCrosshairColor(colorValue);
    }
    
    setColorChanged(type);
    setTimeout(() => setColorChanged(null), 500);
  };

  const handleResetColors = (): void => {
    resetColors();
    setIsResetAnimating(true);
    setColorChanged('all');
    setTimeout(() => {
      setIsResetAnimating(false);
      setColorChanged(null);
    }, 1000);
  };

  const handleGroundSizeChange = (value: number): void => {
    setGroundSize(value);
  };

  const handleGroundInfiniteToggle = (value: boolean): void => {
    setGroundInfinite(value);
    if (value && !isGroundInfinite) {
      localStorage.setItem('previous-ground-size', groundSize.toString());
    } else if (!value && isGroundInfinite) {
      const prevSize = localStorage.getItem('previous-ground-size');
      if (prevSize) {
        setGroundSize(parseInt(prevSize));
      }
    }
  };

  const handleEnvironmentSettingChange = (setting: keyof EnvironmentSettings, value: number | boolean | string | [number, number, number]): void => {
    setEnvironmentSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Skip if the target is an input field
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.metaKey && e.key === 'b') {
        e.preventDefault();
        setShowCatalog(prev => !prev);
        setMovementEnabled(!showCatalog);
      }
      
      if (e.key === 'Tab') {
        e.preventDefault();
        setUiVisible(prev => !prev);
      }
      
      if (e.key === 'F1') {
        e.preventDefault();
        handleToggleHelp();
      }
      
      if (e.key === '1') {
        handleModeChange('live');
      }
      
      if (e.key === 'Escape') {
        handleCancel();
      }

      // Handle inventory toggle with E key
      if ((e.key === 'e' || e.key === 'E') && !pendingWebsiteUrl && !showCatalog && !isSpotlightOpen) {
        e.preventDefault();
        setShowInventory(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCatalog, showHelp, currentMode, pendingWebsiteUrl, isSpotlightOpen, handleCancel, handleModeChange, handleToggleHelp]);

  return (
    <HotbarContext.Provider value={{ selectedHotbarItem, setSelectedHotbarItem }}>
      <div 
        ref={canvasContainerRef}
        className="w-screen h-screen relative"
        style={{ 
          backgroundColor: backgroundVisible ? getColorWithOpacity(backgroundColor, backgroundOpacity) : 'transparent'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        {/* CSS for internal drag */}
        <style>
          {`
            .drop-overlay.internal-drag {
              display: none !important;
            }
          `}
        </style>
        
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            const file = files[0];
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
              handleModelDrop(file);
              // No need to reload inventory manually as it's handled by the hook callback
            } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
                      fileName.endsWith('.png') || fileName.endsWith('.webp') || 
                      fileName.endsWith('.gif')) {
              handleImageDrop(file);
              // No need to reload inventory manually as it's handled by the hook callback
            } else {
              alert(`Unsupported file type: ${fileName}\nSupported formats: GLB, GLTF, JPG, JPEG, PNG, WEBP, GIF`);
            }
            
            e.target.value = '';
          }} 
          accept=".glb,.gltf,.jpg,.jpeg,.png,.webp,.gif" 
          style={{ display: 'none' }} 
        />
        
        {isDragging && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-none border-4 border-dashed border-white/30 drop-overlay">
            <div className="bg-black/80 p-8 rounded-lg text-white text-center shadow-xl">
              <div className="text-5xl mb-4">📦</div>
              <div className="text-2xl font-bold mb-2">Drop File Here</div>
              <div className="text-sm opacity-80 mb-1">Supported 3D formats: GLB, GLTF</div>
              <div className="text-sm opacity-80">Supported image formats: JPG, PNG, WEBP, GIF</div>
            </div>
          </div>
        )}

        <Canvas 
          camera={{ position: [0, 0, 0], fov: 65 }} 
          className={`z-0 ${canvasInteractive ? '' : 'pointer-events-none'}`}
          frameloop="always"
          onPointerMissed={() => setSelectedFrame(null)}
        >
          <FrameRateLimiter />
          <ambientLight intensity={0.8} />
          <directionalLight castShadow position={[2.5, 8, 5]} intensity={1.5} shadow-mapSize={1024} />
          <FPSControls 
            speed={5} 
            enabled={movementEnabled} 
            gravityEnabled={gravityEnabled} 
            floorHeight={0} 
            initialPosition={[0, 1.7, 0]}
          />
          
          <CameraExposer cameraRef={cameraRef} />
          
          {environmentSettings.skyVisible && (
            <Sky 
              distance={environmentSettings.skyDistance} 
              sunPosition={environmentSettings.skySunPosition} 
              inclination={environmentSettings.skyInclination} 
              azimuth={environmentSettings.skyAzimuth} 
              turbidity={environmentSettings.skyTurbidity}
              rayleigh={environmentSettings.skyRayleigh}
            />
          )}
          {environmentSettings.starsVisible && (
            <Stars 
              radius={environmentSettings.starsRadius} 
              depth={environmentSettings.starsDepth} 
              count={environmentSettings.starsCount} 
              factor={environmentSettings.starsFactor} 
              saturation={environmentSettings.starsSaturation} 
              fade={environmentSettings.starsFade} 
            />
          )}
          
          <ImageCloneManager onSelect={() => {}} />
          <ModelManager onSelect={() => {}} />
          
          <WebFrames 
            frames={frames.map(frame => ({
              ...frame,
              id: frame.id.toString()
            })) as unknown as Frame[]}
            onCloseFrame={(frameId: string) => handleCloseFrame(Number(frameId))}
            onRestorePosition={(frameId: string) => handleRestoreFramePosition(Number(frameId))}
            onUpdateFrameUrl={(frameId, newUrl) => {
              setFrames(prevFrames => prevFrames.map(frame => 
                frame.id === Number(frameId) ? { ...frame, url: newUrl } : frame
              ));
            }}
          />

          {showPreview && !confirmedPosition && (
            <PreviewFrame
              isVisible={showPreview}
              onPositionConfirm={handlePositionConfirm}
              isPositionConfirmed={!!confirmedPosition}
              hasPendingWebsite={pendingWebsiteUrl !== null}
            />
          )}

          <MessageManager />
          
          <Floor 
            gridVisible={gridVisible} 
            floorPlaneVisible={floorPlaneVisible} 
            groundSize={groundSize}
            isInfinite={isGroundInfinite}
            groundShape={groundShape as "circle" | "square" | "hexagon"}
          />
        </Canvas>
        
        {/* Settings Panel */}
        {uiVisible && (
          <div 
            ref={settingsPanelRef}
            className={`settings-panel-container ${showSettings ? 'active' : ''}`}
            onMouseEnter={() => setMouseOverSettings(true)}
            onMouseLeave={() => {
              if (!showColorPicker) {
                setMouseOverSettings(false);
                setCanvasInteractive(true);
              }
            }}
          >
            <SettingsPanel 
              onToggle={(isOpen: boolean) => {
                if (!isOpen) {
                  setCanvasInteractive(true);
                  setShowColorPicker(null);
                  setMouseOverSettings(false);
                  // Reload inventory when settings panel is closed
                  if (inventoryRef.current && 'reloadInventory' in inventoryRef.current) {
                    const inventoryWithReload = inventoryRef.current as { reloadInventory: () => void };
                    inventoryWithReload.reloadInventory();
                  }
                } else {
                  setCanvasInteractive(false);
                  setMouseOverSettings(true);
                }
              }}
              isOpen={showSettings}
              onClose={() => {
                setShowSettings(false);
                // Reload inventory when settings panel is closed
                if (inventoryRef.current && 'reloadInventory' in inventoryRef.current) {
                  const inventoryWithReload = inventoryRef.current as { reloadInventory: () => void };
                  inventoryWithReload.reloadInventory();
                }
              }}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onColorChange={handleColorChange}
              onResetColors={handleResetColors}
              isResetAnimating={isResetAnimating}
              colorChanged={colorChanged}
              showColorPicker={showColorPicker}
              onColorPickerChange={setShowColorPicker}
              colorPickerRefs={colorPickerRefs}
              colors={{
                grid: gridColor,
                floorPlane: floorPlaneColor,
                background: backgroundColor,
                crosshair: crosshairColor
              }}
              opacities={{
                grid: gridOpacity,
                floorPlane: floorPlaneOpacity,
                background: backgroundOpacity
              }}
              onOpacityChange={(type: string, value: number) => {
                if (type === 'grid') setGridOpacity(value);
                else if (type === 'floorPlane') setFloorPlaneOpacity(value);
                else if (type === 'background') setBackgroundOpacity(value);
              }}
              groundSize={groundSize}
              onGroundSizeChange={handleGroundSizeChange}
              isGroundInfinite={isGroundInfinite}
              onGroundInfiniteToggle={handleGroundInfiniteToggle}
              groundShape={groundShape as "circle" | "square" | "hexagon"}
              onGroundShapeChange={setGroundShape}
              gridPattern="lines"
              onGridPatternChange={() => {}}
              crosshairSettings={{
                visible: showCrosshair,
                size: crosshairSize,
                thickness: crosshairThickness,
                style: crosshairStyle as "dot" | "cross" | "plus" | "classic"
              }}
              onCrosshairSettingChange={(setting: string, value: unknown) => {
                if (setting === 'visible') setShowCrosshair(value as boolean);
                else if (setting === 'size') setCrosshairSize(value as number);
                else if (setting === 'thickness') setCrosshairThickness(value as number);
                else if (setting === 'style') setCrosshairStyle(value as string);
              }}
              visibilitySettings={{
                floor: floorVisible,
                grid: gridVisible,
                floorPlane: floorPlaneVisible,
                background: backgroundVisible
              }}
              onVisibilityChange={(setting: string, value: boolean) => {
                if (setting === 'floor') setFloorVisible(value);
                else if (setting === 'grid') setGridVisible(value);
                else if (setting === 'floorPlane') setFloorPlaneVisible(value);
                else if (setting === 'background') setBackgroundVisible(value);
              }}
              gravityEnabled={gravityEnabled}
              onGravityToggle={setGravityEnabled}
              selectedTheme={selectedTheme ?? ''}
              onThemeSelect={(theme: string) => {
                setSelectedTheme(theme);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setTheme(theme as any);
              }}
              environmentSettings={environmentSettings}
              onEnvironmentSettingChange={(setting: string, value: unknown) => 
                handleEnvironmentSettingChange(setting as keyof EnvironmentSettings, value as number | boolean | string | [number, number, number])
              }
            />
          </div>
        )}

        {/* Mode indicator */}
        {uiVisible && currentMode === 'build' && !confirmedPosition && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center">
            <span>
              {pendingWebsiteUrl ? "Move to position the website and click to confirm" : "Select a website from the catalog or use Cmd+B to open the catalog"}
            </span>
            {pendingWebsiteUrl && (
              <button 
                onClick={handleCancel}
                className="ml-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="Cancel positioning (Esc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {uiVisible && currentMode === 'build' && confirmedPosition && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg">
            {pendingWebsiteUrl ? "Website positioned! Choose another or press 1 to return to Live mode" : "Position confirmed!"}
          </div>
        )}

        {/* Crosshair */}
        {uiVisible && (
          <Crosshair 
            visible={showCrosshair} 
            size={crosshairSize} 
            color={crosshairColor} 
            thickness={crosshairThickness} 
            style={crosshairStyle as "circle" | "dot" | "cross" | "plus" | "classic"}
          />
        )}

        {/* Spotlight */}
        {uiVisible && (
          <Spotlight 
            onAddFrame={handleAddFrame}
            onVisibilityChange={handleSpotlightVisibility}
            showInput={true}
          />
        )}

        {/* Inventory component - always rendered, visibility controlled by isOpen prop */}
        {uiVisible && (
          <Inventory 
            ref={inventoryRef}
            onSelectImage={(image: InventoryItem) => {
              // Add the selected image to the scene
              if (!image?.url) {
                setShowInventory(false);
                return;
              }
              
              // Calculate position in front of camera
              const position = new THREE.Vector3();
              
              if (cameraRef.current) {
                const camera = cameraRef.current;
                const direction = new THREE.Vector3();
                
                // Get camera position and direction
                position.copy(camera.position);
                camera.getWorldDirection(direction);
                
                // Place image at a comfortable distance in front of camera
                const distance = 3; // 3 units away
                direction.multiplyScalar(distance);
                position.add(direction);
              } else {
                // Default position if camera not available
                position.set(0, 1, -3);
              }
              
              // Check if this image is already in the store
              const existingImage = useImageStore.getState().images.find(img => img.id === image.id);
              
              if (existingImage) {
                // If it exists, update it to be visible in the scene with the new position
                addImage({
                  ...existingImage,
                  src: image.url,
                  fileName: image.fileName,
                  position: [position.x, position.y, position.z],
                  rotation: [0, 0, 0],
                  scale: 1,
                  isInScene: true
                });
              } else {
                // Add image to the store
                useImageStore.getState().addImage({
                  src: image.url,
                  fileName: image.fileName,
                  position: [position.x, position.y, position.z],
                  rotation: [0, 0, 0],
                  scale: 1,
                  isInScene: true
                });
              }
              
              // Close the inventory
              setShowInventory(false);
            }}
            onSelectModel={(model: InventoryItem) => {
              // Add the selected model to the scene
              if (!model?.url) {
                setShowInventory(false);
                return;
              }
              
              // Calculate position in front of camera
              const position = new THREE.Vector3();
              
              if (cameraRef.current) {
                const camera = cameraRef.current;
                const direction = new THREE.Vector3();
                
                // Get camera position and direction
                position.copy(camera.position);
                camera.getWorldDirection(direction);
                
                // Place model at a comfortable distance in front of camera
                direction.multiplyScalar(3);
                position.add(direction);
              } else {
                // Default position if camera not available
                position.set(0, 1, 0);
              }
              
              // Check if this model is already in the store
              const existingModel = useModelStore.getState().models.find(mdl => mdl.id === model.id);
              
              if (existingModel) {
                // If it exists, update it to be visible in the scene with the new position
                useModelStore.getState().updateModel(model.id, {
                  position: [position.x, position.y, position.z],
                  rotation: [0, 0, 0],
                  scale: 1,
                  isInScene: true
                });
              } else {
                // Add model to the store with destructured position
                const { addModel } = useModelStore.getState();
                addModel({
                  url: model.url,
                  fileName: model.fileName,
                  position: [position.x, position.y, position.z],
                  rotation: [0, 0, 0],
                  scale: 1,
                  isInScene: true
                });
              }
              
              // Close the inventory
              setShowInventory(false);
            }}
            onClose={() => setShowInventory(false)}
            isOpen={showInventory}
            onRemoveObject={(id?: string) => {
              if (id) {
                // Try to find and remove the object (could be either image or model)
                const image = useImageStore.getState().images.find(img => img.id === id);
                if (image) {
                  useImageStore.getState().updateImage(id, { isInScene: false });
                } else {
                  // Try as model
                  useModelStore.getState().updateModel(id, { isInScene: false });
                }
              }
            }}
          />
        )}
      </div>
    </HotbarContext.Provider>
  );
};

export default Player; 