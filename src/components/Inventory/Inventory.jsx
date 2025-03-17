import React, { useState, useEffect, useMemo } from 'react';
import { useImageStore } from '../../store/useImageStore';
import { useModelStore } from '../../store/useModelStore';
import Hotbar from './components/Hotbar';

const INVENTORY_ITEMS_KEY = 'loco-inventory-items';
const HOTBAR_ITEMS_KEY = 'loco-hotbar-items';

const Inventory = ({ isOpen, onClose, onSelectImage, onSelectModel }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hotbarItems, setHotbarItems] = useState(Array(9).fill(null));
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  
  // Get items from stores
  const images = useImageStore(state => state.images);
  const models = useModelStore(state => state.models);

  // Convert store items to inventory format
  const convertToInventoryItem = (item, type) => ({
    id: item.id,
    name: item.fileName,
    icon: type === 'image' ? item.src : item.thumbnailUrl || '/model-icon.png',
    type: type,
    url: type === 'image' ? item.src : item.url,
    count: 1
  });

  // Load or update inventory items when stores change
  useEffect(() => {
    try {
      // Get existing inventory items
      const savedInventory = localStorage.getItem(INVENTORY_ITEMS_KEY);
      const savedItems = savedInventory ? JSON.parse(savedInventory) : [];
      
      // Convert current store items
      const currentItems = [
        ...images.map(img => convertToInventoryItem(img, 'image')),
        ...models.map(model => convertToInventoryItem(model, 'model'))
      ];
      
      // Merge existing and new items, keeping duplicates
      const mergedItems = [...savedItems];
      
      // Add new items that aren't already in the inventory
      currentItems.forEach(item => {
        if (!mergedItems.some(existing => existing.id === item.id)) {
          mergedItems.push(item);
        }
      });
      
      // Update state and localStorage
      setInventoryItems(mergedItems);
      localStorage.setItem(INVENTORY_ITEMS_KEY, JSON.stringify(mergedItems));
    } catch (error) {
      console.error('Error managing inventory items:', error);
    }
  }, [images, models]);

  // Close inventory when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // Handle number keys 1-9 for hotbar selection
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        setSelectedSlot(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load hotbar items from localStorage
  useEffect(() => {
    const loadHotbarItems = () => {
      try {
        const savedHotbar = localStorage.getItem(HOTBAR_ITEMS_KEY);
        if (savedHotbar) {
          const savedItems = JSON.parse(savedHotbar);
          const loadedHotbar = savedItems.map(savedItem => {
            if (!savedItem) return null;
            return inventoryItems.find(item => item.id === savedItem.id) || null;
          });
          setHotbarItems(loadedHotbar);
        }
      } catch (error) {
        console.error('Error loading hotbar:', error);
      }
    };

    loadHotbarItems();
  }, [inventoryItems]);

  // Add canvas drag and drop event listeners
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleCanvasDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvas.style.outline = '2px solid #4f9eff';
    };

    const handleCanvasDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvas.style.outline = 'none';
    };

    const handleCanvasDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvas.style.outline = 'none';

      try {
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const item = JSON.parse(data);
        if (item.type === 'image' && onSelectImage) {
          onSelectImage(item);
        } else if (item.type === 'model' && onSelectModel) {
          onSelectModel(item);
        }
      } catch (error) {
        console.error('Error handling canvas drop:', error);
      }
    };

    canvas.addEventListener('dragover', handleCanvasDragOver);
    canvas.addEventListener('dragleave', handleCanvasDragLeave);
    canvas.addEventListener('drop', handleCanvasDrop);

    return () => {
      canvas.removeEventListener('dragover', handleCanvasDragOver);
      canvas.removeEventListener('dragleave', handleCanvasDragLeave);
      canvas.removeEventListener('drop', handleCanvasDrop);
      canvas.style.outline = 'none';
    };
  }, [onSelectImage, onSelectModel]);

  // Add canvas click handler
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleCanvasClick = (e) => {
      // Only handle left clicks
      if (e.button !== 0) return;

      // Check if we have a selected slot with an item
      if (selectedSlot !== null && selectedSlot < 9 && hotbarItems[selectedSlot]) {
        const item = hotbarItems[selectedSlot];
        if (item.type === 'image' && onSelectImage) {
          onSelectImage(item);
        } else if (item.type === 'model' && onSelectModel) {
          onSelectModel(item);
        }
      }
    };

    canvas.addEventListener('mousedown', handleCanvasClick);
    return () => {
      canvas.removeEventListener('mousedown', handleCanvasClick);
    };
  }, [selectedSlot, hotbarItems, onSelectImage, onSelectModel]);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'fixed w-12 h-12 bg-gray-800 rounded-lg opacity-70 pointer-events-none flex items-center justify-center';
    dragImage.innerHTML = `<img src="${item.icon}" class="w-10 h-10 object-contain" alt="${item.name}" />`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 24, 24);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    // Add a class to the canvas to show it's a valid drop target
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.add('valid-drop-target');
    }
  };

  const handleDragOver = (e, slotIndex) => {
    e.preventDefault();
    setDragOverSlot(slotIndex);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedItem) return;

    // If dropping on hotbar slot
    if (slotIndex !== undefined) {
      const newHotbarItems = [...hotbarItems];
      newHotbarItems[slotIndex] = draggedItem;
      setHotbarItems(newHotbarItems);
      localStorage.setItem(HOTBAR_ITEMS_KEY, JSON.stringify(newHotbarItems));
    }
    // If dropping on canvas (outside inventory)
    else if (e.target.tagName === 'CANVAS') {
      if (draggedItem.type === 'image' && onSelectImage) {
        onSelectImage(draggedItem);
      } else if (draggedItem.type === 'model' && onSelectModel) {
        onSelectModel(draggedItem);
      }
    }

    setDraggedItem(null);
  };

  const handleInventorySlotClick = (item) => {
    if (!item) return;

    if (selectedSlot !== null && selectedSlot < 9) {
      // Add to hotbar if a hotbar slot is selected
      const newHotbarItems = [...hotbarItems];
      newHotbarItems[selectedSlot] = item;
      setHotbarItems(newHotbarItems);
      localStorage.setItem(HOTBAR_ITEMS_KEY, JSON.stringify(newHotbarItems));
    } else {
      // Add to canvas
      if (item.type === 'image' && onSelectImage) {
        onSelectImage(item);
      } else if (item.type === 'model' && onSelectModel) {
        onSelectModel(item);
      }
    }
  };

  const handleHotbarItemClick = (index) => {
    const item = hotbarItems[index];
    if (item) {
      if (item.type === 'image' && onSelectImage) {
        onSelectImage(item);
      } else if (item.type === 'model' && onSelectModel) {
        onSelectModel(item);
      }
    }
    setSelectedSlot(index);
  };

  const handleDragEnd = (e) => {
    // Remove the valid drop target indicator from canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.remove('valid-drop-target');
      canvas.style.outline = 'none';
    }
    setDraggedItem(null);
  };

  return (
    <>
      {/* Always render the hotbar */}
      <Hotbar 
        hotbarItems={hotbarItems}
        selectedSlot={selectedSlot}
        onSlotClick={handleHotbarItemClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        dragOverSlot={dragOverSlot}
      />

      {/* Render inventory only when open */}
      {isOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 p-5 rounded-lg z-50 font-minecraft text-white select-none">
          {/* <div className="text-2xl mb-5 text-center text-white text-shadow">Inventory</div> */}
          <div className="flex flex-col gap-2.5">
            {/* Main inventory grid */}
            <div className="grid grid-cols-9 gap-1 p-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg">
              {inventoryItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`w-14 h-14 bg-gray-700 border-2 ${selectedSlot === (index + 9) ? 'border-white' : 'border-gray-600'} 
                    rounded relative cursor-pointer hover:bg-gray-600 flex items-center justify-center transition-colors
                    ${dragOverSlot === index ? 'border-blue-500 bg-blue-500/20' : ''}`}
                  onClick={() => handleInventorySlotClick(item)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <img 
                      src={item.icon} 
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {item.count > 1 && (
                      <span className="absolute bottom-0 right-0 bg-black/70 px-1 text-xs rounded">
                        {item.count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        canvas.valid-drop-target {
          transition: outline 0.2s ease;
        }
        canvas.valid-drop-target:not(:hover) {
          outline: 2px solid rgba(79, 158, 255, 0.5);
        }
        canvas.valid-drop-target:hover {
          outline: 2px solid #4f9eff;
        }
      `}</style>
    </>
  );
};

export default Inventory; 