import React, { useRef, useEffect, forwardRef, ForwardRefRenderFunction, useMemo } from 'react';
import { useInventory, InventoryItem } from '../../hooks/useInventory';
import Hotbar from './Hotbar';
import InventoryGrid from './InventoryGrid';
import InventoryHeader from './InventoryHeader';
import { useGameStore } from '../../store/useGameStore';
import HotbarTopNav from './HotbarTopNav';

interface InventoryProps {
  onSelectImage: (imageData: InventoryItem) => void;
  onSelectModel: (modelData: InventoryItem) => void;
  onSelectVideo?: (videoData: InventoryItem) => void;
  onClose: () => void;
  isOpen: boolean;
  onRemoveObject?: (id?: string) => void;
}

interface InventoryRefHandle {
  reloadInventory: () => void;
}

const Inventory: ForwardRefRenderFunction<InventoryRefHandle, InventoryProps> = (
  { onSelectImage, onSelectModel, onSelectVideo, onClose, isOpen, onRemoveObject },
  ref,
) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);
  const setCanvasInteractive = useGameStore((state) => state.setCanvasInteractive);

  const inventoryHook = useInventory(onSelectImage, onSelectModel, onSelectVideo, onClose, isOpen, onRemoveObject);

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
    addItemToHotbarDirect,
    handleRemoveFromHotbar,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    loadItemsFromDisk,
    handleRemoveItem,
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

  // Restore canvas interactivity when inventory is closed
  useEffect(() => {
    if (!isOpen && prevIsOpenRef.current) {
      setCanvasInteractive(true);
    }
  }, [isOpen, setCanvasInteractive]);

  // Expose the loadItemsFromDisk function to parent components
  React.useImperativeHandle(ref, () => ({
    reloadInventory: loadItemsFromDisk,
  }));

  // Direct method to add an item to the hotbar without requiring an event
  const addItemToHotbarDirectly = useMemo(() => {
    return (item: InventoryItem) => {
      // console.log('Direct method to add item to hotbar:', item);

      // Use the new direct method from the hook
      addItemToHotbarDirect(item);
    };
  }, [addItemToHotbarDirect]);

  // Memoize the Hotbar component to prevent unnecessary re-renders
  const hotbarComponent = useMemo(
    () => (
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
    ),
    [
      hotbarItems,
      selectedHotbarSlot,
      dragOverSlot,
      handleHotbarSlotClick,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragStart,
      handleDragEnd,
      handleRemoveFromHotbar,
    ],
  );

  return (
    <>
      {showFullInventory && (
        <div
          className='fixed inset-0 z-40 bg-black/30'
          onClick={(e) => {
            e.preventDefault();
            onClose();
            setCanvasInteractive(true);
          }}
        ></div>
      )}

      <HotbarTopNav />

      {hotbarComponent}

      {showFullInventory && (
        <div className='absolute inset-0 z-[9999] w-screen h-screen flex items-center justify-center pointer-events-none rounded-md'>
          <div className='relative w-screen h-screen lg:max-h-[500px] lg:max-w-[750px] rounded-md shadow-2xl flex flex-col overflow-hidden text-white font-minecraft pointer-events-auto shadow-black/50'>            
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
              handleAddToHotbar={addItemToHotbarDirectly}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleConfirmSelection={handleConfirmSelection}
              handleRemoveItem={handleRemoveItem}
              reloadInventory={loadItemsFromDisk}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(forwardRef(Inventory));
