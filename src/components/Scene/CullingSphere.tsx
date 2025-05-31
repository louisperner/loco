import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

interface CullingSphereProps {
  radius?: number;
  visible?: boolean;
  opacity?: number;
}

const CullingSphere: React.FC<CullingSphereProps> = ({ 
  radius, 
  visible = false,
  opacity = 0.1 
}) => {
  const { camera } = useThree();
  const sphereRef = useRef<THREE.Mesh>(null);
  const { cullingSettings } = useGameStore();
  
  // Use canvas culling radius from settings if no radius provided
  const effectiveRadius = radius ?? cullingSettings.canvasRadius;
  
  useEffect(() => {
    if (!sphereRef.current || !visible) return;
    
    const updateSpherePosition = () => {
      if (sphereRef.current && camera) {
        // Position the sphere at the camera's location
        sphereRef.current.position.copy(camera.position);
      }
    };
    
    // Update sphere position every frame
    let frameId: number;
    const animate = () => {
      updateSpherePosition();
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [camera, visible]);
  
  if (!visible) return null;
  
  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[effectiveRadius, 32, 32]} />
      <meshBasicMaterial 
        color="#00ff00" 
        transparent 
        opacity={opacity}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default CullingSphere; 