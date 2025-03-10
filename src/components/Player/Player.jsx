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

function Floor() {
  return (
    <Grid
      args={[30, 30]}
      cellSize={1}
      cellThickness={1}
      cellColor="#6366f1"
      sectionSize={5}
      sectionThickness={1.5}
      sectionColor="#818cf8"
      fadeDistance={30}
      fadeStrength={1}
      followCamera={false}
      position={[0, -2, 0]}
    />
  );
}

function getFramePositionAndRotation(camera) {
  // Get direction vector from camera
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  
  // Calculate position 3 units in front of camera (reduced from 5)
  const position = new THREE.Vector3();
  position.copy(camera.position);
  
  // Use direction for all axes, but with shorter distance
  direction.multiplyScalar(3);  // Changed from 5 to 3
  position.add(direction);
  
  // Keep y position within reasonable bounds
  position.y = Math.max(-1, Math.min(3, position.y));

  // Calculate rotation to match camera view
  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);
  
  return {
    position: [position.x, position.y, position.z],
    rotation: [euler.x, euler.y, euler.z]
  };
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
        // console.log(position, rotation);
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
      {/* Outer frame with depth indicator */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.1, 2.1]} />
        <meshBasicMaterial 
          color={isPositionConfirmed ? "#22c55e" : "#3b82f6"}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner frame */}
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
      {/* Corner markers with depth indicators */}
      {[[-1.5, 1], [1.5, 1], [-1.5, -1], [1.5, -1]].map((pos, i) => (
        <group key={i} position={[pos[0], pos[1], 0]}>
          {/* Main corner cube */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} />
          </mesh>
          {/* Depth line */}
          <mesh position={[0, 0, -0.15]}>
            <boxGeometry args={[0.02, 0.02, 0.3]} />
            <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} opacity={0.5} transparent />
          </mesh>
        </group>
      ))}
      {/* Center depth indicator */}
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[0.05, 0.05, 0.3]} />
        <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} opacity={0.3} transparent />
      </mesh>
      
      {/* Instrução para clicar */}
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

// Componente para expor a câmera globalmente
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
  
  // Sims-style UI state
  const [currentMode, setCurrentMode] = useState('live');
  const [showCatalog, setShowCatalog] = useState(false);
  const [movementEnabled, setMovementEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  
  // Estado para rastrear a URL selecionada no catálogo
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState(null);
  const [showFrameControls, setShowFrameControls] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(null);

  // Load frames from localStorage on component mount
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

  // Save frames to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('webview-frames', JSON.stringify(frames));
  }, [frames]);

  const handleAddFrame = (url, pos, rot) => {
    const position = pos || confirmedPosition;
    const rotation = rot || confirmedRotation;
    
    if (!position || !rotation) return;
    
    // console.log(position, rotation);

    setFrames(prevFrames => [...prevFrames, {
      id: Date.now(),
      url: url,
      position: position,
      rotation: rotation,
      originalPosition: position,
      originalRotation: rotation
    }]);
    
    // Reset confirmed position and rotation
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
    // console.log("Posição confirmada:", position, rotation);
    
    setConfirmedPosition(position);
    setConfirmedRotation(rotation);
    
    // Se houver uma URL pendente, adicione o website imediatamente
    if (pendingWebsiteUrl) {
      // Pequeno atraso para garantir feedback visual
      setTimeout(() => {
        handleAddFrame(pendingWebsiteUrl, position, rotation);
        // Após adicionar, podemos voltar ao modo live ou manter no build para adicionar mais
      }, 300);
    }
  };
  
  // Handle mode changes (The Sims style)
  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    
    // Enable movement in live mode, disable in build mode
    setMovementEnabled(mode === 'live');
    
    // If switching to build mode, start showing the preview
    if (mode === 'build') {
      setShowPreview(true);
      // Reset confirmed position when entering build mode
      setConfirmedPosition(null);
      setConfirmedRotation(null);
    } else {
      setShowPreview(false);
      // Clear pending website if switching out of build mode without placing
      if (pendingWebsiteUrl) {
        setPendingWebsiteUrl(null);
      }
      setConfirmedPosition(null);
      setConfirmedRotation(null);
    }
  };
  
  // Handle opening the catalog
  const handleOpenCatalog = () => {
    setShowCatalog(true);
    setMovementEnabled(false); // Disable movement when catalog is open
  };
  
  // Handle closing the catalog
  const handleCloseCatalog = () => {
    setShowCatalog(false);
    setMovementEnabled(true); // Re-enable movement when catalog is closed
  };
  
  // Show help menu
  const handleToggleHelp = () => {
    setShowHelp(!showHelp);
    setMovementEnabled(showHelp); // Enable movement when help is closed
  };
  
  // Cancelar a operação atual (Escape key)
  const handleCancel = () => {
    if (currentMode === 'build') {
      if (pendingWebsiteUrl) {
        // Se estiver tentando posicionar um website, cancele
        setPendingWebsiteUrl(null);
        setConfirmedPosition(null);
        setConfirmedRotation(null);
      } else {
        // Se estiver apenas no modo build, volte para o modo live
        handleModeChange('live');
      }
    }
  };
  
  // Handle keyboard shortcuts for Sims-style mode switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Catalog shortcut (Command + B)
      if (e.metaKey && e.key === 'b') {
        e.preventDefault();
        setShowCatalog(prev => !prev);
        setMovementEnabled(!showCatalog);
      }
      
      // Help shortcut (F1)
      if (e.key === 'F1') {
        e.preventDefault();
        handleToggleHelp();
      }
      
      // Number keys for mode switching
      if (e.key === '1') {
        handleModeChange('live');
      } else if (e.key === '2') {
        handleModeChange('build');
      }
      
      // Escape to cancel
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCatalog, showHelp, currentMode, pendingWebsiteUrl]);
  
  // Debug info
  // useEffect(() => {
  //   console.log("Estado atual:", {
  //     mode: currentMode,
  //     pendingWebsite: pendingWebsiteUrl,
  //     confirmedPosition,
  //     confirmedRotation,
  //     showPreview
  //   });
  // }, [currentMode, pendingWebsiteUrl, confirmedPosition, confirmedRotation, showPreview]);

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

  // Função simplificada para lidar com eventos de mídia
  const handleBoxFrameMediaDrag = (mediaData) => {
    console.log('📱 Media drag detectado:', mediaData);
    // Agora o BoxFrame envia diretamente para o Zustand store
  };
  
  const handleCloseFrame = (frameId) => {
    setFrames(prevFrames => prevFrames.filter(frame => frame.id !== frameId));
  };
  
  const handleClearAllFrames = () => {
    // Clear all frames
    setFrames([]);
    
    // Also clear all images
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

  return (
    <div 
      ref={canvasContainerRef}
      className="w-screen h-screen relative "
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 65 }} 
        className='z-0'
        frameloop="always"
        shadows
        onPointerMissed={() => setSelectedFrame(null)}
      >
        {/* <color attach="background" args={['#f0f0f0']} /> */}
        <ambientLight intensity={0.8} />
        <directionalLight castShadow position={[2.5, 8, 5]} intensity={1.5} shadow-mapSize={1024} />
        <FPSControls speed={5} enabled={movementEnabled} />
        
        {/* Componente para expor a câmera globalmente */}
        <CameraExposer />
        
        {/* Adicionar o ImageCloneManager antes dos WebFrames para garantir disponibilidade */}
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
      
      {/* Adicionar o Spotlight para gerenciar o atalho Cmd+T para adicionar novos frames */}
      <Spotlight 
        onAddFrame={handleAddFrame}
        onVisibilityChange={handleSpotlightVisibility}
        showInput={true}
      />
      
      {/* Mensagem de instrução quando estiver no modo build */}
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
      
      {/* Feedback quando confirmar a posição */}
      {currentMode === 'build' && confirmedPosition && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg">
          {pendingWebsiteUrl ? "Website posicionado! Escolha outro ou pressione 1 para voltar ao modo Live" : "Posição confirmada!"}
        </div>
      )}

      {/* <SimsControls 
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onCatalogOpen={handleOpenCatalog}
      /> */}
    </div>
  );
};

export default Player;
