import React, { useEffect, useState, useRef } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { useImageStore } from '../../store/useImageStore';
import { BiSolidCameraHome, BiReset, BiBorderAll } from 'react-icons/bi';
import { MdInvertColors, MdHideImage, MdDelete } from 'react-icons/md';
import { FaExpand, FaCompress, FaArrowsAlt } from 'react-icons/fa';
import { TbRotate360, TbArrowBigUp, TbArrowBigDown, TbArrowBigLeft, TbArrowBigRight } from 'react-icons/tb';
import { BsArrowsMove } from 'react-icons/bs';
import * as THREE from 'three';

// Define types for the app
export interface ImageDataType {
  id: string;
  src: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  lookAtUser?: boolean;
  invertColors?: boolean;
  removeBackground?: boolean;
  removeBorder?: boolean;
  scale?: number;
  alt?: string;
  isInScene?: boolean;
  fileName?: string;
  type?: string;
  aspectRatio?: number;
  thumbnailUrl?: string;
}

interface ImageInSceneProps {
  imageData: ImageDataType;
  onRemove: () => void;
  onUpdate: (data: ImageDataType) => void;
  onSelect?: (data: ImageDataType & { type: string }) => void;
}

interface ImageCloneManagerProps {
  onSelect?: (data: ImageDataType & { type: string }) => void;
}

type TransformMode = 'translate' | 'rotate' | 'scale';

// Component to render a single image in 3D space
const ImageInScene: React.FC<ImageInSceneProps> = ({ imageData, onRemove, onUpdate, onSelect }) => {
  const { 
    src, 
    width = 300, 
    height = 200, 
    position = [0, 0, -2],
    rotation = [0, 0, 0],
    lookAtUser: initialLookAtUser = false,
    invertColors: initialInvertColors = false,
    removeBackground: initialRemoveBackground = false,
    removeBorder: initialRemoveBorder = false,
    scale: initialScale = 1,
  } = imageData;

  const [lookAtUser, setLookAtUser] = useState<boolean>(initialLookAtUser);
  const [invertColors, setInvertColors] = useState<boolean>(initialInvertColors);
  const [removeBackground, setRemoveBackground] = useState<boolean>(initialRemoveBackground);
  const [removeBorder, setRemoveBorder] = useState<boolean>(initialRemoveBorder);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string>(src);
  
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Handle app-file URLs
  useEffect(() => {
    const loadImage = async (): Promise<void> => {
      if (src && (src.startsWith('app-file://') || src.startsWith('file://'))) {
        try {
          if (window.electron && window.electron.loadImageFromAppFile) {
            const result = await window.electron.loadImageFromAppFile(src);
            if (result.success && result.url) {
              setImageSrc(result.url);
            } else {
              console.error('Failed to load image from app-file URL:', result.error);
              setImageSrc(src); // Fallback to original source
            }
          } else {
            console.warn('electron.loadImageFromAppFile not available, using original src');
            setImageSrc(src);
          }
        } catch (error) {
          console.error('Error loading image from app-file URL:', error);
          setImageSrc(src);
        }
      } else {
        setImageSrc(src);
      }
    };
    
    loadImage();
    
    // Cleanup function to revoke blob URLs
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:') && imageSrc !== src) {
        try {
          // Check if this blob URL is in the cache before revoking
          if (window._imageBlobCache && !Object.values(window._imageBlobCache).includes(imageSrc)) {
            URL.revokeObjectURL(imageSrc);
            // // console.log('Revoked blob URL for image:', imageSrc);
          }
        } catch (error) {
          console.error('Error revoking blob URL:', error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Function to save changes
  const saveChanges = (changes: Partial<ImageDataType>): void => {
    if (groupRef.current) {
      // Convert Vector3 and Euler to arrays
      const currentPosition: [number, number, number] = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z
      ];
      const currentRotation: [number, number, number] = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ];

      const updatedData: ImageDataType = {
        ...imageData,
        ...changes,
        position: currentPosition,
        rotation: currentRotation,
        scale,
      };
      onUpdate(updatedData);
    }
  };

  // Handlers with automatic saving
  const handleLookAtUser = (value: boolean): void => {
    setLookAtUser(value);
    saveChanges({ lookAtUser: value });
  };

  const handleInvertColors = (value: boolean): void => {
    setInvertColors(value);
    saveChanges({ invertColors: value });
  };

  const handleRemoveBackground = (value: boolean): void => {
    setRemoveBackground(value);
    saveChanges({ removeBackground: value });
  };

  const handleRemoveBorder = (value: boolean): void => {
    setRemoveBorder(value);
    saveChanges({ removeBorder: value });
  };

  const handleScale = (increase: boolean): void => {
    const newScale = increase ? scale * 1.2 : scale / 1.2;
    setScale(newScale);
    saveChanges({ scale: newScale });
  };

  const handleFineTune = (type: 'position' | 'rotation', axis: 'x' | 'y' | 'z', value: number): void => {
    if (groupRef.current) {
      if (type === 'position') {
        const currentPos = groupRef.current.position.toArray();
        const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        currentPos[axisIndex] += value;
        groupRef.current.position.fromArray(currentPos);
        saveChanges({ position: currentPos as [number, number, number] });
      } else if (type === 'rotation') {
        const currentRot = [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        ];
        const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        currentRot[axisIndex] += value;
        groupRef.current.rotation.set(currentRot[0], currentRot[1], currentRot[2]);
        saveChanges({ rotation: currentRot as [number, number, number] });
      }
    }
  };

  // Save position and rotation when changed via TransformControls
  useEffect(() => {
    if (groupRef.current && showControls) {
      const controls = document.querySelector('.transform-controls');
      
      const handleChange = (): void => {
        if (groupRef.current) {
          const newPosition: [number, number, number] = [
            groupRef.current.position.x,
            groupRef.current.position.y,
            groupRef.current.position.z
          ];
          const newRotation: [number, number, number] = [
            groupRef.current.rotation.x,
            groupRef.current.rotation.y,
            groupRef.current.rotation.z
          ];
          
          const updatedData: ImageDataType = {
            ...imageData,
            position: newPosition,
            rotation: newRotation,
            scale
          };
          
          onUpdate(updatedData);
        }
      };

      // Add listeners for TransformControls events
      if (controls) {
        controls.addEventListener('mouseup', handleChange);
        controls.addEventListener('change', handleChange);
      }

      return () => {
        if (controls) {
          controls.removeEventListener('mouseup', handleChange);
          controls.removeEventListener('change', handleChange);
        }
      };
    }
    
    return undefined; // Return undefined when condition is false
  }, [showControls, imageData, scale, onUpdate]);

  // Update position and rotation in useFrame to ensure synchronization
  useFrame(() => {
    if (groupRef.current && lookAtUser) {
      const lookAtPosition = new THREE.Vector3();
      camera.getWorldPosition(lookAtPosition);
      groupRef.current.lookAt(lookAtPosition);
      
      // Save new rotation after lookAt
      const newRotation: [number, number, number] = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ];
      
      if (JSON.stringify(newRotation) !== JSON.stringify(imageData.rotation)) {
        onUpdate({
          ...imageData,
          rotation: newRotation
        });
      }
    }
  });

  // Modified to use ThreeEvent type instead of any
  const handleClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    if (onSelect) {
      onSelect({ ...imageData, type: 'image' });
    }
  };

  const ControlPanel: React.FC = () => (
    <div
      style={{
        position: 'absolute',
        bottom: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        gap: '6px',
        color: 'white',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 1000,
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <button 
        onClick={() => handleLookAtUser(!lookAtUser)}
        style={{
          ...iconButtonStyle,
          backgroundColor: lookAtUser ? '#4a90e2' : '#444',
        }}
        title="Look at user"
      >
        <BiSolidCameraHome size={16} />
      </button>
      
      <button 
        onClick={() => handleInvertColors(!invertColors)}
        style={{
          ...iconButtonStyle,
          backgroundColor: invertColors ? '#4a90e2' : '#444',
        }}
        title="Invert colors"
      >
        <MdInvertColors size={16} />
      </button>
      
      <button 
        onClick={() => handleRemoveBackground(!removeBackground)}
        style={{
          ...iconButtonStyle,
          backgroundColor: removeBackground ? '#4a90e2' : '#444',
        }}
        title="Remove background"
      >
        <MdHideImage size={16} />
      </button>
      
      <button 
        onClick={() => handleRemoveBorder(!removeBorder)}
        style={{
          ...iconButtonStyle,
          backgroundColor: removeBorder ? '#4a90e2' : '#444',
        }}
        title="Remove border"
      >
        <BiBorderAll size={16} />
      </button>
      
      <button 
        onClick={() => handleScale(true)}
        style={iconButtonStyle}
        title="Scale up"
      >
        <FaExpand size={14} />
      </button>
      
      <button 
        onClick={() => handleScale(false)}
        style={iconButtonStyle}
        title="Scale down"
      >
        <FaCompress size={14} />
      </button>
      
      <button 
        onClick={() => setShowControls(!showControls)}
        style={{
          ...iconButtonStyle,
          backgroundColor: showControls ? '#4a90e2' : '#444',
        }}
        title="Show transform controls"
      >
        <FaArrowsAlt size={14} />
      </button>
      
      {showControls && (
        <button 
          onClick={() => setTransformMode(
            transformMode === 'translate' ? 'rotate' :
            transformMode === 'rotate' ? 'scale' : 'translate'
          )}
          style={{
            ...iconButtonStyle,
            backgroundColor: '#4a90e2',
          }}
          title={`Current mode: ${transformMode}`}
        >
          {transformMode === 'translate' && <BsArrowsMove size={16} />}
          {transformMode === 'rotate' && <TbRotate360 size={16} />}
          {transformMode === 'scale' && <BiReset size={16} />}
        </button>
      )}
      
      <button 
        onClick={onRemove}
        style={{
          ...iconButtonStyle,
          backgroundColor: '#e24a4a',
        }}
        title="Delete image"
      >
        <MdDelete size={16} />
      </button>
    </div>
  );

  const FineTuneControls: React.FC = () => (
    <div
      style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        zIndex: 1000,
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        Fine Tune Controls
      </div>
      
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => handleFineTune('position', 'y', 0.2)}
          style={iconButtonStyle}
          title="Move up"
        >
          <TbArrowBigUp size={16} />
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => handleFineTune('position', 'x', -0.2)}
          style={iconButtonStyle}
          title="Move left"
        >
          <TbArrowBigLeft size={16} />
        </button>
        
        <button
          onClick={() => handleFineTune('position', 'z', 0.2)}
          style={iconButtonStyle}
          title="Move forward"
        >
          ↓
        </button>
        
        <button
          onClick={() => handleFineTune('position', 'z', -0.2)}
          style={iconButtonStyle}
          title="Move backward"
        >
          ↑
        </button>
        
        <button
          onClick={() => handleFineTune('position', 'x', 0.2)}
          style={iconButtonStyle}
          title="Move right"
        >
          <TbArrowBigRight size={16} />
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => handleFineTune('position', 'y', -0.2)}
          style={iconButtonStyle}
          title="Move down"
        >
          <TbArrowBigDown size={16} />
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px' }}>
        <button
          onClick={() => handleFineTune('rotation', 'y', -0.1)}
          style={iconButtonStyle}
          title="Rotate left"
        >
          ↶
        </button>
        
        <button
          onClick={() => handleFineTune('rotation', 'x', 0.1)}
          style={iconButtonStyle}
          title="Rotate up"
        >
          ↷↑
        </button>
        
        <button
          onClick={() => handleFineTune('rotation', 'x', -0.1)}
          style={iconButtonStyle}
          title="Rotate down"
        >
          ↷↓
        </button>
        
        <button
          onClick={() => handleFineTune('rotation', 'y', 0.1)}
          style={iconButtonStyle}
          title="Rotate right"
        >
          ↷
        </button>
      </div>
    </div>
  );

  const ImageContainer: React.FC = () => (
    <div 
      style={{ 
        position: 'relative',
        paddingBottom: '5px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FineTuneControls />
      <div style={{
        position: 'relative',
        marginBottom: '5px',
      }}>
        <img
          src={imageSrc}
          alt={imageData.alt || 'Image'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            border: removeBorder ? 'none' : '2px solid white',
            borderRadius: removeBorder ? '0' : '4px',
            boxShadow: removeBorder ? 'none' : '0 0 10px rgba(0,0,0,0.5)',
            backgroundColor: removeBackground ? 'transparent' : 'rgba(255,255,255,0.8)',
            padding: removeBorder ? '0' : '8px',
            filter: invertColors ? 'invert(1)' : 'none',
            transition: 'all 0.3s ease-in-out',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        />
      </div>
      <ControlPanel />
    </div>
  );

  return (
    <>
      {showControls && groupRef.current && (
        // @ts-ignore - Using TransformControls with groupRef
        <TransformControls 
          object={groupRef.current}
          mode={transformMode}
          size={1}
          space="local"
          showX={true}
          showY={true}
          showZ={true}
          rotationSnap={Math.PI / 24}
          translationSnap={0.5}
          onObjectChange={() => {
            if (groupRef.current) {
              const newPosition: [number, number, number] = [
                groupRef.current.position.x,
                groupRef.current.position.y,
                groupRef.current.position.z
              ];
              const newRotation: [number, number, number] = [
                groupRef.current.rotation.x,
                groupRef.current.rotation.y,
                groupRef.current.rotation.z
              ];
              
              onUpdate({
                ...imageData,
                position: newPosition,
                rotation: newRotation,
                scale
              });
            }
          }}
        />
      )}
      <group 
        ref={groupRef} 
        position={new THREE.Vector3(...position)} 
        rotation={new THREE.Euler(...rotation)} 
        scale={scale}
        onClick={handleClick}
        userData={{ type: 'image', id: imageData.id }}
        name={`image-${imageData.id}`}
      >
        {/* Add invisible mesh for raycasting */}
        <mesh name={`image-collider-${imageData.id}`}>
          <planeGeometry args={[1.2, 0.7]} />
          <meshBasicMaterial 
            visible={false} 
            transparent={true} 
            opacity={0} 
            side={THREE.DoubleSide}
            alphaTest={0.5}
          />
        </mesh>
        <Html
          transform
          distanceFactor={1.5}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: 'auto',
            userSelect: 'none',
            marginTop: '30px',
          }}
        >
          <ImageContainer />
        </Html>
      </group>
    </>
  );
};

const iconButtonStyle: React.CSSProperties = {
  backgroundColor: '#444',
  border: 'none',
  color: 'white',
  padding: '6px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
};

// Main component that manages images using Zustand
const ImageCloneManager: React.FC<ImageCloneManagerProps> = ({ onSelect }) => {
  const { camera } = useThree();
  const images = useImageStore(state => state.images);
  const addImage = useImageStore(state => state.addImage);
  const removeImage = useImageStore(state => state.removeImage);
  const updateImage = useImageStore(state => state.updateImage);
  const loadSavedImages = useImageStore(state => state.loadSavedImages);

  // Load saved images from localStorage only once on mount
  useEffect(() => {
    loadSavedImages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Listen for removeObject events
  useEffect(() => {
    const handleRemoveObject = (event: Event): void => {
      const customEvent = event as CustomEvent<{type: string; id: string}>;
      if (customEvent.detail && customEvent.detail.type === 'image') {
        // Instead of removing the image, just update it to mark as not in scene
        updateImage(customEvent.detail.id, { isInScene: false });
      }
    };

    window.addEventListener('removeObject', handleRemoveObject);
    return () => window.removeEventListener('removeObject', handleRemoveObject);
  }, [updateImage]);

  // Export the addImage function to the global scope for compatibility
  useEffect(() => {
    // Ensure camera is globally available
    window.mainCamera = camera;
    
    window.addImageToScene = (imageData: ImageDataType): string => {
      // console.log('Calling addImageToScene via global window', imageData);
      return addImage({ ...imageData, camera });
    };

    return () => {
      // Clear global reference when unmounting
      window.addImageToScene = undefined;
    };
  }, [addImage, camera]);

  // Render each image from the store
  return (
    <>
      {images
        .filter(image => image.isInScene !== false) // Only render images that are in scene
        .map((image, index) => {
          // Type assertion to convert image to ImageDataType
          const typedImage = image as unknown as ImageDataType;
          return (
            <ImageInScene 
              key={`image-${image.id || index}`} 
              imageData={typedImage}
              onRemove={() => removeImage(image.id)}
              onUpdate={(updatedData) => updateImage(image.id, updatedData)}
              onSelect={onSelect}
            />
          );
        })}
    </>
  );
};

export default ImageCloneManager; 