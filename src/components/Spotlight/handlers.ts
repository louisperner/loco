import * as THREE from 'three';
import { useGameStore } from '@/store/useGameStore';
import { useImageStore } from '@/store/useImageStore';
import { useVideoStore } from '@/store/videoStore';
import { useModelStore } from '@/store/useModelStore';
import { useCodeStore } from '@/store/useCodeStore';
import { generateVideoThumbnail } from '@/components/Models/utils';
import { getCameraPositionAndRotation } from './utils';

// Define specific types for store functions
type AddModelFn = (model: any) => string;
type ConfirmedPositionType = [number, number, number] | null;
type SetShowDrawingOverlayFn = (show: boolean) => void;
type AddCodeBlockFn = (codeBlock: any) => string;
type AddImageFn = (image: any) => string;
type UpdateImageFn = (id: string, updates: any) => void;
type AddVideoFn = (video: any) => string;
type UpdateVideoFn = (id: string, updates: any) => void;

// Handle primitive selections (cube, sphere, plane)
export const handlePrimitiveSelect = (
  type: 'cube' | 'sphere' | 'plane',
  addModel: AddModelFn,
  confirmedPosition: ConfirmedPositionType,
  specificPosition?: [number, number, number]
) => {
  // Use selected position from store if available (for cube)
  let position: [number, number, number] = [0, 1, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  if (specificPosition) {
    // Use the specific position if provided
    position = specificPosition;
  } else if (type === 'cube' && confirmedPosition) {
    // Snap to grid for cubes
    position = [
      Math.round(confirmedPosition[0]),
      Math.max(0, Math.round(confirmedPosition[1])),
      Math.round(confirmedPosition[2])
    ];
  } else if (window.mainCamera) {
    const camera = window.mainCamera;
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    const pos = new THREE.Vector3();
    pos.copy(camera.position);
    direction.multiplyScalar(3); // Place 3 units in front of camera
    pos.add(direction);

    if (type === 'cube') {
      // Round to nearest integer for grid alignment
      position = [
        Math.round(pos.x),
        Math.max(0, Math.round(pos.y)), // Ensure y is not below ground
        Math.round(pos.z)
      ];
    } else {
      position = [pos.x, pos.y, pos.z];
    }
    rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
  }

  // Create a unique ID for the primitive
  const id = `${type}-${Date.now()}`;

  // Create a simple SVG thumbnail
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

  // Add primitive to the model store
  addModel({
    id,
    url: `primitive://${type}`,
    fileName: `${type}.${type === 'plane' ? 'glb' : 'gltf'}`,
    position,
    rotation,
    scale: 1,
    isInScene: true,
    isPrimitive: true,
    primitiveType: type,
    color: '#4ade80',
    thumbnailUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
  });
};

// Handle drawing mode
export const handleDraw = (
  setShowDrawingOverlay: SetShowDrawingOverlayFn
) => {
  setShowDrawingOverlay(true);
};

// Handle adding code blocks
export const handleCodeAdd = (
  addCodeBlock: AddCodeBlockFn
) => {
  // Get camera position if available
  const { position, rotation } = getCameraPositionAndRotation(window);

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

// Handle file changes for images
export const handleFileSelect = async (
  file: File,
  addImage: AddImageFn,
  updateImage: UpdateImageFn
) => {
  if (!file) return;
  
  const objectUrl = URL.createObjectURL(file);

  // Create an image to get dimensions
  const img = new window.Image();
  
  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const scale =
        aspectRatio > 1
          ? ([aspectRatio, 1, 1] as [number, number, number])
          : ([1, 1 / aspectRatio, 1] as [number, number, number]);

      // Get camera position
      const { position, rotation } = getCameraPositionAndRotation(window);

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
            resolve();
          })
          .catch((error: Error) => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
            reject(error);
          });
      } else {
        resolve();
      }
    };

    img.onerror = (error) => {
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
            resolve();
          })
          .catch((err: Error) => {
            console.error('Error saving image file:', err);
            alert(`Error saving image file: ${err.message}`);
            reject(err);
          });
      } else {
        resolve();
      }
      
      console.error('Error loading image:', error);
    };

    img.src = objectUrl;
  });
};

// Handle video file select 
export const handleVideoSelect = async (
  file: File,
  addVideo: AddVideoFn,
  updateVideo: UpdateVideoFn
) => {
  if (!file) return;
  
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

    // Get camera position
    const { position, rotation } = getCameraPositionAndRotation(window);

    // Add video to the store
    const videoId = addVideo({
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
    
    // Save the file to disk if in Electron environment
    if (window.electron?.saveVideoFile) {
      window.electron
        .saveVideoFile(file, file.name)
        .then((savedPath: string) => {
          // Update video with the new file path
          updateVideo(videoId, { src: savedPath });
          
          // Clean up the blob URL after saving
          URL.revokeObjectURL(objectUrl);
        })
        .catch((error: Error) => {
          console.error('Error saving video file:', error);
          alert(`Error saving video file: ${error.message}`);
        });
    }
    
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
      const { position, rotation } = getCameraPositionAndRotation(window);
      const videoId = addVideo({
        src: objectUrl,
        fileName: file.name,
        position,
        rotation,
        scale: 3,
        isPlaying: true,
        volume: 0.5,
        loop: true,
        isInScene: true,
      });
      
      // Save the file to disk if in Electron environment
      if (window.electron?.saveVideoFile) {
        window.electron
          .saveVideoFile(file, file.name)
          .then((savedPath: string) => {
            // Update video with the new file path
            updateVideo(videoId, { src: savedPath });
            
            // Clean up the blob URL after saving
            URL.revokeObjectURL(objectUrl);
          })
          .catch((error: Error) => {
            console.error('Error saving video file:', error);
            alert(`Error saving video file: ${error.message}`);
          });
      }
    } catch (addError) {
      console.error('Fatal error adding video:', addError);
      alert('Could not add video: ' + (addError instanceof Error ? addError.message : 'Unknown error'));
    }
  }
};

// Handle model file select
export const handleModelSelect = async (
  file: File,
  addModel: AddModelFn
) => {
  if (!file) return;
  
  const objectUrl = URL.createObjectURL(file);

  try {
    // Get camera position
    const { position, rotation } = getCameraPositionAndRotation(window);

    // Add model to the store
    addModel({
      url: objectUrl,
      fileName: file.name,
      position,
      rotation,
      scale: 1,
      isInScene: true,
    });
  } catch (error) {
    console.error('Error handling model upload:', error);
  }
}; 