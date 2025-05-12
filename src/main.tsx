import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Player from './components/Game/Game';
import SplashScreen from './components/Game/SplashScreen';
import PWAInstallPrompts from './components/Game/PWAInstallPrompts';
import DrawingOverlay from './components/ui/DrawingOverlay';
import MergedSpotlight from './components/Spotlight/MergedSpotlight';
import DownloadBanner from './components/ui/DownloadBanner';
// @ts-ignore
import { Analytics } from '@vercel/analytics/react';
import { useAuthStore } from './store/useAuthStore';
import AuthWrapper from './components/Game/AuthWrapper';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialize = useAuthStore(state => state.initialize);
  
  useEffect(() => {
    const unsubscribe = initialize();
    
    return () => unsubscribe();
  }, [initialize]);
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentUser, authModalOpen } = useAuthStore();

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
      {!currentUser && authModalOpen && <AuthWrapper />}
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
