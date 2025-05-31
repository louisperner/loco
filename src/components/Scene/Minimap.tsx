import React, { useRef, useEffect, useState } from 'react';
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
  expandedCanvas: null as HTMLCanvasElement | null,
  renderer: null as THREE.WebGLRenderer | null,
  expandedRenderer: null as THREE.WebGLRenderer | null,
  miniCamera: null as THREE.OrthographicCamera | null,
  playerRotation: 0, // Add rotation tracking here
};

// This component will be placed inside the Canvas in Game.tsx
export const MinimapRenderer: React.FC = () => {
  const { camera, scene } = useThree();
  const viewMode = useGameStore(state => state.viewMode);
  const { cullingSettings } = useGameStore(); // Get culling settings
  
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
      renderer.setClearColor(0x000000, 0); // Transparent background
      sharedCanvasRef.renderer = renderer;
    }

    // Create expanded renderer if expanded canvas exists
    if (sharedCanvasRef.expandedCanvas && !sharedCanvasRef.expandedRenderer) {
      const expandedRenderer = new THREE.WebGLRenderer({
        canvas: sharedCanvasRef.expandedCanvas,
        alpha: true,
        antialias: true
      });
      expandedRenderer.setSize(sharedCanvasRef.expandedCanvas.width, sharedCanvasRef.expandedCanvas.height);
      expandedRenderer.setClearColor(0x000000, 1); // Black background for expanded view
      sharedCanvasRef.expandedRenderer = expandedRenderer;
    }
    
    // Create orthographic camera for top-down view if it doesn't exist
    if (!sharedCanvasRef.miniCamera) {
      const size = sharedCanvasRef.canvas.width;
      const aspect = size / size;
      const mapSize = 150; // Increased from 100 to 150 for even wider view
      const miniCamera = new THREE.OrthographicCamera(
        -mapSize * aspect / 2,
        mapSize * aspect / 2,
        mapSize / 2,
        -mapSize / 2,
        0.1,
        50000 // Massive increase from 10000 to 50000 to capture ALL objects
      );
      miniCamera.position.set(0, 500, 0); // Much higher camera position (500 instead of 200)
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
      if (sharedCanvasRef.expandedRenderer) {
        sharedCanvasRef.expandedRenderer.dispose();
        sharedCanvasRef.expandedRenderer = null;
      }
      sharedCanvasRef.miniCamera = null;
    };
  }, []);

  // Render minimap on each frame
  useFrame(() => {
    if (!sharedCanvasRef.miniCamera || viewMode !== '3D') return;

    const miniCam = sharedCanvasRef.miniCamera;

    // Update minimap camera position to follow player
    if (camera) {
      const playerPos = camera.position.clone();
      miniCam.position.x = playerPos.x;
      miniCam.position.z = playerPos.z;
      // Keep the y coordinate fixed for top-down view

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const angle = Math.atan2(direction.x, direction.z);
      sharedCanvasRef.playerRotation = angle;
    }

    // Store original visibility states and apply minimap culling
    const originalVisibility: Map<THREE.Object3D, boolean> = new Map();
    
    if (cullingSettings.enabled) {
      scene.traverse((object) => {
        if (object.userData.isModelInScene && object instanceof THREE.Group) {
          originalVisibility.set(object, object.visible); // Store original state

          const modelPosition = new THREE.Vector3();
          object.getWorldPosition(modelPosition);
          const distanceToMinimapCamera = miniCam.position.distanceTo(modelPosition);
          
          // Determine visibility based on minimap culling radius
          object.visible = distanceToMinimapCamera <= cullingSettings.minimapRadius;
        }
      });
    }

    // Render the regular minimap
    if (sharedCanvasRef.renderer) {
      sharedCanvasRef.renderer.render(scene, miniCam);
    }

    // Render the expanded minimap if it exists
    if (sharedCanvasRef.expandedRenderer) {
      sharedCanvasRef.expandedRenderer.render(scene, miniCam);
    }

    // Restore original visibility states
    if (cullingSettings.enabled) {
      originalVisibility.forEach((isVisible, object) => {
        object.visible = isVisible;
      });
    }
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
  const expandedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewMode = useGameStore(state => state.viewMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerRotation, setPlayerRotation] = useState(0);

  // Track player rotation from shared reference
  useEffect(() => {
    const updateRotation = () => {
      setPlayerRotation(sharedCanvasRef.playerRotation);
    };

    const animationId = requestAnimationFrame(function animate() {
      updateRotation();
      requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Add keyboard controls for "M" key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'm') {
        setIsExpanded(prev => !prev);
      }
      // Also allow Escape to close
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isExpanded]);

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

  // Setup expanded canvas when modal opens
  useEffect(() => {
    if (isExpanded && expandedCanvasRef.current) {
      const canvas = expandedCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      sharedCanvasRef.expandedCanvas = canvas;
      
      // Create expanded renderer
      if (!sharedCanvasRef.expandedRenderer) {
        const expandedRenderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: true,
          antialias: true
        });
        expandedRenderer.setSize(canvas.width, canvas.height);
        expandedRenderer.setClearColor(0x000000, 1);
        sharedCanvasRef.expandedRenderer = expandedRenderer;
      }
    } else if (!isExpanded) {
      // Cleanup expanded renderer when modal closes
      if (sharedCanvasRef.expandedRenderer) {
        sharedCanvasRef.expandedRenderer.dispose();
        sharedCanvasRef.expandedRenderer = null;
      }
      sharedCanvasRef.expandedCanvas = null;
    }
  }, [isExpanded]);

  const handleMinimapClick = () => {
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  // Simple and correct rotation calculation
  // Convert radians to degrees and apply directly
  const rotationDegrees = (playerRotation * 180) / Math.PI;

  // Only show in 3D mode
  if (viewMode !== '3D') return null;

  return (
    <>
      {/* Regular minimap */}
      <div
        onClick={handleMinimapClick}
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
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <canvas ref={mapCanvasRef} style={{ width: '100%', height: '100%' }} />
        
        {/* Player indicator with direction arrow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '20px',
            height: '20px',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001
          }}
        >
          {/* Player dot */}
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
              border: '2px solid white',
              zIndex: 2
            }}
          />
          {/* Direction arrow - completely remade */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '12px solid yellow',
              transform: `translate(-50%, -50%) rotate(${rotationDegrees}deg)`,
              transformOrigin: 'center center',
              zIndex: 1
            }}
          />
        </div>
        
        {/* Click hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: 'white',
            textShadow: '1px 1px 2px black',
            pointerEvents: 'none',
            opacity: 0.7
          }}
        >
          Click or press M
        </div>
      </div>

      {/* Expanded minimap modal */}
      {isExpanded && (
        <>
          {/* Modal backdrop */}
          <div
            onClick={handleCloseExpanded}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 9998,
              cursor: 'pointer'
            }}
          />
          
          {/* Expanded map */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80vw',
              height: '80vh',
              maxWidth: '800px',
              maxHeight: '800px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '3px solid #333',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.8)',
              zIndex: 9999,
              backgroundColor: '#000'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleCloseExpanded}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            
            {/* Expanded canvas */}
            <canvas 
              ref={expandedCanvasRef} 
              style={{ 
                width: '100%', 
                height: '100%',
                display: 'block'
              }} 
            />
            
            {/* Player indicator for expanded view with direction */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '30px',
                height: '30px',
                transform: 'translate(-50%, -50%)',
                zIndex: 10001
              }}
            >
              {/* Player dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '3px solid white',
                  zIndex: 2
                }}
              />
              {/* Direction arrow for expanded view */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '0',
                  height: '0',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '18px solid yellow',
                  transform: `translate(-50%, -50%) rotate(${rotationDegrees}deg)`,
                  transformOrigin: 'center center',
                  zIndex: 1
                }}
              />
            </div>
            
            {/* Map title */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px black',
                zIndex: 10000
              }}
            >
              World Map (Press M or Esc to close)
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Minimap; 