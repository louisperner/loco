import React from 'react';
import { cn } from '@/lib/utils';
// @ts-ignore
import TopNavBar from '../ui/TopNavBar';

// Define the item interface based on what's used in the component
interface HotbarItem {
  id: string;
  type: 'model' | 'image';
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  [key: string]: any; // For any additional properties
}

interface HotbarProps {
  hotbarItems: (HotbarItem | null)[];
  selectedHotbarSlot: number | null;
  dragOverSlot: number | null;
  handleHotbarSlotClick: (index: number, e: React.MouseEvent) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, item: HotbarItem) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  handleRemoveFromHotbar: (index: number, e: React.MouseEvent) => void;
}

const Hotbar: React.FC<HotbarProps> = ({
  hotbarItems,
  selectedHotbarSlot,
  dragOverSlot,
  handleHotbarSlotClick,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragStart,
  handleDragEnd,
  handleRemoveFromHotbar
}) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-none">
      {/* <TopNavBar /> */}
      <div className="flex gap-1 bg-black/80 rounded-lg p-1.5 shadow-lg pointer-events-auto border border-white/10">
        {hotbarItems.map((item, index) => (
          <div 
            key={index}
            className={cn(
              "w-[60px] h-[60px] bg-black/60 border-2 border-white/20 rounded-md flex justify-center items-center relative cursor-pointer transition-all duration-200 overflow-hidden",
              !item && "bg-black/40",
              selectedHotbarSlot === index && "border-blue-500 shadow-lg shadow-blue-500/30",
              dragOverSlot === index && "bg-blue-500/30 shadow-inner shadow-blue-500/50",
              "hover:bg-black/80 hover:-translate-y-0.5"
            )}
            onClick={(e) => handleHotbarSlotClick(index, e)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={(e) => handleDragLeave(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            draggable={!!item}
            onDragStart={(e) => item && handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
          >
            {item ? (
              <>
                {item.type === 'image' ? (
                  <img 
                    src={item.thumbnailUrl || item.url} 
                    alt={item.fileName} 
                    title={item.fileName}
                    className="w-4/5 h-4/5 object-contain"
                  />
                ) : (
                  <div className="w-4/5 h-4/5 flex justify-center items-center relative">
                    {item.thumbnailUrl ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.fileName} 
                        title={item.fileName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full animate-spin-slow">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.42-7 9.88-3.87-1.45-7-5.2-7-9.88V6.3l7-3.12z"/>
                          <path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute top-0.5 left-1 text-sm text-white/90 font-bold bg-black/30 px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
                <button 
                  className="absolute top-0 right-0 w-[18px] h-[18px] bg-red-500/70 text-white rounded-tr-md rounded-bl-md text-sm flex justify-center items-center cursor-pointer opacity-0 hover:bg-red-500/90 transition-opacity duration-200 p-0 group-hover:opacity-100"
                  onClick={(e) => handleRemoveFromHotbar(index, e)}
                  title="Remove from hotbar"
                >
                  ×
                </button>
              </>
            ) : (
              <div className="absolute top-0.5 left-1 text-sm text-white/90 font-bold bg-black/30 px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hotbar; 