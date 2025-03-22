import React from 'react';
import { Button } from '@/components/ui/button';
import InventoryItem from './InventoryItem';

const InventoryGrid = ({
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
  handleConfirmSelection
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
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 p-5 overflow-y-auto flex-1">
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