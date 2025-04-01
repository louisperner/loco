import React, { useState, useEffect, useRef } from 'react';
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

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

  const updatePreviewPosition = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const previewWidth = 200; // Width of preview container
      const previewHeight = 250; // Height of preview container including title
      const spacing = 10; // Space between item and preview

      // Calculate initial position above the item
      let top = rect.top - previewHeight - spacing;
      let left = rect.left + (rect.width - previewWidth) / 2;

      // Adjust if preview would go off screen
      if (top < 0) {
        // If not enough space above, show below
        top = rect.bottom + spacing;
      }
      if (left < 0) {
        left = 0;
      } else if (left + previewWidth > window.innerWidth) {
        left = window.innerWidth - previewWidth;
      }

      setPreviewPosition({ top, left });
    }
  };

  const handleMouseEnter = () => {
    updatePreviewPosition();
    setShowPreview(true);
  };

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
      ref={itemRef}
      className={cn(
        'w-[56px] h-[56px] relative cursor-pointer border-2 transition-all duration-100 rounded-md group',
        isSelected 
          ? 'ring-blue bg-[#555555]' 
          : 'border-[#151515] bg-[#222222] hover:bg-[#333333]',
        isInHotbar,
      )}
      onClick={() => handleItemSelect(item)}
      draggable={!isInHotbar}
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowPreview(false)}
    >
      {/* Item Preview */}
      <div className='absolute inset-2 flex items-center justify-center'>
        {item.type === 'image' ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.fileName}
            title={item.fileName}
            className='max-w-full max-h-full object-contain'
          />
        ) : item.type === 'video' && videoThumbnail ? (
          <img
            src={videoThumbnail}
            alt={item.fileName}
            title={item.fileName}
            className='max-w-full max-h-full object-contain'
          />
        ) : item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.fileName}
            title={item.fileName}
            className='max-w-full max-h-full object-contain'
          />
        ) : (
          <span className='text-xl'>{getItemIcon()}</span>
        )}
      </div>

      {/* Hover Preview */}
      {showPreview && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${previewPosition.top}px`,
            left: `${previewPosition.left}px`,
          }}
        >
          <div className="bg-[#222222] border-2 border-[#151515] rounded-md p-2 shadow-xl">
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              {item.type === 'image' ? (
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : item.type === 'video' && (videoThumbnail || item.thumbnailUrl) ? (
                <img
                  src={videoThumbnail || item.thumbnailUrl}
                  alt={item.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : item.type === 'model' && item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-8xl">
                  {getItemIcon()}
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-white/90 text-sm truncate max-w-[180px]" title={item.fileName}>
                {item.fileName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons - show on hover */}
      <div className='absolute top-0 right-0 flex justify-center gap-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100'>
        {/* Add to hotbar button */}
        {!isInHotbar && (
          <button
            className='w-6 h-6 bg-[#fff] text-white border border-[#151515] text-[12px] flex justify-center items-center rounded-md'
            onClick={(e) => {
              e.stopPropagation();
              handleAddToHotbar(item);
            }}
            title='Add to hotbar'
          >
            ➕
          </button>
        )}

        {/* Remove button */}
        <button
          className='w-6 h-6 bg-[#fff] text-white border border-[#151515] text-[10px] flex justify-center items-center rounded-md'
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveItem(item.id, e);
          }}
          title='Remove item'
        >
          ❌
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
