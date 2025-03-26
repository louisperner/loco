import { useState, useEffect, useCallback, useMemo, MouseEvent, KeyboardEvent, DragEvent } from 'react';
import { useImageStore } from '../store/useImageStore';
import { useModelStore } from '../store/useModelStore';
import { HOTBAR_STORAGE_KEY, getImageCategory, getModelCategory, showAddedToCanvasIndicator } from '../utils/inventoryUtils';

// Note: Window interface with electron API is defined in src/types/global.d.ts

export interface InventoryItem {
  id: string;
  type: 'image' | 'model';
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  filePath?: string;
  fileSize?: number;
  createdAt?: string;
  modifiedAt?: string;
  category?: string;
  inventoryId?: string;
  [key: string]: any;
}

export interface InventoryHookProps {
  onSelectImage?: (item: InventoryItem) => void;
  onSelectModel?: (item: InventoryItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
  onRemoveObject?: (id?: string) => void;
}

export interface InventoryHookResult {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  selectedItem: InventoryItem | null;
  activeTab: string;
  searchTerm: string;
  showFullInventory: boolean;
  hotbarItems: (InventoryItem | null)[];
  selectedHotbarSlot: number | null;
  categories: string[];
  isAddingToHotbar: boolean;
  draggedItem: InventoryItem | null;
  dragOverSlot: number | null;
  setShowFullInventory: (show: boolean) => void;
  handleItemSelect: (item: InventoryItem) => void;
  handleAddToCanvas: (item: InventoryItem) => void;
  handleConfirmSelection: () => void;
  handleTabChange: (tab: string) => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleHotbarSlotClick: (index: number, e: MouseEvent) => void;
  handleAddToHotbar: (item: InventoryItem, e: MouseEvent) => void;
  handleRemoveFromHotbar: (index: number, e: MouseEvent) => void;
  handleDragStart: (e: DragEvent<HTMLDivElement>, item: InventoryItem) => void;
  handleDragEnd: (e: DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>, index: number) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>, index: number) => void;
  loadItemsFromDisk: () => Promise<void>;
  handleRemoveItem: (itemId: string) => Promise<void>;
}

export const useInventory = (
  onSelectImage?: (item: InventoryItem) => void,
  onSelectModel?: (item: InventoryItem) => void,
  onClose?: () => void,
  isOpen?: boolean,
  onRemoveObject?: (id?: string) => void
): InventoryHookResult => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFullInventory, setShowFullInventory] = useState<boolean>(isOpen || false);
  const [hotbarItems, setHotbarItems] = useState<(InventoryItem | null)[]>(Array(9).fill(null));
  const [selectedHotbarSlot, setSelectedHotbarSlot] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddingToHotbar, setIsAddingToHotbar] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const storeImages = useImageStore(state => state.images);
  const storeModels = useModelStore(state => state.models);

  const loadItemsFromDisk = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      let allItems: InventoryItem[] = [];
      
      // First check if we're in a browser environment (not Electron)
      const isElectronAvailable = window.electron && 
        typeof window.electron.listImagesFromDisk === 'function' &&
        typeof window.electron.listModelsFromDisk === 'function';
      
      if (isElectronAvailable) {
        try {
          const electron = window.electron;
          if (electron && electron.listImagesFromDisk) {
            const imageResult = await electron.listImagesFromDisk();
            
            if (imageResult.success) {
              const imageItems = imageResult.images.map((img: any) => ({
                ...img,
                type: 'image' as const,
                category: getImageCategory(img.fileName)
              }));
              allItems = [...allItems, ...imageItems];
            }
          }
        } catch (error) {
          console.error('Error loading images from disk:', error);
        }
        
        try {
          const electron = window.electron;
          if (electron && electron.listModelsFromDisk) {
            const modelResult = await electron.listModelsFromDisk();
            
            if (modelResult.success) {
              const modelItems = modelResult.models.map((model: any) => ({
                ...model,
                type: 'model' as const,
                category: getModelCategory(model.fileName)
              }));
              allItems = [...allItems, ...modelItems];
            }
          }
        } catch (error) {
          console.error('Error loading models from disk:', error);
        }
      }
      
      // Always include items from store
      const storeImageItems = storeImages.map(img => ({
        id: img.id,
        type: 'image' as const,
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
        type: 'model' as const,
        fileName: model.fileName || 'Unknown',
        url: model.url,
        thumbnailUrl: model.thumbnailUrl,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        category: getModelCategory(model.fileName || 'Unknown')
      }));
      allItems = [...allItems, ...storeModelItems];
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allItems.map(item => item.category))].filter(Boolean) as string[];
      setCategories(['all', 'images', 'models', ...uniqueCategories.filter(cat => cat !== 'images' && cat !== 'models')]);
      
      // Deduplication logic
      const uniqueItems: InventoryItem[] = [];
      const seenUrls = new Map<string, number>();
      const seenPaths = new Map<string, number>();
      const seenIds = new Set<string>();
      
      allItems.forEach(item => {
        if (seenIds.has(item.id)) return;
        
        const normalizedUrl = item.url ? item.url.replace(/\\/g, '/').toLowerCase() : null;
        if (normalizedUrl && seenUrls.has(normalizedUrl)) {
          const existingItemIndex = seenUrls.get(normalizedUrl)!;
          if (!uniqueItems[existingItemIndex].thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemIndex].thumbnailUrl = item.thumbnailUrl;
          }
          seenIds.add(item.id);
          return;
        }
        
        const filePath = item.filePath ? item.filePath.replace(/\\/g, '/').toLowerCase() : null;
        if (filePath && seenPaths.has(filePath)) {
          const existingItemIndex = seenPaths.get(filePath)!;
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
          const savedHotbarIds = JSON.parse(savedHotbar) as (string | null)[];
          const newHotbarItems: (InventoryItem | null)[] = Array(9).fill(null);
          
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
    } catch (error) {
      console.error('Error loading inventory items:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [storeImages, storeModels]);

  // Update showFullInventory when isOpen prop changes
  useEffect(() => {
    // Only update showFullInventory if it's different from the isOpen prop
    if ((isOpen || false) !== showFullInventory) {
      setShowFullInventory(isOpen || false);
    }
  }, [isOpen, showFullInventory]);

  // Load items when the component mounts only
  useEffect(() => {
    loadItemsFromDisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        e.preventDefault();
        
        if (document.pointerLockElement === null) {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            // Create click event in a cross-browser compatible way
            try {
              // Modern approach for most browsers
              canvas.dispatchEvent(new Event('click', {
                bubbles: true,
                cancelable: true
              }));
            } catch (error) {
              // Fallback for older browsers or environments where Event constructor isn't available
              const clickEvent = document.createEvent('MouseEvents');
              clickEvent.initEvent('click', true, true);
              canvas.dispatchEvent(clickEvent);
            }
          }
        }

        if (onClose) onClose();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setSelectedItem(null);
        setSelectedHotbarSlot(null);
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        setSelectedHotbarSlot(index);
        
        if (hotbarItems[index]) {
          handleItemSelect(hotbarItems[index]!);
        } else {
          setSelectedItem(null);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsAddingToHotbar(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [onClose, hotbarItems]);

  // Mouse click handlers
  useEffect(() => {
    const handleMouseClick = (e: MouseEvent) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      if (e.target === canvas || canvas.contains(e.target as Node)) {
        if (e.button === 0 && selectedHotbarSlot !== null && hotbarItems[selectedHotbarSlot]) {
          handleAddToCanvas(hotbarItems[selectedHotbarSlot]!);
        } else if (e.button === 2 && typeof onRemoveObject === 'function') {
          onRemoveObject();
        }
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      const canvas = document.querySelector('canvas');
      if (canvas && (e.target === canvas || canvas.contains(e.target as Node))) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseClick as any);
    document.addEventListener('contextmenu', preventContextMenu as any);

    return () => {
      document.removeEventListener('mousedown', handleMouseClick as any);
      document.removeEventListener('contextmenu', preventContextMenu as any);
    };
  }, [selectedHotbarSlot, hotbarItems, onRemoveObject]);

  const handleItemSelect = (item: InventoryItem): void => {
    setSelectedItem(item);
    
    if (isAddingToHotbar && selectedHotbarSlot !== null) {
      addItemToHotbarSlot(item, selectedHotbarSlot);
    }
  };

  const handleAddToCanvas = (item: InventoryItem): void => {
    if (!item) return;
    
    if (item.type === 'image' && onSelectImage) {
      onSelectImage(item);
      showAddedToCanvasIndicator(item);
    } else if (item.type === 'model' && onSelectModel) {
      onSelectModel(item);
      showAddedToCanvasIndicator(item);
    }
  };

  const handleConfirmSelection = (): void => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'image' && onSelectImage) {
      onSelectImage(selectedItem);
    } else if (selectedItem.type === 'model' && onSelectModel) {
      onSelectModel(selectedItem);
    }
    
    if (onClose) onClose();
  };

  const handleTabChange = (tab: string): void => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setSelectedItem(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleHotbarSlotClick = (index: number, e: MouseEvent): void => {
    const item = hotbarItems[index];
    setSelectedHotbarSlot(index);
    
    if (item) {
      handleItemSelect(item);
    } else {
      setSelectedItem(null);
    }
  };

  const addItemToHotbarSlot = (item: InventoryItem, slotIndex: number): void => {
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

  const handleAddToHotbar = (item: InventoryItem, e: MouseEvent): void => {
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

  const handleRemoveFromHotbar = (index: number, e: MouseEvent): void => {
    e.stopPropagation();
    const newHotbarItems = [...hotbarItems];
    newHotbarItems[index] = null;
    setHotbarItems(newHotbarItems);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: InventoryItem): void => {
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

  const handleDragEnd = (e: DragEvent<HTMLDivElement>): void => {
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number): void => {
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

  const handleDragLeave = (e: DragEvent<HTMLDivElement>, index: number): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dragOverSlot === index) {
      setDragOverSlot(null);
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, index: number): void => {
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
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Filter by category/tab
    if (activeTab === 'images') {
      result = result.filter(item => item.type === 'image');
    } else if (activeTab === 'models') {
      result = result.filter(item => item.type === 'model');
    } else if (activeTab !== 'all') {
      result = result.filter(item => item.category === activeTab);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        item.fileName.toLowerCase().includes(searchLower) || 
        (item.category && item.category.toLowerCase().includes(searchLower))
      );
    }
    
    return result;
  }, [items, activeTab, searchTerm]);

  const handleRemoveItem = useCallback(async (itemId: string): Promise<void> => {
    const itemToDelete = items.find(item => item.id === itemId);
    if (!itemToDelete) return;

    const imageStore = useImageStore.getState();
    const modelStore = useModelStore.getState();

    // Find all instances (originals and clones)
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

    // Remove from canvas
    try {
      // Remove images and clones
      canvasImages.forEach(img => {
        imageStore.removeImage(img.id);
        if (onRemoveObject) onRemoveObject(img.id);
      });

      // Remove models and clones
      canvasModels.forEach(model => {
        modelStore.removeModel(model.id);
        if (onRemoveObject) onRemoveObject(model.id);
      });
    } catch (error) {
      console.error('Erro ao remover do canvas:', error);
      return;
    }

    // Remove from inventory
    setItems(prev => prev.filter(item => item.id !== itemId));
    
    // Remove from hotbar correctly
    setHotbarItems(prev => {
      const newHotbar = prev.map(slotItem => 
        slotItem && slotItem.id === itemId ? null : slotItem
      );
      
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(
        newHotbar.map(slot => slot?.id || null)
      ));
      
      return newHotbar;
    });

    // Remove from global stores
    if (itemToDelete.type === 'image') {
      useImageStore.getState().removeImage(itemId);
    } else {
      useModelStore.getState().removeModel(itemId);
    }

    // Remove physical file (Electron)
    if (window.electron?.deleteFile) {
      try {
        const paths = [
          itemToDelete.filePath,
          itemToDelete.url,
          itemToDelete.thumbnailUrl
        ].filter(Boolean) as string[];
        
        for (const path of paths) {
          await window.electron.deleteFile(path);
        }
      } catch (error) {
        console.error('Erro ao deletar arquivos:', error);
      }
    }

    // Deselect if necessary
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