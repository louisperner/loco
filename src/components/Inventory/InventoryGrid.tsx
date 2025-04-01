import React from 'react';
import InventoryItem from './InventoryItem';
import { useGameStore } from '../../store/useGameStore';

// Define item interface based on what's used in the component
interface InventoryItem {
  id: string;
  fileName: string;
  type: 'model' | 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  [key: string]: unknown;
}

interface InventoryGridProps {
  items: {
    id: string;
    fileName: string;
    type: 'model' | 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    width?: number;
    height?: number;
    aspectRatio?: number;
    [key: string]: unknown;
  }[];
  loading: boolean;
  error: string | null;
  selectedItem: any;
  hotbarItems: (InventoryItem | null)[];
  isAddingToHotbar: boolean;
  selectedHotbarSlot: number | null;
  handleItemSelect: (item: InventoryItem) => void;
  handleAddToHotbar: (item: InventoryItem) => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, item: InventoryItem) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  handleConfirmSelection: () => void;
  handleRemoveItem: (itemId: string, e: React.MouseEvent) => void;
  reloadInventory?: () => void;
  showHotbarButton?: boolean;
  onAddToHotbar?: (item: InventoryItem) => void;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  loading,
  error,
  selectedItem,
  hotbarItems,
  isAddingToHotbar,
  selectedHotbarSlot,
  handleItemSelect,
  handleAddToHotbar,
  handleDragStart,
  handleDragEnd,
  handleConfirmSelection,
  handleRemoveItem,
}) => {
  const setCanvasInteractive = useGameStore((state) => state.setCanvasInteractive);

  if (loading) {
    return (
      <div className='flex justify-center items-center flex-col h-full text-white/60 text-center p-5'>
        <p>Loading items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center flex-col h-full text-red-400 text-center p-5'>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className='flex justify-center items-center flex-col h-full text-white/60 text-center p-5 bg-[#2c2c2c]'>
        <p>No items found. Drag and drop images or 3D models to add them to your inventory.</p>
      </div>
    );
  }

  // Group items into rows of 12 (Wider Minecraft-style grid)
  const groupedItems = [];
  for (let i = 0; i < items.length; i += 12) {
    groupedItems.push(items.slice(i, i + 12));
  }

  return (
    <>
      <div className='bg-[#2C2C2C] flex-1 flex flex-col p-2 overflow-y-auto 
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm 
        [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]'
      >
        {/* Container for items grid */}
        <div className='flex-1 mt-1 flex flex-col items-center'>
          {/* Render rows of items */}
          {groupedItems.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className='flex mb-1 justify-center'>
              {row.map((item) => {
                const isInHotbar = hotbarItems.some((hotbarItem) => hotbarItem && hotbarItem.id === item.id);
                
                return (
                  <div key={item.id} className='mx-0.5'>
                    <InventoryItem
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      isInHotbar={isInHotbar}
                      isAddingToHotbar={isAddingToHotbar}
                      selectedHotbarSlot={selectedHotbarSlot}
                      handleItemSelect={handleItemSelect}
                      handleAddToHotbar={handleAddToHotbar}
                      handleDragStart={handleDragStart}
                      handleDragEnd={handleDragEnd}
                      handleRemoveItem={handleRemoveItem}
                    />
                  </div>
                );
              })}
              
              {/* Fill empty slots in the last row to maintain grid alignment */}
              {rowIndex === groupedItems.length - 1 && row.length < 12 && 
                Array(12 - row.length).fill(null).map((_, idx) => (
                  <div 
                    key={`empty-${idx}`} 
                    className='w-[56px] h-[56px] mx-0.5 bg-[#222222] border-2 border-[#151515] rounded-md'
                  />
                ))
              }
            </div>
          ))}
          
          {/* Add extra empty rows to ensure minimum height when there are few items */}
          {groupedItems.length < 5 &&
            Array(5 - groupedItems.length).fill(null).map((_, rowIdx) => (
              <div key={`empty-row-${rowIdx}`} className='flex mb-1 justify-center'>
                {Array(12).fill(null).map((_, idx) => (
                  <div 
                    key={`empty-slot-${rowIdx}-${idx}`} 
                    className='w-[56px] h-[56px] mx-0.5 bg-[#222222] border-2 border-[#151515] rounded-md'
                  />
                ))}
              </div>
            ))
          }
        </div>
      </div>

      {selectedItem && (
        <div className='flex justify-center p-3 bg-[#222222]'>
          <button
            className='w-full bg-[#555555] text-white/90 rounded-none px-6 py-2 text-sm font-medium transition-all duration-200 hover:bg-[#666666] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            disabled={!selectedItem}
            onClick={() => {
              handleConfirmSelection();
              setCanvasInteractive(true);
            }}
          >
            <span className="text-lg">➕</span>
            <span>Add to Canvas</span>
          </button>
        </div>
      )}
    </>
  );
};

export default InventoryGrid;
