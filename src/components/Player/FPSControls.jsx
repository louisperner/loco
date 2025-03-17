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
  const { camera, gl, scene } = useThree();
  const controls = useRef();
  const raycaster = useRef(new THREE.Raycaster());
  const rayHelper = useRef();
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
  
  // Create ray helper for debugging
  useEffect(() => {
    // Create a sphere to visualize the raycaster range
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    const sphereHelper = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereHelper.name = "raycasterHelper";
    scene.add(sphereHelper);
    
    // Create a laser beam using a line with glow effect
    const laserMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff0000,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
      depthTest: false  // Make it always visible
    });
    
    // Create a very long line for the laser beam (effectively infinite)
    const laserGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1000) // Very long distance
    ]);
    
    const laserBeam = new THREE.Line(laserGeometry, laserMaterial);
    laserBeam.name = "laserBeam";
    laserBeam.renderOrder = 999; // Render on top of other objects
    scene.add(laserBeam);
    
    // Create a helper to visualize the raycaster direction
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3(0, 0, -1);
    const length = 100;
    const rayHelperObj = new THREE.ArrowHelper(direction, origin, length, 0xff0000);
    rayHelperObj.name = "raycasterDirectionHelper";
    rayHelperObj.visible = false; // Hide the arrow helper since we have the laser beam
    scene.add(rayHelperObj);
    
    // Store all helpers in the ref
    rayHelper.current = { 
      sphere: sphereHelper, 
      arrow: rayHelperObj,
      laser: laserBeam
    };
    
    return () => {
      scene.remove(sphereHelper);
      scene.remove(rayHelperObj);
      scene.remove(laserBeam);
    };
  }, [scene]);
  
  // Update raycaster on each frame
  useFrame(() => {
    if (!enabled) return;
    
    // Create direction vector from camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    // Update raycaster position and direction
    raycaster.current.ray.origin.copy(camera.position);
    raycaster.current.ray.direction.copy(direction);
    raycaster.current.far = 1000; // Match the laser's length
    
    // Update ray helper
    if (rayHelper.current) {
      // Update sphere position at origin
      rayHelper.current.sphere.position.copy(camera.position);
      rayHelper.current.sphere.scale.set(1, 1, 1);
      
      // Update arrow helper (hidden but kept for reference)
      rayHelper.current.arrow.position.copy(camera.position);
      rayHelper.current.arrow.setDirection(direction);
      
      // Update laser beam
      rayHelper.current.laser.position.copy(camera.position);
      rayHelper.current.laser.quaternion.copy(camera.quaternion);
      
      // Get ALL objects in the scene for raycasting
      const allObjects = [];
      scene.traverse((object) => {
        if (object.isMesh && 
            object.name !== "raycasterHelper" && 
            object.name !== "laserBeam") {
          allObjects.push(object);
        }
      });
      
      // Use the SAME raycaster for both visualization and interaction
      const intersects = raycaster.current.intersectObjects(allObjects, false);
      
      // If we hit something, adjust the laser length
      if (intersects.length > 0) {
        const distance = intersects[0].distance;
        
        // Update laser geometry to match the hit distance
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -distance)
        ];
        
        rayHelper.current.laser.geometry.setFromPoints(points);
        rayHelper.current.laser.geometry.attributes.position.needsUpdate = true;
        
        // Make the hit point visible
        rayHelper.current.sphere.scale.set(2, 2, 2);
        rayHelper.current.sphere.position.copy(intersects[0].point);
        rayHelper.current.sphere.visible = true;
      } else {
        // If no hit, extend the laser to the maximum distance
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -1000) // Very long distance
        ];
        
        rayHelper.current.laser.geometry.setFromPoints(points);
        rayHelper.current.laser.geometry.attributes.position.needsUpdate = true;
        
        // Hide the sphere when not hitting anything
        rayHelper.current.sphere.visible = false;
      }
    }
  });
  
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

  useEffect(() => {
    if (controls.current) {
      // Prevent context menu on right click
      const handleContextMenu = (e) => {
        e.preventDefault();
      };

      // Debug key handler
      const handleKeyPress = (e) => {
        if (e.key === 'F9') {
          // Toggle visibility of collision meshes for debugging
          scene.traverse((object) => {
            if (object.isMesh && 
                (object.name.includes('collider') || 
                 object.name.includes('image-collider') || 
                 object.name.includes('model-collider'))) {
              
              const material = object.material;
              if (material) {
                material.visible = !material.visible;
                material.opacity = material.visible ? 0.5 : 0;
                material.color.set(material.visible ? 0xff0000 : 0xffffff);
                console.log(`Set ${object.name} visibility to ${material.visible}`);
              }
            }
          });
          console.log('Toggled collision mesh visibility (F9)');
        }
      };

      const handleClick = (e) => {
        if (!enabled || !isLocked) return;

        // We don't need to create a new direction vector or raycaster here
        // since we're using the same raycaster that's updated every frame
        
        // Get ALL objects in the scene
        const allObjects = [];
        scene.traverse((object) => {
          if (object.isMesh && 
              object.name !== "raycasterHelper" && 
              object.name !== "laserBeam") {
            allObjects.push(object);
          }
        });
        
        // Use the existing raycaster that's already updated with the laser direction
        const intersects = raycaster.current.intersectObjects(allObjects, false);
        
        if (e.button === 2) { // Right click - DELETE objects
          e.preventDefault();
          
          console.log('Camera position:', camera.position);
          console.log('Raycaster direction:', raycaster.current.ray.direction);
          console.log('Total meshes in scene:', allObjects.length);
          console.log('Raycaster intersects:', intersects.length, intersects);
          
          if (intersects.length > 0) {
            // Get the first intersected object
            const intersectedObject = intersects[0].object;
            console.log('Intersected object:', intersectedObject);
            
            // Find the parent with userData by traversing up
            let parent = intersectedObject;
            let foundObject = null;
            
            // Traverse up the parent chain
            while (parent) {
              console.log('Checking parent:', parent.name || 'unnamed', parent.userData);
              
              if (parent.userData && 
                 (parent.userData.type === 'image' || parent.userData.type === 'model') && 
                 parent.userData.id) {
                foundObject = parent;
                break;
              }
              parent = parent.parent;
            }
            
            if (foundObject) {
              console.log('Found object to remove:', foundObject.userData);
              
              // Highlight the laser beam red briefly to indicate deletion
              const originalColor = rayHelper.current.laser.material.color.clone();
              rayHelper.current.laser.material.color.set(0xff0000);
              rayHelper.current.laser.material.opacity = 1.0;
              
              setTimeout(() => {
                rayHelper.current.laser.material.color.copy(originalColor);
                rayHelper.current.laser.material.opacity = 0.8;
              }, 300);
              
              // Dispatch the remove event
              const removeEvent = new CustomEvent('removeObject', {
                detail: foundObject.userData
              });
              window.dispatchEvent(removeEvent);
            } else {
              console.log('No valid object found in parent chain');
            }
          } else {
            console.log('No intersections found');
          }
        } else if (e.button === 0) { // Left click - ADD objects at empty space
          e.preventDefault();
          
          // If we have an intersection, we can use that point to place a new object
          if (intersects.length > 0) {
            const hitPoint = intersects[0].point;
            console.log('Hit point for new object:', hitPoint);
            
            // Highlight the laser beam green briefly to indicate addition
            const originalColor = rayHelper.current.laser.material.color.clone();
            rayHelper.current.laser.material.color.set(0x00ff00);
            rayHelper.current.laser.material.opacity = 1.0;
            
            setTimeout(() => {
              rayHelper.current.laser.material.color.copy(originalColor);
              rayHelper.current.laser.material.opacity = 0.8;
            }, 300);
            
            // Dispatch an event to add a new object at this position
            const addEvent = new CustomEvent('addObject', {
              detail: {
                position: [hitPoint.x, hitPoint.y, hitPoint.z],
                // You can add more details here if needed
                // type: 'currentSelectedType',
                // id: 'newId',
              }
            });
            window.dispatchEvent(addEvent);
          } else {
            // If no intersection, we can add an object at a fixed distance
            const targetPosition = new THREE.Vector3();
            targetPosition.copy(camera.position);
            targetPosition.addScaledVector(direction, 10); // Place 10 units in front
            
            console.log('Placing object at distance:', targetPosition);
            
            // Highlight the laser beam green briefly
            const originalColor = rayHelper.current.laser.material.color.clone();
            rayHelper.current.laser.material.color.set(0x00ff00);
            rayHelper.current.laser.material.opacity = 1.0;
            
            setTimeout(() => {
              rayHelper.current.laser.material.color.copy(originalColor);
              rayHelper.current.laser.material.opacity = 0.8;
            }, 300);
            
            // Dispatch an event to add a new object
            const addEvent = new CustomEvent('addObject', {
              detail: {
                position: [targetPosition.x, targetPosition.y, targetPosition.z],
                // You can add more details here if needed
              }
            });
            window.dispatchEvent(addEvent);
          }
        }
      };

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyPress);
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [enabled, isLocked, scene, camera]);

  return (
    <>
      <PointerLockControls ref={controls} args={[camera, gl.domElement]} />
    </>
  );
}

export default FPSControls; 