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
    localStorage.removeItem(STORAGE_KEY);
    set({ images: [] });
  }
}));

export { useImageStore }; 