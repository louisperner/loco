import { create } from 'zustand';
import * as THREE from 'three';

/**
 * Store para gerenciar imagens no espaço 3D
 */
const STORAGE_KEY = 'scene-images';

const loadImagesFromStorage = () => {
  try {
    const savedImages = localStorage.getItem(STORAGE_KEY);
    const parsedImages = savedImages ? JSON.parse(savedImages) : [];
    
    // Processar URLs das imagens para converter file:// para app-file://
    return parsedImages.map(image => {
      if (image.src && image.src.startsWith('file://')) {
        console.log('Convertendo URL de imagem salva:', image.src);
        return {
          ...image,
          src: image.src.replace('file://', 'app-file://')
        };
      }
      return image;
    });
  } catch (error) {
    console.error('Error loading saved images:', error);
    return [];
  }
};

// Helper function to clean up blob URLs
const cleanupBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    try {
      // Check if this blob URL is in the cache before revoking
      if (window._imageBlobCache) {
        // Find all app-file URLs that map to this blob URL
        const appFileUrls = Object.keys(window._imageBlobCache).filter(
          key => window._imageBlobCache[key] === url
        );
        
        // Remove from cache
        appFileUrls.forEach(appFileUrl => {
          delete window._imageBlobCache[appFileUrl];
        });
      }
      
      // Revoke the URL if it's not used elsewhere
      URL.revokeObjectURL(url);
      console.log('Revoked blob URL for image:', url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }
};

const useImageStore = create((set, get) => ({
  images: loadImagesFromStorage(), // Carrega imagens diretamente na inicialização
  
  addImage: (imageData) => {
    const newImage = {
      ...imageData,
      id: Date.now().toString(),
    };
    
    set(state => {
      const newImages = [...state.images, newImage];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      return { images: newImages };
    });
    
    return newImage.id;
  },
  
  removeImage: (imageId) => {
    set(state => {
      // Find the image to remove
      const imageToRemove = state.images.find(img => img.id === imageId);
      
      // Clean up any blob URLs associated with this image
      if (imageToRemove && imageToRemove.src) {
        // If it's a blob URL, revoke it directly
        if (imageToRemove.src.startsWith('blob:')) {
          cleanupBlobUrl(imageToRemove.src);
        }
        
        // If it's an app-file URL, check if it has an associated blob URL in the cache
        if (imageToRemove.src.startsWith('app-file://') && window._imageBlobCache) {
          const blobUrl = window._imageBlobCache[imageToRemove.src];
          if (blobUrl) {
            cleanupBlobUrl(blobUrl);
          }
        }
      }
      
      const newImages = state.images.filter(img => img.id !== imageId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      return { images: newImages };
    });
  },

  updateImage: (imageId, updatedData) => {
    set(state => {
      const newImages = state.images.map(img => 
        img.id === imageId 
          ? { ...img, ...updatedData }
          : img
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      return { images: newImages };
    });
  },
  
  loadSavedImages: () => {
    const images = loadImagesFromStorage();
    set({ images });
  },

  clearImages: () => {
    // Clean up all blob URLs before clearing
    const images = get().images;
    images.forEach(image => {
      if (image.src) {
        // If it's a blob URL, revoke it directly
        if (image.src.startsWith('blob:')) {
          cleanupBlobUrl(image.src);
        }
        
        // If it's an app-file URL, check if it has an associated blob URL in the cache
        if (image.src.startsWith('app-file://') && window._imageBlobCache) {
          const blobUrl = window._imageBlobCache[image.src];
          if (blobUrl) {
            cleanupBlobUrl(blobUrl);
          }
        }
      }
    });
    
    localStorage.removeItem(STORAGE_KEY);
    set({ images: [] });
  }
}));

export { useImageStore }; 