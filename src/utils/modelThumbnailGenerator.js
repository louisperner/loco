import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Generates a thumbnail for a 3D model
 * @param {string} modelUrl - URL of the 3D model
 * @param {number} width - Width of the thumbnail
 * @param {number} height - Height of the thumbnail
 * @returns {Promise<string>} - Promise that resolves to the thumbnail URL
 */
export const generateModelThumbnail = async (modelUrl, width = 300, height = 300) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      
      // Create a camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5);
      
      // Create a renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.outputEncoding = THREE.sRGBEncoding;
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Load the model
      const loader = new GLTFLoader();
      
      // Handle app-file:// URLs with electron APIs
      if (modelUrl.startsWith('app-file://') && window.electron && window.electron.loadFileAsBlob) {
        window.electron.loadFileAsBlob(modelUrl)
          .then(result => {
            if (result.success) {
              resolve(renderThumbnail(result.blobUrl, modelId));
            } else {
              console.error('Failed to load model file:', result.error);
              resolve(null);
            }
          })
          .catch(err => {
            console.error('Error loading model file:', err);
            resolve(null);
          });
      } else if (modelUrl.startsWith('file://') || modelUrl.startsWith('app-file://')) {
        // Browser environment with file:// or app-file:// URLs
        console.info('Browser environment detected, cannot generate thumbnail for file URLs');
        resolve(null);
      } else {
        // Regular URL, try to render it directly
        resolve(renderThumbnail(modelUrl, modelId));
      }
      
      function loadModel(url) {
        loader.load(
          url,
          (gltf) => {
            // Add the model to the scene
            scene.add(gltf.scene);
            
            // Center the model
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
            
            // Resolve with the thumbnail URL
            resolve(thumbnailUrl);
          },
          undefined,
          (error) => {
            reject(error);
          }
        );
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Saves a model thumbnail to disk
 * @param {string} modelUrl - URL of the 3D model
 * @param {string} modelId - ID of the model
 * @returns {Promise<string>} - Promise that resolves to the thumbnail URL
 */
export const saveModelThumbnail = async (modelUrl, modelId) => {
  try {
    // Generate the thumbnail
    const thumbnailDataUrl = await generateModelThumbnail(modelUrl);
    
    // Convert data URL to blob
    const response = await fetch(thumbnailDataUrl);
    const blob = await response.blob();
    
    // Create a File object
    const file = new File([blob], `${modelId}-thumbnail.png`, { type: 'image/png' });
    
    // Save the thumbnail to disk
    if (window.electron && window.electron.saveImageFile) {
      const result = await window.electron.saveImageFile(file, `${modelId}-thumbnail.png`);
      return result;
    } else {
      throw new Error('Electron API not available');
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