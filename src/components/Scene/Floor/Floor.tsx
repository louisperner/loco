import React, { useMemo } from 'react';
import { Grid, Plane, Circle } from '@react-three/drei';
import { useThemeStore } from '../../../store/ThemeStore';
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
        <Plane 
          args={[2000, 2000]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
          raycast={() => null}
        >
          {floorMaterial}
        </Plane>
      );
    }
    
    switch (groundShape) {
      case 'circle':
        return (
          <Circle 
            args={[size / 2]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
            raycast={() => null}
          >
            {floorMaterial}
          </Circle>
        );
      case 'square':
        return (
          <Plane 
            args={[size, size]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
            raycast={() => null}
          >
            {floorMaterial}
          </Plane>
        );
      case 'hexagon':
        return (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
            raycast={() => null}
          >
            <circleGeometry args={[size / 2, 6]} />
            {floorMaterial}
          </mesh>
        );
      case 'triangle':
        return (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
            raycast={() => null}
          >
            <circleGeometry args={[size / 2, 3]} />
            {floorMaterial}
          </mesh>
        );
      case 'octagon':
        return (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
            raycast={() => null}
          >
            <circleGeometry args={[size / 2, 8]} />
            {floorMaterial}
          </mesh>
        );
      case 'diamond':
        return (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]}
            receiveShadow
            raycast={() => null}
          >
            <circleGeometry args={[size / 2, 4, Math.PI/4]} />
            {floorMaterial}
          </mesh>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {gridVisible && (
        <Grid
          args={[size, size]}
          cellSize={1}
          cellThickness={1}
          cellColor={parseColor(gridColor)}
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor={parseColor(gridColor)}
          fadeDistance={fadeDistance}
          fadeStrength={isInfinite ? 0.5 : 1}
          followCamera={isInfinite}
          position={[0, 0.01, 0]}
          infiniteGrid={isInfinite}
          raycast={() => null}
        />
      )}
      
      {renderFloorShape()}
    </>
  );
};

export default Floor; 