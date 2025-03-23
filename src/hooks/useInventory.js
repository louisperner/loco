import { useState, useEffect, useCallback } from 'react';
import { useImageStore } from '../store/useImageStore';
import { useModelStore } from '../store/useModelStore';
import { HOTBAR_STORAGE_KEY, getImageCategory, getModelCategory } from '../utils/inventoryUtils';

export const useInventory = (onSelectImage, onSelectModel, onClose, isOpen, onRemoveObject) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullInventory, setShowFullInventory] = useState(isOpen || false);
  const [hotbarItems, setHotbarItems] = useState(Array(9).fill(null));
  const [selectedHotbarSlot, setSelectedHotbarSlot] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isAddingToHotbar, setIsAddingToHotbar] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const storeImages = useImageStore(state => state.images);
  const storeModels = useModelStore(state => state.models);

  const loadItemsFromDisk = useCallback(async () => {
    try {
      setLoading(true);
      
      let allItems = [];
      
      // First check if we're in a browser environment (not Electron)
      const isElectronAvailable = window.electron && 
        typeof window.electron.listImagesFromDisk === 'function' &&
        typeof window.electron.listModelsFromDisk === 'function';
      
      if (isElectronAvailable) {
        // Electron environment - load from disk
        try {
          const imageResult = await window.electron.listImagesFromDisk();
          
          if (imageResult.success) {
            const imageItems = imageResult.images.map(img => ({
              ...img,
              type: 'image',
              category: getImageCategory(img.fileName)
            }));
            allItems = [...allItems, ...imageItems];
          }
        } catch (error) {
          console.error('Error loading images from disk:', error);
        }
        
        try {
          const modelResult = await window.electron.listModelsFromDisk();
          
          if (modelResult.success) {
            const modelItems = modelResult.models.map(model => ({
              ...model,
              type: 'model',
              category: getModelCategory(model.fileName)
            }));
            allItems = [...allItems, ...modelItems];
          }
        } catch (error) {
          console.error('Error loading models from disk:', error);
        }
      } else {
        // Browser environment - use store data instead
        // console.info('Running in browser environment, using store and localStorage for inventory');
        const storeImageItems = storeImages.map(img => ({
          id: img.id,
          type: 'image',
          fileName: img.fileName || 'Unknown',
          url: img.src,
          thumbnailUrl: img.src,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          category: getImageCategory(img.fileName || 'Unknown')
        }));
        allItems = [...allItems, ...storeImageItems];
        const storeModelItems = storeModels.map(model => ({
          id: model.id,
          type: 'model',
          fileName: model.fileName || 'Unknown',
          url: model.url,
          thumbnailUrl: model.thumbnailUrl,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          category: getModelCategory(model.fileName || 'Unknown')
        }));
        allItems = [...allItems, ...storeModelItems];
      }
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allItems.map(item => item.category))].filter(Boolean);
      setCategories(['all', 'images', 'models', ...uniqueCategories.filter(cat => cat !== 'images' && cat !== 'models')]);
      
      // Deduplication logic
      const uniqueItems = [];
      const seenUrls = new Map();
      const seenPaths = new Map();
      const seenIds = new Set();
      
      allItems.forEach(item => {
        if (seenIds.has(item.id)) return;
        
        const normalizedUrl = item.url ? item.url.replace(/\\/g, '/').toLowerCase() : null;
        if (normalizedUrl && seenUrls.has(normalizedUrl)) {
          const existingItemIndex = seenUrls.get(normalizedUrl);
          if (!uniqueItems[existingItemIndex].thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemIndex].thumbnailUrl = item.thumbnailUrl;
          }
          seenIds.add(item.id);
          return;
        }
        
        const filePath = item.filePath ? item.filePath.replace(/\\/g, '/').toLowerCase() : null;
        if (filePath && seenPaths.has(filePath)) {
          const existingItemIndex = seenPaths.get(filePath);
          if (!uniqueItems[existingItemIndex].thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemIndex].thumbnailUrl = item.thumbnailUrl;
          }
          seenIds.add(item.id);
          return;
        }
        
        const existingItemWithSameFileName = uniqueItems.findIndex(
          existingItem => existingItem.fileName === item.fileName && 
                         existingItem.type === item.type &&
                         existingItem.fileSize === item.fileSize
        );
        
        if (existingItemWithSameFileName !== -1) {
          if (!uniqueItems[existingItemWithSameFileName].thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemWithSameFileName].thumbnailUrl = item.thumbnailUrl;
          }
          seenIds.add(item.id);
          return;
        }
        
        const itemIndex = uniqueItems.length;
        uniqueItems.push(item);
        seenIds.add(item.id);
        
        if (normalizedUrl) seenUrls.set(normalizedUrl, itemIndex);
        if (filePath) seenPaths.set(filePath, itemIndex);
      });
      
      setItems(uniqueItems);
      
      // Restore hotbar items
      try {
        const savedHotbar = localStorage.getItem(HOTBAR_STORAGE_KEY);
        if (savedHotbar) {
          const savedHotbarIds = JSON.parse(savedHotbar);
          const newHotbarItems = Array(9).fill(null);
          
          savedHotbarIds.forEach((id, index) => {
            if (id) {
              const item = uniqueItems.find(item => item.id === id);
              if (item) {
                newHotbarItems[index] = item;
              }
            }
          });
          
          setHotbarItems(newHotbarItems);
        }
      } catch (error) {
        console.error('Error restoring hotbar from localStorage:', error);
      }
      
      setSelectedItem(null);
      setLoading(false);
    } catch (error) {
      console.error(`Error loading items from disk:`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [storeImages, storeModels]);

  // Update showFullInventory when isOpen prop changes
  useEffect(() => {
    setShowFullInventory(isOpen);
    // Carregar itens sempre que o componente montar
    loadItemsFromDisk();
  }, [isOpen, loadItemsFromDisk]);

  // Save hotbar to localStorage whenever it changes
  useEffect(() => {
    try {
      const hotbarIds = hotbarItems.map(item => item ? item.id : null);
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(hotbarIds));
    } catch (error) {
      console.error('Error saving hotbar to localStorage:', error);
    }
  }, [hotbarItems]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        e.preventDefault();
        
        if (document.pointerLockElement === null) {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            canvas.dispatchEvent(clickEvent);
          }
        }

        onClose();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setSelectedItem(null);
        setSelectedHotbarSlot(null);
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        setSelectedHotbarSlot(index);
        
        if (hotbarItems[index]) {
          handleItemSelect(hotbarItems[index]);
        } else {
          setSelectedItem(null);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsAddingToHotbar(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hotbarItems]);

  // Mouse click handlers
  useEffect(() => {
    const handleMouseClick = (e) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      if (e.target === canvas || canvas.contains(e.target)) {
        if (e.button === 0 && selectedHotbarSlot !== null && hotbarItems[selectedHotbarSlot]) {
          handleAddToCanvas(hotbarItems[selectedHotbarSlot]);
        } else if (e.button === 2 && typeof onRemoveObject === 'function') {
          onRemoveObject();
        }
      }
    };

    const preventContextMenu = (e) => {
      const canvas = document.querySelector('canvas');
      if (canvas && (e.target === canvas || canvas.contains(e.target))) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseClick);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleMouseClick);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [selectedHotbarSlot, hotbarItems, onRemoveObject]);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    
    if (isAddingToHotbar && selectedHotbarSlot !== null) {
      addItemToHotbarSlot(item, selectedHotbarSlot);
    }
  };

  const handleAddToCanvas = (item) => {
    if (!item) return;
    
    if (item.type === 'image' && onSelectImage) {
      onSelectImage(item);
      showAddedToCanvasIndicator(item);
    } else if (item.type === 'model' && onSelectModel) {
      onSelectModel(item);
      showAddedToCanvasIndicator(item);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'image' && onSelectImage) {
      onSelectImage(selectedItem);
    } else if (selectedItem.type === 'model' && onSelectModel) {
      onSelectModel(selectedItem);
    }
    
    onClose();
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setSelectedItem(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleHotbarSlotClick = (index, e) => {
    const item = hotbarItems[index];
    setSelectedHotbarSlot(index);
    
    if (item) {
      handleItemSelect(item);
    } else {
      setSelectedItem(null);
    }
  };

  const addItemToHotbarSlot = (item, slotIndex) => {
    if (slotIndex >= 0 && slotIndex < 9) {
      const existingIndex = hotbarItems.findIndex(hotbarItem => 
        hotbarItem && hotbarItem.id === item.id
      );
      
      if (existingIndex !== -1 && existingIndex !== slotIndex) {
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[existingIndex] = null;
        newHotbarItems[slotIndex] = item;
        setHotbarItems(newHotbarItems);
      } else if (existingIndex === -1) {
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[slotIndex] = item;
        setHotbarItems(newHotbarItems);
      }
    }
  };

  const handleAddToHotbar = (item, e) => {
    e.stopPropagation();
    
    if (selectedHotbarSlot !== null) {
      addItemToHotbarSlot(item, selectedHotbarSlot);
    } else {
      const emptySlotIndex = hotbarItems.findIndex(slot => slot === null);
      if (emptySlotIndex !== -1) {
        addItemToHotbarSlot(item, emptySlotIndex);
      } else {
        addItemToHotbarSlot(item, 0);
      }
    }
  };

  const handleRemoveFromHotbar = (index, e) => {
    e.stopPropagation();
    const newHotbarItems = [...hotbarItems];
    newHotbarItems[index] = null;
    setHotbarItems(newHotbarItems);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    
    try {
      const itemData = {
        type: 'inventory-item',
        itemData: {
          id: item.id,
          type: item.type,
          url: item.url,
          fileName: item.fileName,
          thumbnailUrl: item.thumbnailUrl,
          category: item.category
        }
      };
      
      const jsonData = JSON.stringify(itemData);
      e.dataTransfer.setData('application/json', jsonData);
      e.dataTransfer.setData('text/plain', item.fileName);
    } catch (error) {
      console.error('Error setting drag data:', error);
    }
    
    const ghostImage = document.createElement('div');
    ghostImage.classList.add('drag-ghost');
    
    const img = document.createElement('img');
    img.src = item.type === 'image' 
      ? (item.thumbnailUrl || item.url) 
      : (item.thumbnailUrl || '/cube.svg');
    img.alt = item.fileName;
    ghostImage.appendChild(img);
    
    ghostImage.style.position = 'absolute';
    ghostImage.style.left = '-1000px';
    ghostImage.style.top = '-1000px';
    ghostImage.style.width = '60px';
    ghostImage.style.height = '60px';
    ghostImage.style.borderRadius = '4px';
    ghostImage.style.overflow = 'hidden';
    ghostImage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    ghostImage.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    ghostImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    document.body.appendChild(ghostImage);
    
    e.dataTransfer.setDragImage(ghostImage, 30, 30);
    e.dataTransfer.effectAllowed = 'move';
    
    setTimeout(() => {
      document.body.removeChild(ghostImage);
    }, 100);
    
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDragOverSlot(null);
    
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
    
    const ghostElement = document.querySelector('.drag-ghost');
    if (ghostElement) {
      document.body.removeChild(ghostElement);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dragOverSlot !== index) {
      setDragOverSlot(index);
      
      const targetSlot = e.currentTarget;
      targetSlot.classList.add('drag-over');
      
      document.querySelectorAll('.hotbar-slot').forEach(slot => {
        if (slot !== targetSlot) {
          slot.classList.remove('drag-over');
        }
      });
    }
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dragOverSlot === index) {
      setDragOverSlot(null);
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    document.querySelectorAll('.hotbar-slot').forEach(slot => {
      slot.classList.remove('drag-over');
    });
    
    if (draggedItem) {
      setTimeout(() => {
        addItemToHotbarSlot(draggedItem, index);
        setDraggedItem(null);
      }, 50);
    }
  };

  // Filter items based on active tab and search term
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'images' && item.type !== 'image') return false;
    if (activeTab === 'models' && item.type !== 'model') return false;
    if (activeTab !== 'images' && activeTab !== 'models' && activeTab !== 'all') {
      if (item.category !== activeTab) return false;
    }
    
    if (searchTerm) {
      return item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  const handleRemoveItem = useCallback(async (itemId) => {
    const itemToDelete = items.find(item => item.id === itemId);
    if (!itemToDelete) return;

    const imageStore = useImageStore.getState();
    const modelStore = useModelStore.getState();

    // Encontrar todas as instâncias (originais e clones)
    const canvasImages = imageStore.images.filter(img => 
      img.inventoryId === itemId || 
      img.src === itemToDelete.url || 
      img.src === itemToDelete.filePath
    );

    const canvasModels = modelStore.models.filter(model => 
      model.inventoryId === itemId ||
      model.url === itemToDelete.url ||
      model.url === itemToDelete.filePath
    );

    const totalInstances = canvasImages.length + canvasModels.length;

    if (totalInstances > 0) {
      const confirmMessage = `Este item tem ${totalInstances} instância(s) no canvas (incluindo clones).\nDeseja remover TODAS?`;
      if (!window.confirm(confirmMessage)) return;
    } else {
      if (!window.confirm(`Deseja excluir permanentemente "${itemToDelete.fileName}"?`)) return;
    }

    // Remover do canvas
    try {
      // Remover imagens e clones
      canvasImages.forEach(img => {
        imageStore.removeImage(img.id);
        if (onRemoveObject) onRemoveObject(img.id);
      });

      // Remover modelos e clones
      canvasModels.forEach(model => {
        modelStore.removeModel(model.id);
        if (onRemoveObject) onRemoveObject(model.id);
      });
    } catch (error) {
      console.error('Erro ao remover do canvas:', error);
      return;
    }

    // Remover do inventário
    setItems(prev => prev.filter(item => item.id !== itemId));
    
    // Remover da hotbar CORRETAMENTE
    setHotbarItems(prev => {
      const newHotbar = prev.map(slotItem => 
        slotItem && slotItem.id === itemId ? null : slotItem
      );
      
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(
        newHotbar.map(slot => slot?.id || null)
      ));
      
      return newHotbar;
    });

    // Remover das stores globais
    if (itemToDelete.type === 'image') {
      useImageStore.getState().removeImage(itemId);
    } else {
      useModelStore.getState().removeModel(itemId);
    }

    // Remover arquivo físico (Electron)
    if (window.electron?.deleteFile) {
      try {
        const paths = [
          itemToDelete.filePath,
          itemToDelete.url,
          itemToDelete.thumbnailUrl
        ].filter(Boolean);
        
        for (const path of paths) {
          await window.electron.deleteFile(path);
        }
      } catch (error) {
        console.error('Erro ao deletar arquivos:', error);
      }
    }

    // Desselecionar se necessário
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  }, [items, selectedItem, onRemoveObject]);

  return {
    items: filteredItems,
    loading,
    error,
    selectedItem,
    activeTab,
    searchTerm,
    showFullInventory,
    hotbarItems,
    selectedHotbarSlot,
    categories,
    isAddingToHotbar,
    draggedItem,
    dragOverSlot,
    setShowFullInventory,
    handleItemSelect,
    handleAddToCanvas,
    handleConfirmSelection,
    handleTabChange,
    handleSearchChange,
    handleHotbarSlotClick,
    handleAddToHotbar,
    handleRemoveFromHotbar,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    loadItemsFromDisk,
    handleRemoveItem
  };
}; 