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
  handleRemoveItem,
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
        'group relative bg-[#1A1A1A] rounded-md flex flex-col justify-between aspect-square cursor-pointer transition-all duration-200 overflow-hidden min-h-[120px]',
        isSelected && 'ring-2 ring-[#4B6BFB]',
        'hover:bg-[#242424]',
        'active:scale-98',
      )}
      onClick={() => handleItemSelect(item)}
      draggable={!isInHotbar}
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
    >
      {/* Preview */}
      <div className='flex-1 flex items-center justify-center relative p-2'>
        {item.type === 'image' ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.fileName}
            title={item.fileName}
            className='w-[80%] h-[80%] object-contain'
          />
        ) : (
          <div className='w-[80%] h-[80%] flex justify-center items-center relative'>
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.fileName}
                title={item.fileName}
                className='w-full h-full object-contain'
              />
            ) : (
              <div className='w-6 h-6 text-white/40'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='w-full h-full'
                >
                  <path d='M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filename */}
      <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5'>
        <p className='text-[10px] font-medium text-white/90 truncate' title={item.fileName}>
          {item.fileName}
        </p>
      </div>

      {/* Action buttons */}
      <div className='absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
        {/* Add to hotbar button */}
        {!isInHotbar && (
          <button
            className='w-5 h-5 bg-[#4B6BFB] text-white/90 rounded-md text-xs flex justify-center items-center hover:bg-[#5472FB] transition-colors duration-200'
            onClick={(e) => {
              e.stopPropagation();
              handleAddToHotbar(item);
            }}
            title='Add to hotbar'
          >
            +
          </button>
        )}

        {/* Remove button */}
        <button
          className='w-5 h-5 bg-[#C75D5D] text-white/90 rounded-md text-xs flex justify-center items-center hover:bg-[#D46464] transition-colors duration-200'
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveItem(item.id, e);
          }}
          title='Remove item'
        >
          ×
        </button>
      </div>

      {/* "Add to Hotbar" indicator */}
      {isAddingToHotbar && isSelected && selectedHotbarSlot !== null && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/90 text-white/90 text-xs p-1'>
          Add to slot {selectedHotbarSlot + 1}
        </div>
      )}
    </div>
  );
};

export default InventoryItem;
