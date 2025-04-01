import React from 'react';
import { cn } from '@/lib/utils';

interface InventoryHeaderProps {
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: string[];
  activeTab: string;
  handleTabChange: (tab: string) => void;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  searchTerm,
  handleSearchChange,
  categories,
  activeTab,
  handleTabChange,
  onClose,
  searchInputRef,
}) => {
  return (
    <div className='flex flex-col gap-2 p-2 bg-[#0F0F0F]/90'>
      {/* Search and Close */}
      <div className='flex items-center gap-2 px-1'>
        <div className='flex-1 relative'>
          <input
            ref={searchInputRef}
            type='text'
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder='Search items...'
            className='w-full bg-[#1A1A1A] text-white/90 placeholder-white/40 rounded-md px-3 py-2 text-sm focus:outline-none'
          />
        </div>
        <button
          onClick={onClose}
          className='w-[32px] h-[32px] bg-[#C75D5D] text-white/90 rounded-md flex justify-center items-center hover:bg-[#D46464] transition-colors duration-200 text-lg font-light'
          title='Close inventory'
        >
          ×
        </button>
      </div>

      {/* Categories */}
      <div className='flex gap-2 px-1'>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleTabChange(category)}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md transition-colors duration-200',
              activeTab === category ? 'bg-[#4B6BFB] text-white/90' : 'bg-[#1A1A1A] text-white/60 hover:text-white/90',
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryHeader;
