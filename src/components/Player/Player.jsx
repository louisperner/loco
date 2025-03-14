import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useCodeStore } from '../../store/CodeStore';
import WebFrames from './WebFrames';
import Spotlight from './Spotlight';
import FPSControls from './FPSControls';
import ImageCloneManager from './ImageCloneManager';
import MessageManager from './MessageManager';
import { useImageStore } from '../../store/useImageStore';
import { useModelStore } from '../../store/useModelStore';
import ModelManager from './ModelManager';
import { Button, Switch, Slider } from '@/components/ui';
import { SettingsPanel } from '@/components/settings';
import { RgbaColorPicker } from 'react-colorful';
import { FaTimes, FaUndo, FaPalette, FaSlidersH, FaChevronRight, FaMagic, FaLayerGroup, FaAdjust, FaEye, FaEyeSlash, FaExpand, FaInfinity, FaCube, FaCog } from 'react-icons/fa';
import { useThemeStore } from '../../store/ThemeStore';

// Import separated components
import { 
  Crosshair, 
  Floor, 
  PreviewFrame, 
  FrameRateLimiter,
  CameraExposer 
} from './components';

// Import utilities
import { 
  hexToRgba, 
  rgbaToString, 
  stringToRgba, 
  getButtonColorStyle 
} from './utils/colorUtils';

// Import hooks
import { useFileHandling } from './hooks/useFileHandling';

const Player = () => {
  const iframeRef = useRef();
  const canvasContainerRef = useRef();
  const cameraRef = useRef();
  const fileInputRef = useRef();
  const settingsPanelRef = useRef(null);
  const colorPickerRefs = useRef({});
  
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
    skyVisible: true,
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
    skyVisible,
    skyDistance,
    skySunPosition,
    skyInclination,
    skyAzimuth,
    skyTurbidity,
    skyRayleigh,
    skyOpacity,
    starsVisible,
    starsRadius,
    starsDepth,
    starsCount,
    starsFactor,
    starsSaturation,
    starsFade,
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
      if (e.metaKey && e.key === 'b') {
        e.preventDefault();
        setShowCatalog(prev => !prev);
        setMovementEnabled(!showCatalog);
      }
      
      if (e.key === 'F1') {
        e.preventDefault();
        handleToggleHelp();
      }
      
      if (e.key === '1') {
        handleModeChange('live');
      } else if (e.key === '2') {
        handleModeChange('build');
      }
      
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCatalog, showHelp, currentMode, pendingWebsiteUrl]);

  // Add toggleSettings function
  const toggleSettings = () => {
    const newState = !showSettings;
    setShowSettings(newState);
    setCanvasInteractive(!newState);
  };

  return (
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
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-none border-4 border-dashed border-white/30">
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
        
        <ImageCloneManager />
        <ModelManager />
        
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
      <div 
        ref={settingsPanelRef}
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
            } else {
              setCanvasInteractive(false);
              setMouseOverSettings(true);
            }
          }}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
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

      {/* Mode indicator */}
      {currentMode === 'build' && !confirmedPosition && (
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
      
      {currentMode === 'build' && confirmedPosition && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg">
          {pendingWebsiteUrl ? "Website positioned! Choose another or press 1 to return to Live mode" : "Position confirmed!"}
        </div>
      )}

      {/* Crosshair */}
      <Crosshair 
        visible={showCrosshair} 
        size={crosshairSize} 
        color={crosshairColor} 
        thickness={crosshairThickness} 
        style={crosshairStyle}
      />

      {/* Spotlight */}
      <Spotlight 
        onAddFrame={handleAddFrame}
        onVisibilityChange={handleSpotlightVisibility}
        showInput={true}
      />
    </div>
  );
};

export default Player;
