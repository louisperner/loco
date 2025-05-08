import React, { useState, useEffect } from 'react';

const DownloadBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if running in browser (not in Electron)
    const isBrowser = typeof window !== 'undefined' && 
      !window.navigator.userAgent.toLowerCase().includes('electron');
    
    setIsVisible(isBrowser);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="h-16 fixed top-0 left-0 right-0 bg-indigo-600 text-white py-2 px-4 flex justify-between items-center z-50">
      <div>
        <span className="font-bold">🚀 Alpha version available!</span>
        <span className="ml-2">Download our desktop app for the best experience.</span>
      </div>
      <div className="flex gap-2">
        <a 
          href="https://github.com/louisperner/loco/releases/download/v0.0.1-alpha/loco-darwin-arm64-0.0.1.zip" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-indigo-600 px-3 py-1 rounded-md font-medium hover:bg-indigo-100 transition-colors"
        >
          Download MacOS - arm64 (v0.0.1-alpha)
        </a>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-indigo-200 font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default DownloadBanner; 