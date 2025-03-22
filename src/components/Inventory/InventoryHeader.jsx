import React from 'react';
import { cn } from '@/lib/utils';

const InventoryHeader = ({
  searchTerm,
  handleSearchChange,
  categories,
  activeTab,
  handleTabChange,
  onClose,
  searchInputRef
}) => {
  return (
    <>
      <div className="flex justify-between items-center p-5 bg-black/80 border-b border-white/20">
        <h2 className="text-xl font-medium text-white/90">Inventory</h2>
        <div className="flex-1 mx-5">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-md text-white text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/30 focus:bg-black/60"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-sm font-mono">E</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-sm font-mono">Esc</kbd> to close
          </span>
          <button 
            className="text-white/60 hover:text-white text-2xl transition-colors duration-200 flex items-center justify-center w-8 h-8"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="flex gap-1 p-2.5 bg-black/80 border-b border-white/20 overflow-x-auto">
        {categories.map(category => (
          <button 
            key={category}
            className={cn(
              "px-4 py-2 rounded-md text-sm cursor-pointer transition-all duration-200 whitespace-nowrap border",
              activeTab === category 
                ? "bg-blue-500/20 text-white border-blue-500/50" 
                : "bg-black/50 text-white/60 border-transparent hover:bg-black/60 hover:text-white"
            )}
            onClick={() => handleTabChange(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </>
  );
};

export default InventoryHeader; 