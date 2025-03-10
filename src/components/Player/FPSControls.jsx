import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Html } from '@react-three/drei';

/**
 * FPSControls Component
 * 
 * Handles both keyboard movement (WASD/Arrow keys) and mouse look control
 * in a single system while allowing them to work independently.
 */
function FPSControls({ speed = 5, enabled = true }) {
  const { camera, gl } = useThree();
  const controls = useRef();
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const moveUp = useRef(false);
  const moveDown = useRef(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Update pointer lock state when enabled changes
  useEffect(() => {
    if (controls.current) {
      if (enabled) {
        // Don't auto-connect, wait for user interaction
        // controls.current.connect();
      } else {
        if (isLocked) {
          controls.current.disconnect();
        }
      }
    }
  }, [enabled, isLocked]);
  
  // Handle lock state changes
  useEffect(() => {
    if (!controls.current) return;
    
    const onLockStateChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };
    
    const onLockError = (event) => {
      console.warn('Pointer Lock Error:', event);
    };
    
    document.addEventListener('pointerlockchange', onLockStateChange);
    document.addEventListener('pointerlockerror', onLockError);
    
    return () => {
      document.removeEventListener('pointerlockchange', onLockStateChange);
      document.removeEventListener('pointerlockerror', onLockError);
    };
  }, []);
  
  // Handle click on canvas to lock
  useEffect(() => {
    if (!enabled || !controls.current) return;
    
    const handleCanvasClick = (event) => {
      // Only handle clicks on the canvas itself, not on UI elements
      if (event.target === gl.domElement && !isLocked && enabled) {
        try {
          controls.current.connect();
        } catch (err) {
          console.error("Error locking pointer:", err);
        }
      }
    };
    
    // Don't prevent default so other UI elements can still be clicked
    gl.domElement.addEventListener('click', handleCanvasClick);
    
    return () => {
      gl.domElement.removeEventListener('click', handleCanvasClick);
    };
  }, [gl, enabled, isLocked]);
  
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!enabled) return;
      
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveForward.current = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveLeft.current = true;
          break;
        case "KeyS":
        case "ArrowDown":
          moveBackward.current = true;
          break;
        case "KeyD":
        case "ArrowRight":
          moveRight.current = true;
          break;
        case "Space":
          moveUp.current = true;
          break;
        case "ShiftLeft":
          moveDown.current = true;
          break;
        case "Escape":
          // Manually handle escape to exit pointer lock
          if (isLocked && controls.current) {
            controls.current.disconnect();
          }
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event) => {
      if (!enabled) {
        // Reset all movement when controls are disabled
        moveForward.current = false;
        moveBackward.current = false;
        moveLeft.current = false;
        moveRight.current = false;
        moveUp.current = false;
        moveDown.current = false;
        return;
      }
      
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveForward.current = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveLeft.current = false;
          break;
        case "KeyS":
        case "ArrowDown":
          moveBackward.current = false;
          break;
        case "KeyD":
        case "ArrowRight":
          moveRight.current = false;
          break;
        case "Space":
          moveUp.current = false;
          break;
        case "ShiftLeft":
          moveDown.current = false;
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [enabled, isLocked]);

  useFrame((_, delta) => {
    if (!enabled || !isLocked) return;
    
    // Get camera's forward and right vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    // Zero out Y component to keep movement horizontal
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    // Calculate movement
    const moveSpeed = speed * delta;
    
    if (moveForward.current) camera.position.addScaledVector(forward, moveSpeed);
    if (moveBackward.current) camera.position.addScaledVector(forward, -moveSpeed);
    if (moveRight.current) camera.position.addScaledVector(right, moveSpeed);
    if (moveLeft.current) camera.position.addScaledVector(right, -moveSpeed);
    if (moveUp.current) camera.position.y += moveSpeed;
    if (moveDown.current) camera.position.y -= moveSpeed;
  });

  return (
    <>
      <PointerLockControls ref={controls} args={[camera, gl.domElement]} />
      {/* {enabled && !isLocked && (
        <group position={[0, 0, -3]}>
          <Html center>
            <div 
              style={{
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 999,
                opacity: 0.7
              }}
            >
              Click to look around
            </div>
          </Html>
        </group>
      )} */}
    </>
  );
}

export default FPSControls; 