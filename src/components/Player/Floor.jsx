import React from 'react';
import { Plane } from '@react-three/drei';

const Floor = () => {
  return (
    <Plane
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      args={[100, 100]}
    >
      <meshStandardMaterial 
        attach="material" 
        color="#f0f0f0" 
        roughness={0.7}
        metalness={0.05}
      />
    </Plane>
  );
};

export default Floor; 