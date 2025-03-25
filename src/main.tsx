import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Player, { HotbarContext } from './components/Player/Player';
import SplashScreen from './components/SplashScreen/SplashScreen';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="relative w-full h-full">
      <Player />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />); 