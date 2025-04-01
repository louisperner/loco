import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Image, Package, Video, FolderOpen } from 'lucide-react';

interface InventoryHeaderProps {
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: string[];
  activeTab: string;
  handleTabChange: (tab: string) => void;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

// Function to get the appropriate icon for each category
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'all':
      return <Search className="w-4 h-4" />;
    case 'images':
      return <Image className="w-4 h-4" />;
    case 'models':
      return <Package className="w-4 h-4" />;
    case 'videos':
      return <Video className="w-4 h-4" />;
    default:
      return <FolderOpen className="w-4 h-4" />;
  }
};

const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  searchTerm,
  handleSearchChange,
  categories,
  activeTab,
  handleTabChange,
  searchInputRef,
  onClose
}) => {
  return (
    <div className='p-3 bg-[#2C2C2C] border-b-4 border-[#222222]'>
      {/* Search */}
      <div className='flex items-center gap-3 mb-3'>
        <div className='flex-1 relative'>
          <input
            ref={searchInputRef}
            type='text'
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder='Search items...'
            className='w-full bg-[#222222] text-white/90 placeholder-white/40 border-2 border-[#151515] px-3 py-2 text-sm focus:outline-none focus:border-[#666666] rounded-md '
          />
        </div>
        <div className='text-white flex'>
              <button 
                onClick={onClose}
                className='w-10 h-10 bg-[#bb2222] text-white hover:bg-[#D46464] text-12 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center rounded-md transition-colors border-2 border-[#151515]'
              >
                ×
              </button>
            </div>
      </div>

      {/* Categories - Minecraft style tabs with icons */}
      <div className='flex flex-wrap gap-1 -mb-3 relative z-10'>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleTabChange(category)}
            className={cn(
              'px-4 py-1.5 text-sm transition-colors duration-100 border-t-2 border-x-2 border-b-0 flex items-center gap-1 rounded-t-md z-[99999999]',
              activeTab === category 
                ? 'bg-[#3F3F3F] text-white/90 border-[#555555]' 
                : 'bg-[#2A2A2A] text-white/60 border-[#151515] hover:bg-[#333333]',
            )}
            title={category}
          >
            {getCategoryIcon(category)}
            <span className="hidden sm:inline">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryHeader;
