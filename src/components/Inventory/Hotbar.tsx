import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import MobileHotbarMenu from './MobileHotbarMenu';

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
  handleRemoveFromHotbar,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to get the currently selected item
  const getSelectedItem = () => {
    if (selectedHotbarSlot === null) return null;
    return hotbarItems[selectedHotbarSlot];
  };

  return (
    <>
      {/* Complete Hotbar (Landscape and Desktop) */}
      <div className='hidden landscape:flex md:flex fixed bottom-5 left-1/2 -translate-x-1/2 flex-col items-center z-50 pointer-events-none select-none'>
      
        <div className='mt-2 flex gap-1 bg-[#2c2c2c]/90 rounded-lg p-1 shadow-lg pointer-events-auto border border-[#151515] backdrop-blur-sm'>
          {hotbarItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'w-[42px] h-[42px] md:w-[56px] md:h-[56px] bg-[#1A1A1A] rounded-md border-[#151515] border-2 flex justify-center items-center relative cursor-pointer transition-all duration-200 overflow-hidden group',
                !item && 'bg-[#1A1A1A]/60 hover:bg-[#242424]/60',
                selectedHotbarSlot === index && 'ring-2 ring-[#4B6BFB] shadow-[0_0_10px_rgba(75,107,251,0.3)]',
                dragOverSlot === index && 'bg-[#4B6BFB]/30 ring-2 ring-[#4B6BFB]',
                'hover:bg-[#242424] hover:scale-105 active:scale-95',
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
                      className='w-4/5 h-4/5 object-contain transition-transform duration-200 group-hover:scale-110'
                    />
                  ) : (
                    <div className='w-4/5 h-4/5 flex justify-center items-center relative'>
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.fileName}
                          title={item.fileName}
                          className='w-full h-full object-contain transition-transform duration-200 group-hover:scale-110'
                        />
                      ) : (
                        <div className='w-8 h-8 text-white/40 transition-transform duration-200 group-hover:scale-110'>
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
                  <div className='absolute top-0.5 left-1 text-sm text-white/90 font-medium bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm'>
                    {index + 1}
                  </div>
                  <button
                    className='absolute top-0 right-0 w-6 h-6 bg-[#C75D5D] text-white/90 rounded-tr-md rounded-bl-md text-sm flex justify-center items-center cursor-pointer opacity-0 hover:bg-[#D46464] transition-all duration-200 group-hover:opacity-100 hover:scale-110 active:scale-95'
                    onClick={(e) => handleRemoveFromHotbar(index, e)}
                    title='Remove from hotbar'
                  >
                    ❌
                  </button>
                </>
              ) : (
                <div className='absolute top-0.5 left-1 text-sm text-white/90 font-medium bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm'>
                  {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Single Icon Hotbar (Portrait Mobile Only) */}
      <div className='landscape:hidden md:hidden fixed bottom-[50px] left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none'>
        <div
          className='w-[60px] h-[60px] bg-[#0F0F0F]/90 rounded-lg shadow-lg pointer-events-auto border border-white/10 flex justify-center items-center cursor-pointer transition-all duration-200 hover:bg-[#1A1A1A] hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm'
          onClick={() => setIsMobileMenuOpen(true)}
        >
          {getSelectedItem() ? (
            <>
              {getSelectedItem()?.type === 'image' ? (
                <img
                  src={getSelectedItem()?.thumbnailUrl || getSelectedItem()?.url}
                  alt={getSelectedItem()?.fileName}
                  title={getSelectedItem()?.fileName}
                  className='w-4/5 h-4/5 object-contain'
                />
              ) : (
                <div className='w-4/5 h-4/5 flex justify-center items-center relative'>
                  {getSelectedItem()?.thumbnailUrl ? (
                    <img
                      src={getSelectedItem()?.thumbnailUrl}
                      alt={getSelectedItem()?.fileName}
                      title={getSelectedItem()?.fileName}
                      className='w-full h-full object-contain'
                    />
                  ) : (
                    <div className='w-8 h-8 text-white/40'>
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
              <div className='absolute top-0.5 left-1 text-sm text-white/90 font-medium bg-black/30 px-1.5 py-0.5 rounded'>
                {selectedHotbarSlot !== null && selectedHotbarSlot + 1}
              </div>
            </>
          ) : (
            <div className='w-8 h-8 text-white/40 select-none'>
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-full h-full'>
                <path d='M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu (Portrait Only) */}
      <MobileHotbarMenu
        hotbarItems={hotbarItems}
        selectedHotbarSlot={selectedHotbarSlot}
        handleHotbarSlotClick={handleHotbarSlotClick}
        handleRemoveFromHotbar={handleRemoveFromHotbar}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Hotbar;
