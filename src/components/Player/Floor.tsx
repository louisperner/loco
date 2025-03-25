import React from 'react';
import { Circle } from '@react-three/drei';

type FloorProps = {
  // Add any props here if needed in the future
};

const Floor: React.FC<FloorProps> = () => {
  return (
    <Circle
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      args={[50]}
    >
      <meshStandardMaterial 
        attach="material" 
        color="#f0f0f0" 
        roughness={0.7}
        metalness={0.05}
      />
    </Circle>
  );
};

export default Floor; 