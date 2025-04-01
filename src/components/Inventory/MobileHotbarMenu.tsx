import React from 'react';
import { cn } from '@/lib/utils';

interface MobileHotbarMenuProps {
  hotbarItems: (HotbarItem | null)[];
  selectedHotbarSlot: number | null;
  handleHotbarSlotClick: (index: number, e: React.MouseEvent) => void;
  handleRemoveFromHotbar: (index: number, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface HotbarItem {
  id: string;
  type: 'model' | 'image' | 'video';
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  [key: string]: unknown;
}

const MobileHotbarMenu: React.FC<MobileHotbarMenuProps> = ({
  hotbarItems,
  selectedHotbarSlot,
  handleHotbarSlotClick,
  handleRemoveFromHotbar,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className='fixed inset-0 bg-black/70 z-40' onClick={onClose} />}

      {/* Menu - Minecraft style */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-[#3F3F3F]/95 border-t-6 border-[#222222] z-50 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className='flex justify-center items-center py-3 bg-[#222222]'>
          <h2 className='text-white font-bold tracking-wide'>Hotbar</h2>
          <button 
            onClick={onClose}
            className='absolute right-4 w-8 h-8 bg-[#C75D5D] text-white hover:bg-[#D46464] flex items-center justify-center'
          >
            ×
          </button>
        </div>

        <div className='grid grid-cols-3 gap-1 p-3 bg-[#2C2C2C]'>
          {hotbarItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'w-full aspect-square bg-[#222222] border-2 border-[#151515] flex justify-center items-center relative cursor-pointer',
                selectedHotbarSlot === index && 'border-white bg-[#555555]',
                'hover:bg-[#333333]',
              )}
              onClick={(e) => handleHotbarSlotClick(index, e)}
            >
              {item ? (
                <>
                  <div className='absolute inset-2 flex items-center justify-center'>
                    {item.type === 'image' ? (
                      <img
                        src={item.thumbnailUrl || item.url}
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
                      <div className='text-white/40 text-xl'>
                        {item.type === 'model' ? '📦' : item.type === 'video' ? '🎬' : '📄'}
                      </div>
                    )}
                  </div>
                  
                  {/* Item count */}
                  <div className='absolute right-0.5 bottom-0 text-xs font-bold text-white'>
                    1
                  </div>
                  
                  {/* Slot number */}
                  <div className='absolute bottom-0 left-0 w-full text-center text-white/70 text-xs font-minecraft opacity-70'>
                    {index + 1}
                  </div>
                  
                  <button
                    className='absolute -top-6 right-0 w-6 h-6 bg-[#C75D5D] text-white/90 border border-[#151515] text-xs flex justify-center items-center hover:bg-[#D46464]'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromHotbar(index, e);
                    }}
                    title='Remove from hotbar'
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className='text-center text-white/70 text-xs font-minecraft opacity-70'>
                  {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileHotbarMenu;
