import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Bvh } from '@react-three/drei';
import * as THREE from 'three';
import FPSControls from '../Scene/FPSControls';
import ImageCloneManager from '../Models/ImageCloneManager';
import VideoCloneManager from '../Models/VideoCloneManager';
import CodeCloneManager from '../Models/CodeCloneManager';
import MessageManager from '../Scene/MessageManager';
import { useImageStore } from '../../store/useImageStore';
import { useVideoStore } from '../../store/videoStore';
import { useModelStore } from '../../store/useModelStore';
import ModelManager from '../Models/ModelManager';
import { SettingsPanel } from '@/components/Settings';
import { useThemeStore } from '../../store/ThemeStore';
import Inventory from '../Inventory/Inventory';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import WebFrames from '../Models/WebFrames';
import { Crosshair, Floor, PreviewFrame, FrameRateLimiter, CameraExposer } from '../Scene';
import Minimap, { MinimapRenderer } from '../Scene/Minimap';
import CoordinateDisplay from '../ui/CoordinateDisplay';
import { rgbaToString } from '../../utils/colorUtils';
import { useFileHandling } from '../../hooks/useFileHandling';
import { useGameStore, HotbarContext, EnvironmentSettings } from '../../store/useGameStore';
import TouchControls from '../Scene/TouchControls';
import GamepadController from './GamepadController';
// Fix for missing AuthContext - replace with your actual import if available
// import { useAuth } from '@/contexts/AuthContext';
import UserProfile from './UserProfile';
import { User as UserIcon } from 'lucide-react';

interface InventoryItem {
  id: string;
  type: 'image' | 'model' | 'video';
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

interface TouchState {
  moveJoystick: {
    active: boolean;
    currentX: number;
    currentY: number;
  };
  lookJoystick: {
    active: boolean;
    currentX: number;
    currentY: number;
  };
}

const Player: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.Camera>(null) as React.MutableRefObject<THREE.Camera>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const colorPickerRefs = useRef<Record<string, HTMLDivElement | null>>({}) as React.MutableRefObject<
    Record<string, HTMLDivElement | null>
  >;
  const movementKeys = useRef(new Set<string>()); // Ref to track pressed movement keys
  const [isMoving, setIsMoving] = useState(false); // State to control frameloop

  // Calculate position in front of camera
  const position = new THREE.Vector3();
  let rotation: [number, number, number] = [0, 0, 0];

  // Define InventoryRefHandle interface with reloadInventory method
  interface InventoryRefHandle {
    reloadInventory: () => void;
  }
  const inventoryRef = useRef<InventoryRefHandle>(null);

  // Game store state and actions
  const uiVisible = useGameStore((state) => state.uiVisible);
  const setUiVisible = useGameStore((state) => state.setUiVisible);

  const showCoordinates = useGameStore((state) => state.showCoordinates);
  const alwaysOnTop = useGameStore((state) => state.alwaysOnTop);
  const setAlwaysOnTop = useGameStore((state) => state.setAlwaysOnTop);

  const showCatalog = useGameStore((state) => state.showCatalog);
  const setShowCatalog = useGameStore((state) => state.setShowCatalog);

  const showHelp = useGameStore((state) => state.showHelp);

  const showSettings = useGameStore((state) => state.showSettings);
  const setShowSettings = useGameStore((state) => state.setShowSettings);

  const showInventory = useGameStore((state) => state.showInventory);
  const setShowInventory = useGameStore((state) => state.setShowInventory);

  const isSpotlightOpen = useGameStore((state) => state.isSpotlightOpen);

  const currentMode = useGameStore((state) => state.currentMode);
  const movementEnabled = useGameStore((state) => state.movementEnabled);

  const showPreview = useGameStore((state) => state.showPreview);
  const confirmedPosition = useGameStore((state) => state.confirmedPosition);

  const pendingWebsiteUrl = useGameStore((state) => state.pendingWebsiteUrl);

  const activeTab = useGameStore((state) => state.activeTab);
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  const isResetAnimating = useGameStore((state) => state.isResetAnimating);
  const colorChanged = useGameStore((state) => state.colorChanged);
  const canvasInteractive = useGameStore((state) => state.canvasInteractive);
  const setCanvasInteractive = useGameStore((state) => state.setCanvasInteractive);

  const showColorPicker = useGameStore((state) => state.showColorPicker);
  const setShowColorPicker = useGameStore((state) => state.setShowColorPicker);

  const selectedTheme = useGameStore((state) => state.selectedTheme);

  const { crosshairSettings, visibilitySettings, gravityEnabled, groundShape, environmentSettings } = useGameStore();
  const { setCrosshairSetting, setVisibilitySetting, setGravityEnabled, setGroundShape, setEnvironmentSetting } =
    useGameStore();

  const selectedHotbarItem = useGameStore((state) => state.selectedHotbarItem);
  const setSelectedHotbarItem = useGameStore((state) => state.setSelectedHotbarItem);

  const {
    handleModeChange,
    handleToggleHelp,
    handleCancel,
    handlePositionConfirm,
    setIsResetAnimating,
    setColorChanged,
    setSelectedFrame,
    resetCrosshairAndVisibilitySettings,
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

  const frames = useGameStore((state) => state.frames);

  // Get file handling functions
  const { isDragging, handleDragOver, handleDragLeave, handleDrop, handleModelDrop, handleImageDrop, handleVideoDrop } =
    useFileHandling(cameraRef, () => {
      // Reload inventory when files are dropped
      setTimeout(() => {
        if (inventoryRef.current) {
          inventoryRef.current.reloadInventory();
        } else {
          console.warn('inventoryRef.current is null, cannot reload inventory');
        }
      }, 100); // Small delay to ensure component is ready
    });

  const addImage = useImageStore((state) => state.addImage);

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

  // Helper function to simulate a click on the canvas to restore focus
  const simulateCanvasClick = useCallback((): void => {
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // Create and dispatch a click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        canvas.dispatchEvent(clickEvent);
      }
    }, 50); // Small delay to ensure UI updates first
  }, []);

  // Handle inventory opening and closing
  const handleInventoryToggle = useCallback(
    (isOpen: boolean): void => {
      setShowInventory(isOpen);
      setCanvasInteractive(!isOpen);

      if (isOpen && document.pointerLockElement) {
        document.exitPointerLock();
      } else if (!isOpen) {
        // When closing inventory, simulate click on canvas to regain focus
        simulateCanvasClick();
      }
    },
    [setShowInventory, setCanvasInteractive, simulateCanvasClick],
  );

  // Handle settings opening and closing
  const handleSettingsToggle = useCallback(
    (isOpen: boolean): void => {
      setShowSettings(isOpen);
      setCanvasInteractive(!isOpen);

      if (!isOpen) {
        // When closing settings, clear color picker and simulate canvas click
        setShowColorPicker(null);
        simulateCanvasClick();

        // Reload inventory when settings panel is closed
        setTimeout(() => {
          if (inventoryRef.current && 'reloadInventory' in inventoryRef.current) {
            const inventoryWithReload = inventoryRef.current as { reloadInventory: () => void };
            inventoryWithReload.reloadInventory();
          }
        }, 100);
      } else if (isOpen && document.pointerLockElement) {
        // When opening settings and pointer is locked, release it
        document.exitPointerLock();
      }
    },
    [setShowSettings, setCanvasInteractive, setShowColorPicker, simulateCanvasClick],
  );

  // Register keyboard and focus event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Skip if any UI element is focused
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Handle frameloop toggle based on movement keys
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Control'].includes(e.key)) {
        if (!movementKeys.current.has(e.key.toLowerCase())) {
          movementKeys.current.add(e.key.toLowerCase());
          if (!isMoving) {
            setIsMoving(true);
          }
        }
      }

      // Toggle UI visibility with Tab key
      if (e.key === 'Tab') {
        e.preventDefault();
        setUiVisible(!uiVisible);
      }

      // Handle escape key for various UI states
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // Handle different escape sequences based on UI state
        if (pendingWebsiteUrl) {
          handleCancel();
        } else if (showCatalog) {
          setShowCatalog(false);
        } else if (showInventory) {
          handleInventoryToggle(false);
        } else if (showHelp) {
          handleToggleHelp();
        } else if (currentMode === 'build') {
          handleModeChange('live');
        }
      }

      // Handle inventory toggle with E key
      if ((e.key === 'e' || e.key === 'E') && !pendingWebsiteUrl && !showCatalog && !isSpotlightOpen) {
        e.preventDefault();
        // Access the current state directly from the store
        const isInventoryOpen = useGameStore.getState().showInventory;
        handleInventoryToggle(!isInventoryOpen);
      }

      // Always on top shortcuts (Cmd+Up, Cmd+Down)
      if (e.metaKey && e.key === 'ArrowUp') {
        e.preventDefault();
        setAlwaysOnTop(true);
      } else if (e.metaKey && e.key === 'ArrowDown') {
        e.preventDefault();
        setAlwaysOnTop(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      // Handle frameloop toggle based on movement keys
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Control'].includes(e.key)) {
        movementKeys.current.delete(e.key.toLowerCase());
        if (movementKeys.current.size === 0 && isMoving) {
          setIsMoving(false);
        }
      }
    };

    const handleFocus = () => {
      // Force a re-render and restart the animation loop when window regains focus
      setIsMoving(true);
      // Reset back to demand mode if needed after a short delay
      setTimeout(() => {
        if (movementKeys.current.size === 0) {
          setIsMoving(false);
        }
      }, 300);
    };

    // Register event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('focus', handleFocus);

    return () => {
      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('focus', handleFocus);
    };
  }, [
    pendingWebsiteUrl,
    showCatalog,
    showInventory,
    showHelp,
    currentMode,
    isSpotlightOpen,
    uiVisible,
    isMoving,
    handleCancel,
    setShowCatalog,
    handleInventoryToggle,
    handleToggleHelp,
    handleModeChange,
    setIsMoving,
    setUiVisible,
    setAlwaysOnTop,
    movementKeys
  ]);

  // Sync alwaysOnTop state with window property
  useEffect(() => {
    // Check if we're in Electron environment
    if (window.electron && typeof window.electron.setAlwaysOnTop === 'function') {
      // Set the window's always-on-top property
      window.electron.setAlwaysOnTop(alwaysOnTop);
    }
  }, [alwaysOnTop]);

  // Initialize alwaysOnTop from window property
  useEffect(() => {
    // Check if we're in Electron environment
    if (window.electron && typeof window.electron.getAlwaysOnTop === 'function') {
      // Get current window state
      window.electron.getAlwaysOnTop().then((isAlwaysOnTop: boolean) => {
        setAlwaysOnTop(isAlwaysOnTop);
      });
    }
  }, [setAlwaysOnTop]);

  const onRemoveObject = useCallback((dataOrId?: { type: string; id: string } | string): void => {
    // If no parameter is provided, exit early
    if (!dataOrId) return;

    // Handle both formats: object with type and id, or just the id string
    let type: string | undefined;
    let id: string;

    if (typeof dataOrId === 'string') {
      // If just an ID is passed, we need to figure out what type it is
      id = dataOrId;

      // Check which store contains this ID
      const isImage = useImageStore.getState().images.some((img) => img.id === id);
      const isModel = useModelStore.getState().models.some((model) => model.id === id);
      const isVideo = useVideoStore.getState().videos.some((video) => video.id === id);

      if (isImage) type = 'image';
      else if (isModel) type = 'model';
      else if (isVideo) type = 'video';
    } else {
      // Object format with type and id
      type = dataOrId.type;
      id = dataOrId.id;
    }

    if (!id || !type) return;

    // Find and update state for image, model or video
    if (type === 'image') {
      const targetImage = useImageStore.getState().images.find((img) => img.id === id);
      if (targetImage) {
        useImageStore.getState().updateImage(id, { isInScene: false });
      }
    } else if (type === 'model') {
      const targetModel = useModelStore.getState().models.find((model) => model.id === id);
      if (targetModel) {
        useModelStore.getState().updateModel(id, { isInScene: false });
      }
    } else if (type === 'video') {
      const targetVideo = useVideoStore.getState().videos.find((video) => video.id === id);
      if (targetVideo) {
        useVideoStore.getState().updateVideo(id, { isInScene: false });
      }
    }
  }, []);

  // Listen for addObject events from FPSControls
  useEffect(() => {
    const handleAddObject = (event: CustomEvent) => {
      const { position, type, snapToFace } = event.detail;
      console.log('Game: Received addObject event', { position, type, snapToFace });
      
      // Check if a cube is selected in hotbar
      const selectedHotbarItem = useGameStore.getState().selectedHotbarItem;
      const isCubeSelected = selectedHotbarItem && 
                            ((selectedHotbarItem.url as string)?.includes('primitive://cube') || 
                             (selectedHotbarItem.fileName as string)?.toLowerCase().includes('cube'));
      
      console.log('Game: Cube selected?', isCubeSelected, selectedHotbarItem);
      
      if (isCubeSelected || type === 'cube') {
        console.log('Game: Adding cube at position', position);
        
        // ALWAYS snap cube positions to grid for consistency
        const snappedPosition: [number, number, number] = [
          Math.round(position[0]),
          Math.round(position[1]), // Allow placement below y=0
          Math.round(position[2])
        ];
        
        console.log('Game: Snapped cube position from', position, 'to', snappedPosition);
        
        // Check if the selected hotbar item is a custom cube
        const isCustomCube = selectedHotbarItem && (selectedHotbarItem as any).customCube;
        
        let cubeData;
        
        if (isCustomCube) {
          // Use the custom cube data from the hotbar item
          console.log('Game: Creating custom cube from hotbar item', selectedHotbarItem);
          cubeData = {
            url: 'primitive://cube',
            fileName: (selectedHotbarItem.fileName as string) || 'Custom Cube',
            position: snappedPosition,
            rotation: [0, 0, 0] as [number, number, number], // Always keep cubes axis-aligned
            scale: 1,
            isInScene: true,
            isPrimitive: true,
            primitiveType: 'cube' as const,
            customCube: true,
            cubeFaces: (selectedHotbarItem as any).cubeFaces,
            color: (selectedHotbarItem as any).color || '#4ade80',
            textureUrl: (selectedHotbarItem as any).textureUrl,
            textureType: (selectedHotbarItem as any).textureType,
            thumbnailUrl: selectedHotbarItem.thumbnailUrl as string,
          };
        } else {
          // Create a basic cube (fallback for when no custom cube is selected)
          const selectedImageTexture = useGameStore.getState().selectedImageTexture;
          console.log('Game: Selected texture for basic cube', selectedImageTexture);
          
          cubeData = {
            url: 'primitive://cube',
            fileName: 'cube.gltf',
            position: snappedPosition,
            rotation: [0, 0, 0] as [number, number, number], // Always keep cubes axis-aligned
            scale: 1,
            isInScene: true,
            isPrimitive: true,
            primitiveType: 'cube' as const,
            color: selectedImageTexture ? '#ffffff' : '#4ade80', // White when textured, green when not
            textureUrl: selectedImageTexture?.url || undefined,
            textureType: selectedImageTexture ? 'image' as const : undefined,
            textureName: selectedImageTexture?.fileName || undefined,
            thumbnailUrl: selectedImageTexture?.url || `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4ade80"><path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z"/></svg>')}`,
          };
        }
        
        console.log('Game: Creating cube with data', cubeData);
        
        // Add a cube primitive at the specified position
        const { addModel } = useModelStore.getState();
        addModel(cubeData);
      } else if (selectedHotbarItem) {
        // Add the selected item from hotbar
                 if (selectedHotbarItem.type === 'model') {
           const { addModel } = useModelStore.getState();
           addModel({
             url: selectedHotbarItem.url as string,
             fileName: selectedHotbarItem.fileName as string,
             position: position,
             rotation: [0, 0, 0],
             scale: 1,
             isInScene: true,
             inventoryId: selectedHotbarItem.id as string,
           });
         } else if (selectedHotbarItem.type === 'image') {
           const { addImage } = useImageStore.getState();
           addImage({
             src: selectedHotbarItem.url as string,
             fileName: selectedHotbarItem.fileName as string,
             position: position,
             rotation: [0, 0, 0],
             scale: 1,
             isInScene: true,
             inventoryId: selectedHotbarItem.id as string,
           });
         } else if (selectedHotbarItem.type === 'video') {
           const { addVideo } = useVideoStore.getState();
           addVideo({
             src: selectedHotbarItem.url as string,
             fileName: selectedHotbarItem.fileName as string,
             position: position,
             rotation: [0, 0, 0],
             scale: 3,
             isPlaying: true,
             volume: 0.5,
             loop: true,
             isInScene: true,
             inventoryId: selectedHotbarItem.id as string,
           });
         }
      }
    };

    window.addEventListener('addObject', handleAddObject as EventListener);
    
    return () => {
      window.removeEventListener('addObject', handleAddObject as EventListener);
    };
  }, []);

  // Touch controls
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [touchState, setTouchState] = useState<TouchState>({
    moveJoystick: {
      active: false,
      currentX: 0,
      currentY: 0,
    },
    lookJoystick: {
      active: false,
      currentX: 0,
      currentY: 0,
    },
  });

  return (
    <>
      <HotbarContext.Provider value={{ selectedHotbarItem, setSelectedHotbarItem }}>
        <div
          ref={canvasContainerRef}
          className='fixed inset-0 w-screen h-screen'
          style={{
            backgroundColor: visibilitySettings.backgroundVisible
              ? getColorWithOpacity(backgroundColor, backgroundOpacity)
              : 'transparent',
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
            type='file'
            ref={fileInputRef}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              const file = files[0];
              const fileName = file.name.toLowerCase();

              if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
                handleModelDrop(file);
                // No need to reload inventory manually as it's handled by the hook callback
              } else if (
                fileName.endsWith('.jpg') ||
                fileName.endsWith('.jpeg') ||
                fileName.endsWith('.png') ||
                fileName.endsWith('.webp') ||
                fileName.endsWith('.gif')
              ) {
                handleImageDrop(file);
                // No need to reload inventory manually as it's handled by the hook callback
              } else if (
                fileName.endsWith('.mp4') ||
                fileName.endsWith('.webm') ||
                fileName.endsWith('.mov') ||
                fileName.endsWith('.avi') ||
                fileName.endsWith('.mkv')
              ) {
                handleVideoDrop(file);
                // No need to reload inventory manually as it's handled by the hook callback
              } else {
                alert(
                  `Unsupported file type: ${fileName}\nSupported formats: GLB, GLTF, JPG, JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV, AVI, MKV`,
                );
              }

              e.target.value = '';
            }}
            accept='.glb,.gltf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.avi,.mkv'
            style={{ display: 'none' }}
          />

          {isDragging && (
            <div className='absolute inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-none border-4 border-dashed border-white/30 drop-overlay'>
              <div className='bg-black/80 p-8 rounded-lg text-white text-center shadow-xl'>
                <div className='text-5xl mb-4'>📦</div>
                <div className='text-2xl font-bold mb-2'>Drop File Here</div>
                <div className='text-sm opacity-80 mb-1'>Supported 3D formats: GLB, GLTF</div>
                <div className='text-sm opacity-80'>Supported image formats: JPG, PNG, WEBP, GIF</div>
              </div>
            </div>
          )}

          <Canvas
            camera={{ position: [0, 0, 0], fov: 65 }}
            className={`z-0 ${canvasInteractive ? '' : 'pointer-events-none'}`}
            frameloop={isMoving ? 'always' : 'demand'} // Conditional frameloop
            onPointerMissed={() => setSelectedFrame(null)}
            gl={{
              // Preserve the WebGL context to prevent it from being killed
              // when there are too many WebGL instances
              powerPreference: 'high-performance',
              preserveDrawingBuffer: true,
              // Keep the priority high for this WebGL context
              antialias: true,
              // Attempt to make this context more important than others
              failIfMajorPerformanceCaveat: false,
            }}
          >
            {/* <Sparkles count={10000} size={1} position={[0, 0.9, 0]} scale={100} speed={0.3} /> */}

            {/* <directionalLight 
              position={[10, 10, 5]} 
              intensity={Math.PI * 2} 
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight 
              position={[-5, 5, -2]} 
              intensity={Math.PI} 
              color="#8088ff"
            /> */}

            <hemisphereLight args={['#ffffff', '#8888ff', 0.7]} position={[0, 10, 0]} />

            <FrameRateLimiter />
            <ambientLight intensity={0.8} />
            <directionalLight castShadow position={[2.5, 8, 5]} intensity={1.5} shadow-mapSize={1024} />

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

            <Bvh>
              <FPSControls
                speed={5}
                enabled={movementEnabled}
                gravityEnabled={gravityEnabled}
                floorHeight={0}
                initialPosition={[0, 1.7, 0]}
                onTouchStateChange={setTouchState}
                onMobileChange={setIsMobile}
                touchState={touchState}
              />

              <CameraExposer cameraRef={cameraRef} />
              <ImageCloneManager onSelect={() => {}} />
              <VideoCloneManager onSelect={() => {}} />
              <ModelManager onSelect={() => {}} />
              <CodeCloneManager onSelect={() => {}} />

              {/* WebFrames component is currently not in use */}
              <WebFrames frames={frames} onMediaDragStart={() => {}} onCloseFrame={() => {}} onRestorePosition={() => {}} onUpdateFrameUrl={() => {}} onLoadSavedFrames={() => {}} />

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
                groundShape={groundShape as 'circle' | 'square' | 'hexagon'}
              />
              
              {/* Minimap renderer - only renders to the shared canvas */}
              {visibilitySettings.minimapVisible && <MinimapRenderer />}
            </Bvh>

            <EffectComposer>
              {/* <DepthOfField focusDistance={-50} focalLength={0.02} bokehScale={2} height={480} /> */}
              <Bloom luminanceThreshold={0.1} luminanceSmoothing={7} height={300} />
              {/* <Noise opacity={0.02} /> */}
              {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}
            </EffectComposer>

            {/* <GizmoHelper alignment='top-right' margin={[80, 80]}>
              <GizmoViewport labelColor='white' />
            </GizmoHelper> */}
          </Canvas>

          {/* Touch Controls outside Canvas */}
          <TouchControls
            enabled={movementEnabled}
            isMobile={isMobile}
            touchState={touchState}
            onTouchStateChange={setTouchState}
          />

          {/* Gamepad Controller */}
          <GamepadController />

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
                onToggle={(isOpen: boolean) => handleSettingsToggle(!isOpen)}
                isOpen={showSettings}
                onClose={() => handleSettingsToggle(false)}
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
                  crosshair: crosshairSettings.color,
                }}
                opacities={{
                  grid: gridOpacity,
                  floorPlane: floorPlaneOpacity,
                  background: backgroundOpacity,
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
                groundShape={groundShape as 'circle' | 'square' | 'hexagon'}
                onGroundShapeChange={setGroundShape}
                gridPattern='lines'
                onGridPatternChange={() => {}}
                crosshairSettings={{
                  visible: crosshairSettings.visible,
                  size: crosshairSettings.size,
                  thickness: crosshairSettings.thickness,
                  style: crosshairSettings.style as 'dot' | 'cross' | 'plus' | 'classic',
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
                  background: visibilitySettings.backgroundVisible,
                  minimap: visibilitySettings.minimapVisible,
                }}
                onVisibilityChange={(setting: string, value: boolean) => {
                  if (setting === 'floor') setVisibilitySetting('floorVisible', value);
                  else if (setting === 'grid') setVisibilitySetting('gridVisible', value);
                  else if (setting === 'floorPlane') setVisibilitySetting('floorPlaneVisible', value);
                  else if (setting === 'background') setVisibilitySetting('backgroundVisible', value);
                  else if (setting === 'minimap') setVisibilitySetting('minimapVisible', value);
                }}
                gravityEnabled={gravityEnabled}
                onGravityToggle={setGravityEnabled}
                selectedTheme={selectedTheme ?? ''}
                onThemeSelect={(theme: string) => {
                  useGameStore.getState().setSelectedTheme(theme);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setTheme(theme as any);
                }}
                showCoordinates={showCoordinates}
                onCoordinatesToggle={useGameStore.getState().setShowCoordinates}
                alwaysOnTop={alwaysOnTop}
                onAlwaysOnTopToggle={useGameStore.getState().setAlwaysOnTop}
                environmentSettings={environmentSettings}
                onEnvironmentSettingChange={(setting: string, value: unknown) =>
                  setEnvironmentSetting(
                    setting as keyof typeof environmentSettings,
                    value as EnvironmentSettings[keyof EnvironmentSettings],
                  )
                }
              />
            </div>
          )}

          {/* Mode indicator */}
          {uiVisible && currentMode === 'build' && !confirmedPosition && (
            <div className='fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center'>
              <span>
                {pendingWebsiteUrl
                  ? 'Move to position the website and click to confirm'
                  : 'Select a website from the catalog or use Cmd+B to open the catalog'}
              </span>
              {pendingWebsiteUrl && (
                <button
                  onClick={handleCancel}
                  className='ml-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1'
                  title='Cancel positioning (Esc)'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Crosshair */}
          {uiVisible && (
            <Crosshair
              visible={crosshairSettings.visible}
              size={crosshairSettings.size}
              color={crosshairSettings.color}
              thickness={crosshairSettings.thickness}
              style={crosshairSettings.style as 'circle' | 'dot' | 'cross' | 'plus' | 'classic'}
            />
          )}

          {/* Inventory component - always rendered, visibility controlled by isOpen prop */}
          {uiVisible && (
            <Inventory
              ref={inventoryRef}
              onSelectImage={(image: InventoryItem) => {
                // Add the selected image to the scene
                if (!image?.url) {
                  handleInventoryToggle(false);
                  return;
                }

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
                  rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
                } else {
                  // Default position if camera not available
                  position.set(0, 1, -3);
                  rotation = [0, 0, 0];
                }

                // Check if this image is already in the store
                const existingImage = useImageStore.getState().images.find((img) => img.id === image.id);

                if (existingImage) {
                  // If it exists, update it to be visible in the scene with the new position
                  addImage({
                    ...existingImage,
                    src: image.url,
                    fileName: image.fileName,
                    position: [position.x, position.y, position.z],
                    rotation,
                    scale: 1,
                    isInScene: true,
                  });
                } else {
                  // Add image to the store
                  useImageStore.getState().addImage({
                    src: image.url,
                    fileName: image.fileName,
                    position: [position.x, position.y, position.z],
                    rotation,
                    scale: 1,
                    isInScene: true,
                  });
                }

                // Close the inventory
                handleInventoryToggle(false);
              }}
              onSelectModel={(model: InventoryItem) => {
                // Add the selected model to the scene
                if (!model?.url) {
                  handleInventoryToggle(false);
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
                  rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
                } else {
                  // Default position if camera not available
                  position.set(0, 1, 0);
                  rotation = [0, 0, 0];
                }

                // Always create a new model instance (clone) to add to the scene
                const { addModel } = useModelStore.getState();
                
                // For cube primitives, remove rotations to keep them axis-aligned
                const isCubePrimitive = model.url?.includes('primitive://cube') || 
                                       model.fileName?.toLowerCase().includes('cube');
                const finalRotation = isCubePrimitive ? [0, 0, 0] as [number, number, number] : rotation;
                
                // Preserve all custom cube properties when cloning
                const newModelData: any = {
                  url: model.url,
                  fileName: model.fileName,
                  position: [position.x, position.y, position.z] as [number, number, number],
                  rotation: finalRotation,
                  scale: 1,
                  isInScene: true,
                  // Keep track of the original inventory item ID for reference
                  inventoryId: model.id,
                };
                
                // Preserve custom cube properties
                if (model.customCube) {
                  newModelData.customCube = model.customCube;
                  newModelData.cubeFaces = model.cubeFaces;
                  newModelData.isPrimitive = model.isPrimitive;
                  newModelData.primitiveType = model.primitiveType;
                  newModelData.color = model.color;
                  newModelData.textureUrl = model.textureUrl;
                  newModelData.textureType = model.textureType;
                  newModelData.textureName = model.textureName;
                }
                // Preserve other primitive properties for regular cubes
                else if (model.isPrimitive && !model.customCube) {
                  newModelData.isPrimitive = model.isPrimitive;
                  newModelData.primitiveType = model.primitiveType;
                  newModelData.color = model.color;
                  newModelData.textureUrl = model.textureUrl;
                  newModelData.textureType = model.textureType;
                }
                
                addModel(newModelData);

                // Close the inventory
                handleInventoryToggle(false);
              }}
              onSelectVideo={(video: InventoryItem) => {
                // Add the selected video to the scene
                if (!video?.url) {
                  handleInventoryToggle(false);
                  return;
                }
                // Calculate position in front of camera
                const position = new THREE.Vector3();
                let rotation: [number, number, number] = [0, 0, 0];

                if (cameraRef.current) {
                  const camera = cameraRef.current;
                  const direction = new THREE.Vector3();

                  // Get camera position and direction
                  position.copy(camera.position);
                  camera.getWorldDirection(direction);

                  // Place video at a comfortable distance in front of camera
                  const distance = 3; // 3 units away
                  direction.multiplyScalar(distance);
                  position.add(direction);
                  rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
                } else {
                  // Default position if camera not available
                  position.set(0, 1, -3);
                  rotation = [0, 0, 0];
                }

                // Always create a new video instance when adding from hotbar
                useVideoStore.getState().addVideo({
                  src: video.url,
                  fileName: video.fileName,
                  position: [position.x, position.y, position.z],
                  rotation,
                  scale: (video.scale as number) || 3,
                  isPlaying: (video.isPlaying as boolean) || true,
                  volume: (video.volume as number) || 0.5,
                  loop: (video.loop as boolean) || true,
                  isInScene: true,
                });

                // Close the inventory
                handleInventoryToggle(false);
              }}
              onClose={() => handleInventoryToggle(false)}
              isOpen={showInventory}
              onRemoveObject={onRemoveObject}
            />
          )}

          {/* Coordinate Display */}
          {uiVisible && showCoordinates && <CoordinateDisplay cameraRef={cameraRef} />}

          {/* Minimap */}
          {uiVisible && visibilitySettings.minimapVisible && <Minimap size={280} opacity={0.9} scale={25} />}

          {/* FrameLoop Indicator */}
          <div
            className={`absolute bottom-4 right-4 w-3 h-3 rounded-full ${isMoving ? 'bg-green-500' : 'bg-orange-500'}`}
            title={`FrameLoop: ${isMoving ? 'Always' : 'Demand'}`}
          />
        </div>
      </HotbarContext.Provider>
    </>
  );
};

export default Player;
