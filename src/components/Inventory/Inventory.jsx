import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageStore } from '../../store/useImageStore';
import { useModelStore } from '../../store/useModelStore';
import './Inventory.css';

// Create a key for localStorage
const HOTBAR_STORAGE_KEY = 'loco-hotbar-items';

const Inventory = ({ onSelectImage, onSelectModel, onClose, isOpen }, ref) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'images', 'models', or custom categories
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullInventory, setShowFullInventory] = useState(isOpen || false);
  const [hotbarItems, setHotbarItems] = useState(Array(9).fill(null));
  const [selectedHotbarSlot, setSelectedHotbarSlot] = useState(null); // Index of selected hotbar slot (0-8)
  const [categories, setCategories] = useState([]);
  const [isAddingToHotbar, setIsAddingToHotbar] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null); // Track the item being dragged
  const [dragOverSlot, setDragOverSlot] = useState(null); // Track which slot is being dragged over
  const searchInputRef = useRef(null);
  
  // Get images and models from the stores as a fallback
  const storeImages = useImageStore(state => state.images);
  const storeModels = useModelStore(state => state.models);
  
  // Function to reload items from disk
  const loadItemsFromDisk = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have access to the electron API
      if (!window.electron) {
        throw new Error('Electron API not available');
      }
      
      let allItems = [];
      
      // Load images
      try {
        if (typeof window.electron.listImagesFromDisk === 'function') {
          const result = await window.electron.listImagesFromDisk();
          
          if (result.success) {
            const imageItems = result.images.map(img => ({
              ...img,
              type: 'image',
              category: getImageCategory(img.fileName)
            }));
            allItems = [...allItems, ...imageItems];
          }
        } else {
          console.warn('listImagesFromDisk function not available, using images from store instead');
          // Use images from the store as a fallback
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
        }
      } catch (error) {
        console.error('Error loading images:', error);
      }
      
      // Load models
      try {
        if (typeof window.electron.listModelsFromDisk === 'function') {
          const result = await window.electron.listModelsFromDisk();
          
          if (result.success) {
            const modelItems = result.models.map(model => ({
              ...model,
              type: 'model',
              category: getModelCategory(model.fileName)
            }));
            allItems = [...allItems, ...modelItems];
          }
        } else {
          console.warn('listModelsFromDisk function not available, using models from store instead');
          // Use models from the store as a fallback
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
      } catch (error) {
        console.error('Error loading models:', error);
      }
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allItems.map(item => item.category))].filter(Boolean);
      setCategories(['all', 'images', 'models', ...uniqueCategories.filter(cat => cat !== 'images' && cat !== 'models')]);
      
      // Improved deduplication logic
      const uniqueItems = [];
      const seenUrls = new Map(); // Track items by URL
      const seenPaths = new Map(); // Track items by file path
      const seenIds = new Set(); // Continue tracking by ID for backward compatibility
      
      allItems.forEach(item => {
        // Skip if we've already seen this ID
        if (seenIds.has(item.id)) {
          return;
        }
        
        // Check for duplicate URLs
        const normalizedUrl = item.url ? item.url.replace(/\\/g, '/').toLowerCase() : null;
        if (normalizedUrl && seenUrls.has(normalizedUrl)) {
          // Update the existing item with any new information if needed
          const existingItemIndex = seenUrls.get(normalizedUrl);
          const existingItem = uniqueItems[existingItemIndex];
          
          // Merge any missing properties
          if (!existingItem.thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemIndex].thumbnailUrl = item.thumbnailUrl;
          }
          
          // Track this ID as seen
          seenIds.add(item.id);
          return;
        }
        
        // Check for duplicate file paths (for local files)
        const filePath = item.filePath ? item.filePath.replace(/\\/g, '/').toLowerCase() : null;
        if (filePath && seenPaths.has(filePath)) {
          // Update the existing item with any new information if needed
          const existingItemIndex = seenPaths.get(filePath);
          const existingItem = uniqueItems[existingItemIndex];
          
          // Merge any missing properties
          if (!existingItem.thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemIndex].thumbnailUrl = item.thumbnailUrl;
          }
          
          // Track this ID as seen
          seenIds.add(item.id);
          return;
        }
        
        // Check for duplicate filenames as a last resort
        const existingItemWithSameFileName = uniqueItems.findIndex(
          existingItem => existingItem.fileName === item.fileName && 
                         existingItem.type === item.type &&
                         existingItem.fileSize === item.fileSize
        );
        
        if (existingItemWithSameFileName !== -1) {
          // Update the existing item with any new information if needed
          if (!uniqueItems[existingItemWithSameFileName].thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemWithSameFileName].thumbnailUrl = item.thumbnailUrl;
          }
          
          // Track this ID as seen
          seenIds.add(item.id);
          return;
        }
        
        // This is a new unique item
        const itemIndex = uniqueItems.length;
        uniqueItems.push(item);
        seenIds.add(item.id);
        
        // Track by URL and file path for future checks
        if (normalizedUrl) {
          seenUrls.set(normalizedUrl, itemIndex);
        }
        if (filePath) {
          seenPaths.set(filePath, itemIndex);
        }
      });
      
      // console.log(`Deduplicated ${allItems.length} items to ${uniqueItems.length} unique items`);
      setItems(uniqueItems);
      
      // Restore hotbar items from localStorage
      try {
        const savedHotbar = localStorage.getItem(HOTBAR_STORAGE_KEY);
        if (savedHotbar) {
          const savedHotbarIds = JSON.parse(savedHotbar);
          const newHotbarItems = Array(9).fill(null);
          
          // Find the items by ID and restore them to the hotbar
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
      
      // Use items from the store as a fallback
      const fallbackItems = [
        ...storeImages.map(img => ({
          id: img.id,
          type: 'image',
          fileName: img.fileName || 'Unknown',
          url: img.src,
          thumbnailUrl: img.src,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          category: getImageCategory(img.fileName || 'Unknown')
        })),
        ...storeModels.map(model => ({
          id: model.id,
          type: 'model',
          fileName: model.fileName || 'Unknown',
          url: model.url,
          thumbnailUrl: model.thumbnailUrl,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          category: getModelCategory(model.fileName || 'Unknown')
        }))
      ];
      
      // Improved deduplication for fallback items
      const uniqueItems = [];
      const seenUrls = new Map();
      const seenPaths = new Map();
      const seenIds = new Set();
      
      fallbackItems.forEach(item => {
        // Skip if we've already seen this ID
        if (seenIds.has(item.id)) {
          return;
        }
        
        // Check for duplicate URLs
        const normalizedUrl = item.url ? item.url.replace(/\\/g, '/').toLowerCase() : null;
        if (normalizedUrl && seenUrls.has(normalizedUrl)) {
          // Update the existing item with any new information if needed
          const existingItemIndex = seenUrls.get(normalizedUrl);
          const existingItem = uniqueItems[existingItemIndex];
          
          // Merge any missing properties
          if (!existingItem.thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemIndex].thumbnailUrl = item.thumbnailUrl;
          }
          
          // Track this ID as seen
          seenIds.add(item.id);
          return;
        }
        
        // Check for duplicate filenames as a last resort
        const existingItemWithSameFileName = uniqueItems.findIndex(
          existingItem => existingItem.fileName === item.fileName && 
                         existingItem.type === item.type
        );
        
        if (existingItemWithSameFileName !== -1) {
          // Update the existing item with any new information if needed
          if (!uniqueItems[existingItemWithSameFileName].thumbnailUrl && item.thumbnailUrl) {
            uniqueItems[existingItemWithSameFileName].thumbnailUrl = item.thumbnailUrl;
          }
          
          // Track this ID as seen
          seenIds.add(item.id);
          return;
        }
        
        // This is a new unique item
        const itemIndex = uniqueItems.length;
        uniqueItems.push(item);
        seenIds.add(item.id);
        
        // Track by URL for future checks
        if (normalizedUrl) {
          seenUrls.set(normalizedUrl, itemIndex);
        }
      });
      
      // Extract unique categories
      const uniqueCategories = [...new Set(uniqueItems.map(item => item.category))].filter(Boolean);
      setCategories(['all', 'images', 'models', ...uniqueCategories.filter(cat => cat !== 'images' && cat !== 'models')]);
      
      setItems(uniqueItems);
      
      // Try to restore hotbar from localStorage
      try {
        const savedHotbar = localStorage.getItem(HOTBAR_STORAGE_KEY);
        if (savedHotbar) {
          const savedHotbarIds = JSON.parse(savedHotbar);
          const newHotbarItems = Array(9).fill(null);
          
          // Find the items by ID and restore them to the hotbar
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
      
      setError(null);
      setLoading(false);
    }
  }, [storeImages, storeModels]);
  
  // Update showFullInventory when isOpen prop changes
  useEffect(() => {
    setShowFullInventory(isOpen);
  }, [isOpen]);
  
  // Load hotbar items from localStorage on component mount
  useEffect(() => {
    try {
      const savedHotbar = localStorage.getItem(HOTBAR_STORAGE_KEY);
      if (savedHotbar) {
        const parsedHotbar = JSON.parse(savedHotbar);
        // Initialize with empty slots, we'll fill them when items are loaded
        setHotbarItems(Array(9).fill(null));
      }
    } catch (error) {
      console.error('Error loading hotbar from localStorage:', error);
    }
  }, []);
  
  // Load items from disk on component mount
  useEffect(() => {
    loadItemsFromDisk();
  }, [loadItemsFromDisk]);
  
  // Save hotbar to localStorage whenever it changes
  useEffect(() => {
    try {
      // Save only the IDs of the items to localStorage
      const hotbarIds = hotbarItems.map(item => item ? item.id : null);
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(hotbarIds));
    } catch (error) {
      console.error('Error saving hotbar to localStorage:', error);
    }
  }, [hotbarItems]);
  
  // Helper function to determine image category based on filename
  const getImageCategory = (fileName) => {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('texture') || lowerFileName.includes('pattern')) return 'textures';
    if (lowerFileName.includes('background') || lowerFileName.includes('bg')) return 'backgrounds';
    if (lowerFileName.includes('icon')) return 'icons';
    return 'images';
  };
  
  // Helper function to determine model category based on filename
  const getModelCategory = (fileName) => {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('character') || lowerFileName.includes('person')) return 'characters';
    if (lowerFileName.includes('furniture') || lowerFileName.includes('chair') || lowerFileName.includes('table')) return 'furniture';
    if (lowerFileName.includes('vehicle') || lowerFileName.includes('car')) return 'vehicles';
    return 'models';
  };
  
  // Add keyboard event listener to close inventory with 'E' or Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if the target is an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key >= '1' && e.key <= '9') {
        // Select hotbar slot with number keys
        const index = parseInt(e.key) - 1;
        setSelectedHotbarSlot(index);
        
        // If there's an item in this slot, select it and add it to the canvas
        if (hotbarItems[index]) {
          handleItemSelect(hotbarItems[index]);
          handleAddToCanvas(hotbarItems[index]);
        } else {
          setSelectedItem(null);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        // Toggle adding to hotbar mode
        setIsAddingToHotbar(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hotbarItems]);
  
  // Focus search input when inventory is opened
  useEffect(() => {
    if (showFullInventory && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [showFullInventory]);
  
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    
    // If we're in "adding to hotbar" mode and a hotbar slot is selected, add the item
    if (isAddingToHotbar && selectedHotbarSlot !== null) {
      addItemToHotbarSlot(item, selectedHotbarSlot);
    }
  };
  
  const handleAddToCanvas = (item) => {
    if (!item) return;
    
    // Add the item to the canvas based on its type
    if (item.type === 'image' && onSelectImage) {
      onSelectImage(item);
      // Show visual feedback
      showAddedToCanvasIndicator(item);
    } else if (item.type === 'model' && onSelectModel) {
      onSelectModel(item);
      // Show visual feedback
      showAddedToCanvasIndicator(item);
    }
  };
  
  const showAddedToCanvasIndicator = (item) => {
    // Create a temporary element to show the item was added
    const indicator = document.createElement('div');
    indicator.className = 'canvas-add-indicator';
    indicator.textContent = `Added ${item.fileName} to canvas`;
    document.body.appendChild(indicator);
    
    // Animate and remove after animation
    setTimeout(() => {
      indicator.classList.add('show');
      setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(indicator);
        }, 300);
      }, 2000);
    }, 10);
  };
  
  const handleConfirmSelection = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'image' && onSelectImage) {
      onSelectImage(selectedItem);
    } else if (selectedItem.type === 'model' && onSelectModel) {
      onSelectModel(selectedItem);
    }
    
    // Close the inventory after selection
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
  
  const handleHotbarSlotClick = (index) => {
    const item = hotbarItems[index];
    setSelectedHotbarSlot(index);
    
    // If there's an item in this slot, select it and add it to the canvas
    if (item) {
      handleItemSelect(item);
      handleAddToCanvas(item);
    } else {
      setSelectedItem(null);
    }
  };
  
  const addItemToHotbarSlot = (item, slotIndex) => {
    if (slotIndex >= 0 && slotIndex < 9) {
      // Check if the item is already in the hotbar
      const existingIndex = hotbarItems.findIndex(hotbarItem => 
        hotbarItem && hotbarItem.id === item.id
      );
      
      // If the item is already in the hotbar at a different slot, remove it from there
      if (existingIndex !== -1 && existingIndex !== slotIndex) {
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[existingIndex] = null;
        newHotbarItems[slotIndex] = item;
        setHotbarItems(newHotbarItems);
      } else if (existingIndex === -1) {
        // If the item is not in the hotbar, add it to the selected slot
        const newHotbarItems = [...hotbarItems];
        newHotbarItems[slotIndex] = item;
        setHotbarItems(newHotbarItems);
      }
      
      // Show a brief success message or visual feedback
      const slot = document.querySelector(`.hotbar-slot:nth-child(${slotIndex + 1})`);
      if (slot) {
        slot.classList.add('item-added');
        setTimeout(() => {
          slot.classList.remove('item-added');
        }, 500);
      }
    }
  };
  
  const handleAddToHotbar = (item, e) => {
    e.stopPropagation();
    
    if (selectedHotbarSlot !== null) {
      // Add to the selected slot
      addItemToHotbarSlot(item, selectedHotbarSlot);
    } else {
      // Find the first empty slot
      const emptySlotIndex = hotbarItems.findIndex(slot => slot === null);
      if (emptySlotIndex !== -1) {
        addItemToHotbarSlot(item, emptySlotIndex);
      } else {
        // If no empty slot, add to the first slot
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
  
  const handleToggleInventory = () => {
    setShowFullInventory(prev => !prev);
  };
  
  // Filter items based on active tab and search term
  const filteredItems = items.filter(item => {
    // Filter by tab
    if (activeTab === 'all') {
      // No type filtering for 'all' tab
    } else if (activeTab === 'images' && item.type !== 'image') {
      return false;
    } else if (activeTab === 'models' && item.type !== 'model') {
      return false;
    } else if (activeTab !== 'images' && activeTab !== 'models' && activeTab !== 'all') {
      // Filter by custom category
      if (item.category !== activeTab) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      return item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });
  
  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    
    console.log('Starting drag for item:', item);
    
    // Set custom data for canvas drop
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
      
      // Stringify the data and set it in the dataTransfer
      const jsonData = JSON.stringify(itemData);
      e.dataTransfer.setData('application/json', jsonData);
      console.log('Set drag data:', jsonData);
      
      // Also set text data as fallback
      e.dataTransfer.setData('text/plain', item.fileName);
    } catch (error) {
      console.error('Error setting drag data:', error);
    }
    
    // Set a ghost image for the drag operation
    const ghostImage = document.createElement('div');
    ghostImage.classList.add('drag-ghost');
    
    // Create an image element inside the ghost div
    const img = document.createElement('img');
    img.src = item.type === 'image' 
      ? (item.thumbnailUrl || item.url) 
      : (item.thumbnailUrl || '/cube.svg');
    img.alt = item.fileName;
    ghostImage.appendChild(img);
    
    // Add the ghost to the document, position it off-screen
    ghostImage.style.position = 'absolute';
    ghostImage.style.left = '-1000px';
    ghostImage.style.top = '-1000px';
    document.body.appendChild(ghostImage);
    
    // Set the drag image
    e.dataTransfer.setDragImage(ghostImage, 30, 30);
    e.dataTransfer.effectAllowed = 'move';
    
    // Remove the ghost element after a short delay
    setTimeout(() => {
      document.body.removeChild(ghostImage);
    }, 100);
    
    // Hide the "drop files" overlay when dragging from inventory
    const dropOverlay = document.querySelector('.drop-overlay');
    if (dropOverlay) {
      dropOverlay.classList.add('internal-drag');
    }
  };
  
  const handleDragEnd = (e) => {
    // Reset the dragged item and any visual indicators
    setDraggedItem(null);
    setDragOverSlot(null);
    
    // Remove any ghost elements
    const ghostElement = document.querySelector('.drag-ghost');
    if (ghostElement) {
      document.body.removeChild(ghostElement);
    }
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverSlot(index);
  };
  
  const handleDragLeave = (e, index) => {
    e.preventDefault();
    if (dragOverSlot === index) {
      setDragOverSlot(null);
    }
  };
  
  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    if (draggedItem) {
      addItemToHotbarSlot(draggedItem, index);
      setDraggedItem(null);
    }
  };
  
  // Expose the loadItemsFromDisk function to parent components
  React.useImperativeHandle(ref, () => ({
    reloadInventory: loadItemsFromDisk
  }));
  
  return (
    <>
      {/* Hotbar (always visible at bottom) */}
      <div className="hotbar-container">
        <div className="hotbar">
          {hotbarItems.map((item, index) => {
            return (
              <div 
                key={index}
                className={`hotbar-slot ${!item ? 'empty' : ''} ${selectedHotbarSlot === index ? 'selected' : ''} ${dragOverSlot === index ? 'drag-over' : ''}`}
                onClick={() => handleHotbarSlotClick(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={(e) => handleDragLeave(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                draggable={!!item}
                onDragStart={(e) => item && handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
              >
                {item ? (
                  <>
                    {item.type === 'image' ? (
                      <img 
                        src={item.thumbnailUrl || item.url} 
                        alt={item.fileName} 
                        title={item.fileName}
                        className="hotbar-item-thumbnail"
                      />
                    ) : (
                      <div className="hotbar-model-thumbnail">
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.fileName} 
                            title={item.fileName}
                            className="model-thumbnail-img"
                          />
                        ) : (
                          <div className="model-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.42-7 9.88-3.87-1.45-7-5.2-7-9.88V6.3l7-3.12z"/>
                              <path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="hotbar-item-number">{index + 1}</div>
                    <button 
                      className="hotbar-remove-button" 
                      onClick={(e) => handleRemoveFromHotbar(index, e)}
                      title="Remove from hotbar"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="hotbar-item-number">{index + 1}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Full inventory (toggleable) */}
      {showFullInventory && (
        <div className="inventory-container">
          <div className="inventory-header">
            <h2>Inventory</h2>
            <div className="inventory-search">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <div className="inventory-controls">
              <span className="keyboard-hint">Press <kbd>E</kbd> or <kbd>Esc</kbd> to close</span>
              <button className="close-button" onClick={onClose}>×</button>
            </div>
          </div>
          
          <div className="inventory-tabs">
            {categories.map(category => (
              <button 
                key={category}
                className={`inventory-tab ${activeTab === category ? 'active' : ''}`}
                onClick={() => handleTabChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          <div className={`inventory-mode-indicator ${isAddingToHotbar ? 'active' : ''}`}>
            {isAddingToHotbar ? (
              <>
                <span>Adding to hotbar slot {selectedHotbarSlot !== null ? selectedHotbarSlot + 1 : '...'}</span>
                <button 
                  className="mode-toggle-button"
                  onClick={() => setIsAddingToHotbar(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>Click items to select</span>
                <button 
                  className="mode-toggle-button"
                  onClick={() => setIsAddingToHotbar(true)}
                >
                  Add to Hotbar
                </button>
              </>
            )}
          </div>
          
          {loading && (
            <div className="inventory-loading">
              <p>Loading items...</p>
            </div>
          )}
          
          {error && (
            <div className="inventory-error">
              <p>Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && filteredItems.length === 0 && (
            <div className="inventory-empty">
              <p>No items found. Drag and drop images or 3D models to add them to your inventory.</p>
            </div>
          )}
          
          {!loading && !error && filteredItems.length > 0 && (
            <>
              <div className="inventory-grid">
                {filteredItems.map((item) => {
                  // Check if this item is already in the hotbar
                  const isInHotbar = hotbarItems.some(hotbarItem => hotbarItem && hotbarItem.id === item.id);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`inventory-item ${selectedItem?.id === item.id ? 'selected' : ''} ${isInHotbar ? 'in-hotbar' : ''}`}
                      onClick={() => handleItemSelect(item)}
                      onDoubleClick={() => {
                        handleAddToCanvas(item);
                        onClose();
                      }}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                    >
                      {item.type === 'image' ? (
                        <img 
                          src={item.thumbnailUrl || item.url} 
                          alt={item.fileName} 
                          title={item.fileName}
                          className="item-thumbnail"
                        />
                      ) : (
                        <div className="model-thumbnail">
                          {item.thumbnailUrl ? (
                            <img 
                              src={item.thumbnailUrl} 
                              alt={item.fileName} 
                              title={item.fileName}
                              className="model-thumbnail-img"
                            />
                          ) : (
                            <>
                              <div className="model-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.42-7 9.88-3.87-1.45-7-5.2-7-9.88V6.3l7-3.12z"/>
                                  <path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                              </div>
                              <div className="model-label">3D Model</div>
                            </>
                          )}
                        </div>
                      )}
                      <div className="inventory-item-name">{item.fileName}</div>
                      <div className="inventory-item-category">{item.category}</div>
                      {isInHotbar && <div className="in-hotbar-indicator">In Hotbar</div>}
                      {isAddingToHotbar ? (
                        <div className="inventory-item-actions visible">
                          <button 
                            className={`hotbar-add-button ${isInHotbar ? 'disabled' : ''}`}
                            onClick={(e) => !isInHotbar && handleAddToHotbar(item, e)}
                            title={isInHotbar ? 'Already in hotbar' : `Add to hotbar slot ${selectedHotbarSlot !== null ? selectedHotbarSlot + 1 : ''}`}
                            disabled={isInHotbar}
                          >
                            {isInHotbar ? '✓' : '+'}
                          </button>
                        </div>
                      ) : (
                        <div className="inventory-item-actions">
                          <button 
                            className={`hotbar-add-button ${isInHotbar ? 'disabled' : ''}`}
                            onClick={(e) => !isInHotbar && handleAddToHotbar(item, e)}
                            title={isInHotbar ? 'Already in hotbar' : 'Add to hotbar'}
                            disabled={isInHotbar}
                          >
                            {isInHotbar ? '✓' : '+'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="inventory-actions">
                <button 
                  className="select-button" 
                  disabled={!selectedItem}
                  onClick={handleConfirmSelection}
                >
                  Add to Canvas
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default React.forwardRef(Inventory); 