import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Html, useGLTF, TransformControls, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Lock, Unlock, Move, RotateCw, Plus, Minus, MapPin, Trash2 } from 'lucide-react';
import { 
  ModelProps, 
  ModelFallbackProps, 
  ModelInSceneProps 
} from './types';
import ErrorBoundary from './ErrorBoundary';
import { processFileUrl, controlButtonStyle } from './utils';
import LoadingIndicator from '../Scene/LoadingIndicator';

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
        const result = await processFileUrl(url);
        if (isMounted) {
          if (result.error) {
            setError(result.error);
          }
          setProcessedUrl(result.processedUrl);
        }
      } catch (error) {
        if (isMounted) {
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
    };
  }, [url]);
  
  // If error happened during URL conversion
  if (error) {
    throw error;
  }
  
  // Show loading indicator if still converting URL
  if (isConverting) {
    return <LoadingIndicator message="Converting..." />;
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
    position: initialPosition = [0, 0, 0], 
    rotation: initialRotation = [0, 0, 0], 
    scale: initialScale = 1 
  } = modelData;

  const [hovered, setHovered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const groupRef = useRef<THREE.Group>(null);
  const pointerTimerRef = useRef<number | null>(null);
  const boundingBoxRef = useRef<THREE.Box3 | null>(null);
  const lastRaycastTime = useRef<number>(0);
  const RAY_THROTTLE = 100; // ms between raycasts
  
  // Get camera for positioning
  const { camera } = useThree();

  // Set initial position based on camera direction
  useEffect(() => {
    if (groupRef.current) {
      // Only set initial position if it's a new model (position is [0,0,0])
      if (initialPosition[0] === 0 && initialPosition[1] === 0 && initialPosition[2] === 0) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        // Position the model 2 units in front of the camera
        const distance = 5;
        const position = new THREE.Vector3();
        position.copy(camera.position).add(cameraDirection.multiplyScalar(distance));
        
        groupRef.current.position.copy(position);
        
        // Make the model face the camera
        groupRef.current.lookAt(camera.position);
        
        // Save the initial position and rotation
        const currentRotation: [number, number, number] = [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        ];

        onUpdate({
          ...modelData,
          position: [position.x, position.y, position.z],
          rotation: currentRotation
        });
      } else {
        // For existing models, set the saved position and make it look at camera
        groupRef.current.position.set(...initialPosition);
        groupRef.current.lookAt(camera.position);
        
        // Save the new rotation after lookAt
        const currentRotation: [number, number, number] = [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        ];
        
        onUpdate({
          ...modelData,
          rotation: currentRotation
        });
      }
    }
  }, []); // Only run once on mount
  
  // Compute and cache bounding box to avoid recalculating it every frame
  useEffect(() => {
    // Initialize bounding box
    if (groupRef.current) {
      boundingBoxRef.current = new THREE.Box3().setFromObject(groupRef.current);
    }
    
    // We'll update the bounding box when position/rotation/scale changes in other effects
    // instead of using MutationObserver which doesn't work well with Three.js objects
  }, []);
  
  // Update bounding box when position changes
  useEffect(() => {
    if (groupRef.current && boundingBoxRef.current) {
      boundingBoxRef.current = new THREE.Box3().setFromObject(groupRef.current);
    }
  }, [initialPosition]);
  
  // Update bounding box when rotation changes
  useEffect(() => {
    if (groupRef.current && boundingBoxRef.current) {
      boundingBoxRef.current = new THREE.Box3().setFromObject(groupRef.current);
    }
  }, [initialRotation]);

  // Apply scale to the model
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(scale, scale, scale);
      // Update bounding box when scale changes
      if (boundingBoxRef.current) {
        boundingBoxRef.current = new THREE.Box3().setFromObject(groupRef.current);
      }
    }
  }, [scale]);

  // Much more aggressive debouncing for pointer events
  const handlePointerOver = useCallback((e: { nativeEvent: PointerEvent }): void => {
    if (e.nativeEvent) e.nativeEvent.stopPropagation?.();
    
    // Clear any existing timer
    if (pointerTimerRef.current !== null) {
      window.clearTimeout(pointerTimerRef.current);
      pointerTimerRef.current = null;
    }
    
    // Only process if enough time has passed since last raycast
    const now = performance.now();
    if (now - lastRaycastTime.current < RAY_THROTTLE) return;
    lastRaycastTime.current = now;
    
    // More aggressive debounce (150ms instead of 50ms)
    pointerTimerRef.current = window.setTimeout(() => {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }, 150);
  }, []);

  // Debounced pointer leave with longer delay
  const handlePointerOut = useCallback((e: { nativeEvent: PointerEvent }): void => {
    if (e.nativeEvent) e.nativeEvent.stopPropagation?.();
    
    // Clear any existing timer
    if (pointerTimerRef.current !== null) {
      window.clearTimeout(pointerTimerRef.current);
      pointerTimerRef.current = null;
    }
    
    // More aggressive debounce
    pointerTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      document.body.style.cursor = 'auto';
    }, 200);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pointerTimerRef.current !== null) {
        window.clearTimeout(pointerTimerRef.current);
      }
    };
  }, []);

  // Handle click to select this model
  const handleClick = useCallback((e: { nativeEvent: MouseEvent }): void => {
    if (e.nativeEvent) e.nativeEvent.stopPropagation?.();
    if (onSelect) {
      onSelect(id);
    }
  }, [id, onSelect]);

  // Memoize the position update function to reduce rerenders
  const handleObjectChange = useCallback(() => {
    if (groupRef.current) {
      // Update model data
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
      
      // Update bounding box
      if (boundingBoxRef.current) {
        boundingBoxRef.current = new THREE.Box3().setFromObject(groupRef.current);
      }
    }
  }, [modelData, onUpdate]);

  // Highly optimized raycast function using cached bounding box and throttling
  const optimizedRaycast = useCallback((raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => {
    // Skip if not visible
    if (!groupRef.current?.visible) return;
    
    // Only process if enough time has passed since last raycast
    const now = performance.now();
    if (now - lastRaycastTime.current < RAY_THROTTLE) return;
    lastRaycastTime.current = now;
    
    // Use cached bounding box if available, otherwise create a new one
    const box = boundingBoxRef.current || new THREE.Box3().setFromObject(groupRef.current);
    
    // Check if ray intersects bounding box
    if (raycaster.ray.intersectsBox(box)) {
      // Add a single intersection at the center of the bounding box
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      const distance = raycaster.ray.origin.distanceTo(center);
      intersects.push({
        distance,
        point: raycaster.ray.at(distance, new THREE.Vector3()),
        object: groupRef.current
      });
    }
  }, [groupRef]);

  // Only render control panel when needed
  const controlPanelVisible = hovered || selected;
  
  // Load and initialize control panel only when it's going to be visible
  const ControlPanel = useMemo(() => {
    if (!controlPanelVisible) return null;
    
    const MemoizedControlPanel = () => (
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
    
    MemoizedControlPanel.displayName = 'ModelControlPanel';
    return MemoizedControlPanel;
  }, [controlPanelVisible, showControls, transformMode, scale, camera, id, modelData, onRemove, onUpdate]);

  return (
    <>
      {/* Transform controls - only render when needed */}
      {showControls && selected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.75}
          space="local"
          onObjectChange={handleObjectChange}
        />
      )}

      {/* Model group */}
      <group
        ref={groupRef}
        position={initialPosition}
        rotation={initialRotation}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        userData={{ type: 'model', id }}
        name={`model-${id}`}
      >
        {/* Add simple collider with optimized raycast */}
        <mesh 
          name={`model-collider-${id}`} 
          raycast={optimizedRaycast}
        >
          <boxGeometry args={[3, 3, 3]} />
          <meshBasicMaterial 
            visible={false} 
            transparent={true} 
            opacity={0} 
            alphaTest={0.5}
          />
        </mesh>
        
        {/* Use Suspense and ErrorBoundary for model loading */}
        <ErrorBoundary 
          fallback={<ModelFallback fileName={fileName} scale={scale} />}
        >
          <Suspense fallback={<LoadingIndicator message="Loading model..." />}>
            <Model url={url} scale={scale} />
          </Suspense>
        </ErrorBoundary>

        {/* Only render control panel if visible - lazy loading */}
        {controlPanelVisible && ControlPanel && <ControlPanel />}
      </group>
    </>
  );
};

export default ModelInScene; 