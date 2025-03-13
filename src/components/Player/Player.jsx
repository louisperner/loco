import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html, Grid, OrbitControls, Plane, Text, Circle, Ring, Sky, Stars } from '@react-three/drei';
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
import { SettingsPanel, Button, Switch, Slider } from '@/components/ui';
import { RgbaColorPicker, RgbaStringColorPicker } from 'react-colorful';
import { FaTimes, FaUndo, FaPalette, FaSlidersH, FaCheck, FaChevronRight, FaMagic, FaLayerGroup, FaAdjust, FaEye, FaEyeSlash, FaExpand, FaInfinity, FaCube } from 'react-icons/fa';
import { useThemeStore } from '../../store/ThemeStore';

// Componente de mira para o centro da tela com diferentes estilos
function Crosshair({ visible = true, size = 5, color = 'white', thickness = 1, style = 'circle' }) {
  if (!visible) return null;
  
  // Estilos de mira diferentes
  switch (style) {
    case 'circle': // Mira circular
      return (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none z-[1000] bg-transparent`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderWidth: `${thickness}px`,
            borderColor: color
          }}
        />
      );
    
    case 'dot': // Ponto central
      return (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[1000]`}
          style={{
            width: `${size/2}px`,
            height: `${size/2}px`,
            backgroundColor: color
          }}
        />
      );
    
    case 'cross': // Cruz simples
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
          <div 
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${thickness}px`,
              backgroundColor: color,
              left: `${-size/2}px`,
              top: `${-thickness/2}px`
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: `${thickness}px`,
              height: `${size}px`,
              backgroundColor: color,
              left: `${-thickness/2}px`,
              top: `${-size/2}px`
            }}
          />
        </div>
      );
    
    case 'plus': // Cruz com espaço no centro
      const gap = size / 4;
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
          {/* Linha horizontal esquerda */}
          <div 
            style={{
              position: 'absolute',
              width: `${size/2 - gap}px`,
              height: `${thickness}px`,
              backgroundColor: color,
              right: `${gap + thickness/2}px`,
              top: `${-thickness/2}px`
            }}
          />
          {/* Linha horizontal direita */}
          <div 
            style={{
              position: 'absolute',
              width: `${size/2 - gap}px`,
              height: `${thickness}px`,
              backgroundColor: color,
              left: `${gap + thickness/2}px`,
              top: `${-thickness/2}px`
            }}
          />
          {/* Linha vertical superior */}
          <div 
            style={{
              position: 'absolute',
              width: `${thickness}px`,
              height: `${size/2 - gap}px`,
              backgroundColor: color,
              left: `${-thickness/2}px`,
              bottom: `${gap + thickness/2}px`
            }}
          />
          {/* Linha vertical inferior */}
          <div 
            style={{
              position: 'absolute',
              width: `${thickness}px`,
              height: `${size/2 - gap}px`,
              backgroundColor: color,
              left: `${-thickness/2}px`,
              top: `${gap + thickness/2}px`
            }}
          />
        </div>
      );
      
    default:
      return null;
  }
}

function Floor({ gridVisible, floorPlaneVisible, groundSize = 30, isInfinite = false, groundShape = 'circle' }) {
  const gridColor = useThemeStore(state => state.gridColor);
  const floorPlaneColor = useThemeStore(state => state.floorPlaneColor);
  const gridOpacity = useThemeStore(state => state.gridOpacity);
  const floorPlaneOpacity = useThemeStore(state => state.floorPlaneOpacity);
  const getColorWithOpacity = useThemeStore(state => state.getColorWithOpacity);
  
  const gridColorWithOpacity = getColorWithOpacity(gridColor, gridOpacity);
  const floorPlaneColorWithOpacity = getColorWithOpacity(floorPlaneColor, floorPlaneOpacity);
  
  // Always use default size when infinite is true
  const size = isInfinite ? 10 : groundSize;
  const fadeDistance = isInfinite ? 100 : groundSize;
  
  return (
    <>
      {gridVisible && (
        <Grid
          args={[size, size]}
          cellSize={1}
          cellThickness={1}
          cellColor={gridColorWithOpacity}
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor={gridColorWithOpacity}
          fadeDistance={fadeDistance}
          fadeStrength={isInfinite ? 0.5 : 1}
          followCamera={isInfinite}
          position={[0, 0.01, 0]}
          infiniteGrid={isInfinite}
        />
      )}
      
      {/* Render infinite plane when infinite ground is enabled */}
      {floorPlaneVisible && isInfinite && (
        <Plane 
          args={[2000, 2000]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </Plane>
      )}
      
      {/* Only render shape-specific planes when NOT in infinite mode */}
      {floorPlaneVisible && !isInfinite && groundShape === 'circle' && (
        <Circle 
          args={[size / 2]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </Circle>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'square' && (
        <Plane 
          args={[size, size]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </Plane>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'hexagon' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 6]} />
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'triangle' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 3]} />
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'octagon' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 8]} />
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'diamond' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 4, Math.PI/4]} />
          <meshStandardMaterial 
            color={floorPlaneColor}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
    </>
  );
}

function getFramePositionAndRotation(camera) {
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  
  const position = new THREE.Vector3();
  position.copy(camera.position);
  
  direction.multiplyScalar(3);
  position.add(direction);
  
  position.y = Math.max(-1, Math.min(3, position.y));

  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);
  
  return {
    position: [position.x, position.y, position.z],
    rotation: [euler.x, euler.y, euler.z]
  };
}

// Frame rate limiter component that limits to 60 FPS
function FrameRateLimiter() {
  const frameInterval = 1000 / 60; // 60 fps
  const lastUpdate = useRef(0);
  
  useFrame(({ gl, scene, camera }) => {
    const now = performance.now();
    const delta = now - lastUpdate.current;
    
    if (delta < frameInterval) {
      // Skip this frame
      return;
    }
    
    // Update last render time, accounting for any extra time
    lastUpdate.current = now - (delta % frameInterval);
  }, 0); // Priority 0 ensures this runs before other useFrame hooks
  
  return null;
}

function PreviewFrame({ isVisible, onPositionConfirm, isPositionConfirmed, hasPendingWebsite }) {
  const { camera } = useThree();
  const groupRef = useRef();
  const [position, setPosition] = useState([0, 0, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);

  useFrame(() => {
    if (!isVisible || !groupRef.current || isPositionConfirmed) return;
    const { position: newPosition, rotation: newRotation } = getFramePositionAndRotation(camera);
    setPosition(newPosition);
    setRotation(newRotation);
  });

  useEffect(() => {
    if (!isVisible) return;

    const handleClick = () => {
      if (!isPositionConfirmed) {
        onPositionConfirm(position, rotation);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isVisible, position, rotation, onPositionConfirm, isPositionConfirmed]);

  if (!isVisible) return null;

  return (
    <group 
      ref={groupRef} 
      position={position}
      rotation={rotation}
    >
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.1, 2.1]} />
        <meshBasicMaterial 
          color={isPositionConfirmed ? "#22c55e" : "#3b82f6"}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial 
          color={isPositionConfirmed ? "#4ade80" : "#60a5fa"}
          wireframe
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[[-1.5, 1], [1.5, 1], [-1.5, -1], [1.5, -1]].map((pos, i) => (
        <group key={i} position={[pos[0], pos[1], 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} />
          </mesh>
          <mesh position={[0, 0, -0.15]}>
            <boxGeometry args={[0.02, 0.02, 0.3]} />
            <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} opacity={0.5} transparent />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[0.05, 0.05, 0.3]} />
        <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} opacity={0.3} transparent />
      </mesh>
      
      {hasPendingWebsite && !isPositionConfirmed && (
        <Html position={[0, -1.3, 0]} center>
          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
            Clique para posicionar aqui
          </div>
        </Html>
      )}
    </group>
  );
}

function FrameManager({ onAddFrame }) {
  const { camera } = useThree();
  
  React.useEffect(() => {
    window.addFrameAtPosition = (url) => {
      const { position, rotation } = getFramePositionAndRotation(camera);
      onAddFrame(url, position, rotation);
    };
  }, [camera, onAddFrame]);
  
  return null;
}

const Player = () => {
  const iframeRef = useRef();
  const canvasContainerRef = useRef();
  const { updateCode, updateTranspiledCode, updateComponents } = useCodeStore();
  const { code } = useCodeStore();
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
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0, z: 0 });
  const [activeTab, setActiveTab] = useState('cores');
  const [isResetAnimating, setIsResetAnimating] = useState(false);
  const [colorChanged, setColorChanged] = useState(null);
  const [canvasInteractive, setCanvasInteractive] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const colorPickerRefs = useRef({});
  const settingsPanelRef = useRef(null);
  const [mouseOverSettings, setMouseOverSettings] = useState(false);
  
  // Estados para controlar a visibilidade de cada elemento
  const [floorVisible, setFloorVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [floorPlaneVisible, setFloorPlaneVisible] = useState(true);
  const [backgroundVisible, setBackgroundVisible] = useState(true);
  
  // Estados para a mira (crosshair)
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [crosshairSize, setCrosshairSize] = useState(10);
  const [crosshairColor, setCrosshairColor] = useState('white');
  const [crosshairThickness, setCrosshairThickness] = useState(2);
  const [crosshairStyle, setCrosshairStyle] = useState('circle');
  
  // Obter funções e estados da ThemeStore
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

  // Adicione este estado se não estiver no ThemeStore ainda
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [groundShape, setGroundShape] = useState('circle');
  
  const addImage = useImageStore(state => state.addImage);
  const updateImage = useImageStore(state => state.updateImage);
  const addModel = useModelStore(state => state.addModel);
  const updateModel = useModelStore(state => state.updateModel);
  const models = useModelStore(state => state.models);
  const [showModelTip, setShowModelTip] = useState(true);

  // Add a ref to store the camera
  const cameraRef = useRef(null);

  // Efeito para carregar as configurações salvas quando o componente é montado
  useEffect(() => {
    // Carregar frames
    const savedFrames = localStorage.getItem('webview-frames');
    if (savedFrames) {
      try {
        const parsedFrames = JSON.parse(savedFrames);
        setFrames(parsedFrames);
      } catch (error) {
        console.error('Error loading frames from localStorage:', error);
      }
    }
    
    // Carregar configurações de chão
    const savedGroundShape = localStorage.getItem('ground-shape');
    if (savedGroundShape) {
      setGroundShape(savedGroundShape);
    }
    
    // Carregar configuração de gravidade
    const savedGravity = localStorage.getItem('gravity-enabled');
    if (savedGravity !== null) {
      setGravityEnabled(savedGravity === 'true');
    }
    
    // Carregar as cores salvas
    const gridColorSaved = localStorage.getItem('grid-color');
    const gridOpacitySaved = localStorage.getItem('grid-opacity');
    const floorPlaneColorSaved = localStorage.getItem('floor-plane-color');
    const floorPlaneOpacitySaved = localStorage.getItem('floor-plane-opacity');
    const backgroundColorSaved = localStorage.getItem('background-color');
    const backgroundOpacitySaved = localStorage.getItem('background-opacity');
    const groundSizeSaved = localStorage.getItem('ground-size');
    const groundInfiniteSaved = localStorage.getItem('ground-infinite');
    
    // Aplicar cores salvas se existirem
    if (gridColorSaved) setGridColor(gridColorSaved);
    if (gridOpacitySaved) setGridOpacity(parseInt(gridOpacitySaved));
    if (floorPlaneColorSaved) setFloorPlaneColor(floorPlaneColorSaved);
    if (floorPlaneOpacitySaved) setFloorPlaneOpacity(parseInt(floorPlaneOpacitySaved));
    if (backgroundColorSaved) setBackgroundColor(backgroundColorSaved);
    if (backgroundOpacitySaved) setBackgroundOpacity(parseInt(backgroundOpacitySaved));
    if (groundSizeSaved) setGroundSize(parseInt(groundSizeSaved));
    if (groundInfiniteSaved !== null) setGroundInfinite(groundInfiniteSaved === 'true');
    
    // Carregar configurações de crosshair
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
    
    // Carregar configurações de visibilidade
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
    
    // Carregar tema selecionado
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }
  }, [setGridColor, setGridOpacity, setFloorPlaneColor, setFloorPlaneOpacity, setBackgroundColor, setBackgroundOpacity, setGroundSize, setGroundInfinite]);

  // Salvar quando os frames mudam
  useEffect(() => {
    localStorage.setItem('webview-frames', JSON.stringify(frames));
  }, [frames]);
  
  // Salvar quando a forma do chão muda
  useEffect(() => {
    localStorage.setItem('ground-shape', groundShape);
  }, [groundShape]);
  
  // Salvar quando a gravidade muda
  useEffect(() => {
    localStorage.setItem('gravity-enabled', gravityEnabled.toString());
  }, [gravityEnabled]);
  
  // Salvar configurações de crosshair quando mudam
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
  
  // Salvar configurações de visibilidade quando mudam
  useEffect(() => {
    const visibilitySettings = {
      floorVisible,
      gridVisible,
      floorPlaneVisible,
      backgroundVisible
    };
    localStorage.setItem('visibility-settings', JSON.stringify(visibilitySettings));
  }, [floorVisible, gridVisible, floorPlaneVisible, backgroundVisible]);

  // Monitorar mudanças nas cores do ThemeStore e salvá-las
  useEffect(() => {
    localStorage.setItem('grid-color', gridColor);
  }, [gridColor]);
  
  useEffect(() => {
    localStorage.setItem('grid-opacity', gridOpacity.toString());
  }, [gridOpacity]);
  
  useEffect(() => {
    localStorage.setItem('floor-plane-color', floorPlaneColor);
  }, [floorPlaneColor]);
  
  useEffect(() => {
    localStorage.setItem('floor-plane-opacity', floorPlaneOpacity.toString());
  }, [floorPlaneOpacity]);
  
  useEffect(() => {
    localStorage.setItem('background-color', backgroundColor);
  }, [backgroundColor]);
  
  useEffect(() => {
    localStorage.setItem('background-opacity', backgroundOpacity.toString());
  }, [backgroundOpacity]);
  
  useEffect(() => {
    localStorage.setItem('ground-size', groundSize.toString());
  }, [groundSize]);
  
  useEffect(() => {
    localStorage.setItem('ground-infinite', isGroundInfinite.toString());
  }, [isGroundInfinite]);

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

  async function refreshData() {
    await refreshComponents();

    onSnapshot(collection(db, `3Deditor`), (snapshot) => {
      snapshot.forEach((doc) => {
        const code = doc.data().code;
        const formated = generateCode(code);

        const components = JSON.parse(localStorage.getItem('components'));
        updateComponents(components);
        updateCode(code);
        updateTranspiledCode(formated);
      });
    });
  }

  async function refreshComponents() {
    let components = '';

    onSnapshot(collection(db, `components`), (snapshot) => {
      snapshot.forEach((doc) => {
        components += doc.data().code + ';';
      });
      localStorage.setItem(`components`, JSON.stringify(components));
    });
  }

  useEffect(() => {
    if (code !== '') {
      setFinalCode(`${code} render(<Application />);`);
    }
  }, [code]);

  const handleBoxFrameMediaDrag = (mediaData) => {
    console.log('📱 Media drag detectado:', mediaData);
  };
  
  const handleCloseFrame = (frameId) => {
    setFrames(prevFrames => prevFrames.filter(frame => frame.id !== frameId));
  };
  
  const handleClearAllFrames = () => {
    setFrames([]);
    
    const { clearImages } = useImageStore.getState();
    if (clearImages) {
      clearImages();
    }
  };
  
  const handleLoadSavedFrames = (savedFrames) => {
    console.log('Loading saved frames:', savedFrames);
    setFrames(savedFrames);
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

  const handleFrameClose = (frameId) => {
    setSelectedFrame(null);
    handleCloseFrame(frameId);
  };

  const toggleSettings = () => {
    const newState = !showSettings;
    setShowSettings(newState);
    // Desabilitar interação do canvas quando as configurações estiverem abertas
    setCanvasInteractive(!newState);
  };
  
  // Prevenir propagação de eventos
  const handlePanelClick = (e) => {
    e.stopPropagation();
  };
  
  // Converter cores para formato RGBA
  const hexToRgba = (hex, alpha = 1) => {
    if (hex === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    
    // Remover o # se existir
    hex = hex.replace('#', '');
    
    // Converter cores de 3 dígitos para 6 dígitos
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Converter para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b, a: alpha };
  };
  
  // Converter objeto RGBA para string
  const rgbaToString = (rgba) => {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  };
  
  // Converter string RGBA para objeto
  const stringToRgba = (rgbaStr) => {
    if (rgbaStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    
    const match = rgbaStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: parseFloat(match[4])
      };
    }
    
    // Fallback para hex
    return hexToRgba(rgbaStr);
  };

  const handleColorChange = (type, color) => {
    const colorValue = typeof color === 'string' ? color : rgbaToString(color);
    
    if (type === 'grid') {
      setGridColor(colorValue);
      if (colorValue === 'transparent' || (typeof color === 'object' && color.a === 0)) {
        setGridOpacity(0);
      } else if (typeof color === 'object') {
        setGridOpacity(Math.round(color.a * 100));
      }
      // Save to localStorage
      localStorage.setItem('grid-color', colorValue);
      localStorage.setItem('grid-opacity', Math.round(typeof color === 'object' ? color.a * 100 : gridOpacity).toString());
    } else if (type === 'floorPlane') {
      setFloorPlaneColor(colorValue);
      if (colorValue === 'transparent' || (typeof color === 'object' && color.a === 0)) {
        setFloorPlaneOpacity(0);
      } else if (typeof color === 'object') {
        setFloorPlaneOpacity(Math.round(color.a * 100));
      }
      // Save to localStorage
      localStorage.setItem('floor-plane-color', colorValue);
      localStorage.setItem('floor-plane-opacity', Math.round(typeof color === 'object' ? color.a * 100 : floorPlaneOpacity).toString());
    } else if (type === 'background') {
      setBackgroundColor(colorValue);
      if (colorValue === 'transparent' || (typeof color === 'object' && color.a === 0)) {
        setBackgroundOpacity(0);
      } else if (typeof color === 'object') {
        setBackgroundOpacity(Math.round(color.a * 100));
      }
      // Save to localStorage
      localStorage.setItem('background-color', colorValue);
      localStorage.setItem('background-opacity', Math.round(typeof color === 'object' ? color.a * 100 : backgroundOpacity).toString());
    } else if (type === 'crosshair') {
      setCrosshairColor(colorValue);
      // Saving to localStorage is handled by the useEffect above
    }
    
    // Show visual feedback
    setColorChanged(type);
    setTimeout(() => setColorChanged(null), 500);
  };
  
  const handleResetColors = () => {
    resetColors();
    
    // Também resetar no localStorage
    localStorage.setItem('grid-color', '#ffffff');
    localStorage.setItem('grid-opacity', '40');
    localStorage.setItem('floor-plane-color', '#191f2a80');
    localStorage.setItem('floor-plane-opacity', '80');
    localStorage.setItem('background-color', '#000000');
    localStorage.setItem('background-opacity', '100');
    
    setIsResetAnimating(true);
    setColorChanged('all');
    setTimeout(() => {
      setIsResetAnimating(false);
      setColorChanged(null);
    }, 1000);
  };
  
  const applyTheme = (theme) => {
    setGridColor(theme.grid);
    setBackgroundColor(theme.bg);
    setFloorPlaneColor(theme.floorPlane || "#191f2a80");
    setSelectedTheme(theme.id);
    
    // Reset opacities
    setGridOpacity(40);
    setFloorPlaneOpacity(80);
    setBackgroundOpacity(100);
    
    // Salvar no localStorage
    localStorage.setItem('grid-color', theme.grid);
    localStorage.setItem('background-color', theme.bg);
    localStorage.setItem('floor-plane-color', theme.floorPlane || "#191f2a80");
    localStorage.setItem('grid-opacity', '40');
    localStorage.setItem('floor-plane-opacity', '80');
    localStorage.setItem('background-opacity', '100');
    localStorage.setItem('selected-theme', theme.id);
    
    // Show visual feedback
    setColorChanged('all');
    setTimeout(() => setColorChanged(null), 1000);
  };

  // Adicione uma função para gerar um estilo de cor com verificação de transparência
  const getButtonColorStyle = (color) => {
    if (color === 'transparent') {
      return {
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
        backgroundSize: '10px 10px',
        backgroundPosition: '0 0, 5px 5px'
      };
    }
    return { backgroundColor: color };
  };

  // Desabilitar canvas quando o seletor de cores estiver aberto ou quando mouse estiver sobre painel de config
  useEffect(() => {
    setCanvasInteractive(!showColorPicker && !mouseOverSettings);
  }, [showColorPicker, mouseOverSettings]);
  
  // Tratar entrada e saída do mouse no painel de configurações
  const handleMouseEnterSettings = () => {
    setMouseOverSettings(true);
    setCanvasInteractive(false);
  };
  
  const handleMouseLeaveSettings = () => {
    // Só reativamos o canvas se não houver seletor de cores aberto
    if (!showColorPicker) {
      setMouseOverSettings(false);
      setCanvasInteractive(true);
    }
  };
  
  // Tratar cliques fora do seletor de cores
  useEffect(() => {
    if (!showColorPicker) return;
    
    const handleClickOutside = (event) => {
      // Verificar se o clique foi em algum botão de seletor de cor
      // Se for, não fechar o seletor (o estado já será alterado pelo botão)
      const isColorPickerButton = event.target.closest('[data-color-picker-btn]');
      if (isColorPickerButton) return;
      
      // Verificar se o clique foi fora do seletor atual
      const currentRef = colorPickerRefs.current[showColorPicker];
      if (currentRef && !currentRef.contains(event.target)) {
        setShowColorPicker(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // Adicionar lógica para atualizar o tamanho do ground e o modo infinito
  const handleGroundSizeChange = (value) => {
    setGroundSize(value[0]);
    localStorage.setItem('ground-size', value[0].toString());
  };
  
  const handleGroundInfiniteToggle = (value) => {
    setGroundInfinite(value);
    
    // When enabling infinite ground, store the previous size value temporarily
    if (value && !isGroundInfinite) {
      localStorage.setItem('previous-ground-size', groundSize.toString());
    } 
    // When disabling infinite ground, restore previous size if available
    else if (!value && isGroundInfinite) {
      const prevSize = localStorage.getItem('previous-ground-size');
      if (prevSize) {
        setGroundSize(parseInt(prevSize));
      }
    }
    
    localStorage.setItem('ground-infinite', value.toString());
  };

  // Handle file being dragged over the canvas
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging) {
      console.log('Drag over detected');
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drag leave detected');
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop detected');
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) {
      console.log('No files dropped');
      return;
    }
    
    console.log(`${files.length} file(s) dropped`);
    
    // Process only the first file
    const file = files[0];
    console.log('Dropped file:', file.name, file.type, file.size);
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    
    // Handle 3D model files
    if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      console.log('Processing as 3D model file');
      handleModelDrop(file);
    }
    // Handle image files
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
             fileName.endsWith('.png') || fileName.endsWith('.webp') || 
             fileName.endsWith('.gif')) {
      console.log('Processing as image file');
      handleImageDrop(file);
    } else {
      console.log('Unsupported file type:', fileName);
      alert(`Unsupported file type: ${fileName}\nSupported formats: GLB, GLTF, JPG, PNG, WEBP, GIF`);
    }
  };

  // Handle 3D model file drop
  const handleModelDrop = (file) => {
    try {
      console.log('Starting model drop handler for file:', file.name);
      
      // Create a Blob URL for the file
      const objectUrl = URL.createObjectURL(file);
      console.log('Created blob URL for model:', objectUrl);
      
      // Store the file in the model store to ensure it's not garbage collected
      window._modelFileCache = window._modelFileCache || {};
      window._modelFileCache[objectUrl] = file;
      
      // Also store in the blob URL cache for the Model component
      window._blobUrlCache = window._blobUrlCache || {};
      window._blobUrlCache[objectUrl] = true;
      
      // Check if we have access to the camera
      if (!cameraRef.current) {
        console.warn('Camera reference not available. Model will be placed at origin.');
        
        // Add model at origin if camera not available
        const modelId = addModel({
          url: objectUrl,
          fileName: file.name,
          position: [0, 1, 0], // Default position above ground
          rotation: [0, 0, 0],
          scale: 1,
        });
        
        console.log('Added model at origin with ID:', modelId);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveModelFile) {
          console.log('Saving model file to disk...');
          window.electron.saveModelFile(file, file.name).then(savedPath => {
            // Update model with the new file path
            updateModel(modelId, { url: savedPath });
            console.log(`Saved model to disk: ${savedPath}`);
            
            // Clean up the blob URL after the file is saved to disk
            try {
              URL.revokeObjectURL(objectUrl);
              delete window._modelFileCache[objectUrl];
              delete window._blobUrlCache[objectUrl];
              console.log('Revoked blob URL after saving to disk:', objectUrl);
            } catch (e) {
              console.error('Error revoking blob URL:', e);
            }
          }).catch(error => {
            console.error('Error saving model file:', error);
            alert(`Error saving model file: ${error.message}`);
          });
        } else {
          console.warn('Electron saveModelFile API not available');
        }
        
        return;
      }
      
      // Use the camera reference to get position and direction
      const camera = cameraRef.current;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      const position = new THREE.Vector3();
      position.copy(camera.position);
      direction.multiplyScalar(3); // Place 3 units in front of camera
      position.add(direction);
      
      console.log('Placing model at position:', position);
      
      // Add model to the store
      const modelId = addModel({
        url: objectUrl,
        fileName: file.name,
        position: [position.x, position.y, position.z],
        rotation: [0, 0, 0],
        scale: 1,
      });
      
      console.log(`Added model: ${file.name} with ID: ${modelId} at position:`, position);
      
      // Save the file to disk using Electron's IPC
      if (window.electron && window.electron.saveModelFile) {
        console.log('Saving model file to disk...');
        window.electron.saveModelFile(file, file.name).then(savedPath => {
          // Update model with the new file path
          updateModel(modelId, { url: savedPath });
          console.log(`Saved model to disk: ${savedPath}`);
          
          // Clean up the blob URL after the file is saved to disk
          try {
            URL.revokeObjectURL(objectUrl);
            delete window._modelFileCache[objectUrl];
            delete window._blobUrlCache[objectUrl];
            console.log('Revoked blob URL after saving to disk:', objectUrl);
          } catch (e) {
            console.error('Error revoking blob URL:', e);
          }
        }).catch(error => {
          console.error('Error saving model file:', error);
          alert(`Error saving model file: ${error.message}`);
        });
      } else {
        console.warn('Electron saveModelFile API not available');
      }
    } catch (error) {
      console.error('Error handling model drop:', error);
      alert(`Error loading 3D model: ${error.message}`);
    }
  };

  // Handle image file drop
  const handleImageDrop = (file) => {
    try {
      console.log('Starting image drop handler for file:', file.name);
      
      // Create a Blob URL for the file
      const objectUrl = URL.createObjectURL(file);
      console.log('Created blob URL for image:', objectUrl);
      
      // Check if we have access to the camera
      if (!cameraRef.current) {
        console.warn('Camera reference not available. Image will be placed at origin.');
        
        // Add image at origin if camera not available
        const imageId = addImage({
          src: objectUrl,
          fileName: file.name,
          position: [0, 1, 0], // Default position
          rotation: [0, 0, 0],
          scale: 1,
        });
        
        console.log('Added image at origin with ID:', imageId);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveImageFile) {
          console.log('Saving image file to disk...');
          window.electron.saveImageFile(file, file.name).then(savedPath => {
            // Update image with the new file path
            updateImage(imageId, { src: savedPath });
            console.log(`Saved image to disk: ${savedPath}`);
          }).catch(error => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
          });
        } else {
          console.warn('Electron saveImageFile API not available');
        }
        
        return;
      }
      
      // Use the camera reference to get position and direction
      const camera = cameraRef.current;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      const position = new THREE.Vector3();
      position.copy(camera.position);
      direction.multiplyScalar(3); // Place 3 units in front of camera
      position.add(direction);
      
      console.log('Placing image at position:', position);
      
      // Calculate image dimensions asynchronously
      const img = new Image();
      img.onload = () => {
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        console.log('Image loaded with dimensions:', img.width, 'x', img.height, 'aspect ratio:', aspectRatio);
        
        // Add image to the store
        const imageId = addImage({
          src: objectUrl,
          fileName: file.name,
          position: [position.x, position.y, position.z],
          rotation: [0, 0, 0],
          scale: 1,
          width: img.width,
          height: img.height,
          aspectRatio,
        });
        
        console.log(`Added image: ${file.name} with ID: ${imageId} at position:`, position);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveImageFile) {
          console.log('Saving image file to disk...');
          window.electron.saveImageFile(file, file.name).then(savedPath => {
            // Update image with the new file path
            updateImage(imageId, { src: savedPath });
            console.log(`Saved image to disk: ${savedPath}`);
          }).catch(error => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
          });
        } else {
          console.warn('Electron saveImageFile API not available');
        }
      };
      
      img.onerror = (error) => {
        console.error('Error loading image dimensions:', error);
        
        // Add image without dimensions
        const imageId = addImage({
          src: objectUrl,
          fileName: file.name,
          position: [position.x, position.y, position.z],
          rotation: [0, 0, 0],
          scale: 1,
        });
        
        console.log(`Added image without dimensions: ${file.name} with ID: ${imageId}`);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveImageFile) {
          console.log('Saving image file to disk...');
          window.electron.saveImageFile(file, file.name).then(savedPath => {
            // Update image with the new file path
            updateImage(imageId, { src: savedPath });
            console.log(`Saved image to disk: ${savedPath}`);
          }).catch(error => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
          });
        } else {
          console.warn('Electron saveImageFile API not available');
        }
      };
      
      img.src = objectUrl;
    } catch (error) {
      console.error('Error handling image drop:', error);
      alert(`Error loading image: ${error.message}`);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle file selection via input element
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    
    const file = files[0];
    console.log('File selected:', file.name, file.type, file.size);
    
    const fileName = file.name.toLowerCase();
    
    // Handle 3D model files
    if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      console.log('Processing as 3D model file');
      handleModelDrop(file);
    }
    // Handle image files
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
             fileName.endsWith('.png') || fileName.endsWith('.webp') || 
             fileName.endsWith('.gif')) {
      console.log('Processing as image file');
      handleImageDrop(file);
    } else {
      console.log('Unsupported file type:', fileName);
      alert(`Unsupported file type: ${fileName}\nSupported formats: GLB, GLTF, JPG, PNG, WEBP, GIF`);
    }
    
    // Reset the input value so the same file can be selected again
    e.target.value = null;
  };
  
  // Handle click on upload button
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Hide model tip after 10 seconds
  useEffect(() => {
    let timerId;
    
    // If there are no models loaded, show the tip
    if (models.length === 0 && showModelTip) {
      // Auto-hide after 10 seconds
      timerId = setTimeout(() => {
        setShowModelTip(false);
      }, 10000);
    } else if (models.length > 0) {
      // Hide the tip when a model is loaded
      setShowModelTip(false);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [models.length, showModelTip]);

  // Define CameraExposer inside Player so it has access to cameraRef
  function CameraExposer() {
    const { camera } = useThree();
    
    useEffect(() => {
      // Store the camera in the ref
      cameraRef.current = camera;
      
      // Also expose to window for any other uses
      window.mainCamera = camera;
      return () => {
        window.mainCamera = undefined;
      };
    }, [camera]);
    
    return null;
  }

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
        onChange={handleFileSelect} 
        accept=".glb,.gltf,.jpg,.jpeg,.png,.webp,.gif" 
        style={{ display: 'none' }} 
      />
      
      {/* Upload button
      <button
        onClick={handleUploadClick}
        className="absolute bottom-4 right-4 z-40 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        title="Upload 3D model or image"
      >
        <span>Upload File</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button> */}
      
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
        className={`z-0 ${canvasInteractive ? '' : ''}`}
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
        
        <CameraExposer />
        
        {/* Add Sky and Stars components with state variables */}
        {(skyVisible ?? true) && (
          <Sky 
            distance={skyDistance ?? 450000} 
            sunPosition={skySunPosition ?? [0, 1, 0]} 
            inclination={skyInclination ?? 0} 
            azimuth={skyAzimuth ?? 0.25} 
            turbidity={skyTurbidity ?? 10}
            rayleigh={skyRayleigh ?? 2.5}
            opacity={skyOpacity ?? 1}
          />
        )}
        {(starsVisible ?? true) && (
          <Stars 
            radius={starsRadius ?? 100} 
            depth={starsDepth ?? 50} 
            count={starsCount ?? 5000} 
            factor={starsFactor ?? 4} 
            saturation={starsSaturation ?? 0} 
            fade={starsFade ?? true} 
          />
        )}
        
        <ImageCloneManager />
        <ModelManager />
        
        <WebFrames
          frames={frames}
          onMediaDragStart={handleBoxFrameMediaDrag}
          onCloseFrame={handleCloseFrame}
          onRestorePosition={handleRestoreFramePosition}
          onUpdateFrameUrl={(frameId, newUrl) => {
            setFrames(prevFrames => prevFrames.map(frame => 
              frame.id === frameId ? { ...frame, url: newUrl } : frame
            ));
          }}
          onLoadSavedFrames={handleLoadSavedFrames}
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
      
      {/* Settings slide panel with Shadcn UI */}
      <div 
        ref={settingsPanelRef}
        onMouseEnter={handleMouseEnterSettings}
        onMouseLeave={handleMouseLeaveSettings}
      >
        <SettingsPanel 
          onToggle={(isOpen) => {
            // Quando o painel é fechado, resetamos os estados
            if (!isOpen) {
              setCanvasInteractive(true);
              setShowColorPicker(null);
              setMouseOverSettings(false);
            } else {
              // Quando o painel é aberto, desativamos o canvas
              setCanvasInteractive(false);
              setMouseOverSettings(true);
            }
          }}
          tabs={[
            {
              id: 'appearance',
              label: 'Appearance',
              icon: <FaPalette size={10} />,
              content: (
                <div className="space-y-2 animate-fadeIn">
                  {/* Color Options with react-colorful */}
                  <div className="bg-white/5 rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <button 
                        onClick={handleResetColors}
                        className={`text-blue-400 hover:text-blue-300 flex items-center text-xs transition-colors duration-200 rounded-full px-2 py-0.5 hover:bg-blue-900/20 ${isResetAnimating ? 'animate-pulse' : ''}`}
                        title="Restore default colors"
                      >
                        <FaUndo className="mr-1" size={8} /> Reset
                      </button>
                    </div>
                    
                    {/* Background Color Selector with react-colorful */}
                    <div className="bg-black/20 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="text-sm text-white/80 font-medium">Background</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setBackgroundVisible(!backgroundVisible)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${backgroundVisible ? 'text-white/80 hover:text-white' : 'text-white/30 hover:text-white/50'}`}
                            title={backgroundVisible ? "Hide background" : "Show background"}
                          >
                            {backgroundVisible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowColorPicker(showColorPicker === 'background' ? null : 'background');
                            }}
                            className={`w-7 h-7 rounded-full border-2 ${showColorPicker === 'background' ? 'border-white' : 'border-white/30'} overflow-hidden cursor-pointer transition-all duration-200 hover:scale-110`}
                            style={getButtonColorStyle(backgroundColor)}
                            title="Select background color"
                            data-color-picker-btn="background"
                          />
                        </div>
                      </div>
                      
                      {/* Color picker dropdown */}
                      {showColorPicker === 'background' && (
                        <div 
                          ref={el => colorPickerRefs.current.background = el} 
                          className="p-3 border-t border-white/10 relative"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white/90">Background Color</span>
                            <div className="flex gap-2">
                              <button 
                                className="bg-transparent hover:bg-white/10 p-1.5 rounded text-white/80 flex items-center border border-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColorChange('background', 'transparent');
                                }}
                                title="Set transparent"
                              >
                                <FaEyeSlash size={12} className="mr-1.5" />
                                <span className="text-xs">Transparent</span>
                              </button>
                              <button 
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-white/80 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowColorPicker(null);
                                }}
                                title="Close color picker"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="border border-white/10 rounded-md p-2 mb-3 z-50">
                            <RgbaColorPicker 
                              color={backgroundColor === 'transparent' ? { r: 255, g: 255, b: 255, a: 0 } : 
                                    stringToRgba(backgroundColor)}
                              onChange={(color) => handleColorChange('background', color)} 
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Grid and Floor Settings - MOVED FROM ENVIRONMENT TAB */}
                    <div className="bg-black/20 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="text-sm text-white/80 font-medium">Grid</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setGridVisible(!gridVisible)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${gridVisible ? 'text-white/80 hover:text-white' : 'text-white/30 hover:text-white/50'}`}
                            title={gridVisible ? "Hide grid" : "Show grid"}
                          >
                            {gridVisible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowColorPicker(showColorPicker === 'grid' ? null : 'grid');
                            }}
                            className={`w-7 h-7 rounded-full border-2 ${showColorPicker === 'grid' ? 'border-white' : 'border-white/30'} overflow-hidden cursor-pointer transition-all duration-200 hover:scale-110`}
                            style={getButtonColorStyle(gridColor)}
                            title="Select grid color"
                            data-color-picker-btn="grid"
                          />
                        </div>
                      </div>
                      
                      {/* Grid color picker dropdown */}
                      {showColorPicker === 'grid' && (
                        <div 
                          ref={el => colorPickerRefs.current.grid = el} 
                          className="p-3 border-t border-white/10 relative"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white/90">Grid Color</span>
                            <div className="flex gap-2">
                              <button 
                                className="bg-transparent hover:bg-white/10 p-1.5 rounded text-white/80 flex items-center border border-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColorChange('grid', 'transparent');
                                }}
                                title="Set transparent"
                              >
                                <FaEyeSlash size={12} className="mr-1.5" />
                                <span className="text-xs">Transparent</span>
                              </button>
                              <button 
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-white/80 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowColorPicker(null);
                                }}
                                title="Close color picker"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="border border-white/10 rounded-md p-2 mb-3 z-50">
                            <RgbaColorPicker 
                              color={gridColor === 'transparent' ? { r: 255, g: 255, b: 255, a: 0 } : 
                                    stringToRgba(gridColor)}
                              onChange={(color) => handleColorChange('grid', color)} 
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Floor Plane Settings */}
                      <div className="flex items-center justify-between p-2.5 border-t border-white/10">
                        <div className="text-sm text-white/80 font-medium">Floor Plane</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFloorPlaneVisible(!floorPlaneVisible)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${floorPlaneVisible ? 'text-white/80 hover:text-white' : 'text-white/30 hover:text-white/50'}`}
                            title={floorPlaneVisible ? "Hide floor plane" : "Show floor plane"}
                          >
                            {floorPlaneVisible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowColorPicker(showColorPicker === 'floorPlane' ? null : 'floorPlane');
                            }}
                            className={`w-7 h-7 rounded-full border-2 ${showColorPicker === 'floorPlane' ? 'border-white' : 'border-white/30'} overflow-hidden cursor-pointer transition-all duration-200 hover:scale-110`}
                            style={getButtonColorStyle(floorPlaneColor)}
                            title="Select floor plane color"
                            data-color-picker-btn="floorPlane"
                          />
                        </div>
                      </div>
                      
                      {/* Floor plane color picker dropdown */}
                      {showColorPicker === 'floorPlane' && (
                        <div 
                          ref={el => colorPickerRefs.current.floorPlane = el} 
                          className="p-3 border-t border-white/10 relative"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white/90">Floor Plane Color</span>
                            <div className="flex gap-2">
                              <button 
                                className="bg-transparent hover:bg-white/10 p-1.5 rounded text-white/80 flex items-center border border-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColorChange('floorPlane', 'transparent');
                                }}
                                title="Set transparent"
                              >
                                <FaEyeSlash size={12} className="mr-1.5" />
                                <span className="text-xs">Transparent</span>
                              </button>
                              <button 
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-white/80 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowColorPicker(null);
                                }}
                                title="Close color picker"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="border border-white/10 rounded-md p-2 mb-3 z-50">
                            <RgbaColorPicker 
                              color={floorPlaneColor === 'transparent' ? { r: 255, g: 255, b: 255, a: 0 } : 
                                    stringToRgba(floorPlaneColor)}
                              onChange={(color) => handleColorChange('floorPlane', color)} 
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Ground Shape and Size Settings - MOVED FROM ENVIRONMENT TAB */}
                    <div className="bg-black/20 rounded-md overflow-hidden p-3 mt-4">
                      {/* Ground Shape Selector */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm text-white/80">Ground Shape</label>
                        </div>
                        
                        <div className="bg-black/20 p-2 rounded-md">
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {[
                              { id: 'circle', label: 'Circle' },
                              { id: 'square', label: 'Square' },
                              { id: 'diamond', label: 'Diamond' },
                              { id: 'triangle', label: 'Triangle' },
                              { id: 'hexagon', label: 'Hexagon' },
                              { id: 'octagon', label: 'Octagon' }
                            ].map((shape, index) => (
                              <button
                                key={shape.id}
                                className={`p-2 rounded text-xs flex flex-col items-center justify-center ${
                                  groundShape === shape.id 
                                    ? 'bg-white/20 border border-white/40' 
                                    : 'bg-black/30 border border-transparent hover:bg-white/10'
                                }`}
                                onClick={() => setGroundShape(shape.id)}
                              >
                                <div className="w-6 h-6 mb-1">
                                  {shape.id === 'circle' && <div className="w-full h-full rounded-full border-2 border-white"></div>}
                                  {shape.id === 'square' && <div className="w-full h-full border-2 border-white"></div>}
                                  {shape.id === 'diamond' && (
                                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                      <path d="M12 2L22 12L12 22L2 12L12 2Z" />
                                    </svg>
                                  )}
                                  {shape.id === 'triangle' && (
                                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                      <path d="M12 2L22 20H2L12 2Z" />
                                    </svg>
                                  )}
                                  {shape.id === 'hexagon' && (
                                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                      <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" />
                                    </svg>
                                  )}
                                  {shape.id === 'octagon' && (
                                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                      <path d="M8 2L16 2L22 8L22 16L16 22L8 22L2 16L2 8L8 2Z" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-white/70">{shape.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Ground Size Slider */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-sm text-white/80">Ground Size</label>
                          <span className="text-xs text-white/60">
                            {isGroundInfinite ? "∞" : `${groundSize} units`}
                          </span>
                        </div>
                        <Slider
                          disabled={isGroundInfinite}
                          min={10}
                          max={100}
                          step={5}
                          value={[isGroundInfinite ? 10 : groundSize]}
                          onValueChange={handleGroundSizeChange}
                          className={isGroundInfinite ? "opacity-50" : ""}
                        />
                      </div>
                      
                      {/* Infinite Ground Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm text-white/80 flex items-center">
                            <FaInfinity className="mr-1.5" size={12} />
                            Infinite Ground
                          </label>
                          <p className="text-white/50 text-xs mt-0.5">Minecraft-style endless ground</p>
                        </div>
                        <Switch
                          checked={isGroundInfinite}
                          onCheckedChange={handleGroundInfiniteToggle}
                        />
                      </div>
                    </div>
                    
                    {/* Crosshair (Mira) Settings */}
                    <div className="bg-black/20 rounded-md overflow-hidden mt-4">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="text-sm text-white/80 font-medium">Crosshair</div>
                        <div className="flex items-center">
                          <Switch 
                            checked={showCrosshair} 
                            onCheckedChange={setShowCrosshair} 
                            className="mr-2"
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowColorPicker(showColorPicker === 'crosshair' ? null : 'crosshair');
                            }}
                            className={`w-7 h-7 rounded-full border-2 ${showColorPicker === 'crosshair' ? 'border-white' : 'border-white/30'} overflow-hidden cursor-pointer transition-all duration-200 hover:scale-110`}
                            style={getButtonColorStyle(crosshairColor)}
                            title="Select crosshair color"
                            data-color-picker-btn="crosshair"
                          />
                        </div>
                      </div>
                      
                      {showCrosshair && (
                        <div className="p-3 border-t border-white/10">
                          {/* Crosshair color picker dropdown */}
                          {showColorPicker === 'crosshair' && (
                            <div 
                              ref={el => colorPickerRefs.current.crosshair = el} 
                              className="mb-4 relative"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-white/90">Crosshair Color</span>
                                <div className="flex gap-2">
                                  <button 
                                    className="bg-transparent hover:bg-white/10 p-1.5 rounded text-white/80 flex items-center border border-white/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleColorChange('crosshair', 'transparent');
                                    }}
                                    title="Set transparent"
                                  >
                                    <FaEyeSlash size={12} className="mr-1.5" />
                                    <span className="text-xs">Transparent</span>
                                  </button>
                                  <button 
                                    className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-white/80 flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowColorPicker(null);
                                    }}
                                    title="Close color picker"
                                  >
                                    <FaTimes size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="border border-white/10 rounded-md p-2 mb-3 z-50">
                                <RgbaColorPicker 
                                  color={crosshairColor === 'transparent' ? { r: 255, g: 255, b: 255, a: 0 } : 
                                        stringToRgba(crosshairColor)}
                                  onChange={(color) => handleColorChange('crosshair', color)} 
                                  style={{ width: '100%' }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Seletor de estilo da mira */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-white/70">Style</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { id: 'circle', label: 'Circle' },
                                { id: 'dot', label: 'Dot' },
                                { id: 'cross', label: 'Cross' },
                                { id: 'plus', label: 'Plus' }
                              ].map(style => (
                                <button
                                  key={style.id}
                                  className={`p-2 rounded text-xs flex flex-col items-center justify-center ${
                                    crosshairStyle === style.id 
                                      ? 'bg-white/20 border border-white/40' 
                                      : 'bg-black/30 border border-transparent hover:bg-white/10'
                                  }`}
                                  onClick={() => setCrosshairStyle(style.id)}
                                >
                                  <div className="w-8 h-8 bg-black/40 rounded-sm mb-1 flex items-center justify-center">
                                    {style.id === 'circle' && (
                                      <div className="w-4 h-4 rounded-full border-2 border-white" />
                                    )}
                                    {style.id === 'dot' && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                    {style.id === 'cross' && (
                                      <div className="relative w-6 h-6">
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2" />
                                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white transform -translate-x-1/2" />
                                      </div>
                                    )}
                                    {style.id === 'plus' && (
                                      <div className="relative w-6 h-6">
                                        <div className="absolute top-1/2 left-0 w-2 h-0.5 bg-white transform -translate-y-1/2" />
                                        <div className="absolute top-1/2 right-0 w-2 h-0.5 bg-white transform -translate-y-1/2" />
                                        <div className="absolute top-0 left-1/2 h-2 w-0.5 bg-white transform -translate-x-1/2" />
                                        <div className="absolute bottom-0 left-1/2 h-2 w-0.5 bg-white transform -translate-x-1/2" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-white/70">{style.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-white/70">Size</span>
                              <span className="text-xs text-white/70">{crosshairSize}px</span>
                            </div>
                            <Slider 
                              value={[crosshairSize]} 
                              min={4} 
                              max={20} 
                              step={1} 
                              onValueChange={(value) => setCrosshairSize(value[0])} 
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-white/70">Thickness</span>
                              <span className="text-xs text-white/70">{crosshairThickness}px</span>
                            </div>
                            <Slider 
                              value={[crosshairThickness]} 
                              min={1} 
                              max={5} 
                              step={0.5} 
                              onValueChange={(value) => setCrosshairThickness(value[0])} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'environment',
              label: 'Environment',
              icon: <FaLayerGroup size={10} />,
              content: (
                <div className="space-y-2 animate-fadeIn">
                  <div className="bg-white/5 rounded-lg p-3 space-y-3">
                    {/* Sky Settings */}
                    <div className="bg-black/20 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="text-sm text-white/80 font-medium">Sky</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTheme({ skyVisible: !(skyVisible ?? true) })}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${(skyVisible ?? true) ? 'text-white/80 hover:text-white' : 'text-white/30 hover:text-white/50'}`}
                            title={(skyVisible ?? true) ? "Hide sky" : "Show sky"}
                          >
                            {(skyVisible ?? true) ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                          </button>
                        </div>
                      </div>
                      
                      {(skyVisible ?? true) && (
                        <div className="p-3 border-t border-white/10">
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Inclination</label>
                                <span className="text-xs text-white/50">{(skyInclination ?? 0).toFixed(2)}</span>
                              </div>
                              <Slider 
                                value={[skyInclination ?? 0]} 
                                min={0} 
                                max={1} 
                                step={0.01} 
                                onValueChange={(value) => setTheme({ skyInclination: value[0] })}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Azimuth</label>
                                <span className="text-xs text-white/50">{(skyAzimuth ?? 0).toFixed(2)}</span>
                              </div>
                              <Slider 
                                value={[skyAzimuth ?? 0]} 
                                min={0} 
                                max={1} 
                                step={0.01} 
                                onValueChange={(value) => setTheme({ skyAzimuth: value[0] })}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Sun Y Position</label>
                                <span className="text-xs text-white/50">{((skySunPosition && skySunPosition[1]) ?? 1).toFixed(2)}</span>
                              </div>
                              <Slider 
                                value={[(skySunPosition && skySunPosition[1]) ?? 1]} 
                                min={0} 
                                max={10} 
                                step={0.1} 
                                onValueChange={(value) => setTheme({ skySunPosition: [0, value[0], 0] })}
                              />
                            </div>
                            
                            {/* Sky Color/Tone Controls */}
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Sky Color (Turbidity)</label>
                                <span className="text-xs text-white/50">{(skyTurbidity ?? 10).toFixed(1)}</span>
                              </div>
                              <Slider 
                                value={[skyTurbidity ?? 10]} 
                                min={1} 
                                max={20} 
                                step={0.5} 
                                onValueChange={(value) => setTheme({ skyTurbidity: value[0] })}
                              />
                              <p className="text-xs text-white/40 mt-1">Lower = bluer, Higher = hazier</p>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Sky Tone (Rayleigh)</label>
                                <span className="text-xs text-white/50">{(skyRayleigh ?? 2.5).toFixed(1)}</span>
                              </div>
                              <Slider 
                                value={[skyRayleigh ?? 2.5]} 
                                min={0.1} 
                                max={4} 
                                step={0.1} 
                                onValueChange={(value) => setTheme({ skyRayleigh: value[0] })}
                              />
                              <p className="text-xs text-white/40 mt-1">Controls atmospheric scattering</p>
                            </div>
                            
                            {/* Sky Opacity Control */}
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Opacity</label>
                                <span className="text-xs text-white/50">{Math.round((skyOpacity ?? 1) * 100)}%</span>
                              </div>
                              <Slider 
                                value={[skyOpacity ?? 1]} 
                                min={0} 
                                max={1} 
                                step={0.05} 
                                onValueChange={(value) => setTheme({ skyOpacity: value[0] })}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Stars Settings */}
                    <div className="bg-black/20 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="text-sm text-white/80 font-medium">Stars</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTheme({ starsVisible: !(starsVisible ?? true) })}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${(starsVisible ?? true) ? 'text-white/80 hover:text-white' : 'text-white/30 hover:text-white/50'}`}
                            title={(starsVisible ?? true) ? "Hide stars" : "Show stars"}
                          >
                            {(starsVisible ?? true) ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                          </button>
                        </div>
                      </div>
                      
                      {(starsVisible ?? true) && (
                        <div className="p-3 border-t border-white/10">
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Count</label>
                                <span className="text-xs text-white/50">{starsCount ?? 5000}</span>
                              </div>
                              <Slider 
                                value={[starsCount ?? 5000]} 
                                min={1000} 
                                max={10000} 
                                step={100} 
                                onValueChange={(value) => setTheme({ starsCount: value[0] })}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Radius</label>
                                <span className="text-xs text-white/50">{starsRadius ?? 100}</span>
                              </div>
                              <Slider 
                                value={[starsRadius ?? 100]} 
                                min={50} 
                                max={200} 
                                step={5} 
                                onValueChange={(value) => setTheme({ starsRadius: value[0] })}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Depth</label>
                                <span className="text-xs text-white/50">{starsDepth ?? 50}</span>
                              </div>
                              <Slider 
                                value={[starsDepth ?? 50]} 
                                min={10} 
                                max={100} 
                                step={5} 
                                onValueChange={(value) => setTheme({ starsDepth: value[0] })}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Factor</label>
                                <span className="text-xs text-white/50">{starsFactor ?? 4}</span>
                              </div>
                              <Slider 
                                value={[starsFactor ?? 4]} 
                                min={1} 
                                max={10} 
                                step={0.5} 
                                onValueChange={(value) => setTheme({ starsFactor: value[0] })}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-white/70">Saturation</label>
                                <span className="text-xs text-white/50">{starsSaturation ?? 0}</span>
                              </div>
                              <Slider 
                                value={[starsSaturation ?? 0]} 
                                min={0} 
                                max={1} 
                                step={0.05} 
                                onValueChange={(value) => setTheme({ starsSaturation: value[0] })}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-white/70">Fade Effect</label>
                              <Switch 
                                checked={starsFade ?? true} 
                                onCheckedChange={(value) => setTheme({ starsFade: value })} 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'controls',
              label: 'Controls',
              icon: <FaSlidersH size={10} />,
              content: (
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    {/* <h3 className="text-sm font-medium text-white/90 mb-2">Settings</h3> */}
                    
                    {/* Gravity Control */}
                    <div className="flex items-center justify-between bg-black/20 p-2 rounded-md">
                      <div>
                        <label className="text-xs text-white/80 block">Enable Gravity</label>
                        <p className="text-white/50 text-xs mt-0.5">Fall to the ground when active</p>
                      </div>
                      <Switch
                        checked={gravityEnabled}
                        onCheckedChange={setGravityEnabled}
                      />
                    </div>
                    
                    {/* Movement Control */}
                    <div className="flex items-center justify-between bg-black/20 p-2 rounded-md">
                      <div>
                        <label className="text-xs text-white/80 block">Enable Movement</label>
                        <p className="text-white/50 text-xs mt-0.5">Allow navigation in 3D space</p>
                      </div>
                      <Switch
                        checked={movementEnabled}
                        onCheckedChange={setMovementEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between bg-black/20 p-2 rounded-md">
                      <div>
                        <label className="text-xs text-white/80 block">Show Frame Controls</label>
                        <p className="text-white/50 text-xs mt-0.5">Display website controls</p>
                      </div>
                      <Switch
                        checked={showFrameControls}
                        onCheckedChange={setShowFrameControls}
                      />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between p-2 mt-1 text-left text-xs hover:bg-white/10 transition-colors duration-200 border-white/10"
                      onClick={handleClearAllFrames}
                    >
                      <div>
                        <div className="font-medium text-xs text-white/80">Clear Frames</div>
                        <p className="text-white/50 text-xs mt-0.5">Remove all frames from the scene</p>
                      </div>
                      <FaChevronRight className="text-white/50 w-2 h-2" />
                    </Button>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>
      
      {/* Color picker dropdown */}
      {showColorPicker === 'crosshair' && (
        <div 
          ref={el => colorPickerRefs.current.crosshair = el} 
          className="p-3 border-t border-white/10 relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white/90">Cor da Mira</span>
            <div className="flex gap-2">
              <button 
                className="bg-transparent hover:bg-white/10 p-1.5 rounded text-white/80 flex items-center border border-white/20"
                onClick={() => {
                  handleColorChange('crosshair', 'transparent');
                }}
                title="Set transparent"
              >
                <FaEyeSlash size={12} className="mr-1.5" />
                <span className="text-xs">Transparent</span>
              </button>
              <button 
                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-white/80 flex items-center"
                onClick={() => setShowColorPicker(null)}
                title="Close color picker"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
          <div className="border border-white/10 rounded-md p-2 mb-3">
            <RgbaColorPicker 
              color={crosshairColor === 'transparent' ? { r: 255, g: 255, b: 255, a: 0 } : 
                     stringToRgba(crosshairColor)}
              onChange={(color) => handleColorChange('crosshair', color)} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
      
      <Spotlight 
        onAddFrame={handleAddFrame}
        onVisibilityChange={handleSpotlightVisibility}
        showInput={true}
      />
      
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
      
      {/* Adiciona a mira no centro da tela */}
      <Crosshair 
        visible={showCrosshair} 
        size={crosshairSize} 
        color={crosshairColor} 
        thickness={crosshairThickness} 
        style={crosshairStyle}
      />
    </div>
  );
};

export default Player;
