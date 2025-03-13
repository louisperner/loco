import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Html, useGLTF, TransformControls, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useModelStore } from '../../store/useModelStore';

// Separate model component to use with Suspense and ErrorBoundary
function Model({ url, scale }) {
  const [modelUrl, setModelUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Processar URL conforme necessário
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        // Se o URL começar com file:// ou app-file://, tente carregá-lo com o Electron
        if ((url && url.startsWith('file://')) || (url && url.startsWith('app-file://'))) {
          console.log('Carregando modelo com Electron:', url);
          
          if (window.electron && window.electron.loadFileAsBlob) {
            const result = await window.electron.loadFileAsBlob(url);
            if (result.success) {
              console.log('Modelo carregado com sucesso, usando blob URL:', result.blobUrl);
              setModelUrl(result.blobUrl);
            } else {
              console.error('Erro ao carregar modelo com Electron:', result.error);
              setError(new Error(`Erro ao carregar modelo: ${result.error}`));
              // Manter URL original como fallback
              setModelUrl(url);
            }
          } else {
            console.warn('API Electron não disponível, usando URL original:', url);
            setModelUrl(url);
          }
        } else {
          // URL normal, manter como está
          setModelUrl(url);
        }
      } catch (error) {
        console.error('Erro ao processar URL do modelo:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModel();
  }, [url]);
  
  // Se estiver carregando ou houver erro, não tente carregar o modelo com THREE
  if (isLoading) {
    return null;
  }
  
  if (error) {
    throw error; // Deixe o ErrorBoundary lidar com isso
  }
  
  // Este componente suspenderá até que o modelo seja carregado
  const { scene } = useGLTF(modelUrl, undefined, (error) => {
    console.error('Erro ao carregar modelo com Three.js:', error, modelUrl);
    throw error; // Propagar o erro para o ErrorBoundary
  });
  
  const clonedScene = scene.clone();
  
  return (
    <primitive 
      object={clonedScene} 
      dispose={null}
      scale={scale}
    />
  );
}

// Fallback component for when model loading fails
function ModelFallback({ fileName, scale, errorDetails }) {
  return (
    <Box args={[1, 1, 1]} scale={scale}>
      <meshStandardMaterial color="#ff4d4d" />
      <Html
        position={[0, 1.5, 0]}
        center
        style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '4px', maxWidth: '200px' }}
      >
        <div style={{ fontSize: '10px', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Failed to load model<br/>
          <span style={{ fontSize: '8px', opacity: 0.7 }}>{fileName || 'Unknown file'}</span>
          {errorDetails && (
            <div style={{ fontSize: '7px', marginTop: '5px', color: '#ff9999', maxHeight: '40px', overflowY: 'auto' }}>
              {errorDetails}
            </div>
          )}
        </div>
      </Html>
    </Box>
  );
}

// Custom error boundary for model loading
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Registre o erro com detalhes adicionais para diagnóstico
    console.error(`Error loading model: ${error.message}`, errorInfo);
    
    // Se o erro for relacionado ao protocolo file://, forneça uma dica útil
    if (error.message && error.message.includes('file://')) {
      console.info('DICA: O erro pode estar relacionado a permissões de arquivo local. Verifique se você está usando o protocolo app-file:// ou configurou corretamente as permissões de segurança no Electron.');
    }
    
    // Se o erro for sobre CORS, forneça dicas específicas
    if (error.message && error.message.includes('CORS')) {
      console.info('DICA: O erro pode estar relacionado a restrições de CORS. No Electron, você pode configurar webSecurity: false nas webPreferences ou usar um protocolo personalizado.');
    }
  }

  render() {
    if (this.state.hasError) {
      // Exibir informações detalhadas no fallback
      return React.cloneElement(this.props.fallback, { 
        errorDetails: this.state.error ? this.state.error.message : 'Unknown error'
      });
    }

    return this.props.children;
  }
}

function ModelInScene({ 
  modelData, 
  onRemove, 
  onUpdate,
  selected = false,
  onSelect,
}) {
  const { 
    id, 
    url,
    fileName,
    position = [0, 0, 0], 
    rotation = [0, 0, 0], 
    scale: initialScale = 1 
  } = modelData;

  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');
  const [scale, setScale] = useState(initialScale);
  const groupRef = useRef();
  
  // Get camera for positioning
  const { camera } = useThree();

  // Apply scale to the model
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);

  // Handles when pointer hovers over the model
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  // Handles when pointer leaves the model
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Handle click to select this model
  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(id);
    }
  };

  // Control Panel component for the model
  const ControlPanel = () => (
    <Html
      transform
      distanceFactor={8}
      position={[0, 2, 0]}
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        padding: '8px',
        borderRadius: '4px',
        color: 'white',
        whiteSpace: 'nowrap',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowControls(!showControls);
        }}
        style={controlButtonStyle}
      >
        {showControls ? '🔒' : '🔓'}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (showControls) {
            setTransformMode(transformMode === 'translate' ? 'rotate' : 'translate');
          }
        }}
        style={{
          ...controlButtonStyle,
          opacity: showControls ? 1 : 0.5,
          cursor: showControls ? 'pointer' : 'not-allowed'
        }}
      >
        {transformMode === 'translate' ? '↔️' : '🔄'}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setScale(Math.min(scale + 0.1, 5));
          onUpdate({
            ...modelData,
            scale: Math.min(scale + 0.1, 5)
          });
        }}
        style={controlButtonStyle}
      >
        ➕
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setScale(Math.max(scale - 0.1, 0.1));
          onUpdate({
            ...modelData,
            scale: Math.max(scale - 0.1, 0.1)
          });
        }}
        style={controlButtonStyle}
      >
        ➖
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          
          // Position in front of camera
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          
          const newPosition = camera.position.clone().add(
            direction.multiplyScalar(3)
          );
          
          groupRef.current.position.copy(newPosition);
          
          // Look at camera
          const lookAtPosition = camera.position.clone();
          groupRef.current.lookAt(lookAtPosition);
          
          // Update model data
          onUpdate({
            ...modelData,
            position: [newPosition.x, newPosition.y, newPosition.z],
            rotation: [
              groupRef.current.rotation.x,
              groupRef.current.rotation.y,
              groupRef.current.rotation.z
            ]
          });
        }}
        style={controlButtonStyle}
      >
        📍
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onRemove) onRemove(id);
        }}
        style={{...controlButtonStyle, color: '#ff4d4d'}}
      >
        🗑️
      </button>
    </Html>
  );

  return (
    <>
      {/* Transform controls */}
      {showControls && selected && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.75}
          space="local"
          onObjectChange={() => {
            if (groupRef.current) {
              onUpdate({
                ...modelData,
                position: [
                  groupRef.current.position.x,
                  groupRef.current.position.y,
                  groupRef.current.position.z
                ],
                rotation: [
                  groupRef.current.rotation.x,
                  groupRef.current.rotation.y,
                  groupRef.current.rotation.z
                ]
              });
            }
          }}
        />
      )}

      {/* Model group */}
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Use Suspense and ErrorBoundary for model loading */}
        <ModelErrorBoundary 
          fallback={<ModelFallback fileName={fileName} scale={scale} />}
        >
          <Suspense fallback={<Box args={[0.8, 0.8, 0.8]} scale={scale}>
            <meshStandardMaterial color="#3b82f6" wireframe />
            <Html
              position={[0, 1.5, 0]}
              center
              style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '4px' }}
            >
              <div style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                Loading model...
              </div>
            </Html>
          </Box>}>
            <Model url={url} scale={scale} />
          </Suspense>
        </ModelErrorBoundary>

        {/* Only show controls when hovered or selected */}
        {(hovered || selected) && <ControlPanel />}
      </group>
    </>
  );
}

const controlButtonStyle = {
  background: 'transparent',
  border: '1px solid white',
  borderRadius: '4px',
  color: 'white',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s',
};

export default ModelInScene; 