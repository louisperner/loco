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
  [key: string]: unknown;
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
  addItemToHotbarDirect: (item: InventoryItem) => void;
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
              const imageItems = imageResult.images.map((img) => ({
                id: String((img as Record<string, unknown>).id || ''),
                type: 'image' as const,
                fileName: String((img as Record<string, unknown>).fileName || ''),
                url: String((img as Record<string, unknown>).url || ''),
                thumbnailUrl: String((img as Record<string, unknown>).thumbnailUrl || ''),
                filePath: (img as Record<string, unknown>).filePath as string | undefined,
                fileSize: (img as Record<string, unknown>).fileSize as number | undefined,
                createdAt: (img as Record<string, unknown>).createdAt as string | undefined,
                modifiedAt: (img as Record<string, unknown>).modifiedAt as string | undefined,
                category: getImageCategory(String((img as Record<string, unknown>).fileName || ''))
              }));
              allItems = [...allItems, ...imageItems];
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading images from disk:', error);
        }
        
        try {
          const electron = window.electron;
          if (electron && electron.listModelsFromDisk) {
            const modelResult = await electron.listModelsFromDisk();
            
            if (modelResult.success) {
              const modelItems = modelResult.models.map((model) => ({
                id: String((model as Record<string, unknown>).id || ''),
                type: 'model' as const,
                fileName: String((model as Record<string, unknown>).fileName || ''),
                url: String((model as Record<string, unknown>).url || ''),
                thumbnailUrl: String((model as Record<string, unknown>).thumbnailUrl || ''),
                filePath: (model as Record<string, unknown>).filePath as string | undefined,
                fileSize: (model as Record<string, unknown>).fileSize as number | undefined,
                createdAt: (model as Record<string, unknown>).createdAt as string | undefined,
                modifiedAt: (model as Record<string, unknown>).modifiedAt as string | undefined,
                category: getModelCategory(String((model as Record<string, unknown>).fileName || ''))
              }));
              allItems = [...allItems, ...modelItems];
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
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
        thumbnailUrl: model.thumbnailUrl as string | undefined,
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
        // console.log('Loaded savedHotbar from localStorage:', savedHotbar);
        if (savedHotbar) {
          const savedHotbarIds = JSON.parse(savedHotbar) as (string | null)[];
          // console.log('Parsed savedHotbarIds:', savedHotbarIds);
          const newHotbarItems: (InventoryItem | null)[] = Array(9).fill(null);
          
          savedHotbarIds.forEach((id, index) => {
            if (id) {
              const item = uniqueItems.find(item => item.id === id);
              // console.log(`Looking for item with ID ${id} for slot ${index}:`, item);
              if (item) {
                newHotbarItems[index] = item;
              }
            }
          });
          
          // console.log('Restored hotbar from localStorage:', newHotbarItems);
          setHotbarItems(newHotbarItems);
        } else {
          // console.log('No saved hotbar found in localStorage');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error restoring hotbar from localStorage:', error);
      }
      
      setSelectedItem(null);
    } catch (error) {
      // eslint-disable-next-line no-console
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
      // console.log('Saving hotbar to localStorage:', hotbarItems);
      const hotbarIds = hotbarItems.map(item => item ? item.id : null);
      // console.log('Hotbar IDs to save:', hotbarIds);
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(hotbarIds));
      // console.log('Hotbar saved to localStorage successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      // console.error('Error saving hotbar to localStorage:', error);
    }
  }, [hotbarItems]);

  // Move addItemToHotbarSlot into useCallback to avoid dependency cycle
  const addItemToHotbarSlot = useCallback((item: InventoryItem, slotIndex: number): void => {
    // console.log(`addItemToHotbarSlot called with item: ${item.fileName} for slot: ${slotIndex}`);
    
    if (slotIndex >= 0 && slotIndex < 9) {
      const existingIndex = hotbarItems.findIndex(hotbarItem => 
        hotbarItem && hotbarItem.id === item.id
      );
      
      // console.log(`Existing index of item in hotbar: ${existingIndex}`);
      
      if (existingIndex !== -1 && existingIndex !== slotIndex) {
        //console.log(`Item exists in slot ${existingIndex}, moving to slot ${slotIndex}`);
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[existingIndex] = null;
        newHotbarItems[slotIndex] = item;
        //console.log('New hotbar items before update:', newHotbarItems);
        setHotbarItems(newHotbarItems);
      } else if (existingIndex === -1) {
        //console.log(`Item doesn't exist in hotbar, adding to slot ${slotIndex}`);
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[slotIndex] = item;
        //console.log('New hotbar items before update:', newHotbarItems);
        setHotbarItems(newHotbarItems);
      } else {
        //console.log(`Item already exists in slot ${slotIndex}, no change needed`);
      }
    } else {
      //console.log(`Invalid slot index: ${slotIndex}`);
    }
  }, [hotbarItems, setHotbarItems]);

  // Now handleItemSelect can use addItemToHotbarSlot safely
  const handleItemSelect = useCallback((item: InventoryItem): void => {
    setSelectedItem(item);
    
    if (isAddingToHotbar && selectedHotbarSlot !== null) {
      addItemToHotbarSlot(item, selectedHotbarSlot);
    }
  }, [isAddingToHotbar, selectedHotbarSlot, setSelectedItem, addItemToHotbarSlot]);

  const handleAddToCanvas = useCallback((item: InventoryItem): void => {
    if (!item) return;
    
    if (item.type === 'image' && onSelectImage) {
      onSelectImage(item);
      showAddedToCanvasIndicator(item);
    } else if (item.type === 'model' && onSelectModel) {
      onSelectModel(item);
      showAddedToCanvasIndicator(item);
    }
  }, [onSelectImage, onSelectModel]);

  // Keyboard handling for inventory view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Skip if we're not showing the inventory
      if (!showFullInventory) return;
      
      // Skip if we're focused in an input element
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      
      // Handle Escape key to close inventory
      if (e.key === 'Escape') {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log('Escape key pressed, closing inventory');
        setShowFullInventory(false);
        setSelectedItem(null);
      }
      
      // Handle Q key to clear selection
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log('Q key pressed, clearing selection');
        setSelectedItem(null);
        setSelectedHotbarSlot(null);
      }
      
      // Handle B key to toggle adding items to hotbar
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log('B key pressed, toggling add to hotbar mode');
        setIsAddingToHotbar(!isAddingToHotbar);
      }
      
      // Note: number keys are handled by the global keyboard handler
    };
    
    // Use a named function for the keydown listener to help with debugging
    const inventoryKeydownListener = handleKeyDown as unknown as EventListener;
    document.addEventListener('keydown', inventoryKeydownListener);
    
    // eslint-disable-next-line no-console
    console.log("Inventory-specific keyboard handler initialized");
    
    return () => {
      document.removeEventListener('keydown', inventoryKeydownListener);
      // eslint-disable-next-line no-console
      console.log("Inventory-specific keyboard handler removed");
    };
  }, [
    showFullInventory, 
    setShowFullInventory, 
    setSelectedItem, 
    setSelectedHotbarSlot, 
    isAddingToHotbar, 
    setIsAddingToHotbar
  ]);

  // Mouse click handlers
  useEffect(() => {
    const handleMouseClick = (e: MouseEvent): void => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      // Check if we're clicking on the canvas
      if (e.target === canvas || canvas.contains(e.target as Node)) {
        // Left click and we have a selected hotbar slot with an item
        if (e.button === 0 && selectedHotbarSlot !== null && hotbarItems[selectedHotbarSlot]) {
          // Debug information
          // eslint-disable-next-line no-console
          console.log(`Left click on canvas with hotbar slot ${selectedHotbarSlot} selected, placing item:`, 
            hotbarItems[selectedHotbarSlot]?.fileName);
          
          // Add the selected item to the canvas
          handleAddToCanvas(hotbarItems[selectedHotbarSlot]!);
        } 
        // Right click and we have a remove handler
        else if (e.button === 2 && typeof onRemoveObject === 'function') {
          // eslint-disable-next-line no-console
          console.log('Right click on canvas, removing object');
          onRemoveObject();
        }
        else {
          // eslint-disable-next-line no-console
          console.log('Click on canvas but no action taken', { 
            button: e.button, 
            selectedHotbarSlot, 
            hasItem: selectedHotbarSlot !== null ? !!hotbarItems[selectedHotbarSlot] : false 
          });
        }
      }
    };

    const preventContextMenu = (e: MouseEvent): void => {
      const canvas = document.querySelector('canvas');
      if (canvas && (e.target === canvas || canvas.contains(e.target as Node))) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseClick as unknown as EventListener);
    document.addEventListener('contextmenu', preventContextMenu as unknown as EventListener);
    
    // eslint-disable-next-line no-console
    console.log("Mouse click handler initialized");

    return () => {
      document.removeEventListener('mousedown', handleMouseClick as unknown as EventListener);
      document.removeEventListener('contextmenu', preventContextMenu as unknown as EventListener);
      // eslint-disable-next-line no-console
      console.log("Mouse click handler removed");
    };
  }, [selectedHotbarSlot, hotbarItems, onRemoveObject, handleAddToCanvas]);

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

  const handleHotbarSlotClick = (index: number, _e: MouseEvent): void => {
    const item = hotbarItems[index];
    setSelectedHotbarSlot(index);
    
    if (item) {
      handleItemSelect(item);
    } else {
      setSelectedItem(null);
    }
  };

  const handleAddToHotbar = useCallback((item: InventoryItem, e: MouseEvent): void => {
    e.stopPropagation();
    
    // Log the item being added and current hotbar state
    //console.log('handleAddToHotbar called with item:', item);
    //console.log('Current hotbar state:', hotbarItems);
    //console.log('Selected hotbar slot:', selectedHotbarSlot);
    
    if (selectedHotbarSlot !== null) {
      //console.log(`Adding item to selected slot ${selectedHotbarSlot}`);
      // First try using the helper function
      addItemToHotbarSlot(item, selectedHotbarSlot);
      
      // Also update directly as a fallback
      const newHotbarItems = [...hotbarItems];
      newHotbarItems[selectedHotbarSlot] = item;
      setHotbarItems(newHotbarItems);
    } else {
      const emptySlotIndex = hotbarItems.findIndex(slot => slot === null);
      if (emptySlotIndex !== -1) {
        //console.log(`Adding item to first empty slot ${emptySlotIndex}`);
        // First try using the helper function
        addItemToHotbarSlot(item, emptySlotIndex);
        
        // Also update directly as a fallback
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[emptySlotIndex] = item;
        setHotbarItems(newHotbarItems);
      } else {
        //console.log('No empty slots, adding to slot 0');
        // First try using the helper function
        addItemToHotbarSlot(item, 0);
        
        // Also update directly as a fallback
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[0] = item;
        setHotbarItems(newHotbarItems);
      }
    }
  }, [selectedHotbarSlot, hotbarItems, addItemToHotbarSlot, setHotbarItems]);

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
      // eslint-disable-next-line no-console
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

  const handleDragEnd = (_e: DragEvent<HTMLDivElement>): void => {
    setDraggedItem(null);
    setDragOverSlot(null);
    
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
    
    const ghostElement = document.querySelector('.drag-ghost');
    if (ghostElement && ghostElement.parentNode) {
      ghostElement.parentNode.removeChild(ghostElement);
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

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, index: number): void => {
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
  }, [draggedItem, setDraggedItem, addItemToHotbarSlot]);

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
      // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('Erro ao deletar arquivos:', error);
      }
    }

    // Deselect if necessary
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  }, [items, selectedItem, onRemoveObject]);

  // Global keyboard handler for hotbar selection
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent): void => {
      // Skip if we're focused in an input element
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      // Handle number keys 1-9 for hotbar selection (top row number keys)
      if (e.key >= '1' && e.key <= '9') {
        // Get slot index (0-8) from key (1-9)
        const slotIndex = parseInt(e.key, 10) - 1;
        
        // Always prevent default browser behavior for number keys
        e.preventDefault();
        
        // Debug information
        // eslint-disable-next-line no-console
        // console.log(`Number key ${e.key} pressed, selecting hotbar slot ${slotIndex}`);
        
        // Always select the slot regardless of content
        setSelectedHotbarSlot(slotIndex);
        
        // Set selected item based on hotbar contents
        if (hotbarItems[slotIndex]) {
          // eslint-disable-next-line no-console
          // console.log(`Found item in slot ${slotIndex}:`, hotbarItems[slotIndex]?.fileName);
          setSelectedItem(hotbarItems[slotIndex]!);
        } else {
          // eslint-disable-next-line no-console
          // console.log(`No item in slot ${slotIndex}, clearing item selection`);
          setSelectedItem(null);
        }
      }
    };

    // eslint-disable-next-line no-console
    console.log("Global hotbar keyboard handler initialized");
    
    // Use true for capture to ensure this handler runs before others
    document.addEventListener('keydown', handleGlobalHotkeys as unknown as EventListener, true);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalHotkeys as unknown as EventListener, true);
      // eslint-disable-next-line no-console
      // console.log("Global hotbar keyboard handler removed");
    };
  }, [hotbarItems, setSelectedItem]);

  // Direct method to add an item to the hotbar (no event required)
  const addItemToHotbarDirect = useCallback((item: InventoryItem): void => {
    // console.log('addItemToHotbarDirect called with item:', item);
    
    if (selectedHotbarSlot !== null) {
      // console.log(`Adding item directly to selected slot ${selectedHotbarSlot}`);
      // Update hotbar items
      const newHotbarItems = [...hotbarItems];
      newHotbarItems[selectedHotbarSlot] = item;
      setHotbarItems(newHotbarItems);
    } else {
      const emptySlotIndex = hotbarItems.findIndex(slot => slot === null);
      if (emptySlotIndex !== -1) {
        // console.log(`Adding item directly to first empty slot ${emptySlotIndex}`);
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[emptySlotIndex] = item;
        setHotbarItems(newHotbarItems);
      } else {
        // console.log('No empty slots, adding directly to slot 0');
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[0] = item;
        setHotbarItems(newHotbarItems);
      }
    }
  }, [selectedHotbarSlot, hotbarItems, setHotbarItems]);

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
    addItemToHotbarDirect,
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