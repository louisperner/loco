import React, { useEffect, useState } from 'react';
import useGamepadController from '../../hooks/useGamepadController';

export interface GamepadControllerProps {
  className?: string;
}

const GamepadController: React.FC<GamepadControllerProps> = ({ className }) => {
  const gamepadState = useGamepadController();
  const [showMessage, setShowMessage] = useState(false);
  const [isFirstConnection, setIsFirstConnection] = useState(true);
  
  // Show a connection message for a few seconds when gamepad connects/disconnects
  useEffect(() => {
    if (gamepadState.connected) {
      setShowMessage(true);
      
      // Show guide on first connection only
      if (isFirstConnection) {
        setIsFirstConnection(false);
      }
      
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gamepadState.connected, isFirstConnection]);

  return (
    <>  
      {/* Early return if not connected and not showing message */}
      {(!gamepadState.connected && !showMessage) ? null : (
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end ${className}`}>
          {/* Connection status banner */}
          {showMessage && (
            <div className="mb-2 rounded-lg bg-green-500/80 px-4 py-2 text-white shadow-lg backdrop-blur-sm">
              {gamepadState.connected ? 'Xbox Controller Connected!' : 'Xbox Controller Disconnected'}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GamepadController; 