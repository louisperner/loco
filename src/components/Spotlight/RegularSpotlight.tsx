import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { SearchResult } from './types';

interface RegularSpotlightProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  results: SearchResult[];
  selectedResultIndex: number;
  onSearch?: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

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
  
  return (
    <>
      <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-white/10">
        <Search className="w-5 h-5 text-white/70 mr-3" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for commands or type '/' for a list..."
          className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/50"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </form>
      
      <div ref={resultsRef} className="overflow-y-auto flex-1 max-h-[60vh]">
        {searchQuery && results.length > 0 ? (
          <div>
            {Object.entries(groupedResults).map(([category, categoryResults]) => (
              <div key={category} className="mb-2">
                <div className="px-4 py-2 text-xs font-medium text-white/50 uppercase">
                  {category}
                </div>
                <div>
                  {categoryResults.map((result) => {
                    const resultIndex = results.findIndex(r => r.id === result.id);
                    const isSelected = selectedResultIndex === resultIndex;
                    
                    return (
                      <div
                        key={result.id}
                        data-index={resultIndex}
                        className={`flex items-center px-4 py-2 cursor-pointer ${
                          isSelected ? 'bg-white/20' : 'hover:bg-white/10'
                        }`}
                        onClick={() => {
                          result.action();
                          if (onSearch) {
                            onSearch(searchQuery);
                          }
                        }}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                          {result.icon}
                        </div>
                        <div>
                          <span className="text-white">{result.title}</span>
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
          <div className="flex flex-col items-center justify-center py-10 text-white/50">
            <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-white/50">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p>Type to search for commands</p>
            <p className="text-xs mt-2">Try &ldquo;cube&rdquo;, &ldquo;image&rdquo;, &ldquo;code&rdquo;, etc.</p>
            <div className="mt-6 text-center">
              <p className="text-xs">Press <kbd className="bg-white/20 rounded px-1 mx-1">/</kbd> to switch to AI Assistant mode</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-2 text-xs text-white/40 border-t border-white/10 flex justify-between items-center">
        <div>
          Press <kbd className="bg-white/20 rounded px-1">Esc</kbd> to close
        </div>
        <div>
          Press F or Middle click to open
        </div>
      </div>
    </>
  );
};

export default RegularSpotlight; 