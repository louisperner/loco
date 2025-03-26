import { create } from 'zustand';

/**
 * Store para gerenciar imagens no espaço 3D
 */
const STORAGE_KEY = 'scene-images';

// Image interface
export interface Image {
  id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  fileName?: string;
  fromUrl?: string;
  [key: string]: unknown;
}

// Image data interface for adding new images
export interface ImageData {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  fileName?: string;
  fromUrl?: string;
  [key: string]: unknown;
}

// Store interface
interface ImageStore {
  images: Image[];
  addImage: (imageData: ImageData) => string;
  removeImage: (imageId: string) => void;
  updateImage: (imageId: string, updatedData: Partial<Image>) => void;
  loadSavedImages: () => void;
  clearImages: () => void;
}

// Declare window extensions
// Note: Window interface with _imageBlobCache is defined in src/types/global.d.ts

const loadImagesFromStorage = (): Image[] => {
  try {
    const savedImages = localStorage.getItem(STORAGE_KEY);
    const parsedImages: Image[] = savedImages ? JSON.parse(savedImages) : [];
    
    // Processar URLs das imagens para converter file:// para app-file://
    return parsedImages.map(image => {
      if (image.src && image.src.startsWith('file://')) {
        // console.log('Convertendo URL de imagem salva:', image.src);
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
const cleanupBlobUrl = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    try {
      // Check if this blob URL is in the cache before revoking
      if (window._imageBlobCache) {
        // Find all app-file URLs that map to this blob URL
        const appFileUrls = Object.keys(window._imageBlobCache).filter(
          key => window._imageBlobCache && window._imageBlobCache[key] === url
        );
        
        // Remove from cache
        appFileUrls.forEach(appFileUrl => {
          if (window._imageBlobCache) {
            delete window._imageBlobCache[appFileUrl];
          }
        });
      }
      
      // Revoke the URL if it's not used elsewhere
      URL.revokeObjectURL(url);
      // console.log('Revoked blob URL for image:', url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }
};

const useImageStore = create<ImageStore>((set, get) => ({
  images: loadImagesFromStorage(), // Carrega imagens diretamente na inicialização
  
  addImage: (imageData: ImageData): string => {
    const newImage: Image = {
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
  
  removeImage: (imageId: string): void => {
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

  updateImage: (imageId: string, updatedData: Partial<Image>): void => {
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
  
  loadSavedImages: (): void => {
    const images = loadImagesFromStorage();
    set({ images });
  },

  clearImages: (): void => {
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