import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Html, useGLTF, TransformControls, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Lock, Unlock, Move, RotateCw, Plus, Minus, Trash2, Palette, Image as ImageIcon, Video } from 'lucide-react';
import { 
  ModelProps, 
  ModelFallbackProps, 
  ModelInSceneProps,
  ModelDataType,
  PrimitiveType,
  TextureType,
  PrimitiveModelProps,
  PrimitiveModelData,
  StoreImageData,
  StoreVideoData
} from './types';
import ErrorBoundary from './ErrorBoundary';
import { processFileUrl, controlButtonStyle } from './utils';
import LoadingIndicator from '../Scene/LoadingIndicator';
import { useStore } from '@/store/useStore';

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

// Add PrimitiveModel component with color and texture support
const PrimitiveModel: React.FC<PrimitiveModelProps> = ({ type, scale, color = '#4ade80', texture }) => {
  const material = useMemo(() => {
    if (texture) {
      return new THREE.MeshStandardMaterial({ 
        map: texture,
        side: type === 'plane' ? THREE.DoubleSide : THREE.FrontSide
      });
    }
    return new THREE.MeshStandardMaterial({ 
      color,
      side: type === 'plane' ? THREE.DoubleSide : THREE.FrontSide
    });
  }, [color, texture, type]);

  switch (type) {
    case 'cube':
      return (
        <mesh scale={scale}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={material} />
          {/* Add grid lines to make it look more like a Minecraft block */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.001, 1.001, 1.001)]} />
            <lineBasicMaterial color="#000000" transparent opacity={0.3} />
          </lineSegments>
        </mesh>
      );
    case 'sphere':
      return (
        <mesh scale={scale}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <primitive object={material} />
        </mesh>
      );
    case 'plane':
      return (
        <mesh scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <primitive object={material} />
        </mesh>
      );
    default:
      return null;
  }
};

const isPrimitiveModel = (model: ModelDataType): model is PrimitiveModelData => {
  return model.isPrimitive === true;
};

const pickerPanelStyle = {
  position: 'absolute' as const,
  top: '45px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(26, 26, 26, 0.95)',
  padding: '12px',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
  maxHeight: '250px',
  overflowY: 'auto' as const,
  zIndex: 1001,
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
};

const textureGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
  maxWidth: '300px'
};

const textureButtonStyle = {
  ...controlButtonStyle,
  width: '60px',
  height: '60px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  border: '2px solid rgba(255,255,255,0.1)',
  transition: 'border-color 0.2s ease',
  ':hover': {
    borderColor: 'rgba(255,255,255,0.3)'
  }
};

const ModelInScene: React.FC<ModelInSceneProps> = ({ 
  modelData, 
  onRemove, 
  onUpdate,
  selected = false,
  onSelect,
}: {
  modelData: ModelDataType;
  onRemove: (id: string) => void;
  onUpdate: (data: ModelDataType) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) => {
  const isPrimitive = isPrimitiveModel(modelData);
  const primitiveData = isPrimitive ? modelData : null;

  // Debug log to check if images and videos are loaded in store
  const images = useStore((state) => state.images);
  const videos = useStore((state) => state.videos);

  // Enhanced Debug Log
  /* Debugging code removed to comply with ESLint no-console rule
  if (isPrimitive && primitiveData) {
    console.log(
      "ModelInScene - Primitive Detected:",
      `ID: ${primitiveData.id}`,
      `Type: ${primitiveData.primitiveType}`,
      `Color: ${primitiveData.color}`,
      `TextureURL: ${primitiveData.textureUrl}`,
      `TextureType: ${primitiveData.textureType}`,
      `Images in store: ${images.length}`,
      `Videos in store: ${videos.length}`
    );
  } else if (!isPrimitive) {
     console.log("ModelInScene - Loaded Model Detected:", `ID: ${modelData.id}`, `URL: ${modelData.url}`);
  } else {
     console.log("ModelInScene - Error: isPrimitive=true but primitiveData is null?", modelData);
  }
  */

  const { 
    id, 
    url,
    fileName,
    position: initialPosition = [0, 0, 0], 
    rotation: initialRotation = [0, 0, 0], 
    scale: initialScale = 1,
  } = modelData;

  const [hovered, setHovered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showTexturePicker, setShowTexturePicker] = useState<boolean>(false);
  const [texture, setTexture] = useState<THREE.Texture | THREE.VideoTexture | undefined>(undefined);
  const groupRef = useRef<THREE.Group>(null);
  const pointerTimerRef = useRef<number | null>(null);
  const boundingBoxRef = useRef<THREE.Box3 | null>(null);
  const lastRaycastTime = useRef<number>(0);
  const RAY_THROTTLE = 100; // ms between raycasts
  
  // Get camera for positioning
  const { camera } = useThree();

  // Load texture if textureUrl exists
  useEffect(() => {
    console.log('ModelInScene: Texture loading effect triggered', {
      isPrimitive,
      textureUrl: primitiveData?.textureUrl,
      textureType: primitiveData?.textureType,
      primitiveData
    });
    
    if (isPrimitive && primitiveData?.textureUrl) {
      console.log('ModelInScene: Loading texture for primitive', primitiveData.textureType);
      if (primitiveData.textureType === 'image') {
        const img = new Image();
        img.src = primitiveData.textureUrl;
        img.onload = () => {
          console.log('ModelInScene: Image texture loaded successfully');
          const newTexture = new THREE.Texture(img);
          newTexture.needsUpdate = true;
          setTexture(newTexture);
        };
        img.onerror = (error) => {
          console.error('ModelInScene: Failed to load image texture', error);
        };
      } else if (primitiveData.textureType === 'video') {
        const video = document.createElement('video');
        video.src = primitiveData.textureUrl;
        video.loop = true;
        video.muted = true;
        video.play();
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.needsUpdate = true;
        setTexture(videoTexture);
      }
    } else {
      console.log('ModelInScene: No texture to load, clearing texture');
      setTexture(undefined);
    }
  }, [isPrimitive, primitiveData?.textureUrl, primitiveData?.textureType]);

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
        
        // For cube primitives, ALWAYS snap to grid and keep axis-aligned
        let finalPosition: [number, number, number];
        let currentRotation: [number, number, number];
        
        if (isPrimitive && primitiveData?.primitiveType === 'cube') {
          // Snap cube position to grid
          finalPosition = [
            Math.round(position.x),
            Math.round(position.y), // Allow placement below y=0
            Math.round(position.z)
          ];
          // Keep cubes axis-aligned
          groupRef.current.rotation.set(0, 0, 0);
          currentRotation = [0, 0, 0];
          
          console.log('ModelInScene: Snapping cube to grid position', finalPosition);
        } else {
          // For other models, use exact camera-based position
          finalPosition = [position.x, position.y, position.z];
          // Make other models face the camera
          groupRef.current.lookAt(camera.position);
          currentRotation = [
            groupRef.current.rotation.x,
            groupRef.current.rotation.y,
            groupRef.current.rotation.z
          ];
        }
        
        groupRef.current.position.set(...finalPosition);

        onUpdate({
          ...modelData,
          position: finalPosition,
          rotation: currentRotation
        } as ModelDataType);
      } else {
        // For existing models, set the saved position and rotation
        // But still ensure cubes are grid-snapped if they somehow got off-grid
        if (isPrimitive && primitiveData?.primitiveType === 'cube') {
          const snappedPosition: [number, number, number] = [
            Math.round(initialPosition[0]),
            Math.round(initialPosition[1]),
            Math.round(initialPosition[2])
          ];
          
          // Only update if position changed due to snapping
          if (snappedPosition[0] !== initialPosition[0] || 
              snappedPosition[1] !== initialPosition[1] || 
              snappedPosition[2] !== initialPosition[2]) {
            console.log('ModelInScene: Correcting off-grid cube position', initialPosition, '->', snappedPosition);
            groupRef.current.position.set(...snappedPosition);
            onUpdate({
              ...modelData,
              position: snappedPosition,
              rotation: [0, 0, 0] // Ensure cubes stay axis-aligned
            } as ModelDataType);
          } else {
            groupRef.current.position.set(...initialPosition);
            groupRef.current.rotation.set(0, 0, 0); // Ensure cubes stay axis-aligned
          }
        } else {
          groupRef.current.position.set(...initialPosition);
          groupRef.current.rotation.set(...initialRotation);
        }
      }
    }
  }, [camera, initialPosition, initialRotation, modelData, onUpdate, isPrimitive, primitiveData]); // Include all dependencies

  // Update position and rotation when they change
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...initialPosition);
      groupRef.current.rotation.set(...initialRotation);
    }
  }, [initialPosition, initialRotation]);

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

  // Update collider size based on object size
  useEffect(() => {
    if (groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      // Update the collider mesh size
      const collider = groupRef.current.children.find(child => child.name === `model-collider-${id}`);
      if (collider && collider instanceof THREE.Mesh) {
        const geometry = collider.geometry as THREE.BoxGeometry;
        geometry.dispose(); // Clean up old geometry
        collider.geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      }
    }
  }, [scale, id]); // Update when scale changes

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
      const position = groupRef.current.position;
      const rotation = groupRef.current.rotation;
      
      // For cube primitives, implement grid snapping and keep axis-aligned
      if (isPrimitive && primitiveData?.primitiveType === 'cube') {
        // Snap to grid by rounding to nearest integer
        position.x = Math.round(position.x);
        position.y = Math.round(position.y);
        position.z = Math.round(position.z);
        
        // Keep cubes axis-aligned (no rotation)
        rotation.x = 0;
        rotation.y = 0;
        rotation.z = 0;
        groupRef.current.rotation.set(0, 0, 0);
      }
      
      onUpdate({
        ...modelData,
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z]
      } as ModelDataType);
    }
  }, [modelData, onUpdate, isPrimitive, primitiveData]);

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
  
  const handleColorChange = (newColor: string) => {
    if (isPrimitive && primitiveData) {
      // Update current model color
      onUpdate({
        ...modelData,
        color: newColor
      } as PrimitiveModelData);

      // Create a new primitive model with the same type and new color
      const newPrimitiveModel: PrimitiveModelData = {
        id: `primitive-${Date.now()}`,
        isPrimitive: true,
        primitiveType: primitiveData.primitiveType,
        color: newColor,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1
      };

      // Add to inventory using the store
      useStore.getState().addPrimitiveModel(newPrimitiveModel);

      // Close the color picker
      setShowColorPicker(false);

      // Show feedback toast
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = 'rgba(26, 26, 26, 0.95)';
      toast.style.color = 'white';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '8px';
      toast.style.zIndex = '9999';
      toast.style.border = '1px solid rgba(255,255,255,0.1)';
      toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      toast.style.backdropFilter = 'blur(8px)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (toast.style as CSSStyleDeclaration)['WebkitBackdropFilter' as any] = 'blur(8px)';
      toast.textContent = `New ${primitiveData.primitiveType} added to inventory`;
      
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
    }
  };

  const handleTextureSelect = (type: TextureType, item: StoreImageData | StoreVideoData) => {
    if (!item.url) return;
    
    const updatedData = {
      ...modelData,
      textureUrl: item.url,
      textureType: type
    } as PrimitiveModelData;
    
    onUpdate(updatedData);
  };

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
        userData={{ 
          type: 'model', 
          id,
          primitiveType: isPrimitive ? primitiveData?.primitiveType : undefined
        }}
        name={`model-${id}`}
      >
        {/* Add simple collider with optimized raycast */}
        <mesh 
          name={`model-collider-${id}`} 
          raycast={optimizedRaycast}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial 
            visible={false} 
            transparent={true} 
            opacity={0}
            alphaTest={0.5}
          />
        </mesh>
        
        {/* Render primitive or loaded model */}
        {isPrimitive && primitiveData ? (
          <PrimitiveModel 
            type={primitiveData.primitiveType} 
            scale={scale}
            color={primitiveData.color || '#4ade80'}
            texture={texture}
          />
        ) : (
          url?.startsWith('primitive://') ? (
            <PrimitiveModel 
              type={(url?.replace('primitive://', '') || 'cube') as PrimitiveType}
              scale={scale}
              color="#4ade80"
            />
          ) : (
            <ErrorBoundary 
              fallback={<ModelFallback fileName={fileName || 'Unknown'} scale={scale} />}
            >
              <Suspense fallback={<LoadingIndicator message="Loading model..." />}>
                <Model url={url || '/placeholder-model.glb'} scale={scale} />
              </Suspense>
            </ErrorBoundary>
          )
        )}

        {/* Render control panel when visible */}
        {controlPanelVisible && (
          <Html
            transform={false}
            position={[0, 0, 0]}
            style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              padding: '8px 12px',
              borderRadius: '8px',
              color: 'white',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              pointerEvents: 'all',
              userSelect: 'none',
              zIndex: 1000,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              minWidth: '200px',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            prepend
          >
            {/* Control buttons */}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setShowControls(!showControls);
              }}
              style={{
                ...controlButtonStyle,
                backgroundColor: '#2C2C2C',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}
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
                } as ModelDataType);
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
                } as ModelDataType);
              }}
              style={controlButtonStyle}
            >
              <Minus size={16} />
            </button>

            {isPrimitive && primitiveData && (
              <>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                    setShowTexturePicker(false);
                  }}
                  style={{
                    ...controlButtonStyle,
                    backgroundColor: primitiveData.color
                  }}
                >
                  <Palette size={16} />
                </button>

                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setShowTexturePicker(!showTexturePicker);
                    setShowColorPicker(false);
                  }}
                  style={controlButtonStyle}
                >
                  {primitiveData.textureType === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                </button>

                {showColorPicker && (
                  <div 
                    style={pickerPanelStyle}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="color"
                        value={primitiveData.color}
                        onChange={(e) => handleColorChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          width: '100%', 
                          height: '40px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColorPicker(false);
                        }}
                        style={{
                          ...controlButtonStyle,
                          width: '100%',
                          padding: '4px 8px',
                          backgroundColor: '#2C2C2C'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {showTexturePicker && (
                  <div 
                    style={pickerPanelStyle}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <div 
                      style={textureGridStyle}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      {images.map((img: StoreImageData) => (
                        <button
                          key={img.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (img.url) {
                              handleTextureSelect('image', img);
                            }
                          }}
                          style={{
                            ...textureButtonStyle,
                            backgroundImage: `url(${img.thumbnailUrl || img.url || ''})`,
                          }}
                        />
                      ))}
                      {videos.map((video: StoreVideoData) => (
                        <button
                          key={video.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (video.url) {
                              handleTextureSelect('video', video);
                            }
                          }}
                          style={{
                            ...textureButtonStyle,
                            backgroundImage: `url(${video.thumbnailUrl || ''})`,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTexturePicker(false);
                      }}
                      style={{
                        ...controlButtonStyle,
                        width: '100%',
                        padding: '4px 8px',
                        backgroundColor: '#2C2C2C',
                        marginTop: '8px'
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </>
            )}

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
        )}
      </group>
    </>
  );
};

export default ModelInScene; 