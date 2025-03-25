import React from 'react';
import { cn } from '@/lib/utils';

interface InventoryItemProps {
  item: {
    id: string;
    fileName: string;
    type: 'model' | 'image';
    url: string;
    thumbnailUrl?: string;
    [key: string]: any; // For any additional properties
  };
  isSelected: boolean;
  isInHotbar: boolean;
  isAddingToHotbar: boolean;
  selectedHotbarSlot: number | null;
  handleItemSelect: (item: InventoryItemProps['item']) => void;
  handleAddToHotbar: (item: InventoryItemProps['item']) => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, item: InventoryItemProps['item']) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  handleRemoveItem: (itemId: string, e: React.MouseEvent) => void;
}

const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  isSelected,
  isInHotbar,
  isAddingToHotbar,
  selectedHotbarSlot,
  handleItemSelect,
  handleAddToHotbar,
  handleDragStart,
  handleDragEnd,
  handleRemoveItem
}) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 rounded-md p-2 transition-all duration-200 cursor-pointer h-[120px]",
        isSelected && "border-blue-500 bg-blue-900/20"
      )}
      onClick={() => handleItemSelect(item)}
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
    >
      {/* Thumbnail */}
      <div className="w-full h-[70px] flex items-center justify-center">
        {item.type === 'image' ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.fileName}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-10 h-10 mb-1">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.fileName}
                className="w-full h-full object-contain"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-full h-full animate-spin-slow"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.42-7 9.88-3.87-1.45-7-5.2-7-9.88V6.3l7-3.12z" />
                <path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Item name */}
      <div className="text-white/90 text-xs mt-1 text-center truncate w-full">
        {item.fileName.length > 18
          ? `${item.fileName.substring(0, 15)}...`
          : item.fileName}
      </div>

      {/* Action buttons */}
      <div className="absolute top-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Add to hotbar button */}
        {!isInHotbar && (
          <button
            className="w-[18px] h-[18px] bg-blue-500/70 text-white rounded-bl-md text-xs flex justify-center items-center hover:bg-blue-500/90 transition-colors duration-200 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToHotbar(item);
            }}
            title="Add to hotbar"
          >
            +
          </button>
        )}

        {/* Remove button */}
        <button
          className="w-[18px] h-[18px] bg-red-500/70 text-white rounded-bl-md text-xs flex justify-center items-center hover:bg-red-500/90 transition-colors duration-200 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveItem(item.id, e);
          }}
          title="Remove item"
        >
          ×
        </button>
      </div>

      {/* "Add to Hotbar" indicator */}
      {isAddingToHotbar && isSelected && selectedHotbarSlot !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm">
          Add to slot {selectedHotbarSlot + 1}
        </div>
      )}
    </div>
  );
};

export default InventoryItem; 