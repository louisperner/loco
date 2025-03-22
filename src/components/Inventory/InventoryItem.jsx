import React from 'react';
import { cn } from '@/lib/utils';

const InventoryItem = ({
  item,
  isSelected,
  isInHotbar,
  isAddingToHotbar,
  selectedHotbarSlot,
  handleItemSelect,
  handleAddToHotbar,
  handleDragStart,
  handleDragEnd
}) => {
  return (
    <div 
      className={cn(
        "relative bg-black/50 rounded-lg p-2.5 flex flex-col items-center cursor-pointer transition-all duration-200 border-2 overflow-hidden h-40",
        isSelected && "border-blue-500 shadow-lg shadow-blue-500/30",
        isInHotbar && "border-yellow-500/50",
        "hover:bg-black/70 hover:-translate-y-0.5"
      )}
      onClick={(e) => handleItemSelect(item)}
      onDoubleClick={() => {
        handleAddToCanvas(item);
        onClose();
      }}
      draggable="true"
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
    >
      {item.type === 'image' ? (
        <img 
          src={item.thumbnailUrl || item.url} 
          alt={item.fileName} 
          title={item.fileName}
          className="w-full h-[90px] object-cover block"
        />
      ) : (
        <div className="w-full h-[90px] bg-black flex flex-col justify-center items-center text-blue-500">
          {item.thumbnailUrl ? (
            <img 
              src={item.thumbnailUrl} 
              alt={item.fileName} 
              title={item.fileName}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <>
              <div className="w-10 h-10 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full animate-spin-slow">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.42-7 9.88-3.87-1.45-7-5.2-7-9.88V6.3l7-3.12z"/>
                  <path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="text-xs text-white/60">3D Model</div>
            </>
          )}
        </div>
      )}
      <div className="text-sm text-center mt-2 text-white/90 w-full truncate">{item.fileName}</div>
      <div className="text-xs text-white/60 text-center w-full truncate">{item.category}</div>
      {isInHotbar && (
        <div className="absolute top-2 right-2 bg-yellow-500/80 text-black text-xs px-1.5 py-0.5 rounded font-bold z-10">
          In Hotbar
        </div>
      )}
      {isAddingToHotbar ? (
        <div className="absolute top-1 right-1">
          <button 
            className={cn(
              "w-5 h-5 text-white text-base leading-none cursor-pointer transition-colors duration-200 rounded",
              isInHotbar 
                ? "bg-white/50 cursor-not-allowed text-white/50" 
                : "bg-blue-500/70 hover:bg-blue-500"
            )}
            onClick={(e) => !isInHotbar && handleAddToHotbar(item, e)}
            title={isInHotbar ? 'Already in hotbar' : `Add to hotbar slot ${selectedHotbarSlot !== null ? selectedHotbarSlot + 1 : ''}`}
            disabled={isInHotbar}
          >
            {isInHotbar ? '✓' : '+'}
          </button>
        </div>
      ) : (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            className={cn(
              "w-5 h-5 text-white text-base leading-none cursor-pointer transition-colors duration-200 rounded",
              isInHotbar 
                ? "bg-white/50 cursor-not-allowed text-white/50" 
                : "bg-blue-500/70 hover:bg-blue-500"
            )}
            onClick={(e) => !isInHotbar && handleAddToHotbar(item, e)}
            title={isInHotbar ? 'Already in hotbar' : 'Add to hotbar'}
            disabled={isInHotbar}
          >
            {isInHotbar ? '✓' : '+'}
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryItem; 