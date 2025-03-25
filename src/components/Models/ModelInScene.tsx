import React, { useRef, useState, useEffect, Suspense, ReactElement } from 'react';
import { Html, useGLTF, TransformControls, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useModelStore } from '../../store/useModelStore';
import { Lock, Unlock, Move, RotateCw, Plus, Minus, MapPin, Trash2 } from 'lucide-react';

// Define types for props and data
export interface ModelDataType {
  id: string;
  url: string;
  fileName?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  [key: string]: any; // For any additional properties
}

interface ModelProps {
  url: string;
  scale: number;
}

interface ModelFallbackProps {
  fileName?: string;
  scale: number;
  errorDetails?: string;
}

interface ModelInSceneProps {
  modelData: ModelDataType;
  onRemove: (id: string) => void;
  onUpdate: (data: ModelDataType) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

interface ModelErrorBoundaryProps {
  children: React.ReactNode;
  fallback: ReactElement;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Separate model component to use with Suspense and ErrorBoundary
const Model: React.FC<ModelProps> = ({ url, scale }) => {
  const [modelUrl, setModelUrl] = useState<string>(url);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Process URL as needed
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        // If URL starts with file:// or app-file://, try to load it with Electron
        if ((url && url.startsWith('file://')) || (url && url.startsWith('app-file://'))) {
          // console.log('Loading model with Electron:', url);
          
          if (window.electron && window.electron.loadFileAsBlob) {
            const result = await window.electron.loadFileAsBlob(url);
            if (result.success) {
              // console.log('Model loaded successfully, using blob URL:', result.blobUrl);
              
              // Store the blob URL in a global cache to prevent garbage collection
              window._blobUrlCache = window._blobUrlCache || {};
              window._blobUrlCache[result.blobUrl] = true;
              
              setModelUrl(result.blobUrl);
            } else {
              console.error('Error loading model with Electron:', result.error);
              setError(new Error(`Error loading model: ${result.error}`));
              // Keep original URL as fallback
              setModelUrl(url);
            }
          } else {
            console.info('Browser environment detected, using alternative model URL');
            // In browser environment, handle file URLs appropriately
            if (url.startsWith('file://')) {
              // Use a placeholder model in browser mode
              setModelUrl('/placeholder-model.glb');
              setError(new Error('File system access not available in browser'));
            } else {
              // Try to use the URL directly
              setModelUrl(url);
            }
          }
        } else if (url && url.startsWith('blob:')) {
          // For blob URLs, ensure they're cached to prevent garbage collection
          console.log('Using blob URL directly:', url);
          window._blobUrlCache = window._blobUrlCache || {};
          window._blobUrlCache[url] = true;
          setModelUrl(url);
        } else {
          // Normal URL, keep as is
          setModelUrl(url);
        }
      } catch (error) {
        console.error('Error processing model URL:', error);
        if (error instanceof Error) {
          setError(error);
        } else {
          setError(new Error('Unknown error loading model'));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModel();
    
    // Cleanup function to revoke blob URLs when component unmounts
    return () => {
      if (modelUrl && modelUrl.startsWith('blob:') && window._blobUrlCache) {
        delete window._blobUrlCache[modelUrl];
        // Only revoke if no other components are using this blob URL
        if (!Object.values(window._blobUrlCache).some(v => v === modelUrl)) {
          try {
            URL.revokeObjectURL(modelUrl);
            console.log('Revoked blob URL:', modelUrl);
          } catch (e) {
            console.error('Error revoking blob URL:', e);
          }
        }
      }
    };
  }, [url]);
  
  // If loading or there's an error, don't try to load the model with THREE
  if (isLoading) {
    return null;
  }
  
  if (error) {
    throw error; // Let the ErrorBoundary handle it
  }
  
  // This component will suspend until the model is loaded
  const { scene } = useGLTF(modelUrl, undefined, undefined, (error: any) => {
    console.error('Error loading model with Three.js:', error, modelUrl);
    throw error; // Propagate the error to the ErrorBoundary
  });
  
  const clonedScene = scene.clone();
  
  return (
    <primitive 
      object={clonedScene} 
      dispose={null}
      scale={scale}
    />
  );
};

// Fallback component for when model loading fails
const ModelFallback: React.FC<ModelFallbackProps> = ({ fileName, scale, errorDetails }) => {
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
};

// Custom error boundary for model loading
class ModelErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error with additional details for diagnosis
    console.error(`Error loading model: ${error.message}`, errorInfo);
    
    // If the error is related to file:// protocol, provide a helpful hint
    if (error.message && error.message.includes('file://')) {
      console.info('HINT: The error may be related to local file permissions. Check if you are using the app-file:// protocol or have properly configured security permissions in Electron.');
    }
    
    // If the error is about CORS, provide specific hints
    if (error.message && error.message.includes('CORS')) {
      console.info('HINT: The error may be related to CORS restrictions. In Electron, you can configure webSecurity: false in webPreferences or use a custom protocol.');
    }
    
    // If the error is about Content Security Policy
    if (error.message && (error.message.includes('Content Security Policy') || error.message.includes('CSP'))) {
      console.info('HINT: The error is related to Content Security Policy (CSP). Check if your CSP allows blob: URLs in connect-src. Add "blob:" to the connect-src directive in your CSP.');
    }
    
    // If the error is about Failed to fetch
    if (error.message && error.message.includes('Failed to fetch')) {
      console.info('HINT: The "Failed to fetch" error may be related to network issues, CORS, or CSP. Check if the URL is accessible and if your CSP allows access to this resource.');
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Display detailed information in the fallback
      return React.cloneElement(this.props.fallback, { 
        errorDetails: this.state.error ? this.state.error.message : 'Unknown error'
      } as any);
    }

    return this.props.children;
  }
}

const ModelInScene: React.FC<ModelInSceneProps> = ({ 
  modelData, 
  onRemove, 
  onUpdate,
  selected = false,
  onSelect,
}) => {
  const { 
    id, 
    url,
    fileName,
    position = [0, 0, 0], 
    rotation = [0, 0, 0], 
    scale: initialScale = 1 
  } = modelData;

  const [hovered, setHovered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const groupRef = useRef<THREE.Group>(null);
  
  // Get camera for positioning
  const { camera } = useThree();

  // Apply scale to the model
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);

  // Handles when pointer hovers over the model
  const handlePointerOver = (e: any): void => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  // Handles when pointer leaves the model
  const handlePointerOut = (e: any): void => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Handle click to select this model
  const handleClick = (e: any): void => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(id);
    }
  };

  // Control Panel component for the model
  const ControlPanel: React.FC = () => (
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
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setShowControls(!showControls);
        }}
        style={controlButtonStyle}
      >
        {showControls ? <Lock size={16} /> : <Unlock size={16} />}
      </button>

      <button
        onClick={(e: React.MouseEvent) => {
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
        {transformMode === 'translate' ? <Move size={16} /> : <RotateCw size={16} />}
      </button>

      <button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          const newScale = Math.min(scale + 0.1, 5);
          setScale(newScale);
          onUpdate({
            ...modelData,
            scale: newScale
          });
        }}
        style={controlButtonStyle}
      >
        <Plus size={16} />
      </button>

      <button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          const newScale = Math.max(scale - 0.1, 0.1);
          setScale(newScale);
          onUpdate({
            ...modelData,
            scale: newScale
          });
        }}
        style={controlButtonStyle}
      >
        <Minus size={16} />
      </button>

      <button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          
          // Position in front of camera
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          
          const newPosition = camera.position.clone().add(
            direction.multiplyScalar(3)
          );
          
          if (groupRef.current) {
            groupRef.current.position.copy(newPosition);
            
            // Look at camera
            const lookAtPosition = camera.position.clone();
            groupRef.current.lookAt(lookAtPosition);
            
            // Update model data
            onUpdate({
              ...modelData,
              position: [newPosition.x, newPosition.y, newPosition.z] as [number, number, number],
              rotation: [
                groupRef.current.rotation.x,
                groupRef.current.rotation.y,
                groupRef.current.rotation.z
              ] as [number, number, number]
            });
          }
        }}
        style={controlButtonStyle}
      >
        <MapPin size={16} />
      </button>

      <button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRemove(id);
        }}
        style={{...controlButtonStyle, color: '#ff4d4d'}}
      >
        <Trash2 size={16} />
      </button>
    </Html>
  );

  return (
    <>
      {/* Transform controls */}
      {showControls && selected && groupRef.current && (
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
                ] as [number, number, number],
                rotation: [
                  groupRef.current.rotation.x,
                  groupRef.current.rotation.y,
                  groupRef.current.rotation.z
                ] as [number, number, number]
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
        userData={{ type: 'model', id: id }}
        name={`model-${id}`}
      >
        {/* Add invisible mesh for raycasting */}
        <mesh name={`model-collider-${id}`}>
          <boxGeometry args={[5, 5, 5]} />
          <meshBasicMaterial 
            visible={false} 
            transparent={true} 
            opacity={0} 
            side={THREE.DoubleSide}
            alphaTest={0.5}
          />
        </mesh>
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

const controlButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid white',
  borderRadius: '4px',
  color: 'white',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default ModelInScene; 