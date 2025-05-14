import React, { useRef } from 'react';
import { Search, Image, Package, Video, FolderOpen, Code, Layers } from 'lucide-react';
import { SearchResult } from './types';
import { cn } from '@/lib/utils';

interface RegularSpotlightProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  results: SearchResult[];
  selectedResultIndex: number;
  onSearch?: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

// Function to get the appropriate icon for each category
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'all':
      return <Search className="w-4 h-4" />;
    case 'models':
      return <Package className="w-4 h-4" />;
    case 'images':
      return <Image className="w-4 h-4" />;
    case 'videos':
      return <Video className="w-4 h-4" />;
    case 'draw':
      return <Layers className="w-4 h-4" />;
    case 'code':
      return <Code className="w-4 h-4" />;
    default:
      return <FolderOpen className="w-4 h-4" />;
  }
};

const RegularSpotlight: React.FC<RegularSpotlightProps> = ({
  searchQuery,
  setSearchQuery,
  results,
  selectedResultIndex,
  onSearch,
  handleSearchSubmit
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Group results by category
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((groups, result) => {
    if (!groups[result.category]) {
      groups[result.category] = [];
    }
    groups[result.category].push(result);
    return groups;
  }, {});
  
  const categories = ['All', 'Models', 'Images', 'Videos', 'Draw', 'Code'];
  
  return (
    <>
      {/* Header section with search input */}
      <div className='p-3 bg-[#2C2C2C] border-b-4 border-[#222222]'>
        <form 
          onSubmit={handleSearchSubmit} 
          className="flex items-center gap-3 mb-3"
        >
          <div className='flex-1 relative'>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for commands or type '/' for a list..."
              className="w-full bg-[#222222] text-white/90 placeholder-white/40 border-2 border-[#151515] px-3 py-2 text-sm focus:outline-none focus:border-[#666666] rounded-md"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className='text-white flex'>
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className='w-10 h-10 bg-[#bb2222] text-white hover:bg-[#D46464] text-12 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center rounded-md transition-colors border-2 border-[#151515]'
            >
              ×
            </button>
          </div>
        </form>
        
        {/* Command categories - Minecraft style tabs with icons */}
        <div className='flex flex-wrap gap-1 -mb-3 relative z-10'>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSearchQuery(category.toLowerCase())}
              className={cn(
                'px-4 py-1.5 text-sm transition-colors duration-100 border-t-2 border-x-2 border-b-0 flex items-center gap-1 rounded-t-md z-[99999999]',
                searchQuery.toLowerCase().includes(category.toLowerCase()) 
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
      
      {/* Results section */}
      <div 
        ref={resultsRef} 
        className="bg-[#2C2C2C] flex-1 flex flex-col p-2 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
          [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]"
      >
        {searchQuery && results.length > 0 ? (
          <div>
            {Object.entries(groupedResults).map(([category, categoryResults]) => (
              <div key={category} className="mb-2">
                <div className="px-4 py-2 text-xs font-medium text-white/50 uppercase">
                  {category}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {categoryResults.map((result) => {
                    const resultIndex = results.findIndex(r => r.id === result.id);
                    const isSelected = selectedResultIndex === resultIndex;
                    
                    return (
                      <div
                        key={result.id}
                        data-index={resultIndex}
                        className={`flex items-center px-4 py-2 cursor-pointer rounded-md ${
                          isSelected ? 'bg-[#555555] border-2 border-[#151515]' : 'hover:bg-[#333333] border-2 border-[#151515] bg-[#222222]'
                        }`}
                        onClick={() => {
                          result.action();
                          if (onSearch) {
                            onSearch(searchQuery);
                          }
                        }}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#151515] text-white/90 mr-3">
                          {result.icon}
                        </div>
                        <div>
                          <span className="text-white/90">{result.title}</span>
                          <div className="text-xs text-white/50">Type &ldquo;{result.id}&rdquo; or select this option</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center py-10 text-white/50 bg-[#222222] min-h-[200px] h-full rounded-md">
            <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-white/50 bg-[#222222] min-h-[200px] h-full rounded-md">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p>Type to search for commands</p>
            <p className="text-xs mt-2">Try &ldquo;cube&rdquo;, &ldquo;image&rdquo;, &ldquo;code&rdquo;, etc.</p>
            <div className="mt-6 text-center">
              <p className="text-xs">Press <kbd className="bg-[#151515] rounded px-1 mx-1">F</kbd> for regular search, <kbd className="bg-[#151515] rounded px-1 mx-1">/</kbd> for AI Assistant</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with keyboard shortcuts */}
      <div className="p-2 text-xs text-white/40 border-t-2 border-[#151515] bg-[#222222] flex justify-between items-center">
        <div>
          Press <kbd className="bg-[#151515] rounded px-1">Esc</kbd> to close
        </div>
        <div>
          Press <kbd className="bg-[#151515] rounded px-1">F</kbd> or Middle click to open
        </div>
      </div>
    </>
  );
};

export default RegularSpotlight; 