import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
// @ts-ignore
import TopNavBar from '../ui/TopNavBar';
import MobileHotbarMenu from './MobileHotbarMenu';
import { useImageStore } from '@/store/useImageStore';
import * as THREE from 'three';

// Define the item interface based on what's used in the component
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

const HotbarTopNav: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImage = useImageStore(state => state.addImage);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);

      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const scale = aspectRatio > 1
          ? ([aspectRatio, 1, 1] as [number, number, number])
          : ([1, 1 / aspectRatio, 1] as [number, number, number]);

        // Get camera position if available
        let position: [number, number, number] = [0, 1, 0];
        if (window.mainCamera) {
          const camera = window.mainCamera;
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          const pos = new THREE.Vector3();
          pos.copy(camera.position);
          direction.multiplyScalar(3); // Place 3 units in front of camera
          pos.add(direction);
          position = [pos.x, pos.y, pos.z];
        }

        // Add image to the store
        addImage({
          src: objectUrl,
          fileName: file.name,
          width: img.width,
          height: img.height,
          position,
          rotation: [0, 0, 0],
          scale,
          isInScene: true
        });
      };

      img.onerror = () => {
        // Add image without dimensions if loading fails
        addImage({
          src: objectUrl,
          fileName: file.name,
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: 1,
          isInScene: true
        });
      };

      img.src = objectUrl;
    }
  };

  const handleButtonClick = (id: string) => {
    if (id === 'img') {
      fileInputRef.current?.click();
    }
    // Handle other button clicks here
  };

  const navItems = [
    {
      id: 'www',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM16.36 6H13.36C13.08 4.84 12.68 3.72 12.16 2.68C14.16 3.24 15.84 4.44 16.36 6ZM10 2.04C10.76 3.2 11.32 4.48 11.68 5.96H8.32C8.68 4.48 9.24 3.2 10 2.04ZM2.12 12C2.04 11.36 2 10.68 2 10C2 9.32 2.04 8.64 2.12 8H5.52C5.44 8.64 5.4 9.32 5.4 10C5.4 10.68 5.44 11.36 5.52 12H2.12ZM3.64 14H6.64C6.92 15.16 7.32 16.28 7.84 17.32C5.84 16.76 4.16 15.56 3.64 14ZM6.64 6H3.64C4.16 4.44 5.84 3.24 7.84 2.68C7.32 3.72 6.92 4.84 6.64 6ZM10 17.96C9.24 16.8 8.68 15.52 8.32 14.04H11.68C11.32 15.52 10.76 16.8 10 17.96ZM12.08 12H7.92C7.84 11.36 7.8 10.68 7.8 10C7.8 9.32 7.84 8.64 7.92 8H12.08C12.16 8.64 12.2 9.32 12.2 10C12.2 10.68 12.16 11.36 12.08 12ZM12.16 17.32C12.68 16.28 13.08 15.16 13.36 14H16.36C15.84 15.56 14.16 16.76 12.16 17.32ZM14.48 12C14.56 11.36 14.6 10.68 14.6 10C14.6 9.32 14.56 8.64 14.48 8H17.88C17.96 8.64 18 9.32 18 10C18 10.68 17.96 11.36 17.88 12H14.48Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'txt',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 1H5C2.79086 1 1 2.79086 1 5V15C1 17.2091 2.79086 19 5 19H15C17.2091 19 19 17.2091 19 15V5C19 2.79086 17.2091 1 15 1Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 6H14M10 6V14M8 14H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: '3d',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1L1 6V14L10 19L19 14V6L10 1ZM10 3.82L15.54 7L10 10.18L4.46 7L10 3.82ZM3 8.27L9 11.64V16.73L3 13.36V8.27ZM11 16.73V11.64L17 8.27V13.36L11 16.73Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'img',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 1H3C1.89543 1 1 1.89543 1 3V17C1 18.1046 1.89543 19 3 19H17C18.1046 19 19 18.1046 19 17V3C19 1.89543 18.1046 1 17 1Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M1 13L6 8L10 12L13 9L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'video',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5C1 3.89543 1.89543 3 3 3H13C14.1046 3 15 3.89543 15 5V15C15 16.1046 14.1046 17 13 17H3C1.89543 17 1 16.1046 1 15V5Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M15 8.5L19 5V15L15 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'code',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4L2 9.5L7 15M13 4L18 9.5L13 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'cube',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1L2 5V15L10 19L18 15V5L10 1ZM10 3.82L15.54 7L10 10.18L4.46 7L10 3.82ZM3 8.27L9 11.64V16.73L3 13.36V8.27ZM11 16.73V11.64L17 8.27V13.36L11 16.73Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'sphere',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 1C10 1 5 5.5 5 10C5 14.5 10 19 10 19" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 1C10 1 15 5.5 15 10C15 14.5 10 19 10 19" stroke="currentColor" strokeWidth="2"/>
          <path d="M1 10H19" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'plane',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2H18V18H2V2Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 10H18M10 2V18" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  return (
    <div className="flex gap-1 bg-[#2c2c2c]/90 rounded-lg p-1 shadow-lg pointer-events-auto border border-[#151515] backdrop-blur-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        multiple={false}
      />
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleButtonClick(item.id)}
          className="w-[35px] h-[35px] flex items-center justify-center text-white/90 hover:bg-[#3C3C3C] rounded transition-colors"
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
};

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
      <div className='hidden landscape:flex md:flex fixed bottom-5 left-1/2 -translate-x-1/2 flex-col items-center z-50 pointer-events-none'>
        <HotbarTopNav />
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
      <div className='landscape:hidden md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none'>
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
            <div className='w-8 h-8 text-white/40'>
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
