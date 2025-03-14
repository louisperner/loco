import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface HotbarItem {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface MinecraftHotbarProps {
  items: HotbarItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  enableKeyboardShortcuts?: boolean;
  containerRef?: React.RefObject<HTMLElement>; // Reference to the container element (canvas/game container)
  position?: 'fixed' | 'absolute'; // Position strategy
}

export function MinecraftHotbar({
  items = [],
  selectedIndex = 0,
  onSelect,
  className,
  enableKeyboardShortcuts = true,
  containerRef,
  position = 'fixed',
}: MinecraftHotbarProps) {
  // Ensure we have exactly 9 slots (like Minecraft)
  const filledItems = [...items];
  while (filledItems.length < 9) {
    filledItems.push({ id: `empty-${filledItems.length}`, name: '', icon: '', count: 0 });
  }

  // Handle keyboard shortcuts (1-9 keys)
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the key pressed is a number between 1-9
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        onSelect(num - 1); // Convert to 0-based index
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSelect, enableKeyboardShortcuts]);

  // Determine positioning class based on the position prop
  const positionClass = position === 'fixed' 
    ? 'fixed bottom-4 left-1/2 transform -translate-x-1/2' 
    : 'absolute bottom-4 left-1/2 transform -translate-x-1/2';

  return (
    <div className={cn(positionClass, 'z-[9999]', className)}>
      <div className="flex items-center justify-center">
        {/* Main hotbar container */}
        <div className="bg-[#2D2D2D] bg-opacity-80 border-2 border-[#373737] rounded-md p-1 flex">
          {filledItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'w-16 h-16 m-0.5 flex items-center justify-center relative cursor-pointer',
                'border-2',
                index === selectedIndex
                  ? 'border-white bg-[#5C5C5C] bg-opacity-70'
                  : 'border-[#373737] bg-[#3D3D3D] bg-opacity-70'
              )}
              onClick={() => onSelect(index)}
            >
              {/* Item icon */}
              {item.icon && (
                <div className="w-12 h-12 flex items-center justify-center">
                  <img src={item.icon} alt={item.name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              
              {/* Item count */}
              {item.count && item.count > 1 && (
                <div className="absolute bottom-0.5 right-1 text-white text-sm font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {item.count}
                </div>
              )}
              
              {/* Slot number indicator */}
              <div className="absolute top-0 left-1 text-gray-300 text-xs opacity-70">
                {index + 1}
              </div>
              
              {/* Selection indicator (white border when selected) */}
              {index === selectedIndex && (
                <div className="absolute inset-0 border-2 border-white opacity-70 pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected item indicator (the white selector that appears above the selected slot) */}
      <div 
        className="absolute bottom-[72px] h-1 w-16 bg-white"
        style={{ 
          left: `calc(50% - 72px + ${selectedIndex * 68}px)`,
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
} 