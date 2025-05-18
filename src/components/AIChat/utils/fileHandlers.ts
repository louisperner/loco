import { useImageStore } from '@/store/useImageStore';
import { useVideoStore } from '@/store/videoStore';
import { useModelStore } from '@/store/useModelStore';
import { getCameraPosition, getCameraRotation } from './aiChatUtils';

// Handle file select for images
export const handleImageUpload = (
  file: File, 
  setCommandFeedback: (feedback: string | null) => void
) => {
  const objectUrl = URL.createObjectURL(file);
  const { addImage, updateImage } = useImageStore.getState();

  // Create an image to get dimensions
  const img = new Image();
  img.onload = () => {
    const aspectRatio = img.width / img.height;
    const scale =
      aspectRatio > 1
        ? ([aspectRatio, 1, 1] as [number, number, number])
        : ([1, 1 / aspectRatio, 1] as [number, number, number]);

    // Get camera position if available
    const position = getCameraPosition(3);
    const rotation = getCameraRotation();

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
    const electron = (window as unknown as { electron?: { saveImageFile: (file: File, fileName: string) => Promise<string> } }).electron;
    if (electron?.saveImageFile) {
      electron
        .saveImageFile(file, file.name)
        .then((savedPath: string) => {
          // Update image with the new file path
          updateImage(imageId, { src: savedPath });
          
          // Clean up the blob URL after saving
          URL.revokeObjectURL(objectUrl);
        })
        .catch((error: Error) => {
          console.error('Error saving image file:', error);
          setCommandFeedback(`Error saving image file: ${error.message}`);
        });
    }
    
    // Add feedback message
    setCommandFeedback(`Added image ${file.name}`);
  };

  img.onerror = () => {
    console.error('Failed to load image');
    setCommandFeedback('Failed to load image');
  };

  img.src = objectUrl;
};

// Handle file select for videos
export const handleVideoUpload = (
  file: File,
  setCommandFeedback: (feedback: string | null) => void
) => {
  const objectUrl = URL.createObjectURL(file);
  const { addVideo } = useVideoStore.getState();
  
  // Get camera position if available
  const position = getCameraPosition(3);
  const rotation = getCameraRotation();
  
  // Add video to store
  addVideo({
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
  
  // Add feedback
  setCommandFeedback(`Added video ${file.name}`);
};

// Handle file select for 3D models
export const handleModelUpload = (
  file: File,
  setCommandFeedback: (feedback: string | null) => void
) => {
  const objectUrl = URL.createObjectURL(file);
  const { addModel } = useModelStore.getState();
  
  // Get camera position if available
  const position = getCameraPosition(3);
  const rotation = getCameraRotation();
  
  // Store the file in the model cache
  window._modelFileCache = window._modelFileCache || {};
  window._modelFileCache[objectUrl] = file;
  
  // Store in the blob URL cache
  window._blobUrlCache = window._blobUrlCache || {};
  window._blobUrlCache[objectUrl] = true;
  
  // Add model to the store
  addModel({
    url: objectUrl,
    fileName: file.name,
    position,
    rotation,
    scale: 1,
    isInScene: true,
  });
  
  // Add feedback
  setCommandFeedback(`Added 3D model ${file.name}`);
}; 