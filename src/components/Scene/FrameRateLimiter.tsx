import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const FrameRateLimiter: React.FC = () => {
  const frameInterval = 1000 / 60; // 60 fps
  const lastUpdate = useRef<number>(0);
  
  useFrame(() => {
    const now = performance.now();
    const delta = now - lastUpdate.current;
    
    if (delta < frameInterval) {
      // Skip this frame
      return;
    }
    
    // Update last render time, accounting for any extra time
    lastUpdate.current = now - (delta % frameInterval);
  }, 0); // Priority 0 ensures this runs before other useFrame hooks
  
  return null;
};

export default FrameRateLimiter; 