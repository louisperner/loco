import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html, Grid, OrbitControls, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCodeStore } from '../../store/CodeStore';
import WebFrames from './WebFrames';
import Spotlight from './Spotlight';
import FPSControls from './FPSControls';
import ImageCloneManager from './ImageCloneManager';
import MessageManager from './MessageManager';
import { useImageStore } from '../../store/useImageStore';
import { FaCog, FaTimes, FaUndo, FaPalette, FaSlidersH, FaCheck, FaChevronRight, FaMagic, FaLayerGroup, FaAdjust } from 'react-icons/fa';
import { useThemeStore } from '../../store/ThemeStore';

function Floor() {
  const floorColor = useThemeStore(state => state.floorColor);
  const gridColor = useThemeStore(state => state.gridColor);
  const floorPlaneColor = useThemeStore(state => state.floorPlaneColor);
  const floorOpacity = useThemeStore(state => state.floorOpacity);
  const gridOpacity = useThemeStore(state => state.gridOpacity);
  const floorPlaneOpacity = useThemeStore(state => state.floorPlaneOpacity);
  const getColorWithOpacity = useThemeStore(state => state.getColorWithOpacity);
  
  const gridColorWithOpacity = getColorWithOpacity(gridColor, gridOpacity);
  const floorColorWithOpacity = getColorWithOpacity(floorColor, floorOpacity);
  const floorPlaneColorWithOpacity = getColorWithOpacity(floorPlaneColor, floorPlaneOpacity);
  
  return (
    <>
      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={1}
        cellColor={gridColorWithOpacity}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={gridColorWithOpacity}
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        position={[0, -2, 0]}
      />
      <Plane 
        args={[30, 30]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={floorColor}
          opacity={floorPlaneOpacity / 100}
          transparent={true}
        />
      </Plane>
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

function CameraExposer() {
  const { camera } = useThree();
  
  useEffect(() => {
    window.mainCamera = camera;
    return () => {
      window.mainCamera = undefined;
    };
  }, [camera]);
  
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

  // Obter funções e estados da ThemeStore
  const { 
    floorColor, 
    gridColor, 
    backgroundColor,
    floorPlaneColor,
    floorOpacity,
    gridOpacity,
    backgroundOpacity,
    floorPlaneOpacity,
    setFloorColor,
    setGridColor,
    setBackgroundColor,
    setFloorPlaneColor,
    setFloorOpacity,
    setGridOpacity,
    setBackgroundOpacity,
    setFloorPlaneOpacity,
    getColorWithOpacity,
    resetColors
  } = useThemeStore();

  // Estados para feedback visual
  const [colorChanged, setColorChanged] = useState(null);
  const [activeTab, setActiveTab] = useState('cores'); // 'controles' ou 'cores'
  const [isResetAnimating, setIsResetAnimating] = useState(false);
  
  // Referência para o tema selecionado
  const [selectedTheme, setSelectedTheme] = useState(null);
  
  // Temas pré-definidos estilo Apple
  const predefinedThemes = [
    { 
      id: 'dark', 
      name: 'Space Dark', 
      floor: '#323842', 
      grid: '#484f5e',
      bg: '#1a1d24',
      preview: 'bg-gradient-to-br from-gray-800 to-gray-900'
    },
    { 
      id: 'blue', 
      name: 'Ocean Blue', 
      floor: '#2e5c8a', 
      grid: '#4a7daf',
      bg: '#1a3b5f',
      preview: 'bg-gradient-to-br from-blue-900 to-blue-800'
    },
    { 
      id: 'purple', 
      name: 'Cosmic Purple', 
      floor: '#4f3b78', 
      grid: '#6d5496',
      bg: '#2d1f4a',
      preview: 'bg-gradient-to-br from-purple-900 to-purple-800'
    },
    { 
      id: 'green', 
      name: 'Forest Green', 
      floor: '#2d5f4d', 
      grid: '#3d7a66',
      bg: '#1a3c2e',
      preview: 'bg-gradient-to-br from-green-900 to-green-800'
    }
  ];

  // Ajuste para controlar o estado do canvas
  const [canvasInteractive, setCanvasInteractive] = useState(true);
  
  useEffect(() => {
    const savedFrames = localStorage.getItem('webview-frames');
    if (savedFrames) {
      try {
        const parsedFrames = JSON.parse(savedFrames);
        setFrames(parsedFrames);
      } catch (error) {
        console.error('Error loading frames from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('webview-frames', JSON.stringify(frames));
  }, [frames]);

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
  
  const handleColorChange = (colorType, value) => {
    switch(colorType) {
      case 'floor':
        setFloorColor(value);
        break;
      case 'grid':
        setGridColor(value);
        break;
      case 'background':
        setBackgroundColor(value);
        break;
      case 'floorPlane':
        setFloorPlaneColor(value);
        break;
      default:
        return;
    }
    
    // Reset selected theme since we're customizing
    setSelectedTheme(null);
    
    // Mostra feedback visual
    setColorChanged(colorType);
    setTimeout(() => setColorChanged(null), 800);
  };
  
  const handleResetColors = () => {
    resetColors();
    setSelectedTheme(null);
    setIsResetAnimating(true);
    setColorChanged('all');
    setTimeout(() => {
      setColorChanged(null);
      setIsResetAnimating(false);
    }, 800);
  };
  
  const applyTheme = (theme) => {
    setFloorColor(theme.floor);
    setGridColor(theme.grid);
    setBackgroundColor(theme.bg);
    setFloorPlaneColor(theme.floorPlane || "#191f2a80");
    setSelectedTheme(theme.id);
    
    // Reset opacities
    setFloorOpacity(100);
    setGridOpacity(100);
    setBackgroundOpacity(100);
    setFloorPlaneOpacity(theme.floorPlaneOpacity || 50);
    
    // Animação de feedback
    setColorChanged('all');
    setTimeout(() => setColorChanged(null), 800);
  };

  // Renderizar componente de slider de opacidade
  const OpacitySlider = ({ label, value, onChange, color }) => (
    <div className="flex items-center space-x-2 mt-2">
      <div className="w-6 text-xs text-white/60">{value}%</div>
      <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <input 
          type="range"
          min="0" 
          max="100"
          value={value}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onChange(parseInt(e.target.value));
          }}
          className="w-full appearance-none cursor-pointer bg-transparent absolute inset-0 h-full"
          style={{
            WebkitAppearance: 'none',
            background: 'transparent'
          }}
        />
        <div 
          className="absolute inset-y-0 rounded-full transition-all duration-200"
          style={{ 
            width: `${value}%`, 
            backgroundColor: color || '#3b82f6'
          }}
        />
      </div>
      <div className="w-6 text-xs text-right text-white/60">α</div>
    </div>
  );

  return (
    <div 
      ref={canvasContainerRef}
      className="w-screen h-screen relative"
      style={{ 
        backgroundColor: getColorWithOpacity(backgroundColor, backgroundOpacity) 
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 65 }} 
        className={`z-0 ${canvasInteractive ? '' : 'pointer-events-none'}`}
        frameloop="always"
        // shadows
        onPointerMissed={() => setSelectedFrame(null)}
      >
        <FrameRateLimiter />
        <ambientLight intensity={0.8} />
        <directionalLight castShadow position={[2.5, 8, 5]} intensity={1.5} shadow-mapSize={1024} />
        <FPSControls speed={5} enabled={movementEnabled} />
        
        <CameraExposer />
        
        <ImageCloneManager />
        
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
        <Floor />
      </Canvas>
      
      {/* Botão de configurações com estilo Apple */}
      <button 
        className="fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full p-3 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10"
        onClick={toggleSettings}
        title="Configurações"
      >
        <FaCog className="w-5 h-5" />
      </button>
      
      {/* Overlay semi-transparente quando o painel está aberto */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleSettings}
        />
      )}
      
      {/* Painel Lateral de Configurações estilo Apple/shadcn */}
      <div 
        className={`fixed top-0 right-0 h-full z-50 overflow-hidden transition-all duration-500 ease-out ${
          showSettings ? 'w-96 translate-x-0' : 'w-0 translate-x-full'
        }`}
        onClick={handlePanelClick}
      >
        <div className="h-full min-w-96 bg-black/40 backdrop-blur-xl shadow-2xl border-l border-white/10">
          <div className="p-8 text-white h-full flex flex-col">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-light tracking-wide text-white/90">
                Configurações
              </h2>
              <button 
                className="text-white/70 hover:text-white/90 transition-colors duration-200 rounded-full p-2 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSettings();
                }}
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            {/* Navegação por abas estilo Apple */}
            <div className="flex space-x-1 mb-8 p-1 bg-white/10 rounded-lg">
              <button 
                className={`flex-1 flex justify-center items-center py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'cores' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-white/70 hover:text-white/90 hover:bg-white/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('cores');
                }}
              >
                <FaPalette className={`mr-2 ${activeTab === 'cores' ? 'text-black' : ''}`} /> 
                Aparência
              </button>
              <button 
                className={`flex-1 flex justify-center items-center py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'controles' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-white/70 hover:text-white/90 hover:bg-white/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('controles');
                }}
              >
                <FaSlidersH className={`mr-2 ${activeTab === 'controles' ? 'text-black' : ''}`} /> 
                Controles
              </button>
            </div>
            
            {/* Conteúdo das abas */}
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {/* Aba de Cores */}
              {activeTab === 'cores' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Temas pré-definidos */}
                  <div>
                    <h3 className="text-lg font-light mb-4 text-white/90 flex items-center">
                      <FaMagic className="mr-2 text-blue-400" /> Temas
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {predefinedThemes.map(theme => (
                        <button
                          key={theme.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyTheme(theme);
                          }}
                          className={`relative rounded-xl p-4 transition-all duration-200 ${theme.preview} hover:scale-105 ${
                            selectedTheme === theme.id ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black/50' : 'hover:ring-1 hover:ring-white/20'
                          }`}
                        >
                          <div className="flex flex-col h-24">
                            <div className="flex-1"></div>
                            <div className="text-white/90 text-sm font-medium">{theme.name}</div>
                            {selectedTheme === theme.id && (
                              <div className="absolute top-2 right-2 text-blue-400">
                                <FaCheck className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-light text-white/90">Personalizar</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetColors();
                        }}
                        className={`text-blue-400 hover:text-blue-300 flex items-center text-xs transition-all duration-200 rounded-full px-3 py-1 hover:bg-blue-900/20 ${isResetAnimating ? 'animate-pulse' : ''}`}
                        title="Restaurar cores padrão"
                      >
                        <FaUndo className="mr-1" /> Cores padrão
                      </button>
                    </div>
                  </div>
                  
                  {/* Visualização combinada aprimorada */}
                  <div className="mb-6">
                    <div className="relative rounded-xl overflow-hidden shadow-lg border border-white/10">
                      <div 
                        className="aspect-video p-6 flex items-center justify-center"
                        style={{ backgroundColor: getColorWithOpacity(backgroundColor, backgroundOpacity) }}
                      >
                        <div className="w-3/4 h-1/2 relative overflow-hidden rounded-lg shadow-inner border border-white/10">
                          <div 
                            className="absolute inset-0 opacity-80"
                            style={{ 
                              background: `
                              linear-gradient(to bottom, transparent, ${getColorWithOpacity(floorColor, floorOpacity)}60),
                              repeating-linear-gradient(
                                0deg,
                                ${getColorWithOpacity(gridColor, gridOpacity)},
                                ${getColorWithOpacity(gridColor, gridOpacity)} 1px,
                                transparent 1px,
                                transparent 20px
                              ),
                              repeating-linear-gradient(
                                90deg,
                                ${getColorWithOpacity(gridColor, gridOpacity)},
                                ${getColorWithOpacity(gridColor, gridOpacity)} 1px,
                                transparent 1px,
                                transparent 20px
                              )`,
                              backgroundColor: getColorWithOpacity(floorPlaneColor, floorPlaneOpacity) 
                            }}
                          />
                          {colorChanged === 'all' && (
                            <div className="absolute inset-0 bg-blue-400/20 animate-pulse flex items-center justify-center">
                              <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 text-xs text-white animate-bounce shadow-lg">
                                <FaCheck className="inline mr-1" /> Aplicado
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seletores detalhados de cor */}
                  <div className="space-y-6">
                    {/* Cor do Chão */}
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium text-sm text-white/80">Cor do Chão</label>
                        <span className="text-xs bg-black/30 text-white/70 py-1 px-2 rounded-full">{floorColor}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('floorColorPicker').click();
                          }}
                          className={`w-10 h-10 rounded-full cursor-pointer shadow-inner transition-transform duration-200 ${colorChanged === 'floor' ? 'scale-110 ring-2 ring-white/30' : 'hover:scale-105'}`}
                          style={{ backgroundColor: floorColor }}
                        />
                        <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <input 
                            type="range"
                            min="0" 
                            max="360"
                            value={floorColor.startsWith('#') ? 0 : parseInt(floorColor.match(/\d+/)?.[0] || '0')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const hue = e.target.value;
                              handleColorChange('floor', `hsl(${hue}, 60%, 40%)`);
                            }}
                            className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 w-full h-full"/>
                          <div 
                            className="absolute inset-y-0 w-2 h-2 bg-white rounded-full shadow-md -ml-1 pointer-events-none transition-all duration-100"
                            style={{ 
                              left: `${floorColor.startsWith('#') ? 0 : parseInt(floorColor.match(/\d+/)?.[0] || '0') / 3.6}%` 
                            }}
                          />
                        </div>
                        <input 
                          id="floorColorPicker"
                          type="color" 
                          value={floorColor.startsWith('#') ? floorColor : '#6366f1'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleColorChange('floor', e.target.value);
                          }}
                          className="sr-only"
                        />
                      </div>
                      <OpacitySlider 
                        value={floorOpacity} 
                        onChange={(value) => {
                          setFloorOpacity(value);
                          setSelectedTheme(null);
                        }}
                        color={floorColor}
                      />
                    </div>
                    
                    {/* Cor da Grid */}
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium text-sm text-white/80">Cor da Grid</label>
                        <span className="text-xs bg-black/30 text-white/70 py-1 px-2 rounded-full">{gridColor}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('gridColorPicker').click();
                          }}
                          className={`w-10 h-10 rounded-full cursor-pointer shadow-inner transition-transform duration-200 ${colorChanged === 'grid' ? 'scale-110 ring-2 ring-white/30' : 'hover:scale-105'}`} 
                          style={{ backgroundColor: gridColor }}
                        />
                        <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <input 
                            type="range"
                            min="0" 
                            max="360"
                            value={gridColor.startsWith('#') ? 0 : parseInt(gridColor.match(/\d+/)?.[0] || '0')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const hue = e.target.value;
                              handleColorChange('grid', `hsl(${hue}, 60%, 50%)`);
                            }}
                            className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 w-full h-full"/>
                          <div 
                            className="absolute inset-y-0 w-2 h-2 bg-white rounded-full shadow-md -ml-1 pointer-events-none transition-all duration-100"
                            style={{ 
                              left: `${gridColor.startsWith('#') ? 0 : parseInt(gridColor.match(/\d+/)?.[0] || '0') / 3.6}%` 
                            }}
                          />
                        </div>
                        <input 
                          id="gridColorPicker"
                          type="color" 
                          value={gridColor.startsWith('#') ? gridColor : '#818cf8'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleColorChange('grid', e.target.value);
                          }}
                          className="sr-only"
                        />
                      </div>
                      <OpacitySlider 
                        value={gridOpacity} 
                        onChange={(value) => {
                          setGridOpacity(value);
                          setSelectedTheme(null);
                        }}
                        color={gridColor}
                      />
                    </div>
                    
                    {/* Cor do Plano */}
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium text-sm text-white/80">Cor do Plano</label>
                        <span className="text-xs bg-black/30 text-white/70 py-1 px-2 rounded-full">{floorColor}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('floorColorPicker').click();
                          }}
                          className={`w-10 h-10 rounded-full cursor-pointer shadow-inner transition-transform duration-200 ${colorChanged === 'floor' ? 'scale-110 ring-2 ring-white/30' : 'hover:scale-105'}`}
                          style={{ backgroundColor: floorColor }}
                        />
                        <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <input 
                            type="range"
                            min="0" 
                            max="360"
                            value={floorColor.startsWith('#') ? 0 : parseInt(floorColor.match(/\d+/)?.[0] || '0')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const hue = e.target.value;
                              handleColorChange('floor', `hsl(${hue}, 60%, 40%)`);
                            }}
                            className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 w-full h-full"/>
                          <div 
                            className="absolute inset-y-0 w-2 h-2 bg-white rounded-full shadow-md -ml-1 pointer-events-none transition-all duration-100"
                            style={{ 
                              left: `${floorColor.startsWith('#') ? 0 : parseInt(floorColor.match(/\d+/)?.[0] || '0') / 3.6}%` 
                            }}
                          />
                        </div>
                        <input 
                          id="floorColorPicker"
                          type="color" 
                          value={floorColor.startsWith('#') ? floorColor : '#6366f1'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleColorChange('floor', e.target.value);
                          }}
                          className="sr-only"
                        />
                      </div>
                      <OpacitySlider 
                        value={floorOpacity} 
                        onChange={(value) => {
                          setFloorOpacity(value);
                          setSelectedTheme(null);
                        }}
                        color={floorColor}
                      />
                    </div>
                    
                    {/* Cor do Plano de Fundo */}
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium text-sm text-white/80">Cor do Plano</label>
                        <span className="text-xs bg-black/30 text-white/70 py-1 px-2 rounded-full">{floorPlaneColor}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('floorPlaneColorPicker').click();
                          }}
                          className={`w-10 h-10 rounded-full cursor-pointer shadow-inner transition-transform duration-200 ${colorChanged === 'floorPlane' ? 'scale-110 ring-2 ring-white/30' : 'hover:scale-105'}`}
                          style={{ backgroundColor: floorPlaneColor }}
                        />
                        <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <input 
                            type="range"
                            min="0" 
                            max="360"
                            value={floorPlaneColor.startsWith('#') ? 0 : parseInt(floorPlaneColor.match(/\d+/)?.[0] || '0')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const hue = e.target.value;
                              handleColorChange('floorPlane', `hsl(${hue}, 40%, 20%)`);
                            }}
                            className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 w-full h-full"/>
                          <div 
                            className="absolute inset-y-0 w-2 h-2 bg-white rounded-full shadow-md -ml-1 pointer-events-none transition-all duration-100"
                            style={{ 
                              left: `${floorPlaneColor.startsWith('#') ? 0 : parseInt(floorPlaneColor.match(/\d+/)?.[0] || '0') / 3.6}%` 
                            }}
                          />
                        </div>
                        <input 
                          id="floorPlaneColorPicker"
                          type="color" 
                          value={floorPlaneColor.startsWith('#') ? floorPlaneColor : '#191f2a'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleColorChange('floorPlane', e.target.value);
                          }}
                          className="sr-only"
                        />
                      </div>
                      <OpacitySlider 
                        value={floorPlaneOpacity} 
                        onChange={(value) => {
                          setFloorPlaneOpacity(value);
                          setSelectedTheme(null);
                        }}
                        color={floorPlaneColor}
                      />
                    </div>
                    
                    {/* Cor de Fundo da Cena */}
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium text-sm text-white/80">Cor de Fundo da Cena</label>
                        <span className="text-xs bg-black/30 text-white/70 py-1 px-2 rounded-full">{backgroundColor}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('bgColorPicker').click();
                          }}
                          className={`w-10 h-10 rounded-full cursor-pointer shadow-inner transition-transform duration-200 ${colorChanged === 'background' ? 'scale-110 ring-2 ring-white/30' : 'hover:scale-105'}`} 
                          style={{ backgroundColor: backgroundColor }}
                        />
                        <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <input 
                            type="range"
                            min="0" 
                            max="360"
                            value={backgroundColor.startsWith('#') ? 0 : parseInt(backgroundColor.match(/\d+/)?.[0] || '0')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const hue = e.target.value;
                              handleColorChange('background', `hsl(${hue}, 80%, 10%)`);
                            }}
                            className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 w-full h-full"/>
                          <div 
                            className="absolute inset-y-0 w-2 h-2 bg-white rounded-full shadow-md -ml-1 pointer-events-none transition-all duration-100"
                            style={{ 
                              left: `${backgroundColor.startsWith('#') ? 0 : parseInt(backgroundColor.match(/\d+/)?.[0] || '0') / 3.6}%` 
                            }}
                          />
                        </div>
                        <input 
                          id="bgColorPicker"
                          type="color" 
                          value={backgroundColor.startsWith('#') ? backgroundColor : '#000000'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleColorChange('background', e.target.value);
                          }}
                          className="sr-only"
                        />
                      </div>
                      <OpacitySlider 
                        value={backgroundOpacity} 
                        onChange={(value) => {
                          setBackgroundOpacity(value);
                          setSelectedTheme(null);
                        }}
                        color={backgroundColor}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Aba de Controles estilo shadcn */}
              {activeTab === 'controles' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-light text-white/90 mb-6">Configurações</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium text-sm text-white/80">Habilitar Movimento</label>
                          <p className="text-white/50 text-xs mt-1">Permite navegar pelo espaço 3D</p>
                        </div>
                        <div className="relative inline-block h-6 w-11">
                          <input 
                            type="checkbox" 
                            id="toggle-movement"
                            checked={movementEnabled} 
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setMovementEnabled(prev => !prev);
                            }}
                            className="sr-only"
                          />
                          <label 
                            htmlFor="toggle-movement"
                            onClick={(e) => e.stopPropagation()}
                            className={`
                              absolute inset-0 rounded-full cursor-pointer transition-all duration-300
                              ${movementEnabled ? 'bg-blue-500' : 'bg-white/20'}
                            `}
                          >
                            <span 
                              className={`
                                absolute top-0.5 left-0.5 bg-white h-5 w-5 rounded-full shadow-md transform transition-transform duration-300
                                ${movementEnabled ? 'translate-x-5' : 'translate-x-0'}
                              `}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium text-sm text-white/80">Mostrar Controles de Frame</label>
                          <p className="text-white/50 text-xs mt-1">Exibe os controles dos websites</p>
                        </div>
                        <div className="relative inline-block h-6 w-11">
                          <input 
                            type="checkbox" 
                            id="toggle-frame-controls"
                            checked={showFrameControls} 
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setShowFrameControls(prev => !prev);
                            }}
                            className="sr-only"
                          />
                          <label 
                            htmlFor="toggle-frame-controls"
                            onClick={(e) => e.stopPropagation()}
                            className={`
                              absolute inset-0 rounded-full cursor-pointer transition-all duration-300
                              ${showFrameControls ? 'bg-blue-500' : 'bg-white/20'}
                            `}
                          >
                            <span 
                              className={`
                                absolute top-0.5 left-0.5 bg-white h-5 w-5 rounded-full shadow-md transform transition-transform duration-300
                                ${showFrameControls ? 'translate-x-5' : 'translate-x-0'}
                              `}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Item do menu com chevron */}
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      <button 
                        className="w-full p-4 text-left hover:bg-white/10 transition-colors duration-200 flex justify-between items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearAllFrames();
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm text-white/80">Limpar Frames</div>
                          <p className="text-white/50 text-xs mt-1">Remove todos os frames da cena</p>
                        </div>
                        <FaChevronRight className="text-white/50 w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Rodapé */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <div className="text-xs text-white/40 text-center">
                {colorChanged === 'all' && (
                  <div className="text-blue-400 animate-pulse mb-1">Configurações aplicadas</div>
                )}
                <span className="font-light tracking-wide">Seu espaço virtual • Design by Loco</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Spotlight 
        onAddFrame={handleAddFrame}
        onVisibilityChange={handleSpotlightVisibility}
        showInput={true}
      />
      
      {currentMode === 'build' && !confirmedPosition && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center">
          <span>
            {pendingWebsiteUrl ? "Mova-se para posicionar o website e clique para confirmar" : "Selecione um website do catálogo ou use Cmd+B para abrir o catálogo"}
          </span>
          {pendingWebsiteUrl && (
            <button 
              onClick={handleCancel}
              className="ml-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              title="Cancelar posicionamento (Esc)"
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
          {pendingWebsiteUrl ? "Website posicionado! Escolha outro ou pressione 1 para voltar ao modo Live" : "Posição confirmada!"}
        </div>
      )}
    </div>
  );
};

export default Player;
