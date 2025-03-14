import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

const CameraExposer = ({ cameraRef }) => {
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