import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import WebFrames from '../Models/WebFrames';
import Spotlight from '../ui/Spotlight';
import FPSControls from '../Scene/FPSControls';
import ImageCloneManager from '../Models/ImageCloneManager';
import MessageManager from '../Scene/MessageManager';
import { useImageStore } from '../../store/useImageStore';
import { useModelStore } from '../../store/useModelStore';
import ModelManager from '../Models/ModelManager';
import { SettingsPanel } from '@/components/Settings';
import { useThemeStore } from '../../store/ThemeStore';
import Inventory from '../Inventory/Inventory';

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

// Import game store
import {
  useGameStore,
  HotbarContext,
  EnvironmentSettings
} from '../../store/useGameStore';

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
  
  // Game store state and actions
  const uiVisible = useGameStore(state => state.uiVisible);
  const setUiVisible = useGameStore(state => state.setUiVisible);
  
  const showCatalog = useGameStore(state => state.showCatalog);
  const setShowCatalog = useGameStore(state => state.setShowCatalog);
  
  const showHelp = useGameStore(state => state.showHelp);
  
  const showSettings = useGameStore(state => state.showSettings);
  const setShowSettings = useGameStore(state => state.setShowSettings);
  
  const showInventory = useGameStore(state => state.showInventory);
  const setShowInventory = useGameStore(state => state.setShowInventory);
  
  const isSpotlightOpen = useGameStore(state => state.isSpotlightOpen);
  
  const currentMode = useGameStore(state => state.currentMode);
  const movementEnabled = useGameStore(state => state.movementEnabled);
  
  const frames = useGameStore(state => state.frames);
  
  const showPreview = useGameStore(state => state.showPreview);
  const confirmedPosition = useGameStore(state => state.confirmedPosition);
  
  const pendingWebsiteUrl = useGameStore(state => state.pendingWebsiteUrl);
  
  const activeTab = useGameStore(state => state.activeTab);
  const setActiveTab = useGameStore(state => state.setActiveTab);
  
  const isResetAnimating = useGameStore(state => state.isResetAnimating);
  const colorChanged = useGameStore(state => state.colorChanged);
  const canvasInteractive = useGameStore(state => state.canvasInteractive);
  const setCanvasInteractive = useGameStore(state => state.setCanvasInteractive);
  
  const showColorPicker = useGameStore(state => state.showColorPicker);
  const setShowColorPicker = useGameStore(state => state.setShowColorPicker);
  
  const selectedTheme = useGameStore(state => state.selectedTheme);
  
  const { crosshairSettings, visibilitySettings, gravityEnabled, groundShape, environmentSettings } = useGameStore();
  const { 
    setCrosshairSetting, 
    setVisibilitySetting, 
    setGravityEnabled, 
    setGroundShape, 
    setEnvironmentSetting 
  } = useGameStore();
  
  const selectedHotbarItem = useGameStore(state => state.selectedHotbarItem);
  const setSelectedHotbarItem = useGameStore(state => state.setSelectedHotbarItem);
  
  const { 
    handleModeChange, 
    handleToggleHelp, 
    handleCancel, 
    handlePositionConfirm, 
    handleSpotlightVisibility, 
    addFrame, 
    removeFrame, 
    restoreFramePosition, 
    updateFrameUrl, 
    setIsResetAnimating, 
    setColorChanged,
    setSelectedFrame,
    resetCrosshairAndVisibilitySettings
  } = useGameStore();

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
    setTimeout(() => {
      if (inventoryRef.current) {
        inventoryRef.current.reloadInventory();
      } else {
        console.warn('inventoryRef.current is null, cannot reload inventory');
      }
    }, 100); // Small delay to ensure component is ready
  });

  const addImage = useImageStore(state => state.addImage);

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
      setCrosshairSetting('color', colorValue);
    }
    
    setColorChanged(type);
    setTimeout(() => setColorChanged(null), 500);
  };

  const handleResetColors = (): void => {
    resetColors();
    resetCrosshairAndVisibilitySettings();
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Skip if the target is an input field
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.metaKey && e.key === 'b') {
        e.preventDefault();
        setShowCatalog(!showCatalog);
      }
      
      if (e.key === 'Tab') {
        e.preventDefault();
        setUiVisible(!uiVisible);
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
        // Acessa o estado atual diretamente da store em vez de usar o valor capturado no escopo do useEffect
        const isInventoryOpen = useGameStore.getState().showInventory;
        setShowInventory(!isInventoryOpen);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showCatalog, 
    showHelp, 
    currentMode, 
    pendingWebsiteUrl, 
    isSpotlightOpen, 
    uiVisible, 
    setShowCatalog, 
    setUiVisible, 
    setShowInventory, 
    handleCancel, 
    handleModeChange, 
    handleToggleHelp
  ]);

  return (
    <HotbarContext.Provider value={{ selectedHotbarItem, setSelectedHotbarItem }}>
      <div 
        ref={canvasContainerRef}
        className="w-screen h-screen relative"
        style={{ 
          backgroundColor: visibilitySettings.backgroundVisible ? getColorWithOpacity(backgroundColor, backgroundOpacity) : 'transparent'
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
            onCloseFrame={(frameId: string) => removeFrame(Number(frameId))}
            onRestorePosition={(frameId: string) => restoreFramePosition(Number(frameId))}
            onUpdateFrameUrl={(frameId, newUrl) => {
              updateFrameUrl(Number(frameId), newUrl);
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
            gridVisible={visibilitySettings.gridVisible} 
            floorPlaneVisible={visibilitySettings.floorPlaneVisible} 
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
            onMouseEnter={() => setCanvasInteractive(false)}
            onMouseLeave={() => {
              if (!showColorPicker) {
                setCanvasInteractive(true);
              }
            }}
          >
            <SettingsPanel 
              onToggle={(isOpen: boolean) => {
                if (!isOpen) {
                  setCanvasInteractive(true);
                  setShowColorPicker(null);
                } else {
                  setCanvasInteractive(false);
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
                crosshair: crosshairSettings.color
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
                visible: crosshairSettings.visible,
                size: crosshairSettings.size,
                thickness: crosshairSettings.thickness,
                style: crosshairSettings.style as "dot" | "cross" | "plus" | "classic"
              }}
              onCrosshairSettingChange={(setting: string, value: unknown) => {
                if (setting === 'visible') setCrosshairSetting('visible', value as boolean);
                else if (setting === 'size') setCrosshairSetting('size', value as number);
                else if (setting === 'thickness') setCrosshairSetting('thickness', value as number);
                else if (setting === 'style') setCrosshairSetting('style', value as string);
              }}
              visibilitySettings={{
                floor: visibilitySettings.floorVisible,
                grid: visibilitySettings.gridVisible,
                floorPlane: visibilitySettings.floorPlaneVisible,
                background: visibilitySettings.backgroundVisible
              }}
              onVisibilityChange={(setting: string, value: boolean) => {
                if (setting === 'floor') setVisibilitySetting('floorVisible', value);
                else if (setting === 'grid') setVisibilitySetting('gridVisible', value);
                else if (setting === 'floorPlane') setVisibilitySetting('floorPlaneVisible', value);
                else if (setting === 'background') setVisibilitySetting('backgroundVisible', value);
              }}
              gravityEnabled={gravityEnabled}
              onGravityToggle={setGravityEnabled}
              selectedTheme={selectedTheme ?? ''}
              onThemeSelect={(theme: string) => {
                useGameStore.getState().setSelectedTheme(theme);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setTheme(theme as any);
              }}
              environmentSettings={environmentSettings}
              onEnvironmentSettingChange={(setting: string, value: unknown) => 
                setEnvironmentSetting(
                  setting as keyof typeof environmentSettings, 
                  value as EnvironmentSettings[keyof EnvironmentSettings]
                )
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
            visible={crosshairSettings.visible} 
            size={crosshairSettings.size} 
            color={crosshairSettings.color} 
            thickness={crosshairSettings.thickness} 
            style={crosshairSettings.style as "circle" | "dot" | "cross" | "plus" | "classic"}
          />
        )}

        {/* Spotlight */}
        {uiVisible && (
          <Spotlight 
            onAddFrame={addFrame}
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
              
              // Always create a new model instance (clone) to add to the scene
              const { addModel } = useModelStore.getState();
              addModel({
                url: model.url,
                fileName: model.fileName,
                position: [position.x, position.y, position.z],
                rotation: [0, 0, 0],
                scale: 1,
                isInScene: true,
                // Keep track of the original inventory item ID for reference
                inventoryId: model.id
              });
              
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