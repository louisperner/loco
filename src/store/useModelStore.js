import { create } from 'zustand';
import * as THREE from 'three';

/**
 * Store para gerenciar modelos 3D no espaço
 */
const STORAGE_KEY = 'scene-models';

// Helper function to clean blob URLs when they're no longer needed
const cleanupBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    try {
      // Clear from cache
      if (window._modelFileCache && window._modelFileCache[url]) {
        delete window._modelFileCache[url];
      }
      
      // Revoke the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error cleaning up blob URL:', error);
    }
  }
};

// Manter um cache de blobs para modelos
const modelBlobCache = new Map();

const loadModelsFromStorage = () => {
  try {
    const savedModels = localStorage.getItem(STORAGE_KEY);
    const parsedModels = savedModels ? JSON.parse(savedModels) : [];
    
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

export const useModelStore = create((set, get) => ({
  models: loadModelsFromStorage(),
  
  /**
   * Adiciona um novo modelo 3D na cena
   */
  addModel: (modelData) => {
    const id = Date.now().toString();
    
    // Calculate position in front of camera if not provided
    const position = modelData.position || [0, 0, -3];
    const rotation = modelData.rotation || [0, 0, 0];
    const scale = modelData.scale || 1;
    
    const newModel = {
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
  updateModel: (id, updates) => {
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
  removeModel: (id) => {
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
  clearAllModels: () => {
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