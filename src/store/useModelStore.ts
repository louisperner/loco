import { create } from 'zustand';
import * as THREE from 'three';

/**
 * Store para gerenciar modelos 3D no espaço
 */
const STORAGE_KEY = 'scene-models';

// Model interface
export interface Model {
  id: string;
  url: string;
  fileName?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number | [number, number, number];
  added: string;
  [key: string]: any;
}

// ModelData interface (for adding new models)
export interface ModelData {
  url: string;
  fileName?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  [key: string]: any;
}

// Store interface
interface ModelStore {
  models: Model[];
  addModel: (modelData: ModelData) => string;
  updateModel: (id: string, updates: Partial<Model>) => void;
  removeModel: (id: string) => void;
  clearAllModels: () => void;
}

// Declare window extensions
declare global {
  interface Window {
    _modelFileCache?: Record<string, any>;
    _blobUrlCache?: Record<string, any>;
  }
}

// Helper function to clean up blob URLs
const cleanupBlobUrl = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    try {
      // Remove from caches
      if (window._modelFileCache && window._modelFileCache[url]) {
        delete window._modelFileCache[url];
      }
      
      if (window._blobUrlCache && window._blobUrlCache[url]) {
        delete window._blobUrlCache[url];
      }
      
      // Revoke the URL
      URL.revokeObjectURL(url);
      console.log('Revoked blob URL:', url);
    } catch (error) {
      console.error('Error cleaning up blob URL:', error);
    }
  }
};

// Manter um cache de blobs para modelos
const modelBlobCache = new Map<string, string>();

const loadModelsFromStorage = (): Model[] => {
  try {
    const savedModels = localStorage.getItem(STORAGE_KEY);
    const parsedModels: Model[] = savedModels ? JSON.parse(savedModels) : [];
    
    // Processar URLs dos modelos para converter file:// para app-file://
    // e também pré-carregar quando possível
    return parsedModels.map(model => {
      if (model.url && model.url.startsWith('file://')) {
        console.log('Convertendo URL de modelo salvo:', model.url);
        return {
          ...model,
          url: model.url.replace('file://', 'app-file://')
        };
      }
      return model;
    });
  } catch (error) {
    console.error('Error loading saved models:', error);
    return [];
  }
};

export const useModelStore = create<ModelStore>((set, get) => ({
  models: loadModelsFromStorage(),
  
  /**
   * Adiciona um novo modelo 3D na cena
   */
  addModel: (modelData: ModelData): string => {
    const id = Date.now().toString();
    
    // Calculate position in front of camera if not provided
    const position = modelData.position || [0, 0, -3] as [number, number, number];
    const rotation = modelData.rotation || [0, 0, 0] as [number, number, number];
    const scale = modelData.scale || 1;
    
    const newModel: Model = {
      ...modelData,
      id,
      position,
      rotation,
      scale,
      added: new Date().toISOString(),
    };
    
    set(state => {
      const updatedModels = [...state.models, newModel];
      
      // Only save non-blob data to localStorage to prevent issues
      const storageModels = updatedModels.map(model => {
        // For blob URLs, just save a placeholder with the filename
        if (model.url && model.url.startsWith('blob:')) {
          return {
            ...model,
            url: `file://${model.fileName || 'unknown'}` // Use a placeholder
          };
        }
        return model;
      });
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageModels));
      } catch (error) {
        console.error('Error saving models to localStorage:', error);
      }
      
      return { models: updatedModels };
    });
    
    return id;
  },
  
  /**
   * Atualiza um modelo existente
   */
  updateModel: (id: string, updates: Partial<Model>): void => {
    set(state => {
      const updatedModels = state.models.map(model => 
        model.id === id ? { ...model, ...updates } : model
      );
      
      // Only save non-blob data to localStorage to prevent issues
      const storageModels = updatedModels.map(model => {
        // For blob URLs, just save a placeholder with the filename
        if (model.url && model.url.startsWith('blob:')) {
          return {
            ...model,
            url: `file://${model.fileName || 'unknown'}` // Use a placeholder
          };
        }
        return model;
      });
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageModels));
      } catch (error) {
        console.error('Error saving models to localStorage:', error);
      }
      
      return { models: updatedModels };
    });
  },
  
  /**
   * Remove um modelo da cena
   */
  removeModel: (id: string): void => {
    set(state => {
      // Find the model to remove
      const modelToRemove = state.models.find(model => model.id === id);
      
      // Clean up any blob URLs
      if (modelToRemove && modelToRemove.url) {
        cleanupBlobUrl(modelToRemove.url);
      }
      
      const updatedModels = state.models.filter(model => model.id !== id);
      
      try {
        // Only save non-blob data to localStorage
        const storageModels = updatedModels.map(model => {
          if (model.url && model.url.startsWith('blob:')) {
            return {
              ...model,
              url: `file://${model.fileName || 'unknown'}`
            };
          }
          return model;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageModels));
      } catch (error) {
        console.error('Error saving models to localStorage:', error);
      }
      
      return { models: updatedModels };
    });
  },
  
  /**
   * Remove todos os modelos
   */
  clearAllModels: (): void => {
    // Clean up all blob URLs before clearing
    get().models.forEach(model => {
      if (model.url) {
        cleanupBlobUrl(model.url);
      }
    });
    
    set({ models: [] });
    localStorage.removeItem(STORAGE_KEY);
  }
})); 