import { useState, useCallback, RefObject } from 'react';
import { useImageStore } from '../store/useImageStore';
import { useModelStore } from '../store/useModelStore';
import * as THREE from 'three';
import { saveModelThumbnail } from '../utils/modelThumbnailGenerator';

// Note: Window interface with electron API is defined in src/types/global.d.ts

// Return type for the hook
interface FileHandlingHook {
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleModelDrop: (file: File) => void;
  handleImageDrop: (file: File) => void;
}

export const useFileHandling = (
  cameraRef: RefObject<THREE.Camera>,
  onSuccessfulFileDrop?: () => void
): FileHandlingHook => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const addImage = useImageStore(state => state.addImage);
  const updateImage = useImageStore(state => state.updateImage);
  const addModel = useModelStore(state => state.addModel);
  const updateModel = useModelStore(state => state.updateModel);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging) {
      // console.log('Drag over detected');
      setIsDragging(true);
    }
  }, [isDragging]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    // console.log('Drag leave detected');
    setIsDragging(false);
  }, []);

  const handleModelDrop = useCallback((file: File): void => {
    try {
      // console.log('Starting model drop handler for file:', file.name);
      
      // Create a Blob URL for the file
      const objectUrl = URL.createObjectURL(file);
      // console.log('Created blob URL for model:', objectUrl);
      
      // Store the file in the model store to ensure it's not garbage collected
      window._modelFileCache = window._modelFileCache || {};
      window._modelFileCache[objectUrl] = file;
      
      // Also store in the blob URL cache for the Model component
      window._blobUrlCache = window._blobUrlCache || {};
      window._blobUrlCache[objectUrl] = true;
      
      // Check if we have access to the camera
      if (!cameraRef.current) {
        console.warn('Camera reference not available. Model will be placed at origin.');
        
        // Add model at origin if camera not available
        const modelId = addModel({
          url: objectUrl,
          fileName: file.name,
          position: [0, 1, 0], // Default position above ground
          rotation: [0, 0, 0],
          scale: 1,
        });
        
        // console.log('Added model at origin with ID:', modelId);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveModelFile) {
          // console.log('Saving model file to disk...');
          window.electron.saveModelFile(file, file.name).then(async (savedPath: string) => {
            // Generate and save a thumbnail for the model
            const thumbnailUrl = await saveModelThumbnail(savedPath, modelId);
            
            // Update model with the new file path and thumbnail
            updateModel(modelId, { 
              url: savedPath,
              thumbnailUrl: thumbnailUrl
            });
            // console.log(`Saved model to disk: ${savedPath}`);
            // console.log(`Generated thumbnail: ${thumbnailUrl}`);
            
            // Clean up the blob URL after the file is saved to disk
            try {
              URL.revokeObjectURL(objectUrl);
              if (window._modelFileCache) delete window._modelFileCache[objectUrl];
              if (window._blobUrlCache) delete window._blobUrlCache[objectUrl];
              // console.log('Revoked blob URL after saving to disk:', objectUrl);
            } catch (e) {
              console.error('Error revoking blob URL:', e);
            }
            
            // Call the callback after successful save
            if (onSuccessfulFileDrop) {
              // console.log('Calling file drop callback after model save');
              onSuccessfulFileDrop();
            }
          }).catch((error: Error) => {
            console.error('Error saving model file:', error);
            alert(`Error saving model file: ${error.message}`);
          });
        } else {
          console.info('Running in browser environment, using blob URL for model storage');
          // Call the callback for browser environment
          if (onSuccessfulFileDrop) {
            // console.log('Calling file drop callback for browser environment');
            setTimeout(onSuccessfulFileDrop, 500);
          }
        }
        
        return;
      }
      
      // Use the camera reference to get position and direction
      const camera = cameraRef.current;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      const position = new THREE.Vector3();
      position.copy(camera.position);
      direction.multiplyScalar(3); // Place 3 units in front of camera
      position.add(direction);
      
      // console.log('Placing model at position:', position);
      
      // Add model to the store
      const modelId = addModel({
        url: objectUrl,
        fileName: file.name,
        position: [position.x, position.y, position.z],
        rotation: [0, 0, 0],
        scale: 1,
      });
      
      // console.log(`Added model: ${file.name} with ID: ${modelId} at position:`, position);
      
      // Save the file to disk using Electron's IPC
      if (window.electron && window.electron.saveModelFile) {
        // console.log('Saving model file to disk...');
        window.electron.saveModelFile(file, file.name).then(async (savedPath: string) => {
          // Generate and save a thumbnail for the model
          const thumbnailUrl = await saveModelThumbnail(savedPath, modelId);
          
          // Update model with the new file path and thumbnail
          updateModel(modelId, { 
            url: savedPath,
            thumbnailUrl: thumbnailUrl
          });
          // console.log(`Saved model to disk: ${savedPath}`);
          // console.log(`Generated thumbnail: ${thumbnailUrl}`);
          
          // Clean up the blob URL after the file is saved to disk
          try {
            URL.revokeObjectURL(objectUrl);
            if (window._modelFileCache) delete window._modelFileCache[objectUrl];
            if (window._blobUrlCache) delete window._blobUrlCache[objectUrl];
            // console.log('Revoked blob URL after saving to disk:', objectUrl);
          } catch (e) {
            console.error('Error revoking blob URL:', e);
          }
          
          // Call the callback after successful save
          if (onSuccessfulFileDrop) {
            // console.log('Calling file drop callback after model save');
            onSuccessfulFileDrop();
          }
        }).catch((error: Error) => {
          console.error('Error saving model file:', error);
          alert(`Error saving model file: ${error.message}`);
        });
      } else {
        console.info('Running in browser environment, using blob URL for model storage');
        // Call the callback for browser environment
        if (onSuccessfulFileDrop) {
          // console.log('Calling file drop callback for browser environment');
          setTimeout(onSuccessfulFileDrop, 500);
        }
      }
    } catch (error) {
      console.error('Error handling model drop:', error);
      alert(`Error loading 3D model: ${(error as Error).message}`);
    }
  }, [addModel, updateModel, cameraRef, onSuccessfulFileDrop]);

  const handleImageDrop = useCallback((file: File): void => {
    try {
      // console.log('Starting image drop handler for file:', file.name);
      
      // Create a Blob URL for the file
      const objectUrl = URL.createObjectURL(file);
      // console.log('Created blob URL for image:', objectUrl);
      
      // Check if we have access to the camera
      if (!cameraRef.current) {
        console.warn('Camera reference not available. Image will be placed at origin.');
        
        // Add image at origin if camera not available
        const imageId = addImage({
          src: objectUrl,
          fileName: file.name,
          position: [0, 1, 0], // Default position
          rotation: [0, 0, 0],
          scale: 1,
        });
        
        // console.log('Added image at origin with ID:', imageId);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveImageFile) {
          // console.log('Saving image file to disk...');
          window.electron.saveImageFile(file, file.name).then((savedPath: string) => {
            // Update image with the new file path
            updateImage(imageId, { src: savedPath });
            // console.log(`Saved image to disk: ${savedPath}`);
            
            // Call the callback after successful save
            if (onSuccessfulFileDrop) {
              // console.log('Calling file drop callback after image save');
              onSuccessfulFileDrop();
            }
          }).catch((error: Error) => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
          });
        } else {
          console.info('Running in browser environment, using blob URL for image storage');
          // Call the callback for browser environment
          if (onSuccessfulFileDrop) {
            // console.log('Calling file drop callback for browser environment');
            setTimeout(onSuccessfulFileDrop, 500);
          }
        }
        
        return;
      }
      
      // Use the camera reference to get position and direction
      const camera = cameraRef.current;
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      const position = new THREE.Vector3();
      position.copy(camera.position);
      direction.multiplyScalar(3); // Place 3 units in front of camera
      position.add(direction);
      
      // console.log('Placing image at position:', position);
      
      // Calculate image dimensions asynchronously
      const img = new Image();
      img.onload = () => {
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        // console.log('Image loaded with dimensions:', img.width, 'x', img.height, 'aspect ratio:', aspectRatio);
        
        // Add image to the store
        const imageId = addImage({
          src: objectUrl,
          fileName: file.name,
          position: [position.x, position.y, position.z],
          rotation: [0, 0, 0],
          scale: 1,
          width: 300,
          height: 200,
          aspectRatio,
        });
        
        // console.log(`Added image: ${file.name} with ID: ${imageId} at position:`, position);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveImageFile) {
          // console.log('Saving image file to disk...');
          window.electron.saveImageFile(file, file.name).then((savedPath: string) => {
            // Update image with the new file path
            updateImage(imageId, { src: savedPath });
            // console.log(`Saved image to disk: ${savedPath}`);
            
            // Call the callback after successful save
            if (onSuccessfulFileDrop) {
              // console.log('Calling file drop callback after image save');
              onSuccessfulFileDrop();
            }
          }).catch((error: Error) => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
          });
        } else {
          console.info('Running in browser environment, using blob URL for image storage');
          // Call the callback for browser environment
          if (onSuccessfulFileDrop) {
            // console.log('Calling file drop callback for browser environment');
            setTimeout(onSuccessfulFileDrop, 500);
          }
        }
      };
      
      img.onerror = (error) => {
        console.error('Error loading image dimensions:', error);
        
        // Add image without dimensions
        const imageId = addImage({
          src: objectUrl,
          fileName: file.name,
          position: [position.x, position.y, position.z],
          rotation: [0, 0, 0],
          scale: 1,
        });
        
        // console.log(`Added image without dimensions: ${file.name} with ID: ${imageId}`);
        
        // Save the file to disk using Electron's IPC
        if (window.electron && window.electron.saveImageFile) {
          // console.log('Saving image file to disk...');
          window.electron.saveImageFile(file, file.name).then((savedPath: string) => {
            // Update image with the new file path
            updateImage(imageId, { src: savedPath });
            // console.log(`Saved image to disk: ${savedPath}`);
            
            // Call the callback after successful save
            if (onSuccessfulFileDrop) {
              // console.log('Calling file drop callback after image save');
              onSuccessfulFileDrop();
            }
          }).catch((error: Error) => {
            console.error('Error saving image file:', error);
            alert(`Error saving image file: ${error.message}`);
          });
        } else {
          console.info('Running in browser environment, using blob URL for image storage');
          // Call the callback for browser environment
          if (onSuccessfulFileDrop) {
            // console.log('Calling file drop callback for browser environment');
            setTimeout(onSuccessfulFileDrop, 500);
          }
        }
      };
      
      img.src = objectUrl;
    } catch (error) {
      console.error('Error handling image drop:', error);
      alert(`Error loading image: ${(error as Error).message}`);
    }
  }, [addImage, updateImage, cameraRef, onSuccessfulFileDrop]);

  interface InventoryItem {
    type: string;
    url: string;
    fileName?: string;
    [key: string]: any;
  }
  
  interface InventoryDrop {
    type: string;
    itemData?: InventoryItem;
    [key: string]: any;
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    // console.log('Drop detected');
    setIsDragging(false);
    
    // Check for inventory item data
    try {
      // First, check if this is an inventory item drop
      const jsonData = e.dataTransfer.getData('application/json');
      // console.log('Checking for JSON data in drop:', jsonData);
      
      if (jsonData) {
        try {
          const data = JSON.parse(jsonData) as InventoryDrop;
          // console.log('Parsed drop data:', data);
          
          if (data.type === 'inventory-item' && data.itemData) {
            // console.log('Inventory item dropped:', data.itemData);
            const item = data.itemData;
            
            // Handle based on item type
            if (item.type === 'image') {
              // Add the selected image to the scene
              if (item && item.url) {
                const position = new THREE.Vector3();
                
                // If camera is available, place in front of camera
                if (cameraRef.current) {
                  const camera = cameraRef.current;
                  const direction = new THREE.Vector3(0, 0, -1);
                  direction.applyQuaternion(camera.quaternion);
                  
                  position.copy(camera.position);
                  direction.multiplyScalar(3); // Place 3 units in front of camera
                  position.add(direction);
                } else {
                  // Default position if camera not available
                  position.set(0, 1, 0);
                }
                
                // Add image to the store
                const imageId = addImage({
                  src: item.url,
                  fileName: item.fileName || 'Untitled Image',
                  position: [position.x, position.y, position.z],
                  rotation: [0, 0, 0],
                  scale: 1,
                });
                
                // console.log(`Added image from inventory: ${item.fileName} with ID: ${imageId}`);
                return; // Exit early since we've handled the drop
              }
            } else if (item.type === 'model') {
              // Add the selected model to the scene
              if (item && item.url) {
                const position = new THREE.Vector3();
                
                // If camera is available, place in front of camera
                if (cameraRef.current) {
                  const camera = cameraRef.current;
                  const direction = new THREE.Vector3(0, 0, -1);
                  direction.applyQuaternion(camera.quaternion);
                  
                  position.copy(camera.position);
                  direction.multiplyScalar(3); // Place 3 units in front of camera
                  position.add(direction);
                } else {
                  // Default position if camera not available
                  position.set(0, 1, 0);
                }
                
                // Add model to the store
                const modelId = addModel({
                  url: item.url,
                  fileName: item.fileName || 'Untitled Model',
                  position: [position.x, position.y, position.z],
                  rotation: [0, 0, 0],
                  scale: 1,
                });
                
                // console.log(`Added model from inventory: ${item.fileName} with ID: ${modelId}`);
                return; // Exit early since we've handled the drop
              }
            }
          }
        } catch (jsonError) {
          console.error('Error parsing JSON data from drop:', jsonError);
        }
      }
    } catch (error) {
      console.error('Error processing inventory item drop:', error);
    }
    
    // If not an inventory item, process as a file drop
    const files = e.dataTransfer.files;
    if (files.length === 0) {
      // console.log('No files dropped');
      return;
    }
    
    // console.log(`${files.length} file(s) dropped`);
    
    // Process only the first file
    const file = files[0];
    // console.log('Dropped file:', file.name, file.type, file.size);
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    
    // Handle 3D model files
    if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      // console.log('Processing as 3D model file');
      handleModelDrop(file);
    }
    // Handle image files
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
             fileName.endsWith('.png') || fileName.endsWith('.webp') || 
             fileName.endsWith('.gif')) {
      // console.log('Processing as image file');
      handleImageDrop(file);
    } else {
      // console.log('Unsupported file type:', fileName);
      alert(`Unsupported file type: ${fileName}\nSupported formats: GLB, GLTF, JPG, PNG, WEBP, GIF`);
    }
  }, [handleModelDrop, handleImageDrop, addImage, addModel, cameraRef, onSuccessfulFileDrop]);

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleModelDrop,
    handleImageDrop
  };
}; 