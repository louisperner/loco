import React, { useState, useEffect } from 'react';

const DownloadBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    // Check if running in browser (not in Electron)
    const isBrowser = typeof window !== 'undefined' && 
      !window.navigator.userAgent.toLowerCase().includes('electron');
    
    // Check if user is on a Mac
    const userOnMac = typeof window !== 'undefined' && 
      window.navigator.platform.toLowerCase().includes('mac');
    
    setIsVisible(isBrowser);
    setIsMac(userOnMac);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="h-16 fixed top-0 left-0 right-0 bg-indigo-600 text-white py-2 px-4 flex justify-between items-center z-50">
      <div className="flex items-center">
        <span className="font-bold">🚀 Alpha version available!</span>
        <span className="ml-2">Download our desktop app for the best experience.</span>
      </div>
      <div className="flex gap-2">
        <a 
          href="https://github.com/louisperner/loco" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white mr-4 hover:text-indigo-200 transition-colors"
          title="View on GitHub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        {isMac && (
          <a 
            href="https://github.com/louisperner/loco/releases/download/v0.0.2-alpha/loco-darwin-arm64-0.0.2.zip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-indigo-600 px-3 py-1 rounded-md font-medium hover:bg-indigo-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            MacOS - ARM64
          </a>
        )}
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