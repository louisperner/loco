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
import { useGameStore } from '../../store/useGameStore';

// Add shared geometries and materials at the top level to avoid recreating them
const sharedGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  boxEdges: new THREE.EdgesGeometry(new THREE.BoxGeometry(1.001, 1.001, 1.001)),
  sphere: new THREE.SphereGeometry(0.5, 32, 32),
  plane: new THREE.PlaneGeometry(1, 1),
  // Add LOD geometries for distant objects
  boxLOD: new THREE.BoxGeometry(1, 1, 1), // Simplified geometry for distant cubes
  sphereLOD: new THREE.SphereGeometry(0.5, 16, 16), // Lower poly sphere for distance
};

const sharedMaterials = {
  edgeLines: new THREE.LineBasicMaterial({ color: "#000000", transparent: true, opacity: 0.3 }),
  // Add simplified materials for distant objects
  simpleCube: new THREE.MeshBasicMaterial({ color: "#4ade80" }), // Basic material for distant cubes
  // Pre-create common cube materials to avoid lag on creation
  greenCube: new THREE.MeshStandardMaterial({ color: "#4ade80" }),
  redCube: new THREE.MeshStandardMaterial({ color: "#ef4444" }),
  blueCube: new THREE.MeshStandardMaterial({ color: "#3b82f6" }),
  yellowCube: new THREE.MeshStandardMaterial({ color: "#eab308" }),
  whiteCube: new THREE.MeshStandardMaterial({ color: "#ffffff" }),
};

// Material cache to avoid creating duplicate materials
const materialCache = new Map<string, THREE.Material>();

// Debounced material creation to prevent lag spikes
// eslint-disable-next-line prefer-const
let materialCreationQueue: Array<{ key: string; createMaterial: () => THREE.Material; resolve: (material: THREE.Material) => void }> = [];
// @ts-ignore
let materialCreationTimeout: number | null = null;

// @ts-ignore
const processMaterialQueue = () => {
  if (materialCreationQueue.length === 0) return;
  
  // Process one material at a time to avoid lag spikes
  const { key, createMaterial, resolve } = materialCreationQueue.shift()!;
  
  if (!materialCache.has(key)) {
    cleanupMaterialCache();
    const material = createMaterial();
    materialCache.set(key, material);
    resolve(material);
  } else {
    resolve(materialCache.get(key)!);
  }
  
  // Schedule next material creation
  if (materialCreationQueue.length > 0) {
    materialCreationTimeout = window.setTimeout(processMaterialQueue, 16); // ~60fps
  }
};

const getCachedMaterial = (key: string, createMaterial: () => THREE.Material): THREE.Material => {
  if (materialCache.has(key)) {
    return materialCache.get(key)!;
  }
  
  // For immediate needs, create synchronously but with simpler materials
  cleanupMaterialCache();
  const material = createMaterial();
  materialCache.set(key, material);
  return material;
};

// Performance monitoring
let frameCount = 0;
let lastFPSCheck = performance.now();
let currentFPS = 60;
let fpsUpdateCounter = 0;

const updateFPS = () => {
  // Only update FPS every 10th call to reduce overhead
  fpsUpdateCounter++;
  if (fpsUpdateCounter % 10 !== 0) return;
  
  frameCount++;
  const now = performance.now();
  if (now - lastFPSCheck >= 1000) {
    currentFPS = Math.round((frameCount * 1000) / (now - lastFPSCheck));
    frameCount = 0;
    lastFPSCheck = now;
  }
};

// Adaptive quality based on performance
const getAdaptiveQuality = () => {
  if (currentFPS < 30) return 'low';
  if (currentFPS < 45) return 'medium';
  return 'high';
};

// Performance stats for debugging
export const getPerformanceStats = () => ({
  fps: currentFPS,
  quality: getAdaptiveQuality(),
  materialCacheSize: materialCache.size,
});

// Clear material cache when it gets too large
const cleanupMaterialCache = () => {
  if (materialCache.size > 100) {
    // Keep only the most recently used materials
    const entries = Array.from(materialCache.entries());
    materialCache.clear();
    // Keep the last 50 materials
    entries.slice(-50).forEach(([key, material]) => {
      materialCache.set(key, material);
    });
  }
};

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
const PrimitiveModel: React.FC<PrimitiveModelProps & { distanceToCamera?: number }> = ({ 
  type, 
  scale, 
  color = '#4ade80', 
  texture, 
  cubeFaces, 
  distanceToCamera = 0 
}) => {
  const [faceMaterials, setFaceMaterials] = useState<THREE.Material[]>([]);
  
  // Handle custom cube face materials with proper async texture loading
  useEffect(() => {
    if (type === 'cube' && cubeFaces) {
      const faceOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];
      const materials: THREE.Material[] = new Array(faceOrder.length);
      let loadedCount = 0;
      const totalFaces = faceOrder.length;
      
      faceOrder.forEach((faceId, index) => {
        const face = cubeFaces[faceId];
        
        if (face?.texture) {
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Handle CORS if needed
          img.onload = () => {
            const textureMap = new THREE.Texture(img);
            textureMap.needsUpdate = true;
            textureMap.wrapS = THREE.RepeatWrapping;
            textureMap.wrapT = THREE.RepeatWrapping;
            materials[index] = new THREE.MeshStandardMaterial({ map: textureMap });
            loadedCount++;
            
            // Update materials when all faces are processed
            if (loadedCount === totalFaces) {
              setFaceMaterials([...materials]);
            }
          };
          img.onerror = (error) => {
            console.error(`PrimitiveModel: Failed to load texture for face ${faceId}:`, error);
            // Fallback to color if texture fails to load
            materials[index] = new THREE.MeshStandardMaterial({ color: face?.color || color });
            loadedCount++;
            
            if (loadedCount === totalFaces) {
              setFaceMaterials([...materials]);
            }
          };
          img.src = face.texture;
        } else {
          materials[index] = new THREE.MeshStandardMaterial({ color: face?.color || color });
          loadedCount++;
          
          if (loadedCount === totalFaces) {
            setFaceMaterials([...materials]);
          }
        }
      });
    } else {
      // Clear face materials if not a custom cube
      setFaceMaterials([]);
    }
  }, [type, cubeFaces, color]);
  
  const materials = useMemo(() => {
    // Use face materials for custom cubes if available
    if (type === 'cube' && cubeFaces && faceMaterials.length > 0) {
      return faceMaterials;
    }
    
    // Adaptive quality based on performance and distance
    const quality = getAdaptiveQuality();
    const isDistant = distanceToCamera > 15;
    const useSimpleMaterial = quality === 'low' || (quality === 'medium' && isDistant);
    
    // Single material for non-cube primitives or cubes without custom faces
    if (texture && !useSimpleMaterial) {
      const textureKey = `texture-${texture.uuid}-${type}`;
      return getCachedMaterial(textureKey, () => new THREE.MeshStandardMaterial({ 
        map: texture,
        side: type === 'plane' ? THREE.DoubleSide : THREE.FrontSide
      }));
    }
    
    // Use simplified materials for distant objects or when performance is low
    if (useSimpleMaterial && type === 'cube') {
      return sharedMaterials.simpleCube;
    }
    
    // Use pre-created materials for common cube colors to avoid lag
    if (type === 'cube' && !useSimpleMaterial) {
      switch (color) {
        case '#4ade80': return sharedMaterials.greenCube;
        case '#ef4444': return sharedMaterials.redCube;
        case '#3b82f6': return sharedMaterials.blueCube;
        case '#eab308': return sharedMaterials.yellowCube;
        case '#ffffff': return sharedMaterials.whiteCube;
      }
    }
    
    const colorKey = `color-${color}-${type}-${useSimpleMaterial ? 'basic' : 'standard'}`;
    return getCachedMaterial(colorKey, () => {
      if (useSimpleMaterial) {
        return new THREE.MeshBasicMaterial({ 
          color,
          side: type === 'plane' ? THREE.DoubleSide : THREE.FrontSide
        });
      }
      return new THREE.MeshStandardMaterial({ 
        color,
        side: type === 'plane' ? THREE.DoubleSide : THREE.FrontSide
      });
    });
  }, [color, texture, type, cubeFaces, faceMaterials, distanceToCamera]);

  // Advanced LOD and culling logic
  const quality = getAdaptiveQuality();
  const isVeryDistant = distanceToCamera > 50;
  const isDistant = distanceToCamera > 15;
  const isNearby = distanceToCamera < 10;
  
  // Don't render very distant objects when performance is low
  if (quality === 'low' && isVeryDistant) {
    return null;
  }

  switch (type) {
    case 'cube':
      return (
        <mesh 
          scale={scale} 
          material={materials} 
          geometry={isDistant ? sharedGeometries.boxLOD : sharedGeometries.box}
        >
          {/* Advanced edge line rendering based on distance and performance */}
          {isNearby && quality !== 'low' && (
            <lineSegments 
              geometry={sharedGeometries.boxEdges} 
              material={sharedMaterials.edgeLines}
            />
          )}
        </mesh>
      );
    case 'sphere':
      return (
        <mesh 
          scale={scale} 
          geometry={isDistant ? sharedGeometries.sphereLOD : sharedGeometries.sphere}
        >
          <primitive object={materials} />
        </mesh>
      );
    case 'plane':
      return (
        <mesh 
          scale={scale} 
          rotation={[-Math.PI / 2, 0, 0]} 
          geometry={sharedGeometries.plane}
        >
          <primitive object={materials} />
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
    if (isPrimitive && primitiveData?.textureUrl) {
      if (primitiveData.textureType === 'image') {
        const img = new Image();
        img.src = primitiveData.textureUrl;
        img.onload = () => {
          const newTexture = new THREE.Texture(img);
          newTexture.needsUpdate = true;
          setTexture(newTexture);
        };
        img.onerror = () => {
          // console.error('ModelInScene: Failed to load image texture', error);
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
              // console.log('ModelInScene: Correcting off-grid cube position', initialPosition, '->', snappedPosition);
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

  // Lazy bounding box calculation - only compute when needed
  const getBoundingBox = useCallback(() => {
    if (!boundingBoxRef.current && groupRef.current) {
      boundingBoxRef.current = new THREE.Box3().setFromObject(groupRef.current);
    }
    return boundingBoxRef.current;
  }, []);
  
  // Invalidate bounding box when position/rotation changes (lazy recalculation)
  useEffect(() => {
    boundingBoxRef.current = null; // Invalidate cache
  }, [initialPosition, initialRotation]);

  // Apply scale to the model and invalidate bounding box
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(scale, scale, scale);
      // Invalidate bounding box cache when scale changes
      boundingBoxRef.current = null;
    }
  }, [scale]);

  // Simplified collider - use basic box geometry without dynamic sizing
  // This avoids expensive bounding box calculations on every scale change

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

  // Highly optimized raycast function using lazy bounding box and throttling
  const optimizedRaycast = useCallback((raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => {
    // Skip if not visible
    if (!groupRef.current?.visible) return;
    
    // Only process if enough time has passed since last raycast
    const now = performance.now();
    if (now - lastRaycastTime.current < RAY_THROTTLE) return;
    lastRaycastTime.current = now;
    
    // Use lazy bounding box calculation
    const box = getBoundingBox();
    if (!box) return;
    
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
  }, [getBoundingBox]);

  // Spherical culling system with configurable radius
  const [distanceToCamera, setDistanceToCamera] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { cullingSettings } = useGameStore();
  
  const CULLING_SPHERE_RADIUS = cullingSettings.enabled 
    ? cullingSettings.canvasRadius 
    : Infinity; // Disable culling if not enabled

  
  useEffect(() => {
    if (!groupRef.current) return;
    
    // Delay the performance monitoring to avoid lag on cube creation
    const startDelay = setTimeout(() => {
      if (!groupRef.current) return;
            
      let frameId: number;
      let frameCount = 0;
      
      const checkDistanceAndVisibility = () => {
        if (!groupRef.current) return;
        
        // Update FPS counter here instead of in materials
        updateFPS();
        
        // Calculate distance to camera for spherical culling
        const objectPosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(objectPosition);
        const distance = camera.position.distanceTo(objectPosition);
        
        // Always update distance for accurate tracking
        setDistanceToCamera(distance);
        
        // Simple spherical culling: hide objects outside the configured radius
        const finalVisibility = distance <= CULLING_SPHERE_RADIUS;
        

        
        // Always update visibility state
        setIsVisible(finalVisibility);
        
        // Ensure the Three.js object visibility matches our state
        if (groupRef.current) {
          groupRef.current.visible = finalVisibility;
        }
      };
      
      // More frequent and consistent checking
      const throttledCheck = () => {
        frameCount++;
        const quality = getAdaptiveQuality();
        const checkInterval = quality === 'low' ? 5 : quality === 'medium' ? 3 : 1; // Very frequent checks for reliable culling
        
        if (frameCount % checkInterval === 0) {
          checkDistanceAndVisibility();
        }
        frameId = requestAnimationFrame(throttledCheck);
      };
      
      frameId = requestAnimationFrame(throttledCheck);
      
      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    }, 100); // 100ms delay to avoid lag on creation
    
    return () => {
      clearTimeout(startDelay);
    };
  }, [camera, id, CULLING_SPHERE_RADIUS, cullingSettings.enabled, cullingSettings.canvasRadius]); // Ensure re-check if culling settings change

  // Only render control panel when needed
  // const controlPanelVisible = hovered || selected;
  const controlPanelVisible = false;
  
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

  // Note: We don't return null here because we need the component to stay mounted
  // to continue checking distance. Instead, we use the visible prop on the group.

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
        visible={isVisible}
        userData={{ 
          type: 'model', 
          id,
          primitiveType: isPrimitive ? primitiveData?.primitiveType : undefined,
          isModelInScene: true
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
            cubeFaces={primitiveData.cubeFaces}
            distanceToCamera={distanceToCamera}
          />
        ) : (
          url?.startsWith('primitive://') ? (
            <PrimitiveModel 
              type={(url?.replace('primitive://', '') || 'cube') as PrimitiveType}
              scale={scale}
              color="#4ade80"
              distanceToCamera={distanceToCamera}
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