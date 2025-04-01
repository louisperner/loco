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
      {isOpen && <div className='fixed inset-0 bg-black/50 z-40' onClick={onClose} />}

      {/* Menu */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 rounded-t-xl p-4 z-50 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className='flex justify-center items-center mb-4'>
          <div className='w-12 h-1 bg-white/20 rounded-full' />
        </div>

        <div className='grid grid-cols-3 gap-2'>
          {hotbarItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'w-full aspect-square bg-black/60 border-2 border-white/20 rounded-md flex justify-center items-center relative cursor-pointer transition-all duration-200 overflow-hidden',
                !item && 'bg-black/40',
                selectedHotbarSlot === index && 'border-blue-500 shadow-lg shadow-blue-500/30',
                'hover:bg-black/80 hover:-translate-y-0.5',
              )}
              onClick={(e) => handleHotbarSlotClick(index, e)}
            >
              {item ? (
                <>
                  {item.type === 'image' ? (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.fileName}
                      title={item.fileName}
                      className='w-4/5 h-4/5 object-contain'
                    />
                  ) : (
                    <div className='w-4/5 h-4/5 flex justify-center items-center relative'>
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.fileName}
                          title={item.fileName}
                          className='w-full h-full object-contain'
                        />
                      ) : (
                        <div className='w-10 h-10 mb-1'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            fill='currentColor'
                            className='w-full h-full animate-spin-slow'
                          >
                            <path d='M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  <div className='absolute top-0.5 left-1 text-xs text-white/90 font-bold bg-black/30 px-1.5 py-0.5 rounded'>
                    {index + 1}
                  </div>
                  <button
                    className='absolute top-0 right-0 w-[18px] h-[18px] bg-red-500/70 text-white rounded-tr-md rounded-bl-md text-xs flex justify-center items-center cursor-pointer opacity-0 hover:bg-red-500/90 transition-opacity duration-200 p-0 group-hover:opacity-100'
                    onClick={(e) => handleRemoveFromHotbar(index, e)}
                    title='Remove from hotbar'
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className='absolute top-0.5 left-1 text-xs text-white/90 font-bold bg-black/30 px-1.5 py-0.5 rounded'>
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
