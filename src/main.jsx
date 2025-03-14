import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import Player, { HotbarContext } from './components/Player/Player';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { MinecraftHotbar } from './components/ui/minecraft-hotbar';

// Sample items for the hotbar
const HOTBAR_ITEMS = [
  {
    id: 'sword',
    name: 'Diamond Sword',
    icon: '/items/diamond_sword.svg',
    count: 1,
  },
  {
    id: 'pickaxe',
    name: 'Iron Pickaxe',
    icon: '/items/iron_pickaxe.svg',
    count: 1,
  },
  {
    id: 'axe',
    name: 'Stone Axe',
    icon: '/items/stone_axe.svg',
    count: 1,
  },
  {
    id: 'shovel',
    name: 'Wooden Shovel',
    icon: '/items/wooden_shovel.svg',
    count: 1,
  },
  {
    id: 'dirt',
    name: 'Dirt Block',
    icon: '/items/dirt.svg',
    count: 64,
  },
  {
    id: 'torch',
    name: 'Torch',
    icon: '/items/torch.svg',
    count: 32,
  },
];

// Wrapper component to connect the hotbar with the Player
const PlayerWithHotbar = () => {
  const [selectedHotbarIndex, setSelectedHotbarIndex] = useState(0);
  const { setSelectedHotbarItem } = useContext(HotbarContext);

  const handleHotbarSelect = (index) => {
    setSelectedHotbarIndex(index);
    // Pass the selected item to the Player component via context
    setSelectedHotbarItem(HOTBAR_ITEMS[index]);
  };

  return (
    <>
      <Player />
    </>
  );
};

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

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="relative w-full h-full">
      <PlayerWithHotbar />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
