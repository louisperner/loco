import React, { useEffect, useState, useRef } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { useImageStore } from '../../store/useImageStore';
import { BiSolidCameraHome, BiReset } from 'react-icons/bi';
import { MdInvertColors, MdDelete } from 'react-icons/md';
import { FaExpand, FaCompress, FaArrowsAlt } from 'react-icons/fa';
import { TbRotate360 } from 'react-icons/tb';
import { BsArrowsMove } from 'react-icons/bs';
import * as THREE from 'three';
import { ImageDataType, ImageInSceneProps, ImageCloneManagerProps, TransformMode } from './types';
import { processImageUrl, revokeBlobUrl, iconButtonStyle } from './utils';
import LoadingIndicator from '../Scene/LoadingIndicator';

// Component to render a single image in 3D space
const ImageInScene: React.FC<ImageInSceneProps> = ({ imageData, onRemove, onUpdate, onSelect }) => {
  const { 
    src, 
    position: initialPosition = [0, 0, 0],
    rotation: initialRotation = [0, 0, 0],
    lookAtUser: initialLookAtUser = false,
    invertColors: initialInvertColors = false,
    scale: initialScale = 1,
  } = imageData;

  const [lookAtUser, setLookAtUser] = useState<boolean>(initialLookAtUser);
  const [invertColors, setInvertColors] = useState<boolean>(initialInvertColors);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Handle app-file URLs
  useEffect(() => {
    const loadImage = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const processedUrl = await processImageUrl(src);
        setImageSrc(processedUrl);
        
        // Create an image element to detect when the image is loaded
        const img = new Image();
        img.onload = () => {
          setIsLoading(false);
        };
        img.onerror = () => {
          console.error('Error loading image');
          setIsLoading(false);
        };
        img.src = processedUrl;
      } catch (error) {
        console.error('Error processing image URL:', error);
        setImageSrc(src);
        setIsLoading(false);
      }
    };
    
    loadImage();
    
    // Cleanup function to revoke blob URLs
    return () => {
      revokeBlobUrl(imageSrc, src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Set initial position based on camera direction
  useEffect(() => {
    if (groupRef.current) {
      // Only set initial position if it's a new image (position is [0,0,0])
      if (initialPosition[0] === 0 && initialPosition[1] === 0 && initialPosition[2] === 0) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        // Position the image 2 units in front of the camera
        const distance = 5;
        const position = new THREE.Vector3();
        position.copy(camera.position).add(cameraDirection.multiplyScalar(distance));
        
        groupRef.current.position.copy(position);
        
        // Make the image face the camera
        groupRef.current.lookAt(camera.position);
        
        // Save the initial position and rotation
        const currentRotation: [number, number, number] = [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        ];

        saveChanges({
          position: [position.x, position.y, position.z],
          rotation: currentRotation
        });
      } else {
        groupRef.current.position.set(...initialPosition);
        groupRef.current.rotation.set(...initialRotation);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

  const handleScale = (increase: boolean): void => {
    const newScale = increase ? scale * 1.2 : scale / 1.2;
    setScale(newScale);
    saveChanges({ scale: newScale });
  };

  // const handleFineTune = (type: 'position' | 'rotation', axis: 'x' | 'y' | 'z', value: number): void => {
  //   if (groupRef.current) {
  //     if (type === 'position') {
  //       const currentPos = groupRef.current.position.toArray();
  //       const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  //       currentPos[axisIndex] += value;
  //       groupRef.current.position.fromArray(currentPos);
  //       saveChanges({ position: currentPos as [number, number, number] });
  //     } else if (type === 'rotation') {
  //       const currentRot = [
  //         groupRef.current.rotation.x,
  //         groupRef.current.rotation.y,
  //         groupRef.current.rotation.z
  //       ];
  //       const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  //       currentRot[axisIndex] += value;
  //       groupRef.current.rotation.set(currentRot[0], currentRot[1], currentRot[2]);
  //       saveChanges({ rotation: currentRot as [number, number, number] });
  //     }
  //   }
  // };

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
            border: 'none',
            borderRadius: '0',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            padding: '0',
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
        position={new THREE.Vector3(...initialPosition)} 
        rotation={new THREE.Euler(...initialRotation)} 
        scale={scale}
        onClick={handleClick}
        userData={{ type: 'image', id: imageData.id }}
        name={`image-${imageData.id}`}
      >
        {isLoading ? (
          <LoadingIndicator message="Loading image..." />
        ) : (
          <>
            {/* Add invisible mesh for raycasting with args relative to image size */}
            <mesh 
              name={`image-collider-${imageData.id}`} 
              position={[0, -0.2, 0]} 
            >
              <planeGeometry args={[1, 1]} />
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
                pointerEvents: 'auto',
                userSelect: 'none',
                marginTop: '30px',
              }}
            >
              <ImageContainer />
            </Html>
          </>
        )}
      </group>
    </>
  );
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