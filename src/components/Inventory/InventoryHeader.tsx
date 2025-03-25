import React from 'react';
import { cn } from '@/lib/utils';

interface InventoryHeaderProps {
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: string[];
  activeTab: string;
  handleTabChange: (category: string) => void;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  searchTerm,
  handleSearchChange,
  categories,
  activeTab,
  handleTabChange,
  onClose,
  searchInputRef
}) => {
  return (
    <div className="p-4 border-b border-white/10 bg-black/80">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Inventory</h2>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:bg-white/20 transition-colors duration-200"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="w-full sm:w-auto flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full bg-black/60 border border-white/10 rounded px-3 py-1.5 text-white/90 placeholder-white/40 focus:outline-none focus:border-blue-500/70 transition-colors duration-200"
          />
        </div>
        
        <div className="flex gap-1 w-full sm:w-auto overflow-x-auto scrollbar-thin">
          {categories.map(category => (
            <button
              key={category}
              className={cn(
                "px-3 py-1.5 text-sm border border-white/10 rounded whitespace-nowrap transition-all duration-200",
                activeTab === category 
                  ? "bg-blue-500/50 text-white border-blue-500/70" 
                  : "bg-black/60 text-white/70 hover:bg-black/80"
              )}
              onClick={() => handleTabChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader; 