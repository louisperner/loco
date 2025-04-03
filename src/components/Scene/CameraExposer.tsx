import React, { useEffect, RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// No need to declare Window interface here as it's already defined in global.d.ts

interface CameraExposerProps {
  cameraRef: RefObject<THREE.Camera>;
}

const CameraExposer: React.FC<CameraExposerProps> = ({ cameraRef }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    // Store the camera in the ref
    cameraRef.current = camera;
    
    // Also expose to window for any other uses
    window.mainCamera = camera;
    return () => {
      window.mainCamera = undefined;
    };
  }, [camera, cameraRef]);
  
  return null;
};

export default CameraExposer; 