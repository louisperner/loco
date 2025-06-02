import React, { useMemo } from 'react';
import { Grid, Plane, Circle } from '@react-three/drei';
import { usePlane } from '@react-three/cannon';
import { useThemeStore } from '../../store/ThemeStore';
import * as THREE from 'three';

interface FloorProps {
  gridVisible?: boolean;
  floorPlaneVisible?: boolean;
  groundSize?: number;
  isInfinite?: boolean;
  groundShape?: 'circle' | 'square' | 'hexagon' | 'triangle' | 'octagon' | 'diamond';
}

const Floor: React.FC<FloorProps> = ({ 
  gridVisible, 
  floorPlaneVisible, 
  groundSize = 30, 
  isInfinite = false, 
  groundShape = 'circle' 
}) => {
  const gridColor = useThemeStore(state => state.gridColor);
  const floorPlaneColor = useThemeStore(state => state.floorPlaneColor);
  const floorPlaneOpacity = useThemeStore(state => state.floorPlaneOpacity);
  
  // Physics floor plane - invisible but solid
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0], // Horizontal plane
    position: [0, 0, 0],
    type: 'Static', // Static body for the floor
  }));
  
  // Extract RGB values from the rgba strings
  const parseColor = (rgba: string): THREE.Color => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      return new THREE.Color(
        parseInt(match[1]) / 255,
        parseInt(match[2]) / 255,
        parseInt(match[3]) / 255
      );
    }
    return new THREE.Color(1, 1, 1);
  };
  
  // Always use default size when infinite is true
  const size = isInfinite ? 10 : groundSize;
  const fadeDistance = isInfinite ? 100 : groundSize;
  
  // Create reusable material
  const floorMaterial = useMemo(() => (
    <meshStandardMaterial 
      color={parseColor(floorPlaneColor)}
      opacity={floorPlaneOpacity / 100}
      transparent={true}
    />
  ), [floorPlaneColor, floorPlaneOpacity]);

  // Render appropriate floor shape based on groundShape prop
  const renderFloorShape = () => {
    if (!floorPlaneVisible) return null;
    
    if (isInfinite) {
      return (
        <>
          {/* Visual floor plane */}
          <Plane 
            args={[1000, 1000]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
          >
            {floorMaterial}
          </Plane>
          {/* Physics collision plane - invisible but solid */}
          <mesh ref={ref} visible={false}>
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial />
          </mesh>
        </>
      );
    }
    
    // Non-infinite floor shapes
    switch (groundShape) {
      case 'square':
        return (
          <>
            {/* Visual floor */}
            <Plane 
              args={[size * 2, size * 2]} 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              {floorMaterial}
            </Plane>
            {/* Physics collision plane */}
            <mesh ref={ref} visible={false}>
              <planeGeometry args={[size * 2, size * 2]} />
              <meshBasicMaterial />
            </mesh>
          </>
        );
      case 'circle':
        return (
          <>
            {/* Visual floor */}
            <Circle 
              args={[size]} 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              {floorMaterial}
            </Circle>
            {/* Physics collision plane */}
            <mesh ref={ref} visible={false}>
              <circleGeometry args={[size]} />
              <meshBasicMaterial />
            </mesh>
          </>
        );
      case 'hexagon':
        return (
          <>
            {/* Visual floor */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[size / 2, 6]} />
              {floorMaterial}
            </mesh>
            {/* Physics collision plane */}
            <mesh ref={ref} visible={false}>
              <circleGeometry args={[size / 2, 6]} />
              <meshBasicMaterial />
            </mesh>
          </>
        );
      case 'triangle':
        return (
          <>
            {/* Visual floor */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[size / 2, 3]} />
              {floorMaterial}
            </mesh>
            {/* Physics collision plane */}
            <mesh ref={ref} visible={false}>
              <circleGeometry args={[size / 2, 3]} />
              <meshBasicMaterial />
            </mesh>
          </>
        );
      case 'octagon':
        return (
          <>
            {/* Visual floor */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[size / 2, 8]} />
              {floorMaterial}
            </mesh>
            {/* Physics collision plane */}
            <mesh ref={ref} visible={false}>
              <circleGeometry args={[size / 2, 8]} />
              <meshBasicMaterial />
            </mesh>
          </>
        );
      case 'diamond':
        return (
          <>
            {/* Visual floor */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[size / 2, 4, Math.PI/4]} />
              {floorMaterial}
            </mesh>
            {/* Physics collision plane */}
            <mesh ref={ref} visible={false}>
              <circleGeometry args={[size / 2, 4, Math.PI/4]} />
              <meshBasicMaterial />
            </mesh>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Grid overlay */}
      {gridVisible && (
        <Grid
          position={[0, 0.01, 0]} // Slightly above floor to prevent z-fighting
          args={[size * 2, size * 2]}
          cellSize={1}
          cellThickness={1}
          cellColor={parseColor(gridColor)}
          sectionSize={5}
          sectionThickness={2}
          sectionColor={parseColor(gridColor)}
          fadeDistance={fadeDistance}
          fadeStrength={1}
          followCamera={isInfinite}
          infiniteGrid={isInfinite}
        />
      )}
      
      {/* Floor shape */}
      {renderFloorShape()}
    </>
  );
};

export default Floor; 