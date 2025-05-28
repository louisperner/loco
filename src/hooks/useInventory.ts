import { useState, useEffect, useCallback, useMemo, MouseEvent, KeyboardEvent, DragEvent } from 'react';
import { useImageStore } from '../store/useImageStore';
import { useModelStore } from '../store/useModelStore';
import { useVideoStore } from '../store/videoStore';
import { useGameStore } from '../store/useGameStore';
import {
  HOTBAR_STORAGE_KEY,
  getImageCategory,
  getModelCategory,
  getVideoCategory,
  showAddedToCanvasIndicator,
} from '../utils/inventoryUtils';

// Note: Window interface with electron API is defined in src/types/global.d.ts

export interface InventoryItem {
  id: string;
  type: 'image' | 'model' | 'video';
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
  onSelectVideo?: (item: InventoryItem) => void;
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

// Define interfaces for Electron API responses - using more specific types
interface ImageData {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  filePath?: string;
  fileSize?: number;
  createdAt?: string;
  modifiedAt?: string;
  [key: string]: unknown;
}

interface ModelData {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  filePath?: string;
  fileSize?: number;
  createdAt?: string;
  modifiedAt?: string;
  [key: string]: unknown;
}

interface VideoData {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  filePath?: string;
  fileSize?: number;
  createdAt?: string;
  modifiedAt?: string;
  position?: string;
  rotation?: string;
  scale?: string;
  isInScene?: boolean;
  isPlaying?: boolean;
  volume?: number;
  loop?: boolean;
  [key: string]: unknown;
}

interface ImageResponse {
  success: boolean;
  images: ImageData[];
  error?: string;
}

interface ModelResponse {
  success: boolean;
  models: ModelData[];
  error?: string;
}

interface VideoResponse {
  success: boolean;
  videos: VideoData[];
  error?: string;
}

interface DeleteFileResponse {
  success: boolean;
  error?: string;
}

// Type for electron API to avoid 'any'
interface ElectronInstance {
  listImagesFromDisk?: () => Promise<ImageResponse>;
  listModelsFromDisk?: () => Promise<ModelResponse>;
  listVideosFromDisk?: () => Promise<VideoResponse>;
  deleteFile?: (path: string) => Promise<DeleteFileResponse>;
  [key: string]: unknown;
}

export const useInventory = (
  onSelectImage?: (item: InventoryItem) => void,
  onSelectModel?: (item: InventoryItem) => void,
  onSelectVideo?: (item: InventoryItem) => void,
  onClose?: () => void,
  isOpen = false,
  onRemoveObject?: (id?: string) => void,
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

  const storeImages = useImageStore((state) => state.images);
  const storeModels = useModelStore((state) => state.models);
  const storeVideos = useVideoStore((state) => state.videos);
  


  const loadItemsFromDisk = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      let allItems: InventoryItem[] = [];

      // First check if we're in a browser environment (not Electron)
      const electron = window.electron as unknown as ElectronInstance;
      const isElectronAvailable =
        !!electron &&
        typeof electron.listImagesFromDisk === 'function' &&
        typeof electron.listModelsFromDisk === 'function';

      if (isElectronAvailable) {
        try {
          if (electron && electron.listImagesFromDisk) {
            const imageResult = await electron.listImagesFromDisk();

            if (imageResult.success) {
              const imageItems = imageResult.images.map((img: ImageData) => ({
                id: String(img.id || ''),
                type: 'image' as const,
                fileName: String(img.fileName || ''),
                url: String(img.url || ''),
                thumbnailUrl: String(img.thumbnailUrl || ''),
                filePath: img.filePath as string | undefined,
                fileSize: img.fileSize as number | undefined,
                createdAt: img.createdAt as string | undefined,
                modifiedAt: img.modifiedAt as string | undefined,
                category: getImageCategory(String(img.fileName || '')),
              }));
              allItems = [...allItems, ...imageItems];
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading images from disk:', error);
        }

        try {
          if (electron && electron.listModelsFromDisk) {
            const modelResult = await electron.listModelsFromDisk();

            if (modelResult.success) {
              const modelItems = modelResult.models.map((model: ModelData) => ({
                id: String(model.id || ''),
                type: 'model' as const,
                fileName: String(model.fileName || ''),
                url: String(model.url || ''),
                thumbnailUrl: String(model.thumbnailUrl || ''),
                filePath: model.filePath as string | undefined,
                fileSize: model.fileSize as number | undefined,
                createdAt: model.createdAt as string | undefined,
                modifiedAt: model.modifiedAt as string | undefined,
                category: getModelCategory(String(model.fileName || '')),
              }));
              allItems = [...allItems, ...modelItems];
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading models from disk:', error);
        }

        try {
          if (electron && electron.listVideosFromDisk) {
            const videoResult = await electron.listVideosFromDisk();

            if (videoResult.success) {
              const videoItems = videoResult.videos.map((video: VideoData) => {
                const fileName = typeof video.fileName === 'string' ? video.fileName : 'Unknown Video';
                const videoFileName = fileName || 'Unknown Video';

                // Create a complete inventory item with all video properties
                return {
                  id: String(video.id || ''),
                  type: 'video' as const,
                  fileName: videoFileName,
                  url: String(video.url || ''),
                  thumbnailUrl: String(video.thumbnailUrl || ''),
                  // Include these extra properties for restoration
                  src: String(video.url || ''),
                  position: video.position as string | undefined,
                  rotation: video.rotation as string | undefined,
                  scale: video.scale as string | undefined,
                  isInScene: video.isInScene as boolean | undefined,
                  isPlaying: video.isPlaying as boolean | undefined,
                  volume: video.volume as number | undefined,
                  loop: video.loop as boolean | undefined,
                  createdAt: video.createdAt as string | undefined,
                  modifiedAt: video.modifiedAt as string | undefined,
                  category: getVideoCategory(videoFileName),
                } as InventoryItem;
              });
              allItems = [...allItems, ...videoItems];
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading videos from disk:', error);
        }
      }

      // Always include items from store
      const storeImageItems = storeImages.map((img) => ({
        id: img.id,
        type: 'image' as const,
        fileName: img.fileName || 'Unknown',
        url: img.src,
        thumbnailUrl: img.src,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        category: getImageCategory(img.fileName || 'Unknown'),
      }));
      allItems = [...allItems, ...storeImageItems];

      const storeModelItems = storeModels.map((model) => {
        return {
                  id: model.id,
        type: 'model' as const,
        fileName: model.fileName || 'Unknown',
        url: model.url,
        thumbnailUrl: model.thumbnailUrl as string | undefined,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        category: getModelCategory(model.fileName || 'Unknown'),
        // Preserve custom cube properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customCube: (model as any).customCube,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cubeFaces: (model as any).cubeFaces,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isPrimitive: (model as any).isPrimitive,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        primitiveType: (model as any).primitiveType,
        };
      });
      allItems = [...allItems, ...storeModelItems];

      const storeVideoItems = storeVideos.map((video) => {
        const fileName = typeof video.fileName === 'string' ? video.fileName : 'Unknown Video';
        const videoFileName = fileName || 'Unknown Video';

        // Create a complete inventory item with all video properties
        return {
          id: video.id,
          type: 'video' as const,
          fileName: videoFileName,
          url: video.src,
          thumbnailUrl: video.thumbnailUrl || '',
          // Include these extra properties for restoration
          src: video.src,
          position: video.position,
          rotation: video.rotation,
          scale: video.scale,
          isInScene: video.isInScene,
          isPlaying: video.isPlaying,
          volume: video.volume,
          loop: video.loop,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          category: getVideoCategory(videoFileName),
        } as InventoryItem;
      });
      allItems = [...allItems, ...storeVideoItems];

      // Extract unique categories
      const uniqueCategories = [...new Set(allItems.map((item) => item.category))].filter(Boolean) as string[];
      setCategories([
        'all',
        'images',
        'models',
        'videos',
        ...uniqueCategories.filter((cat) => cat !== 'images' && cat !== 'models' && cat !== 'videos'),
      ]);

      // Deduplication logic
      const uniqueItems: InventoryItem[] = [];
      const seenUrls = new Map<string, number>();
      const seenPaths = new Map<string, number>();
      const seenIds = new Set<string>();

      allItems.forEach((item) => {
        if (seenIds.has(item.id)) return;

        // Skip URL-based deduplication for custom cubes since they all share the same primitive URL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isCustomCube = (item as any).customCube;
        
        const normalizedUrl = item.url ? item.url.replace(/\\/g, '/').toLowerCase() : null;
        if (normalizedUrl && seenUrls.has(normalizedUrl) && !isCustomCube) {
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
          (existingItem) =>
            existingItem.fileName === item.fileName &&
            existingItem.type === item.type &&
            existingItem.fileSize === item.fileSize,
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

        // Only track URLs for non-custom cubes to avoid deduplication issues
        if (normalizedUrl && !isCustomCube) seenUrls.set(normalizedUrl, itemIndex);
        if (filePath) seenPaths.set(filePath, itemIndex);
      });

      setItems(uniqueItems);

      // Restore hotbar items
      try {
        const savedHotbar = localStorage.getItem(HOTBAR_STORAGE_KEY);
        // // console.log('Loaded savedHotbar from localStorage:', savedHotbar);
        if (savedHotbar) {
          const savedHotbarIds = JSON.parse(savedHotbar) as (string | null)[];
          // // console.log('Parsed savedHotbarIds:', savedHotbarIds);
          const newHotbarItems: (InventoryItem | null)[] = Array(9).fill(null);

          savedHotbarIds.forEach((id, index) => {
            if (id) {
              const item = uniqueItems.find((item) => item.id === id);
              // // console.log(`Looking for item with ID ${id} for slot ${index}:`, item);
              if (item) {
                newHotbarItems[index] = item;
              }
            }
          });

          // // console.log('Restored hotbar from localStorage:', newHotbarItems);
          setHotbarItems(newHotbarItems);
        } else {
          // // console.log('No saved hotbar found in localStorage');
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
  }, [storeImages, storeModels, storeVideos]);

  // Update showFullInventory when isOpen prop changes
  useEffect(() => {
    // Only update showFullInventory if it's different from the isOpen prop
    setShowFullInventory(isOpen || false);
  }, [isOpen]);

  // Load items when the component mounts or stores change
  useEffect(() => {
    loadItemsFromDisk();
    // We depend on the underlying data, not the function itself to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeImages, storeModels, storeVideos]);

  // Save hotbar to localStorage whenever it changes
  useEffect(() => {
    try {
      // // console.log('Saving hotbar to localStorage:', hotbarItems);
      const hotbarIds = hotbarItems.map((item) => (item ? item.id : null));
      // // console.log('Hotbar IDs to save:', hotbarIds);
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(hotbarIds));
      // // console.log('Hotbar saved to localStorage successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      // console.error('Error saving hotbar to localStorage:', error);
    }
  }, [hotbarItems]);

  // Move addItemToHotbarSlot into useCallback to avoid dependency cycle
  const addItemToHotbarSlot = useCallback(
    (item: InventoryItem, slotIndex: number): void => {
      // // console.log(`addItemToHotbarSlot called with item: ${item.fileName} for slot: ${slotIndex}`);

      if (slotIndex >= 0 && slotIndex < 9) {
        const existingIndex = hotbarItems.findIndex((hotbarItem) => hotbarItem && hotbarItem.id === item.id);

        // // console.log(`Existing index of item in hotbar: ${existingIndex}`);

        if (existingIndex !== -1 && existingIndex !== slotIndex) {
          //// console.log(`Item exists in slot ${existingIndex}, moving to slot ${slotIndex}`);
          const newHotbarItems = [...hotbarItems];
          newHotbarItems[existingIndex] = null;
          newHotbarItems[slotIndex] = item;
          //// console.log('New hotbar items before update:', newHotbarItems);
          setHotbarItems(newHotbarItems);
        } else if (existingIndex === -1) {
          //// console.log(`Item doesn't exist in hotbar, adding to slot ${slotIndex}`);
          const newHotbarItems = [...hotbarItems];
          newHotbarItems[slotIndex] = item;
          //// console.log('New hotbar items before update:', newHotbarItems);
          setHotbarItems(newHotbarItems);
        } else {
          //// console.log(`Item already exists in slot ${slotIndex}, no change needed`);
        }
      } else {
        //// console.log(`Invalid slot index: ${slotIndex}`);
      }
    },
    [hotbarItems, setHotbarItems],
  );

  // Now handleItemSelect can use addItemToHotbarSlot safely
  const handleItemSelect = useCallback(
    (item: InventoryItem): void => {
      setSelectedItem(item);

      if (isAddingToHotbar && selectedHotbarSlot !== null) {
        addItemToHotbarSlot(item, selectedHotbarSlot);
      }
    },
    [isAddingToHotbar, selectedHotbarSlot, setSelectedItem, addItemToHotbarSlot],
  );

  const handleAddToCanvas = useCallback(
    (item: InventoryItem): void => {
      if (!item) return;

      if (item.type === 'image' && onSelectImage) {
        onSelectImage(item);
        showAddedToCanvasIndicator(item);
      } else if (item.type === 'model' && onSelectModel) {
        onSelectModel(item);
        showAddedToCanvasIndicator(item);
      } else if (item.type === 'video' && onSelectVideo) {
        onSelectVideo(item);
        showAddedToCanvasIndicator(item);
      }
    },
    [onSelectImage, onSelectModel, onSelectVideo],
  );

  // Global keyboard handler for hotbar selection and item deselection
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

      // Handle Q key to clear selection globally
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        // eslint-disable-next-line no-console
        // // console.log('Q key pressed, clearing selection globally');
        setSelectedItem(null);
        setSelectedHotbarSlot(null);
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
        // // console.log(`Number key ${e.key} pressed, selecting hotbar slot ${slotIndex}`);

        // Always select the slot regardless of content
        setSelectedHotbarSlot(slotIndex);

        // Set selected item based on hotbar contents
        if (hotbarItems[slotIndex]) {
          const item = hotbarItems[slotIndex]!;

          setSelectedItem(item);
          
          // Update the global store with the selected hotbar item
          useGameStore.getState().setSelectedHotbarItem({
            ...item,
            name: item.fileName,
          });
        } else {
          // eslint-disable-next-line no-console
          // // console.log(`No item in slot ${slotIndex}, clearing item selection`);
          setSelectedItem(null);
          useGameStore.getState().setSelectedHotbarItem(null);
        }
      }
    };

    // eslint-disable-next-line no-console
    // // console.log("Global hotbar and deselection keyboard handler initialized");

    // Use true for capture to ensure this handler runs before others
    document.addEventListener('keydown', handleGlobalHotkeys as unknown as EventListener, true);

    return () => {
      document.removeEventListener('keydown', handleGlobalHotkeys as unknown as EventListener, true);
      // eslint-disable-next-line no-console
      // // console.log("Global hotbar keyboard handler removed");
    };
  }, [hotbarItems, setSelectedItem, setSelectedHotbarSlot]);

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
        // // console.log('Escape key pressed, closing inventory');
        setShowFullInventory(false);
        setSelectedItem(null);

        // Restore canvas interactivity
        useGameStore.getState().setCanvasInteractive(true);
      }
      // Note: number keys are handled by the global keyboard handler
    };

    // Use a named function for the keydown listener to help with debugging
    const inventoryKeydownListener = handleKeyDown as unknown as EventListener;
    document.addEventListener('keydown', inventoryKeydownListener);

    return () => {
      document.removeEventListener('keydown', inventoryKeydownListener);
      // eslint-disable-next-line no-console
    };
  }, [
    showFullInventory,
    setShowFullInventory,
    setSelectedItem,
    setSelectedHotbarSlot,
    isAddingToHotbar,
    setIsAddingToHotbar,
  ]);

  // Mouse click handlers
  useEffect(() => {
    const handleMouseClick = (e: MouseEvent): void => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      // Check if we're clicking on the canvas
      if (e.target === canvas || canvas.contains(e.target as Node)) {
        // Left click and we have a selected hotbar slot with an item
        // BUT only handle this if FPSControls didn't already handle it via addObject event
        if (e.button === 0 && selectedHotbarSlot !== null && hotbarItems[selectedHotbarSlot]) {
          // Check if a cube is selected - if so, let FPSControls handle it
          const selectedItem = hotbarItems[selectedHotbarSlot]!;
          const isCubeSelected = selectedItem && 
                                ((selectedItem.url as string)?.includes('primitive://cube') || 
                                 (selectedItem.fileName as string)?.toLowerCase().includes('cube'));
          
          // Only handle non-cube items here, let FPSControls handle cubes
          if (!isCubeSelected) {
            handleAddToCanvas(selectedItem);
          }
        }
        // Right click and we have a remove handler
        else if (e.button === 2 && typeof onRemoveObject === 'function') {
          // // console.log('Right click on canvas, removing object');
          onRemoveObject();
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

    // // console.log("Mouse click handler initialized");

    return () => {
      document.removeEventListener('mousedown', handleMouseClick as unknown as EventListener);
      document.removeEventListener('contextmenu', preventContextMenu as unknown as EventListener);
      // // console.log("Mouse click handler removed");
    };
  }, [selectedHotbarSlot, hotbarItems, onRemoveObject, handleAddToCanvas]);

  const handleConfirmSelection = (): void => {
    if (!selectedItem) return;

    if (selectedItem.type === 'image' && onSelectImage) {
      onSelectImage(selectedItem);
    } else if (selectedItem.type === 'model' && onSelectModel) {
      onSelectModel(selectedItem);
    } else if (selectedItem.type === 'video' && onSelectVideo) {
      onSelectVideo(selectedItem);
    }

    // Restore canvas interactivity - the simulation of canvas click is
    // handled by the UI components that call this function
    useGameStore.getState().setCanvasInteractive(true);

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

    // Update the global store with the selected hotbar item
    if (item) {
      useGameStore.getState().setSelectedHotbarItem({
        ...item,
        name: item.fileName,
      });
      handleItemSelect(item);
    } else {
      useGameStore.getState().setSelectedHotbarItem(null);
      setSelectedItem(null);
    }
  };

  const handleAddToHotbar = useCallback(
    (item: InventoryItem, e: MouseEvent): void => {
      e.stopPropagation();

      // Log the item being added and current hotbar state
      //// console.log('handleAddToHotbar called with item:', item);
      //// console.log('Current hotbar state:', hotbarItems);
      //// console.log('Selected hotbar slot:', selectedHotbarSlot);

      if (selectedHotbarSlot !== null) {
        //// console.log(`Adding item to selected slot ${selectedHotbarSlot}`);
        // First try using the helper function
        addItemToHotbarSlot(item, selectedHotbarSlot);

        // Also update directly as a fallback
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[selectedHotbarSlot] = item;
        setHotbarItems(newHotbarItems);
      } else {
        const emptySlotIndex = hotbarItems.findIndex((slot) => slot === null);
        if (emptySlotIndex !== -1) {
          //// console.log(`Adding item to first empty slot ${emptySlotIndex}`);
          // First try using the helper function
          addItemToHotbarSlot(item, emptySlotIndex);

          // Also update directly as a fallback
          const newHotbarItems = [...hotbarItems];
          newHotbarItems[emptySlotIndex] = item;
          setHotbarItems(newHotbarItems);
        } else {
          //// console.log('No empty slots, adding to slot 0');
          // First try using the helper function
          addItemToHotbarSlot(item, 0);

          // Also update directly as a fallback
          const newHotbarItems = [...hotbarItems];
          newHotbarItems[0] = item;
          setHotbarItems(newHotbarItems);
        }
      }
    },
    [selectedHotbarSlot, hotbarItems, addItemToHotbarSlot, setHotbarItems],
  );

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
          category: item.category,
        },
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
    img.src = item.type === 'image' ? item.thumbnailUrl || item.url : item.thumbnailUrl || '/cube.svg';
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

    document.querySelectorAll('.dragging').forEach((el) => {
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

      document.querySelectorAll('.hotbar-slot').forEach((slot) => {
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

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number): void => {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll('.hotbar-slot').forEach((slot) => {
        slot.classList.remove('drag-over');
      });

      if (draggedItem) {
        setTimeout(() => {
          addItemToHotbarSlot(draggedItem, index);
          setDraggedItem(null);
        }, 50);
      }
    },
    [draggedItem, setDraggedItem, addItemToHotbarSlot],
  );

  // Filter items based on active tab and search term
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Filter by active tab
        if (activeTab === 'all') return true;
        if (activeTab === 'images' && item.type === 'image') return true;
        if (activeTab === 'models' && item.type === 'model') return true;
        if (activeTab === 'videos' && item.type === 'video') return true;
        if (item.category === activeTab) return true;
        return false;
      })
      .filter((item) => {
        // Filter by search term (case-insensitive)
        return item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [items, activeTab, searchTerm]);

  const handleRemoveItem = useCallback(
    async (itemId: string): Promise<void> => {
      const itemToDelete = items.find((item) => item.id === itemId);
      if (!itemToDelete) return;

      const imageStore = useImageStore.getState();
      const modelStore = useModelStore.getState();
      const videoStore = useVideoStore.getState();

      // Find all instances (originals and clones)
      const canvasImages = imageStore.images.filter(
        (img) => img.inventoryId === itemId || img.src === itemToDelete.url || img.src === itemToDelete.filePath,
      );

      // For custom cubes, use more specific matching to avoid removing all cubes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isCustomCube = (itemToDelete as any).customCube;
      // console.log(`Removing item: ${itemToDelete.fileName}, isCustomCube: ${isCustomCube}, itemId: ${itemId}`);
      
      const canvasModels = modelStore.models.filter((model) => {
        // First check for direct inventory ID match (for clones placed from inventory)
        if (model.inventoryId === itemId) {
          // console.log(`Found model by inventoryId: ${model.id}`);
          return true;
        }
        
        // Check if this model IS the inventory item (for original models created by cube crafter)
        if (model.id === itemId) {
          // console.log(`Found model by direct ID match: ${model.id}`);
          return true;
        }
        
        // For custom cubes, use fileName matching as additional safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (isCustomCube && (model as any).customCube) {
          const matches = model.fileName === itemToDelete.fileName;
          if (matches) {
            // console.log(`Found custom cube by fileName: ${model.id} (${model.fileName})`);
          }
          return matches;
        }
        
        // For regular models, use URL/path matching
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!isCustomCube && !(model as any).customCube) {
          return model.url === itemToDelete.url || model.url === itemToDelete.filePath;
        }
        
        return false;
      });
      
      // console.log(`Found ${canvasModels.length} models to remove for item ${itemToDelete.fileName}`);

      const canvasVideos = videoStore.videos.filter(
        (video) => video.id === itemId || video.src === itemToDelete.url || video.src === itemToDelete.filePath,
      );

      const totalInstances = canvasImages.length + canvasModels.length + canvasVideos.length;

      if (totalInstances > 0) {
        const confirmMessage = `Remove ALL Instances?`;
        if (!window.confirm(confirmMessage)) return;
      } else {
        if (!window.confirm(`Deseja excluir permanentemente "${itemToDelete.fileName}"?`)) return;
      }

      // Remove from canvas
      try {
        // Remove images and clones
        canvasImages.forEach((img) => {
          imageStore.removeImage(img.id);
          if (onRemoveObject) onRemoveObject(img.id);
        });

        // Remove models and clones
        canvasModels.forEach((model) => {
          modelStore.removeModel(model.id);
          if (onRemoveObject) onRemoveObject(model.id);
        });

        // Remove videos
        canvasVideos.forEach((video) => {
          videoStore.removeVideo(video.id);
          if (onRemoveObject) onRemoveObject(video.id);
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao remover do canvas:', error);
        return;
      }

      // Remove from inventory
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      // Remove from hotbar correctly
      setHotbarItems((prev) => {
        const newHotbar = prev.map((slotItem) => (slotItem && slotItem.id === itemId ? null : slotItem));

        localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(newHotbar.map((slot) => slot?.id || null)));

        return newHotbar;
      });

      // Remove from global stores
      if (itemToDelete.type === 'image') {
        useImageStore.getState().removeImage(itemId);
      } else if (itemToDelete.type === 'model') {
        // The canvasModels filter above should have found all relevant models
        // We don't need to remove from store again since they were already removed in the loop above
        // But we should remove the original model if it exists and wasn't already removed
        const modelStore = useModelStore.getState();
        const originalModel = modelStore.models.find(model => model.id === itemId);
        if (originalModel) {
          modelStore.removeModel(itemId);
        }
      } else if (itemToDelete.type === 'video') {
        useVideoStore.getState().removeVideo(itemId);
      }

      // Remove physical file (Electron)
      const electron = window.electron as unknown as ElectronInstance;
      if (electron && electron.deleteFile) {
        try {
          const paths = [itemToDelete.filePath, itemToDelete.url, itemToDelete.thumbnailUrl].filter(
            Boolean,
          ) as string[];

          for (const path of paths) {
            await electron.deleteFile(path);
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
    },
    [items, selectedItem, onRemoveObject],
  );

  // Direct method to add an item to the hotbar (no event required)
  const addItemToHotbarDirect = useCallback(
    (item: InventoryItem): void => {
      // // console.log('addItemToHotbarDirect called with item:', item);

      if (selectedHotbarSlot !== null) {
        // // console.log(`Adding item directly to selected slot ${selectedHotbarSlot}`);
        // Update hotbar items
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[selectedHotbarSlot] = item;
        setHotbarItems(newHotbarItems);
      } else {
        const emptySlotIndex = hotbarItems.findIndex((slot) => slot === null);
        if (emptySlotIndex !== -1) {
          // // console.log(`Adding item directly to first empty slot ${emptySlotIndex}`);
          const newHotbarItems = [...hotbarItems];
          newHotbarItems[emptySlotIndex] = item;
          setHotbarItems(newHotbarItems);
        } else {
          // // console.log('No empty slots, adding directly to slot 0');
          const newHotbarItems = [...hotbarItems];
          newHotbarItems[0] = item;
          setHotbarItems(newHotbarItems);
        }
      }
    },
    [selectedHotbarSlot, hotbarItems, setHotbarItems],
  );

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
    handleRemoveItem,
  };
};
