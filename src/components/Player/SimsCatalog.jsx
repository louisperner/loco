import React, { useState, useEffect } from 'react';

/**
 * SimsCatalog Component - Provides a Sims 4-like catalog interface for adding websites
 */
function SimsCatalog({ onAddFrame, isVisible, onClose }) {
  const [url, setUrl] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteWebsites');
    return saved ? JSON.parse(saved) : [
      { name: 'Google', url: 'google.com', icon: '🔍' },
      { name: 'YouTube', url: 'youtube.com', icon: '▶️' },
      { name: 'GitHub', url: 'github.com', icon: '💻' }
    ];
  });
  const [activeCategory, setActiveCategory] = useState('favorites');
  
  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('favoriteWebsites', JSON.stringify(favorites));
  }, [favorites]);

  // Handle adding a new website from direct input
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    onAddFrame(url);
    setUrl('');
  };

  // Add a website to favorites
  const addToFavorites = () => {
    if (!url.trim()) return;
    
    // Create a simple name from the URL
    const name = url.replace(/https?:\/\/(www\.)?/, '').split('.')[0];
    
    setFavorites([...favorites, {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      url: url,
      icon: '🌐'
    }]);
    
    setUrl('');
  };

  // Remove a website from favorites
  const removeFromFavorites = (index) => {
    setFavorites(favorites.filter((_, i) => i !== index));
  };

  // Use a website from favorites
  const useFromFavorites = (favoriteUrl) => {
    onAddFrame(favoriteUrl);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-xl border-2 border-blue-500 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Top bar with title and close button */}
        <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
          <h2 className="text-white font-bold text-xl">Web Catalog</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-red-300 font-bold text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Category tabs */}
        <div className="flex bg-gray-700">
          <button 
            className={`px-4 py-2 text-white font-medium ${activeCategory === 'favorites' ? 'bg-gray-600 border-b-2 border-blue-500' : 'hover:bg-gray-600'}`}
            onClick={() => setActiveCategory('favorites')}
          >
            Favorites
          </button>
          <button 
            className={`px-4 py-2 text-white font-medium ${activeCategory === 'add' ? 'bg-gray-600 border-b-2 border-blue-500' : 'hover:bg-gray-600'}`}
            onClick={() => setActiveCategory('add')}
          >
            Add New
          </button>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeCategory === 'favorites' && (
            <div className="grid grid-cols-3 gap-4">
              {favorites.length > 0 ? (
                favorites.map((site, index) => (
                  <div 
                    key={index}
                    className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-all cursor-pointer"
                    onClick={() => useFromFavorites(site.url)}
                  >
                    <div className="p-4 flex flex-col items-center">
                      <div className="text-4xl mb-2">{site.icon}</div>
                      <div className="text-white font-medium">{site.name}</div>
                      <div className="text-gray-400 text-sm truncate w-full text-center">{site.url}</div>
                    </div>
                    <div className="bg-gray-800 p-2 flex justify-between">
                      <button 
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          useFromFavorites(site.url);
                        }}
                      >
                        Use
                      </button>
                      <button 
                        className="text-xs text-red-400 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromFavorites(index);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-400">
                  Você ainda não tem websites favoritos.
                  <br />
                  Adicione seu primeiro website na aba "Add New"!
                </div>
              )}
            </div>
          )}
          
          {activeCategory === 'add' && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!url.trim()) return;
                onAddFrame(url);
                onClose();
                setUrl('');
              }} className="mb-4">
                <div className="mb-4">
                  <label className="block text-white mb-2">Website URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter website URL (e.g., google.com)"
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Place in World
                  </button>
                  <button
                    type="button"
                    onClick={addToFavorites}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Add to Favorites
                  </button>
                </div>
              </form>
              
              <div className="bg-gray-800 p-3 rounded mt-4">
                <h3 className="text-white font-medium mb-2">Tips:</h3>
                <ul className="text-gray-300 text-sm space-y-1 list-disc pl-5">
                  <li>Enter URLs without "http://" or "https://" (e.g., "google.com")</li>
                  <li>Add your favorite websites to quickly access them later</li>
                  <li>Use Command+B to open this catalog</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimsCatalog; 