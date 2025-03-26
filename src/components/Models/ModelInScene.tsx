import React, { useRef, useState, useEffect, Suspense, ReactElement } from 'react';
import { Html, useGLTF, TransformControls, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Lock, Unlock, Move, RotateCw, Plus, Minus, MapPin, Trash2 } from 'lucide-react';

// Define types for props and data
export interface ModelDataType {
  id: string;
  url: string;
  fileName?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  [key: string]: unknown; // For any additional properties
}

// Add Electron API type declaration
declare global {
  interface Window {
    electron?: {
      loadFileAsBlob: (url: string) => Promise<{
        success: boolean;
        blobUrl?: string;
        error?: string;
      }>;
      [key: string]: any;
    };
    _blobUrlCache?: Record<string, any>;
  }
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
  fallback: ReactElement<ModelFallbackProps>;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Separate model component to use with Suspense and ErrorBoundary
const Model: React.FC<ModelProps> = ({ url, scale }) => {
  const [error, setError] = useState<Error | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(true);
  const [processedUrl, setProcessedUrl] = useState<string>('/placeholder-model.glb');
  
  // Process the URL before loading the model
  useEffect(() => {
    let isMounted = true;
    
    const processUrl = async () => {
      if (!isMounted) return;
      
      setIsConverting(true);
      try {
        // Handle different URL protocols
        if (url.startsWith('file://') || url.startsWith('app-file://')) {
          // In Electron environment
          if (window.electron && typeof window.electron.loadFileAsBlob === 'function') {
            try {
              const result = await window.electron.loadFileAsBlob(url);
              if (result.success && result.blobUrl && isMounted) {
                // Cache the blob URL
                window._blobUrlCache = window._blobUrlCache || {};
                window._blobUrlCache[result.blobUrl] = true;
                
                setProcessedUrl(result.blobUrl);
              } else if (isMounted) {
                console.error('Electron API returned error:', result.error);
                setError(new Error(`Failed to load model: ${result.error || 'Unknown error'}`));
                setProcessedUrl('/placeholder-model.glb');
              }
            } catch (electronError) {
              if (isMounted) {
                console.error('Error with Electron API:', electronError);
                setError(new Error(`Error with Electron API: ${electronError}`));
                setProcessedUrl('/placeholder-model.glb');
              }
            }
          } else if (isMounted) {
            // Browser environment
            console.warn('Electron API not available for file:// or app-file:// protocol');
            setError(new Error('File system access not available in browser'));
            setProcessedUrl('/placeholder-model.glb');
          }
        } else if (url.startsWith('blob:') && isMounted) {
          // Already a blob URL
          window._blobUrlCache = window._blobUrlCache || {};
          window._blobUrlCache[url] = true;
          setProcessedUrl(url);
        } else if (isMounted) {
          // Normal http/https URL
          setProcessedUrl(url);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error processing URL:', error);
          setError(error instanceof Error ? error : new Error('Unknown error processing URL'));
          setProcessedUrl('/placeholder-model.glb');
        }
      } finally {
        if (isMounted) {
          setIsConverting(false);
        }
      }
    };
    
    processUrl();
    
    return () => {
      isMounted = false;
      
      // Cleanup blob URLs
      if (processedUrl && processedUrl.startsWith('blob:') && window._blobUrlCache) {
        delete window._blobUrlCache[processedUrl];
        
        // Only revoke if no other components are using it
        if (!Object.values(window._blobUrlCache).some(v => v === processedUrl)) {
          try {
            URL.revokeObjectURL(processedUrl);
          } catch (e) {
            // Error revoking URL
          }
        }
      }
    };
  }, [url]);
  
  // If error happened during URL conversion
  if (error) {
    throw error;
  }
  
  // Show loading indicator if still converting URL
  if (isConverting) {
    return null; // Let Suspense fallback handle it
  }
  
  // Return the actual model component with the processed URL
  return <ActualModel url={processedUrl} scale={scale} />;
};

// Component that actually loads the model using useGLTF
const ActualModel: React.FC<ModelProps> = ({ url, scale }) => {
  // Now we can safely use useGLTF with a properly processed URL
  const { scene } = useGLTF(url);
  return (
    <primitive 
      object={scene.clone()} 
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

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Display detailed information in the fallback
      return React.cloneElement(this.props.fallback, { 
        errorDetails: this.state.error ? this.state.error.message : 'Unknown error'
      });
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
  const handlePointerOver = (e: { nativeEvent: PointerEvent }): void => {
    if (e.nativeEvent) e.nativeEvent.stopPropagation?.();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  // Handles when pointer leaves the model
  const handlePointerOut = (e: { nativeEvent: PointerEvent }): void => {
    if (e.nativeEvent) e.nativeEvent.stopPropagation?.();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Handle click to select this model
  const handleClick = (e: { nativeEvent: MouseEvent }): void => {
    if (e.nativeEvent) e.nativeEvent.stopPropagation?.();
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