import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useCodeStore } from '../../store/CodeStore';
import WebFrames from './WebFrames';
import Spotlight from './Spotlight';
import FPSControls from './FPSControls';
import ImageCloneManager from '../models/ImageCloneManager';
import MessageManager from './MessageManager';
import { useImageStore } from '../../store/useImageStore';
import { useModelStore } from '../../store/useModelStore';
import ModelManager from '../models/ModelManager';
import { Button, Switch, Slider } from '../ui/index';
import { SettingsPanel } from '@/components/settings';
import { useThemeStore } from '../../store/ThemeStore';
import Inventory from '../inventory';

// Import separated components
import { 
  Crosshair, 
  Floor, 
  PreviewFrame, 
  FrameRateLimiter,
  CameraExposer 
} from '../scene';

// Import utilities
import { 
  hexToRgba, 
  rgbaToString, 
  stringToRgba, 
  getButtonColorStyle 
} from '../../utils/colorUtils';

// Import hooks
import { useFileHandling } from '../../hooks/useFileHandling';

// Create a context for the hotbar selection
export const HotbarContext = React.createContext({
  selectedHotbarItem: null,
  setSelectedHotbarItem: () => {},
});

const Player = () => {
  const iframeRef = useRef();
  const canvasContainerRef = useRef();
  const cameraRef = useRef();
  const fileInputRef = useRef();
  const settingsPanelRef = useRef(null);
  const colorPickerRefs = useRef({});
  const inventoryRef = useRef(null);
  
  // UI visibility state
  const [uiVisible, setUiVisible] = useState(true);
  
  // Hotbar state
  const [selectedHotbarItem, setSelectedHotbarItem] = useState(null);
  
  // Code Store
  const { updateCode, updateTranspiledCode, updateComponents } = useCodeStore();
  const { code } = useCodeStore();
  
  // States
  const [frames, setFrames] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmedPosition, setConfirmedPosition] = useState(null);
  const [confirmedRotation, setConfirmedRotation] = useState(null);
  const [finalCode, setFinalCode] = useState(`function Application() {
    return (
      <div>
        <h1>Teste 1</h1>
      </div>
    );
  }
  render(<Application />);`);
  
  const [currentMode, setCurrentMode] = useState('live');
  const [showCatalog, setShowCatalog] = useState(false);
  const [movementEnabled, setMovementEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState(null);
  const [showFrameControls, setShowFrameControls] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [activeTab, setActiveTab] = useState('cores');
  const [isResetAnimating, setIsResetAnimating] = useState(false);
  const [colorChanged, setColorChanged] = useState(null);
  const [canvasInteractive, setCanvasInteractive] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [mouseOverSettings, setMouseOverSettings] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  
  // Visibility states
  const [floorVisible, setFloorVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [floorPlaneVisible, setFloorPlaneVisible] = useState(true);
  const [backgroundVisible, setBackgroundVisible] = useState(true);
  
  // Crosshair states
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [crosshairSize, setCrosshairSize] = useState(10);
  const [crosshairColor, setCrosshairColor] = useState('white');
  const [crosshairThickness, setCrosshairThickness] = useState(2);
  const [crosshairStyle, setCrosshairStyle] = useState('circle');
  
  // Ground states
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [groundShape, setGroundShape] = useState('circle');
  
  // Environment settings
  const [environmentSettings, setEnvironmentSettings] = useState({
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
  } = useFileHandling(cameraRef);

  const { images, removeImage } = useImageStore();
  const { models, removeModel } = useModelStore();
  const [selectedObject, setSelectedObject] = useState(null);
  const addImage = useImageStore(state => state.addImage);

  // Effects
  useEffect(() => {
    if (code !== '') {
      setFinalCode(`${code} render(<Application />);`);
    }
  }, [code]);

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
    const crosshairSettings = {
      visible: showCrosshair,
      size: crosshairSize,
      color: crosshairColor,
      thickness: crosshairThickness,
      style: crosshairStyle
    };
    localStorage.setItem('crosshair-settings', JSON.stringify(crosshairSettings));
  }, [showCrosshair, crosshairSize, crosshairColor, crosshairThickness, crosshairStyle]);

  useEffect(() => {
    const visibilitySettings = {
      floorVisible,
      gridVisible,
      floorPlaneVisible,
      backgroundVisible
    };
    localStorage.setItem('visibility-settings', JSON.stringify(visibilitySettings));
  }, [floorVisible, gridVisible, floorPlaneVisible, backgroundVisible]);

  // Handlers
  const handleAddFrame = (url, pos, rot) => {
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

  const handleSpotlightVisibility = (isVisible) => {
    setShowPreview(isVisible);
    setIsSpotlightOpen(isVisible);
    if (!isVisible) {
      setConfirmedPosition(null);
      setConfirmedRotation(null);
    }
  };

  const handlePositionConfirm = (position, rotation) => {
    setConfirmedPosition(position);
    setConfirmedRotation(rotation);
    
    if (pendingWebsiteUrl) {
      setTimeout(() => {
        handleAddFrame(pendingWebsiteUrl, position, rotation);
      }, 300);
    }
  };

  const handleModeChange = (mode) => {
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
  };

  const handleOpenCatalog = () => {
    setShowCatalog(true);
    setMovementEnabled(false);
  };

  const handleCloseCatalog = () => {
    setShowCatalog(false);
    setMovementEnabled(true);
  };

  const handleToggleHelp = () => {
    setShowHelp(!showHelp);
    setMovementEnabled(showHelp);
  };

  const handleCancel = () => {
    if (currentMode === 'build') {
      if (pendingWebsiteUrl) {
        setPendingWebsiteUrl(null);
        setConfirmedPosition(null);
        setConfirmedRotation(null);
      } else {
        handleModeChange('live');
      }
    }
  };

  const handleCloseFrame = (frameId) => {
    setFrames(prevFrames => prevFrames.filter(frame => frame.id !== frameId));
  };

  const handleClearAllFrames = () => {
    setFrames([]);
  };

  const handleRestoreFramePosition = (frameId) => {
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

  const handleFrameMove = (frameId, newPosition, newRotation) => {
    setFrames(prevFrames => prevFrames.map(frame =>
      frame.id === frameId ? { ...frame, position: newPosition, rotation: newRotation } : frame
    ));
  };

  const handleColorChange = (type, color) => {
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

  const handleResetColors = () => {
    resetColors();
    setIsResetAnimating(true);
    setColorChanged('all');
    setTimeout(() => {
      setIsResetAnimating(false);
      setColorChanged(null);
    }, 1000);
  };

  const handleGroundSizeChange = (value) => {
    setGroundSize(value);
  };

  const handleGroundInfiniteToggle = (value) => {
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

  const handleEnvironmentSettingChange = (setting, value) => {
    setEnvironmentSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if the target is an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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

      // Add 'E' key to open inventory, but only if no input is focused and spotlight is not open
      if ((e.key === 'e' || e.key === 'E') && !pendingWebsiteUrl && !showCatalog && !isSpotlightOpen) {
        e.preventDefault();
        setShowInventory(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCatalog, showHelp, currentMode, pendingWebsiteUrl, isSpotlightOpen]);

  // Add toggleSettings function
  const toggleSettings = () => {
    const newState = !showSettings;
    setShowSettings(newState);
    setCanvasInteractive(!newState);
  };

  // Handle hotbar item selection
  const handleHotbarItemSelect = (item) => {
    setSelectedHotbarItem(item);
    
    // You can add logic here to handle different item types
    console.log(`Selected hotbar item: ${item?.name}`);
    
    // Example: Switch tools based on item type
    if (item) {
      switch (item.id) {
        case 'sword':
          // Activate attack mode or weapon
          console.log('Sword selected - activating attack mode');
          break;
        case 'pickaxe':
          // Activate mining/editing mode
          console.log('Pickaxe selected - activating edit mode');
          break;
        case 'axe':
          // Activate cutting/removing mode
          console.log('Axe selected - activating remove mode');
          break;
        case 'shovel':
          // Activate digging/terrain editing mode
          console.log('Shovel selected - activating terrain edit mode');
          break;
        default:
          // Handle other items or blocks
          console.log(`Selected ${item.name}`);
      }
    }
  };

  const handleOpenInventory = () => {
    setShowInventory(true);
  };
  
  const handleCloseInventory = () => {
    setShowInventory(false);
  };
  
  const handleSelectImageFromInventory = (image) => {
    // Add the selected image to the scene
    if (image && image.url) {
      const position = new THREE.Vector3();
      
      // If camera is available, place in front of camera
      if (cameraRef.current) {
        const camera = cameraRef.current;
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        position.copy(camera.position);
        direction.multiplyScalar(3); // Place 3 units in front of camera
        position.add(direction);
      } else {
        // Default position if camera not available
        position.set(0, 1, 0);
      }
      
      // Add image to the store
      addImage({
        src: image.url,
        fileName: image.fileName,
        position: [position.x, position.y, position.z],
        rotation: [0, 0, 0],
        scale: 1,
      });
    }
    
    // Close the inventory
    setShowInventory(false);
  };
  
  const handleSelectModelFromInventory = (model) => {
    // Add the selected model to the scene
    if (!model?.url) return setShowInventory(false);
    
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
    
    // Add model to the store with destructured position
    const { addModel } = useModelStore.getState();
    addModel({
      url: model.url,
      fileName: model.fileName,
      position: [position.x, position.y, position.z],
      rotation: [0, 0, 0],
      scale: 1,
    });
    
    // Close the inventory
    setShowInventory(false);
  };

  const handleRemoveObject = (objectData) => {
    if (objectData && objectData.type && objectData.id) {
      if (objectData.type === 'image') {
        removeImage(objectData.id);
      } else if (objectData.type === 'model') {
        removeModel(objectData.id);
      }
      setSelectedObject(null);
    }
  };

  // Handle object selection
  const handleObjectSelect = (object) => {
    setSelectedObject(object);
  };

  // Global keyboard event handler
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Log all key presses for debugging
      // console.log(`Key pressed: ${e.key}, target: ${e.target.tagName}, focused: ${document.activeElement.tagName}`);
      
      // Prevent opening inventory with E key if any input is focused
      if ((e.key === 'e' || e.key === 'E') && 
          (document.activeElement.tagName === 'INPUT' || 
           document.activeElement.tagName === 'TEXTAREA' ||
           isSpotlightOpen)) {
        e.stopPropagation(); // Prevent other handlers from processing this event
      }
    };
    
    // Use capture phase to intercept events before other handlers
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [isSpotlightOpen]);

  return (
    <HotbarContext.Provider value={{ selectedHotbarItem, setSelectedHotbarItem: handleHotbarItemSelect }}>
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
          onChange={(e) => {
            const files = e.target.files;
            if (files.length === 0) return;
            
            const file = files[0];
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
              handleModelDrop(file);
            } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
                       fileName.endsWith('.png') || fileName.endsWith('.webp') || 
                       fileName.endsWith('.gif')) {
              handleImageDrop(file);
            } else {
              alert(`Unsupported file type: ${fileName}\nSupported formats: GLB, GLTF, JPG, PNG, WEBP, GIF`);
            }
            
            e.target.value = null;
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
              opacity={environmentSettings.skyOpacity}
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
          
          <ImageCloneManager onSelect={handleObjectSelect} />
          <ModelManager onSelect={handleObjectSelect} />
          
          <WebFrames
            frames={frames}
            onCloseFrame={handleCloseFrame}
            onRestorePosition={handleRestoreFramePosition}
            onUpdateFrameUrl={(frameId, newUrl) => {
              setFrames(prevFrames => prevFrames.map(frame => 
                frame.id === frameId ? { ...frame, url: newUrl } : frame
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
            groundShape={groundShape}
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
              onToggle={(isOpen) => {
                if (!isOpen) {
                  setCanvasInteractive(true);
                  setShowColorPicker(null);
                  setMouseOverSettings(false);
                  // Reload inventory when settings panel is closed
                  if (inventoryRef.current && inventoryRef.current.reloadInventory) {
                    inventoryRef.current.reloadInventory();
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
                if (inventoryRef.current && inventoryRef.current.reloadInventory) {
                  inventoryRef.current.reloadInventory();
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
              onOpacityChange={(type, value) => {
                if (type === 'grid') setGridOpacity(value);
                else if (type === 'floorPlane') setFloorPlaneOpacity(value);
                else if (type === 'background') setBackgroundOpacity(value);
              }}
              groundSize={groundSize}
              onGroundSizeChange={handleGroundSizeChange}
              isGroundInfinite={isGroundInfinite}
              onGroundInfiniteToggle={handleGroundInfiniteToggle}
              groundShape={groundShape}
              onGroundShapeChange={setGroundShape}
              crosshairSettings={{
                visible: showCrosshair,
                size: crosshairSize,
                thickness: crosshairThickness,
                style: crosshairStyle
              }}
              onCrosshairSettingChange={(setting, value) => {
                if (setting === 'visible') setShowCrosshair(value);
                else if (setting === 'size') setCrosshairSize(value);
                else if (setting === 'thickness') setCrosshairThickness(value);
                else if (setting === 'style') setCrosshairStyle(value);
              }}
              visibilitySettings={{
                floor: floorVisible,
                grid: gridVisible,
                floorPlane: floorPlaneVisible,
                background: backgroundVisible
              }}
              onVisibilityChange={(setting, value) => {
                if (setting === 'floor') setFloorVisible(value);
                else if (setting === 'grid') setGridVisible(value);
                else if (setting === 'floorPlane') setFloorPlaneVisible(value);
                else if (setting === 'background') setBackgroundVisible(value);
              }}
              gravityEnabled={gravityEnabled}
              onGravityToggle={setGravityEnabled}
              selectedTheme={selectedTheme}
              onThemeSelect={(theme) => {
                setSelectedTheme(theme);
                setTheme(theme);
              }}
              environmentSettings={environmentSettings}
              onEnvironmentSettingChange={handleEnvironmentSettingChange}
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
            style={crosshairStyle}
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
            onSelectImage={handleSelectImageFromInventory}
            onSelectModel={handleSelectModelFromInventory}
            onClose={handleCloseInventory}
            isOpen={showInventory}
            onRemoveObject={handleRemoveObject}
          />
        )}
      </div>
    </HotbarContext.Provider>
  );
};

export default Player;
