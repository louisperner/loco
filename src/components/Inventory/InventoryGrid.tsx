import React from 'react';
import { Button } from '@/components/ui/button';
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
  reloadInventory,
  showHotbarButton,
  onAddToHotbar,
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
      <div className='flex justify-center items-center flex-col h-full text-white/60 text-center p-5'>
        <p>No items found. Drag and drop images or 3D models to add them to your inventory.</p>
        {/* <button 
          onClick={() => reloadInventory?.()}
          className="mt-4 bg-blue-500/70 text-white rounded-md px-6 py-2.5 text-base cursor-pointer transition-all duration-200 hover:bg-blue-500/90"
        >
          Refresh Inventory
        </button> */}
      </div>
    );
  }

  return (
    <>
      <div
        className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-4 overflow-y-auto flex-1 
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full 
        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent relative'
      >
        <button
          onClick={() => reloadInventory?.()}
          className='absolute top-4 right-4 bg-[#4B6BFB] text-white/90 text-xs rounded-md px-3 py-1.5 hover:bg-[#5472FB] transition-colors duration-200'
          title='Refresh inventory'
        >
          Refresh
        </button>
        {items.map((item) => {
          const isInHotbar = hotbarItems.some((hotbarItem) => hotbarItem && hotbarItem.id === item.id);

          return (
            <InventoryItem
              key={item.id}
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
          );
        })}
      </div>

      {selectedItem && (
        <div className='flex justify-center p-2 bg-[#0F0F0F]/90'>
          <Button
            className='w-full bg-[#4B6BFB] text-white/90 rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 hover:bg-[#5472FB] disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={!selectedItem}
            onClick={() => {
              handleConfirmSelection();
              setCanvasInteractive(true);
            }}
          >
            Add to Canvas
          </Button>
        </div>
      )}
    </>
  );
};

export default InventoryGrid;
