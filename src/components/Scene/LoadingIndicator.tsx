import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface LoadingIndicatorProps {
  scale?: number;
  color?: string;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  scale = 1,
  color = "#F3C7F1",
  message = "Loading..."
}) => {
  const loadingRef = useRef<THREE.Group>(null);

  // Animate loading indicator
  useFrame(() => {
    if (loadingRef.current) {
      loadingRef.current.rotation.y += 0.03;
      loadingRef.current.rotation.x += 0.01;
    }
  });

  return (
    <group ref={loadingRef} scale={scale}>
      <mesh>
        <torusGeometry args={[0.5, 0.01, 16, 32]} />
        <meshStandardMaterial color={color} opacity={1} transparent emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.01, 16, 32]} />
        <meshStandardMaterial color={color} opacity={1} transparent emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.5, 0.01, 16, 32]} />
        <meshStandardMaterial color={color} opacity={1} transparent emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.1, 0.01, 16, 32]} />
        <meshStandardMaterial color={color} opacity={1} transparent emissive={color} emissiveIntensity={2} />
      </mesh>
      <Html center position={[0, 0, 0]}>
        <div style={{
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: '6px',
          border: '1px solid rgba(74, 144, 226, 0.5)',
          marginTop: '190px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 10px rgba(74, 144, 226, 0.5)'
        }}>
          {message}
        </div>
      </Html>
    </group>
  );
};

export default LoadingIndicator; 