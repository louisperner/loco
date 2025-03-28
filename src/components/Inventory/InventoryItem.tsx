import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { generateVideoThumbnail } from '../Models/utils';

interface InventoryItemProps {
  item: {
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
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  
  // Generate thumbnail for videos if needed
  useEffect(() => {
    if (item.type === 'video' && !item.thumbnailUrl && item.url) {
      const loadThumbnail = async () => {
        try {
          const thumbnail = await generateVideoThumbnail(item.url);
          setVideoThumbnail(thumbnail);
        } catch (error) {
          console.error('Failed to generate video thumbnail:', error);
          // Keep videoThumbnail as null, will use icon instead
        }
      };
      
      loadThumbnail();
    }
  }, [item.type, item.thumbnailUrl, item.url]);
  
  // Determine the icon to show based on item type
  const getItemIcon = () => {
    if (item.type === 'model') {
      return '📦'; // Cube emoji for 3D models
    } else if (item.type === 'image') {
      return '🖼️'; // Picture emoji for images
    } else if (item.type === 'video') {
      return '🎬'; // Clapper board emoji for videos
    }
    return '📄'; // Default document emoji
  };

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
        ) : item.type === 'video' && (item.thumbnailUrl || videoThumbnail) ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={item.thumbnailUrl || videoThumbnail!}
              alt={item.fileName}
              className="max-w-full max-h-full object-contain rounded"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200 rounded">
              <div className="bg-black/60 rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-white">▶</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mb-1 flex items-center justify-center">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.fileName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-2xl">
                {getItemIcon()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex flex-col justify-between h-full w-full p-2">
        <div className="flex items-center">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate" title={item.fileName}>
            {item.fileName}
          </p>
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
    </div>
  );
};

export default InventoryItem; 