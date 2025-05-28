import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore';

interface MinimapProps {
  size?: number;
  opacity?: number;
  scale?: number;
}

// Canvas reference accessible between components
const sharedCanvasRef = {
  canvas: null as HTMLCanvasElement | null,
  renderer: null as THREE.WebGLRenderer | null,
  miniCamera: null as THREE.OrthographicCamera | null,
};

// This component will be placed inside the Canvas in Game.tsx
export const MinimapRenderer: React.FC = () => {
  const { camera, scene } = useThree();
  const viewMode = useGameStore(state => state.viewMode);
  
  // Set up orthographic camera for the minimap view
  useEffect(() => {
    if (!sharedCanvasRef.canvas) return;
    
    // Create minimap renderer if it doesn't exist
    if (!sharedCanvasRef.renderer) {
      const renderer = new THREE.WebGLRenderer({
        canvas: sharedCanvasRef.canvas,
        alpha: true,
        antialias: true
      });
      renderer.setSize(sharedCanvasRef.canvas.width, sharedCanvasRef.canvas.height);
      sharedCanvasRef.renderer = renderer;
    }
    
    // Create orthographic camera for top-down view if it doesn't exist
    if (!sharedCanvasRef.miniCamera) {
      const size = sharedCanvasRef.canvas.width;
      const aspect = size / size;
      const mapSize = 20; // Scale factor
      const miniCamera = new THREE.OrthographicCamera(
        -mapSize * aspect / 2,
        mapSize * aspect / 2,
        mapSize / 2,
        -mapSize / 2,
        0.1,
        1000
      );
      miniCamera.position.set(0, 30, 0); // Position high above
      miniCamera.lookAt(0, 0, 0);
      miniCamera.rotation.z = Math.PI; // Adjust rotation so north points up
      sharedCanvasRef.miniCamera = miniCamera;
    }
    
    return () => {
      // Cleanup
      if (sharedCanvasRef.renderer) {
        sharedCanvasRef.renderer.dispose();
        sharedCanvasRef.renderer = null;
      }
      sharedCanvasRef.miniCamera = null;
    };
  }, []);

  // Render minimap on each frame
  useFrame(() => {
    if (!sharedCanvasRef.renderer || !sharedCanvasRef.miniCamera || viewMode !== '3D') return;

    // Update minimap camera position to follow player
    if (camera) {
      const playerPos = camera.position.clone();
      sharedCanvasRef.miniCamera.position.x = playerPos.x;
      sharedCanvasRef.miniCamera.position.z = playerPos.z;
      // Keep the y coordinate fixed for top-down view
    }

    // Render the minimap
    sharedCanvasRef.renderer.render(scene, sharedCanvasRef.miniCamera);
  });

  // This component doesn't render anything visible
  return null;
};

// UI component that shows the minimap - this will be placed in the regular DOM
const Minimap: React.FC<MinimapProps> = ({
  size = 200,
  opacity = 0.8,
  scale = 20
}) => {
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewMode = useGameStore(state => state.viewMode);

  // Setup canvas ref
  useEffect(() => {
    if (!mapCanvasRef.current) return;
    
    // Set canvas dimensions
    mapCanvasRef.current.width = size;
    mapCanvasRef.current.height = size;
    
    // Share the canvas with the renderer component
    sharedCanvasRef.canvas = mapCanvasRef.current;
    
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (sharedCanvasRef.canvas === mapCanvasRef.current) {
        sharedCanvasRef.canvas = null;
      }
    };
  }, [size, scale]);

  // Only show in 3D mode
  if (viewMode !== '3D') return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid black',
        opacity: opacity,
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none', // Make it click-through
        zIndex: 1000
      }}
    >
      <canvas ref={mapCanvasRef} style={{ width: '100%', height: '100%' }} />
      {/* Player indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '8px',
          height: '8px',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001
        }}
      />
    </div>
  );
};

export default Minimap; 