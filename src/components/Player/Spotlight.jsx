import React, { useState, useEffect } from 'react';

import { useCodeStore } from '../../store/CodeStore';

function Spotlight({ onAddFrame, onVisibilityChange, showInput }) {
  const { code, updateCode } = useCodeStore();
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check for Command (Meta) + T
      if ((event.metaKey && event.key === 't') || (event.ctrlKey && event.key === 'T')) {
        event.preventDefault(); // Prevent default browser behavior
        setShowSpotlight(true);
        onVisibilityChange(true);
      }
      // Close spotlight with Escape
      if (event.key === 'Escape' && showSpotlight) {
        setShowSpotlight(false);
        onVisibilityChange(false);
        setInputUrl('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onVisibilityChange, showSpotlight]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onAddFrame(inputUrl);
      setInputUrl('');
      setShowSpotlight(false);
      onVisibilityChange(false);
    }
  };

  if (!showSpotlight || !showInput) return null;

  return (
    <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 w-96">
      <div className="bg-gray-800 rounded-lg shadow-lg p-4">
        <form onSubmit={handleUrlSubmit}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter website URL..."
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}

export default Spotlight;
