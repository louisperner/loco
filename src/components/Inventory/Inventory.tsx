import React, { useRef, useEffect, forwardRef, ForwardRefRenderFunction, MouseEvent, useMemo } from 'react';
import { useInventory, InventoryItem } from '../../hooks/useInventory';
import Hotbar from './Hotbar';
import InventoryGrid from './InventoryGrid';
import InventoryHeader from './InventoryHeader';

interface InventoryProps {
  onSelectImage: (imageData: InventoryItem) => void;
  onSelectModel: (modelData: InventoryItem) => void;
  onClose: () => void;
  isOpen: boolean;
  onRemoveObject?: (id?: string) => void;
}

interface InventoryRefHandle {
  reloadInventory: () => void;
}

const Inventory: ForwardRefRenderFunction<InventoryRefHandle, InventoryProps> = (
  { onSelectImage, onSelectModel, onClose, isOpen, onRemoveObject },
  ref
) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);
  
  const inventoryHook = useInventory(onSelectImage, onSelectModel, onClose, isOpen, onRemoveObject);
  
  const {
    items,
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
    dragOverSlot,
    handleItemSelect,
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
  } = inventoryHook;

  // Focus search input when inventory is opened, only if it wasn't open before
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && searchInputRef.current) {
      setTimeout(() => {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }, 100);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Expose the loadItemsFromDisk function to parent components
  React.useImperativeHandle(ref, () => ({
    reloadInventory: loadItemsFromDisk
  }));

  // Wrapper for handleAddToHotbar to make the MouseEvent optional
  const handleAddToHotbarWrapper = useMemo(() => {
    return (item: InventoryItem, e?: MouseEvent) => {
      if (e) {
        handleAddToHotbar(item, e as MouseEvent);
      } else {
        // Create a synthetic event if not provided
        const syntheticEvent = new MouseEvent('click') as unknown as MouseEvent;
        handleAddToHotbar(item, syntheticEvent);
      }
    };
  }, [handleAddToHotbar]);

  // Memoize the Hotbar component to prevent unnecessary re-renders
  const hotbarComponent = useMemo(() => (
    <Hotbar
      hotbarItems={hotbarItems}
      selectedHotbarSlot={selectedHotbarSlot}
      dragOverSlot={dragOverSlot}
      handleHotbarSlotClick={handleHotbarSlotClick}
      handleDragOver={handleDragOver}
      handleDragLeave={handleDragLeave}
      handleDrop={handleDrop}
      handleDragStart={handleDragStart}
      handleDragEnd={handleDragEnd}
      handleRemoveFromHotbar={handleRemoveFromHotbar}
    />
  ), [hotbarItems, selectedHotbarSlot, dragOverSlot, handleHotbarSlotClick, 
      handleDragOver, handleDragLeave, handleDrop, handleDragStart, 
      handleDragEnd, handleRemoveFromHotbar]);

  return (
    <>
      {showFullInventory && (
        <div className="fixed inset-0 z-40" onClick={onClose}></div>
      )}
      
      {hotbarComponent}
      
      {showFullInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="relative w-4/5 max-w-[900px] h-4/5 max-h-[700px] bg-black/95 rounded-xl shadow-2xl flex flex-col overflow-hidden text-white font-minecraft border border-white/10 pointer-events-auto">
            <InventoryHeader
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              categories={categories}
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              onClose={onClose}
              searchInputRef={searchInputRef}
            />
            
            <InventoryGrid
              items={items}
              loading={loading}
              error={error}
              selectedItem={selectedItem}
              hotbarItems={hotbarItems}
              isAddingToHotbar={isAddingToHotbar}
              selectedHotbarSlot={selectedHotbarSlot}
              handleItemSelect={handleItemSelect}
              handleAddToHotbar={handleAddToHotbarWrapper}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleConfirmSelection={handleConfirmSelection}
              handleRemoveItem={handleRemoveItem}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(forwardRef(Inventory)); 