import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Player from './components/Player/Player';
import SplashScreen from './components/SplashScreen/SplashScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This function simulates or performs actual app initialization
    const initializeApp = async () => {
      try {
        // If you have actual initialization tasks, you can put them here
        // Such as loading data, initializing services, etc.
        
        // For demonstration, we're just using a timeout
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Once everything is loaded, set loading to false
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Handle initialization errors
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <div>
      {isLoading ? (
        <SplashScreen />
      ) : (
        <Player />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
