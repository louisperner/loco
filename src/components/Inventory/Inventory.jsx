import React, { useRef, useEffect } from 'react';
import { useInventory } from '../../hooks/useInventory';
import Hotbar from './Hotbar';
import InventoryGrid from './InventoryGrid';
import InventoryHeader from './InventoryHeader';
import { showAddedToCanvasIndicator } from '../../utils/inventoryUtils';

const Inventory = ({ onSelectImage, onSelectModel, onClose, isOpen, onRemoveObject }, ref) => {
  const searchInputRef = useRef(null);
  
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
  } = useInventory(onSelectImage, onSelectModel, onClose, isOpen, onRemoveObject);

  // Focus search input when inventory is opened
  useEffect(() => {
    if (showFullInventory && searchInputRef.current) {
      setTimeout(() => {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }, 100);
    }
  }, [showFullInventory]);

  // Expose the loadItemsFromDisk function to parent components
  React.useImperativeHandle(ref, () => ({
    reloadInventory: loadItemsFromDisk
  }));

  return (
    <>
      {showFullInventory && (
        <div className="fixed inset-0 z-40" onClick={onClose}></div>
      )}
      
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
              handleAddToHotbar={handleAddToHotbar}
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

export default React.forwardRef(Inventory); 