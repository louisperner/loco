import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Player from './components/Game/Game';
import SplashScreen from './components/Game/SplashScreen';
import { useImageStore } from './store/useImageStore';
import PWAInstallPrompts from './components/Game/PWAInstallPrompts';
import DrawingOverlay from './components/ui/DrawingOverlay';
import MergedSpotlight from './components/Spotlight/MergedSpotlight';
import DownloadBanner from './components/ui/DownloadBanner';
// @ts-ignore
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <div className='fixed inset-0 w-screen h-screen overflow-hidden select-none' draggable={false}>
      {isLoading && <SplashScreen />}
      <Player />
      <DrawingOverlay />
      <MergedSpotlight />
      <DownloadBanner />
      {typeof window !== 'undefined' && 
        !window.navigator.userAgent.toLowerCase().includes('electron') && 
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(window.navigator.userAgent.toLowerCase()) && 
        <PWAInstallPrompts />}
      <Analytics />
    </div>
  );
};

// Add welcome image to local storage if it doesn't exist
const initializeWelcomeImage = () => {
  const STORAGE_KEY = 'scene-images';

  try {
    // Check if images already exist in local storage
    const savedImages = localStorage.getItem(STORAGE_KEY);
    let existingImages = [];

    if (savedImages) {
      try {
        existingImages = JSON.parse(savedImages);
      } catch (err) {
        // Invalid JSON, treat as empty
      }
    }

    // Check if welcome image is already added
    const hasWelcomeImage =
      Array.isArray(existingImages) && existingImages.some((img) => img.fileName === 'welcome.png');

    if (!hasWelcomeImage) {
      // Load image first to get its dimensions
      const img = new Image();

      img.onload = () => {
        // Add welcome.png with correct dimensions
        const welcomeImagePath = '/welcome.png';
        const imageStore = useImageStore.getState();
        imageStore.addImage({
          src: welcomeImagePath,
          fileName: 'welcome.png',
          position: [0, 5, -15],
          rotation: [0, 0, 0],
          scale: 2,
          width: img.width,
          height: img.height,
          alt: 'Welcome image',
        });
      };

      img.onerror = () => {
        // Fallback without dimensions
        const welcomeImagePath = '/welcome.png';
        const imageStore = useImageStore.getState();
        imageStore.addImage({
          src: welcomeImagePath,
          fileName: 'welcome.png',
          position: [0, 4, -10],
          rotation: [0, 0, 0],
          scale: 2,
          alt: 'Welcome image',
        });
      };

      // Start loading the image
      img.src = '/welcome.png';
    }
  } catch (error) {
    // Error handling
  }
};

// Initialize welcome image on app start
// initializeWelcomeImage();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
