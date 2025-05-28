import { useGameStore } from '@/store/useGameStore';
import { useImageStore } from '@/store/useImageStore';
import { useModelStore } from '@/store/useModelStore';
import { useVideoStore } from '@/store/videoStore';
import { useCodeStore } from '@/store/useCodeStore';
import { saveModelThumbnail } from '@/utils/modelThumbnailGenerator';
import React, { useState } from 'react';
import { useRef } from 'react';
import { generateVideoThumbnail } from '../Models/utils';
import TextureSelector from './TextureSelector';
import CubeCrafter from '../CubeCrafter/CubeCrafter';
import * as THREE from 'three';

const HotbarTopNav: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [showTextureSelector, setShowTextureSelector] = useState(false);
  const [showCubeCrafter, setShowCubeCrafter] = useState(false);
  const addImage = useImageStore((state) => state.addImage);
  const updateImage = useImageStore((state) => state.updateImage);
  const addVideo = useVideoStore((state) => state.addVideo);
  const addModel = useModelStore((state) => state.addModel);
  const addCodeBlock = useCodeStore((state) => state.addCodeBlock);
  const updateModel = useModelStore((state) => state.updateModel);
  const setShowDrawingOverlay = useGameStore((state) => state.setShowDrawingOverlay);
  const { selectedImageTexture } = useGameStore();

  let position: [number, number, number] = [0, 1, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);

      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const scale =
          aspectRatio > 1
            ? ([aspectRatio, 1, 1] as [number, number, number])
            : ([1, 1 / aspectRatio, 1] as [number, number, number]);

        // Get camera position if available
        if (window.mainCamera) {
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // Place 3 units in front of camera
          pos.add(direction);
          position = [pos.x, pos.y, pos.z];
          rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
        }

        // Add image to the store
        const imageId = addImage({
          id: `image-${Date.now()}`,
          src: objectUrl,
          fileName: file.name,
          width: img.width,
          height: img.height,
          position,
          rotation,
          scale,
          isInScene: true,
        });

        // Save the file to disk if in Electron environment
        if (window.electron?.saveImageFile) {
          window.electron
            .saveImageFile(file, file.name)
            .then((savedPath: string) => {
              // Update image with the new file path
              updateImage(imageId, { src: savedPath });
              
              // Clean up the blob URL after saving
              URL.revokeObjectURL(objectUrl);
            })
            .catch((error: Error) => {
              console.error('Error saving image file:', error);
              alert(`Error saving image file: ${error.message}`);
            });
        }
      };

      img.onerror = () => {
        // Add image without dimensions if loading fails
        const imageId = addImage({
          id: `image-${Date.now()}`,
          src: objectUrl,
          fileName: file.name,
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: 1,
          isInScene: true,
        });

        // Save the file to disk if in Electron environment
        if (window.electron?.saveImageFile) {
          window.electron
            .saveImageFile(file, file.name)
            .then((savedPath: string) => {
              // Update image with the new file path
              updateImage(imageId, { src: savedPath });
              
              // Clean up the blob URL after saving
              URL.revokeObjectURL(objectUrl);
            })
            .catch((error: Error) => {
              console.error('Error saving image file:', error);
              alert(`Error saving image file: ${error.message}`);
            });
        }
      };

      img.src = objectUrl;
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      
      // Check file extension for supported formats
      const fileName = file.name.toLowerCase();
      const isSupportedFormat = 
        fileName.endsWith('.mp4') || 
        fileName.endsWith('.webm') || 
        fileName.endsWith('.ogg') || 
        fileName.endsWith('.mov');
      
      if (!isSupportedFormat) {
        console.warn(`Video format may not be supported: ${fileName}`);
      }

      try {
        // Try to generate thumbnail for the video
        let thumbnailUrl = '';
        try {
          thumbnailUrl = await generateVideoThumbnail(objectUrl);
        } catch (thumbnailError) {
          console.warn('Could not generate video thumbnail:', thumbnailError);
          // Continue without thumbnail
        }

        // Check for specific demuxer error during thumbnail generation
        const video = document.createElement('video');
        video.src = objectUrl;
        
        // Set up event handlers to check for demuxer error
        const videoErrorPromise = new Promise<boolean>((resolve) => {
          video.onerror = () => {
            const errorMessage = video.error?.message || '';
            if (errorMessage.includes('DEMUXER_ERROR_NO_SUPPORTED_STREAMS') || 
                errorMessage.includes('FFmpegDemuxer: no supported streams')) {
              console.error('Unsupported video format detected:', errorMessage);
              alert(`This video format is not supported by your browser. Please try a different format like MP4, WebM, or OGG.`);
              URL.revokeObjectURL(objectUrl);
              resolve(true); // Error occurred
            } else {
              resolve(false); // Other error or no error
            }
          };
          
          // If video loads metadata, assume it's playable
          video.onloadedmetadata = () => resolve(false);
          
          // Set a timeout in case neither event fires
          setTimeout(() => resolve(false), 3000);
        });
        
        // Load the video to trigger error if format is not supported
        video.load();
        
        // Wait to see if demuxer error occurs
        const hasError = await videoErrorPromise;
        if (hasError) {
          // Clean up and exit
          video.src = '';
          video.load();
          return;
        }
        
        // Clean up test video element
        video.src = '';
        video.load();

        // Get camera position if available
        if (window.mainCamera) {
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // Place 3 units in front of camera
          pos.add(direction);
          position = [pos.x, pos.y, pos.z];
          rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
        }

        // Add video to the store
        addVideo({
          src: objectUrl,
          fileName: file.name,
          thumbnailUrl, // This might be empty string if thumbnail generation failed
          position,
          rotation,
          scale: 3,
          isPlaying: true,
          volume: 0.5,
          loop: true,
          isInScene: true,
        });
        
        // If format is not supported but didn't trigger demuxer error, show a warning
        if (!isSupportedFormat) {
          setTimeout(() => {
            alert(`Note: The video format '${fileName.split('.').pop()}' may not play correctly in all browsers. For best compatibility, use MP4, WebM, or OGG formats.`);
          }, 500);
        }
      } catch (error) {
        console.error('Error processing video:', error);
        
        // Check if this is the specific demuxer error
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('DEMUXER_ERROR_NO_SUPPORTED_STREAMS') || 
            errorMsg.includes('FFmpegDemuxer: no supported streams')) {
          alert(`This video format is not supported by your browser. Please try a different format like MP4, WebM, or OGG.`);
          URL.revokeObjectURL(objectUrl);
          return; // Exit without adding video
        }
        
        // For other errors, try to add the video anyway
        try {
          addVideo({
            src: objectUrl,
            fileName: file.name,
            position: [0, 1, 0],
            rotation: [0, 0, 0],
            scale: 3,
            isPlaying: true,
            volume: 0.5,
            loop: true,
            isInScene: true,
          });
        } catch (addError) {
          console.error('Fatal error adding video:', addError);
          alert('Could not add video: ' + (addError instanceof Error ? addError.message : 'Unknown error'));
        }
      }
    }
  };

  const handleModelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);

      try {
        // Get camera position if available
        if (window.mainCamera) {
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // Place 3 units in front of camera
          pos.add(direction);
          position = [pos.x, pos.y, pos.z];
          rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
        }

        // Store the file in the model cache
        window._modelFileCache = window._modelFileCache || {};
        window._modelFileCache[objectUrl] = file;

        // Store in the blob URL cache
        window._blobUrlCache = window._blobUrlCache || {};
        window._blobUrlCache[objectUrl] = true;

        // Add model to the store
        const modelId = addModel({
          url: objectUrl,
          fileName: file.name,
          position,
          rotation,
          scale: 1,
          isInScene: true,
        });

        // Save the file to disk if in Electron environment
        if (window.electron?.saveModelFile) {
          const savedPath = await window.electron.saveModelFile(file, file.name);
          const thumbnailUrl = await saveModelThumbnail(savedPath, modelId);

          // Update model with the new file path and thumbnail
          updateModel(modelId, {
            url: savedPath,
            thumbnailUrl,
          });

          // Clean up the blob URL after saving
          URL.revokeObjectURL(objectUrl);
          if (window._modelFileCache) delete window._modelFileCache[objectUrl];
          if (window._blobUrlCache) delete window._blobUrlCache[objectUrl];
        }
      } catch (error) {
        console.error('Error handling model upload:', error);
        alert(`Error loading 3D model: ${(error as Error).message}`);
      }
    }
  };

  const handlePrimitiveSelect = (type: 'cube' | 'sphere' | 'plane', specificPosition?: [number, number, number]) => {
    // Get camera position if available
    let position: [number, number, number] = [0, 1, 0];
    let rotation: [number, number, number] = [0, 0, 0];

    if (specificPosition) {
      position = specificPosition;
      // Always snap cubes to grid, even when position is specified
      if (type === 'cube') {
        position = [
          Math.round(position[0]), 
          Math.round(position[1]), // Allow placement below y=0
          Math.round(position[2])
        ];
      }
    } else if (window.mainCamera) {
      const camera = window.mainCamera;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      const pos = new THREE.Vector3();
      pos.copy(camera.position);
      direction.multiplyScalar(3); // Place 3 units in front of camera
      pos.add(direction);
      
      // For cubes, ALWAYS snap to grid (Minecraft-like behavior) and keep axis-aligned
      if (type === 'cube') {
        // Round to nearest integer for grid alignment
        position = [
          Math.round(pos.x), 
          Math.round(pos.y), // Allow placement below y=0
          Math.round(pos.z)
        ];
        // Keep cubes axis-aligned (no rotation)
        rotation = [0, 0, 0];
      } else {
        position = [pos.x, pos.y, pos.z];
        rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
      }
    } else {
      // Default fallback position - ensure cubes are grid-aligned
      if (type === 'cube') {
        position = [0, 1, 0]; // Already grid-aligned
      }
    }
    
    // console.log('HotbarTopNav: Final cube position after grid snap', position);

    // Create a unique ID for the primitive
    const id = `${type}-${Date.now()}`;

    // Create a simple SVG thumbnail without Unicode characters
    const svgString = `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#1A1A1A"/>
          ${
            type === 'cube'
              ? '<rect x="20" y="20" width="60" height="60" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
              : type === 'sphere'
                ? '<circle cx="50" cy="50" r="30" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
                : '<rect x="20" y="40" width="60" height="20" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
          }
        </svg>
      `;

    // console.log('HotbarTopNav: Selected texture for primitive', selectedImageTexture);
    
    const primitiveData = {
      id,
      url: `primitive://${type}`,
      fileName: `${type}.${type === 'plane' ? 'glb' : 'gltf'}`,
      position,
      rotation,
      scale: 1,
      isInScene: true,
      isPrimitive: true,
      primitiveType: type,
      color: selectedImageTexture ? '#ffffff' : '#4ade80', // White when textured, green when not
      textureUrl: selectedImageTexture?.url || undefined,
      textureType: selectedImageTexture ? 'image' : undefined,
      textureName: selectedImageTexture?.fileName || undefined,
      thumbnailUrl: selectedImageTexture?.url || `data:image/svg+xml;base64,${btoa(svgString)}`,
    };
    
    // console.log('HotbarTopNav: Creating primitive with data', primitiveData);
    
    // Add primitive to the model store
    addModel(primitiveData);
  };

  const handleButtonClick = (type: string) => {
    switch (type) {
      case 'img':
        fileInputRef.current?.click();
        break;
      case 'video':
        videoInputRef.current?.click();
        break;
      case 'model':
        modelInputRef.current?.click();
        break;
      case 'cube':
        handlePrimitiveSelect('cube');
        break;
      case 'draw':
        handleDraw();
        break;
      case 'sphere':
        handlePrimitiveSelect('sphere');
        break;
      case 'plane':
        handlePrimitiveSelect('plane');
        break;
      case 'code':
        handleCodeAdd();
        break;
      case 'texture':
        setShowTextureSelector(true);
        break;
      case 'cube-crafter':
        setShowCubeCrafter(true);
        break;
      default:
        break;
    }
  };

  const handleDraw = () => {
    setShowDrawingOverlay(true);
  };

  const handleCodeAdd = () => {
    // Get camera position if available
    if (window.mainCamera) {
      const camera = window.mainCamera;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      const pos = new THREE.Vector3();
      pos.copy(camera.position);
      direction.multiplyScalar(3); // Place 3 units in front of camera
      pos.add(direction);
      position = [pos.x, pos.y, pos.z];
      rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
    }

    // Create default code
    const defaultCode = `// Write your React code here
    function Counter() {
      const [count, setCount] = React.useState(0);
      
      return (
        <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem' }}>
          <h3>Counter: {count}</h3>
          <button 
            onClick={() => setCount(count + 1)}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#4ade80', 
              border: 'none', 
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Click me!
          </button>
        </div>
      );
    }

    render(<Counter />);`;

    // Add code block to the store
    addCodeBlock({
      code: defaultCode,
      fileName: 'Code Block',
      position,
      rotation,
      scale: 1,
      isInScene: true,
      noInline: true,
      language: 'jsx',
    });
  };

  const navItems = [
    // {
    //   id: 'www',
    //   icon: (
    //     <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    //       <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM16.36 6H13.36C13.08 4.84 12.68 3.72 12.16 2.68C14.16 3.24 15.84 4.44 16.36 6ZM10 2.04C10.76 3.2 11.32 4.48 11.68 5.96H8.32C8.68 4.48 9.24 3.2 10 2.04ZM2.12 12C2.04 11.36 2 10.68 2 10C2 9.32 2.04 8.64 2.12 8H5.52C5.44 8.64 5.4 9.32 5.4 10C5.4 10.68 5.44 11.36 5.52 12H2.12ZM3.64 14H6.64C6.92 15.16 7.32 16.28 7.84 17.32C5.84 16.76 4.16 15.56 3.64 14ZM6.64 6H3.64C4.16 4.44 5.84 3.24 7.84 2.68C7.32 3.72 6.92 4.84 6.64 6ZM10 17.96C9.24 16.8 8.68 15.52 8.32 14.04H11.68C11.32 15.52 10.76 16.8 10 17.96ZM12.08 12H7.92C7.84 11.36 7.8 10.68 7.8 10C7.8 9.32 7.84 8.64 7.92 8H12.08C12.16 8.64 12.2 9.32 12.2 10C12.2 10.68 12.16 11.36 12.08 12ZM12.16 17.32C12.68 16.28 13.08 15.16 13.36 14H16.36C15.84 15.56 14.16 16.76 12.16 17.32ZM14.48 12C14.56 11.36 14.6 10.68 14.6 10C14.6 9.32 14.56 8.64 14.48 8H17.88C17.96 8.64 18 9.32 18 10C18 10.68 17.96 11.36 17.88 12H14.48Z" fill="currentColor"/>
    //     </svg>
    //   )
    // },
    // {
    //   id: 'txt',
    //   icon: (
    //     <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    //       <path d="M15 1H5C2.79086 1 1 2.79086 1 5V15C1 17.2091 2.79086 19 5 19H15C17.2091 19 19 17.2091 19 15V5C19 2.79086 17.2091 1 15 1Z" stroke="currentColor" strokeWidth="2"/>
    //       <path d="M6 6H14M10 6V14M8 14H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    //     </svg>
    //   )
    // },
    {
      id: '3d',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M10 1L1 6V14L10 19L19 14V6L10 1ZM10 3.82L15.54 7L10 10.18L4.46 7L10 3.82ZM3 8.27L9 11.64V16.73L3 13.36V8.27ZM11 16.73V11.64L17 8.27V13.36L11 16.73Z'
            fill='currentColor'
          />
        </svg>
      ),
    },
    {
      id: 'img',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M17 1H3C1.89543 1 1 1.89543 1 3V17C1 18.1046 1.89543 19 3 19H17C18.1046 19 19 18.1046 19 17V3C19 1.89543 18.1046 1 17 1Z'
            stroke='currentColor'
            strokeWidth='2'
          />
          <path
            d='M1 13L6 8L10 12L13 9L19 15'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <circle cx='6.5' cy='6.5' r='1.5' fill='currentColor' />
        </svg>
      ),
    },
    {
      id: 'video',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M1 5C1 3.89543 1.89543 3 3 3H13C14.1046 3 15 3.89543 15 5V15C15 16.1046 14.1046 17 13 17H3C1.89543 17 1 16.1046 1 15V5Z'
            stroke='currentColor'
            strokeWidth='2'
          />
          <path
            d='M15 8.5L19 5V15L15 11.5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      id: 'code',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M7 4L2 9.5L7 15M13 4L18 9.5L13 15'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      id: 'draw',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M16.5 3.5L15 2L13.5 3.5L16.5 6.5L18 5L16.5 3.5Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M3.5 16.5L2 15L10 7L13 10L3.5 16.5Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path d='M10 7L13 10' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      ),
    },
    {
      id: 'cube',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M10 1L2 5V15L10 19L18 15V5L10 1ZM10 3.82L15.54 7L10 10.18L4.46 7L10 3.82ZM3 8.27L9 11.64V16.73L3 13.36V8.27ZM11 16.73V11.64L17 8.27V13.36L11 16.73Z'
            fill='currentColor'
          />
        </svg>
      ),
    },
    {
      id: 'sphere',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='10' cy='10' r='9' stroke='currentColor' strokeWidth='2' />
          <path d='M10 1C10 1 5 5.5 5 10C5 14.5 10 19 10 19' stroke='currentColor' strokeWidth='2' />
          <path d='M10 1C10 1 15 5.5 15 10C15 14.5 10 19 10 19' stroke='currentColor' strokeWidth='2' />
          <path d='M1 10H19' stroke='currentColor' strokeWidth='2' />
        </svg>
      ),
    },
    {
      id: 'plane',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M2 2H18V18H2V2Z' stroke='currentColor' strokeWidth='2' />
          <path d='M2 10H18M10 2V18' stroke='currentColor' strokeWidth='2' />
        </svg>
      ),
    },
    {
      id: 'texture',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M2 2H18V18H2V2Z' stroke='currentColor' strokeWidth='2' />
          <path d='M6 6H8V8H6V6ZM10 6H12V8H10V6ZM14 6H16V8H14V6Z' fill='currentColor' />
          <path d='M6 10H8V12H6V10ZM10 10H12V12H10V10ZM14 10H16V12H14V10Z' fill='currentColor' />
          <path d='M6 14H8V16H6V14ZM10 14H12V16H10V14ZM14 14H16V16H14V14Z' fill='currentColor' />
        </svg>
      ),
    },
    {
      id: 'cube-crafter',
      icon: (
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M10 1L2 5V15L10 19L18 15V5L10 1Z' stroke='currentColor' strokeWidth='2' fill='none' />
          <path d='M2 5L10 9L18 5M10 9V19' stroke='currentColor' strokeWidth='2' />
          <circle cx='10' cy='9' r='2' fill='currentColor' />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className='select-none absolute portrait:top-[80px] portrait:opacity-30 lg:top-[unset] sm:bottom-[130px] md:bottom-[95px] left-1/2 -translate-x-1/2 z-[9999]'>
        <div className='flex gap-1 bg-[#2c2c2c]/90 rounded-lg p-1 shadow-lg pointer-events-auto border border-[#151515] backdrop-blur-sm'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileSelect}
            multiple={false}
          />
          <input
            ref={videoInputRef}
            type='file'
            accept='video/*'
            className='hidden'
            onChange={handleVideoSelect}
            multiple={false}
          />
          <input
            ref={modelInputRef}
            type='file'
            accept='.glb,.gltf,.fbx,.obj'
            className='hidden'
            onChange={handleModelSelect}
            multiple={false}
          />
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleButtonClick(item.id)}
              className={`w-[35px] h-[35px] flex items-center justify-center text-white/90 hover:bg-[#3C3C3C] rounded transition-colors relative ${
                item.id === 'texture' && selectedImageTexture ? 'bg-green-600' : ''
              }`}
            >
              {item.icon}
              {item.id === 'texture' && selectedImageTexture && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-gray-800"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <TextureSelector 
        isOpen={showTextureSelector} 
        onClose={() => setShowTextureSelector(false)} 
      />
      
      <CubeCrafter 
        isOpen={showCubeCrafter} 
        onClose={() => setShowCubeCrafter(false)} 
      />
    </>
  );
};

export default HotbarTopNav;
