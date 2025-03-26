import React from 'react';
import { Button } from '@/components/ui/button';
import InventoryItem from './InventoryItem';

// Define item interface based on what's used in the component
interface InventoryItem {
  id: string;
  fileName: string;
  type: 'model' | 'image';
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
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  selectedItem: InventoryItem | null;
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
  reloadInventory
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center flex-col h-full text-white/60 text-center p-5">
        <p>Loading items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center flex-col h-full text-red-400 text-center p-5">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center items-center flex-col h-full text-white/60 text-center p-5">
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 p-5 overflow-y-auto flex-1 
        [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full 
        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-black/30 relative">
        <button 
          onClick={() => reloadInventory?.()}
          className="absolute top-2 right-2 bg-blue-500/70 text-white text-xs rounded-md px-2 py-1 hover:bg-blue-500/90"
          title="Refresh inventory"
        >
          Refresh
        </button>
        {items.map((item) => {
          const isInHotbar = hotbarItems.some(hotbarItem => hotbarItem && hotbarItem.id === item.id);
          
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
        <div className="flex justify-center p-4 bg-black/80 border-t border-white/20">
          <Button 
            className="bg-blue-500/70 text-white rounded-md px-6 py-2.5 text-base cursor-pointer transition-all duration-200 hover:bg-blue-500/90 hover:-translate-y-0.5 disabled:bg-white/50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!selectedItem}
            onClick={handleConfirmSelection}
          >
            Add to Canvas
          </Button>
        </div>
      )}
    </>
  );
};

export default InventoryGrid; 