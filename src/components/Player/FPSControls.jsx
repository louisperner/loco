import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Html } from '@react-three/drei';
import { Vector3 } from 'three';

/**
 * FPSControls Component
 * 
 * Handles both keyboard movement (WASD/Arrow keys) and mouse look control
 * in a single system while allowing them to work independently.
 */
function FPSControls({ 
  speed = 5, 
  enabled = true, 
  gravityEnabled = false, 
  floorHeight = -2,
  initialPosition = [0,0,0]
}) {
  const { camera, gl } = useThree();
  const controls = useRef();
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const moveUp = useRef(false);
  const moveDown = useRef(false);
  const [isLocked, setIsLocked] = useState(false);
  const hasSetInitialPosition = useRef(false);
  
  // Referências para controle de gravidade
  const verticalVelocity = useRef(0);
  const isOnGround = useRef(false);
  
  // Constantes de física
  const GRAVITY = 0.05;
  const JUMP_FORCE = 0.2;
  
  // Set initial position if provided
  useEffect(() => {
    if (initialPosition && !hasSetInitialPosition.current) {
      camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
      hasSetInitialPosition.current = true;
    }
  }, [camera, initialPosition]);
  
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
    const handleKeyDown = (e) => {
      if (!enabled) return;
      
      switch (e.code) {
        case 'KeyW':
          moveForward.current = true;
          break;
        case 'KeyS':
          moveBackward.current = true;
          break;
        case 'KeyA':
          moveLeft.current = true;
          break;
        case 'KeyD':
          moveRight.current = true;
          break;
        case 'Space':
          if (gravityEnabled && isOnGround.current) {
            // Pular quando estiver no chão com gravidade
            verticalVelocity.current = JUMP_FORCE;
            isOnGround.current = false;
          } else {
            // Movimento para cima quando sem gravidade
            moveUp.current = true;
          }
          break;
        case 'ControlLeft':
          moveDown.current = true;
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      if (!enabled) return;
      
      switch (e.code) {
        case 'KeyW':
          moveForward.current = false;
          break;
        case 'KeyS':
          moveBackward.current = false;
          break;
        case 'KeyA':
          moveLeft.current = false;
          break;
        case 'KeyD':
          moveRight.current = false;
          break;
        case 'Space':
          if (!gravityEnabled) {
            moveUp.current = false;
          }
          break;
        case 'ControlLeft':
          moveDown.current = false;
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, gravityEnabled]);

  useFrame((state, delta) => {
    if (!enabled) return;
    
    // Ajuste de velocidade para suavizar o movimento
    const actualSpeed = speed * delta;
    
    // Direções de movimento
    const direction = new Vector3();
    const sideDirection = new Vector3();
    
    // Controle frente/trás
    if (moveForward.current) direction.z = -1;
    if (moveBackward.current) direction.z = 1;
    
    // Controle esquerda/direita
    if (moveLeft.current) sideDirection.x = -1;
    if (moveRight.current) sideDirection.x = 1;
    
    // Normalizar para movimento diagonal consistente
    if (direction.length() > 0) direction.normalize();
    if (sideDirection.length() > 0) sideDirection.normalize();
    
    // Aplicar rotação da câmera ao movimento
    direction.applyQuaternion(camera.quaternion);
    sideDirection.applyQuaternion(camera.quaternion);
    
    // Manter movimento horizontal
    direction.y = 0;
    sideDirection.y = 0;
    
    // Normalizar novamente
    if (direction.length() > 0) direction.normalize();
    if (sideDirection.length() > 0) sideDirection.normalize();
    
    // Aplicar movimento horizontal
    camera.position.addScaledVector(direction, actualSpeed);
    camera.position.addScaledVector(sideDirection, actualSpeed);
    
    // Sistema de gravidade
    if (gravityEnabled) {
      // Verificar colisão com o chão
      if (camera.position.y <= floorHeight + 1.8) { // 1.8 = altura da câmera/jogador
        camera.position.y = floorHeight + 1.8;
        verticalVelocity.current = 0;
        isOnGround.current = true;
      } else {
        // Aplicar gravidade em queda livre
        verticalVelocity.current -= GRAVITY;
        isOnGround.current = false;
      }
      
      // Atualizar posição vertical
      camera.position.y += verticalVelocity.current;
    } else {
      // Movimento vertical tradicional (sem gravidade)
      if (moveUp.current) camera.position.y += actualSpeed;
      if (moveDown.current) camera.position.y -= actualSpeed;
    }
  });

  return (
    <>
      <PointerLockControls ref={controls} args={[camera, gl.domElement]} />
    </>
  );
}

export default FPSControls; 