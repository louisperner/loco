import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Define an interface for just the functions we need in this file
interface ElectronHelpers {
  loadFileAsBlob?: (url: string) => Promise<{
    success: boolean;
    blobUrl?: string;
    error?: string;
  }>;
  saveImageFile?: (file: File, filename: string) => Promise<string | null>;
}

/**
 * Generates a thumbnail for a 3D model
 * @param {string} modelUrl - URL of the 3D model
 * @param {number} width - Width of the thumbnail
 * @param {number} height - Height of the thumbnail
 * @returns {Promise<string | null>} - Promise that resolves to the thumbnail URL or null if generation fails
 */
export const generateModelThumbnail = async (
  modelUrl: string, 
  width: number = 300, 
  height: number = 300
): Promise<string | null> => {
  // Create a scene setup for rendering
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  
  // Create a camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Get a reference to the electron API with the right typing
  const electron = window.electron as ElectronHelpers | undefined;
  
  try {
    // Handle different URL protocols
    if (modelUrl.startsWith('app-file://') && electron?.loadFileAsBlob) {
      const result = await electron.loadFileAsBlob(modelUrl);
      if (result.success && result.blobUrl) {
        return await renderThumbnail(result.blobUrl);
      } else {
        console.error('Failed to load model file:', result.error);
        return null;
      }
    } else if (modelUrl.startsWith('file://') || modelUrl.startsWith('app-file://')) {
      // Browser environment can't load file:// or app-file:// URLs directly
      return null;
    } else {
      // Regular URL, render directly
      return await renderThumbnail(modelUrl);
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }

  /**
   * Renders a thumbnail for a model
   * @param {string} url - URL of the model
   * @returns {Promise<string | null>} - Promise that resolves to the thumbnail URL
   */
  async function renderThumbnail(url: string): Promise<string | null> {
    try {
      const thumbnailUrl = await loadModel(url);
      return thumbnailUrl;
    } catch (error) {
      console.error('Error rendering thumbnail:', error);
      return null;
    }
  }
  
  /**
   * Loads a 3D model and renders it
   * @param {string} url - URL of the model
   * @returns {Promise<string>} - Promise that resolves to the rendered image data URL
   */
  function loadModel(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          // Add the model to the scene
          scene.add(gltf.scene);
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          
          gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          gltf.scene.scale.set(scale, scale, scale);
          
          // Render the scene
          renderer.render(scene, camera);
          
          // Get the thumbnail URL
          const thumbnailUrl = renderer.domElement.toDataURL('image/png');
          
          // Clean up
          if (url.startsWith('blob:') && url !== modelUrl) {
            URL.revokeObjectURL(url);
          }
          
          resolve(thumbnailUrl);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }
};

/**
 * Saves a model thumbnail to disk
 * @param {string} modelUrl - URL of the 3D model
 * @param {string} modelId - ID of the model
 * @returns {Promise<string | null>} - Promise that resolves to the thumbnail URL or null if saving fails
 */
export const saveModelThumbnail = async (
  modelUrl: string, 
  modelId: string
): Promise<string | null> => {
  try {
    // Generate the thumbnail
    const thumbnailDataUrl = await generateModelThumbnail(modelUrl);
    
    if (!thumbnailDataUrl) {
      throw new Error('Failed to generate thumbnail');
    }
    
    // Convert data URL to blob
    const response = await fetch(thumbnailDataUrl);
    const blob = await response.blob();
    
    // Create a File object
    const file = new File([blob], `${modelId}-thumbnail.png`, { type: 'image/png' });
    
    // Get a reference to the electron API with the right typing
    const electron = window.electron as ElectronHelpers | undefined;
    
    // Save the thumbnail to disk using the electron API
    if (electron?.saveImageFile) {
      return await electron.saveImageFile(file, `${modelId}-thumbnail.png`);
    } else {
      throw new Error('Electron API saveImageFile not available');
    }
  } catch (error) {
    console.error('Error saving model thumbnail:', error);
    return null;
  }
};

export default {
  generateModelThumbnail,
  saveModelThumbnail
}; 