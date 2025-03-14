import React from 'react';
import { Grid, Plane, Circle } from '@react-three/drei';
import { useThemeStore } from '../../../../store/ThemeStore';
import * as THREE from 'three';

const Floor = ({ gridVisible, floorPlaneVisible, groundSize = 30, isInfinite = false, groundShape = 'circle' }) => {
  const gridColor = useThemeStore(state => state.gridColor);
  const floorPlaneColor = useThemeStore(state => state.floorPlaneColor);
  const gridOpacity = useThemeStore(state => state.gridOpacity);
  const floorPlaneOpacity = useThemeStore(state => state.floorPlaneOpacity);
  
  // Extract RGB values from the rgba strings
  const parseColor = (rgba) => {
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
          opacity={gridOpacity / 100}
        />
      )}
      
      {/* Render infinite plane when infinite ground is enabled */}
      {floorPlaneVisible && isInfinite && (
        <Plane 
          args={[2000, 2000]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </Plane>
      )}
      
      {/* Only render shape-specific planes when NOT in infinite mode */}
      {floorPlaneVisible && !isInfinite && groundShape === 'circle' && (
        <Circle 
          args={[size / 2]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </Circle>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'square' && (
        <Plane 
          args={[size, size]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </Plane>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'hexagon' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 6]} />
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'triangle' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 3]} />
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'octagon' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 8]} />
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
      {floorPlaneVisible && !isInfinite && groundShape === 'diamond' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[size / 2, 4, Math.PI/4]} />
          <meshStandardMaterial 
            color={parseColor(floorPlaneColor)}
            opacity={floorPlaneOpacity / 100}
            transparent={true}
          />
        </mesh>
      )}
    </>
  );
};

export default Floor; 