import React, { useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const getFramePositionAndRotation = (camera) => {
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  
  const position = new THREE.Vector3();
  position.copy(camera.position);
  
  direction.multiplyScalar(3);
  position.add(direction);
  
  position.y = Math.max(-1, Math.min(3, position.y));

  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);
  
  return {
    position: [position.x, position.y, position.z],
    rotation: [euler.x, euler.y, euler.z]
  };
};

const PreviewFrame = ({ isVisible, onPositionConfirm, isPositionConfirmed, hasPendingWebsite }) => {
  const { camera } = useThree();
  const groupRef = useRef();
  const [position, setPosition] = useState([0, 0, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);

  useFrame(() => {
    if (!isVisible || !groupRef.current || isPositionConfirmed) return;
    const { position: newPosition, rotation: newRotation } = getFramePositionAndRotation(camera);
    setPosition(newPosition);
    setRotation(newRotation);
  });

  React.useEffect(() => {
    if (!isVisible) return;

    const handleClick = () => {
      if (!isPositionConfirmed) {
        onPositionConfirm(position, rotation);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isVisible, position, rotation, onPositionConfirm, isPositionConfirmed]);

  if (!isVisible) return null;

  return (
    <group 
      ref={groupRef} 
      position={position}
      rotation={rotation}
    >
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.1, 2.1]} />
        <meshBasicMaterial 
          color={isPositionConfirmed ? "#22c55e" : "#3b82f6"}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial 
          color={isPositionConfirmed ? "#4ade80" : "#60a5fa"}
          wireframe
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[[-1.5, 1], [1.5, 1], [-1.5, -1], [1.5, -1]].map((pos, i) => (
        <group key={i} position={[pos[0], pos[1], 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} />
          </mesh>
          <mesh position={[0, 0, -0.15]}>
            <boxGeometry args={[0.02, 0.02, 0.3]} />
            <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} opacity={0.5} transparent />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[0.05, 0.05, 0.3]} />
        <meshBasicMaterial color={isPositionConfirmed ? "#22c55e" : "#3b82f6"} opacity={0.3} transparent />
      </mesh>
      
      {hasPendingWebsite && !isPositionConfirmed && (
        <Html position={[0, -1.3, 0]} center>
          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
            Clique para posicionar aqui
          </div>
        </Html>
      )}
    </group>
  );
};

export default PreviewFrame; 