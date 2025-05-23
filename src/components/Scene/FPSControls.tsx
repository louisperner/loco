import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { Vector3, Euler, Quaternion } from 'three';
import { savePosition, loadPosition, POSITION_STORAGE_KEY } from '@/utils/local-storage-sync';
import { useGameStore } from '@/store/useGameStore';

interface FPSControlsProps {
  speed?: number;
  enabled?: boolean;
  gravityEnabled?: boolean;
  floorHeight?: number;
  initialPosition?: [number, number, number];
  onTouchStateChange?: (state: TouchState) => void;
  onMobileChange?: (isMobile: boolean) => void;
  touchState?: TouchState;
}

interface TouchState {
  moveJoystick: {
    active: boolean;
    currentX: number;
    currentY: number;
  };
  lookJoystick: {
    active: boolean;
    currentX: number;
    currentY: number;
  };
}

// interface RayHelper {
//   sphere: THREE.Mesh;
//   arrow: THREE.ArrowHelper;
// }

/**
 * FPSControls Component
 *
 * Handles both keyboard movement (WASD/Arrow keys) and mouse look control
 * in a single system while allowing them to work independently.
 */
const FPSControls: React.FC<FPSControlsProps> = ({
  speed = 5,
  enabled = true,
  gravityEnabled = false,
  floorHeight = -2,
  initialPosition = [0, 0, 0],
  onTouchStateChange,
  onMobileChange,
  touchState,
}) => {
  const { camera, gl, scene } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);
  
  // Get selected hotbar item to check if cube is selected
  const selectedHotbarItem = useGameStore((state) => state.selectedHotbarItem);
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
  // const rayHelper = useRef<RayHelper | null>(null);
  const moveForward = useRef<boolean>(false);
  const moveBackward = useRef<boolean>(false);
  const moveLeft = useRef<boolean>(false);
  const moveRight = useRef<boolean>(false);
  const moveUp = useRef<boolean>(false);
  const moveDown = useRef<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const hasSetInitialPosition = useRef<boolean>(false);

  // References for gravity control
  const verticalVelocity = useRef<number>(0);
  const isOnGround = useRef<boolean>(false);

  // Add references for camera rotation smoothing
  const targetRotationX = useRef<number>(0);
  const targetRotationY = useRef<number>(0);
  const currentRotationX = useRef<number>(0);
  const currentRotationY = useRef<number>(0);
  // const smoothingFactor = 0.15; // Lower = smoother but more laggy

  // Store previous touch state to detect when touch has ended
  const prevTouchActive = useRef<boolean>(false);

  // Physics constants
  const GRAVITY = 0.05;
  const JUMP_FORCE = 0.2;

  // Add euler and quaternion references for camera rotation handling
  const cameraEuler = useRef(new Euler(0, 0, 0, 'YXZ'));
  const cameraQuaternion = useRef(new Quaternion());

  // Add near top of component
  const isMobile = useRef(false);

  // Reference to track when to save position
  const lastPositionSave = useRef<number>(Date.now());
  const saveInterval = 5000; // Save position every 5 seconds

  // Add highlight mesh ref
  const highlightMesh = useRef<THREE.Mesh | null>(null);

  // Update raycaster on each frame
  useFrame(() => {
    if (!enabled) return;

    // Create direction vector from camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    // Update raycaster position and direction
    raycaster.current.ray.origin.copy(camera.position);
    raycaster.current.ray.direction.copy(direction);
    raycaster.current.far = 10; // Limit range for cube detection

    // Only show highlighting if a cube primitive is selected in hotbar
    const isCubeSelected = selectedHotbarItem && 
                          ((selectedHotbarItem.url as string)?.includes('primitive://cube') || 
                           (selectedHotbarItem.fileName as string)?.toLowerCase().includes('cube'));

    // Check for intersections with cube objects only if cube is selected
    if (isCubeSelected) {
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      
      let foundCube = false;
      for (const intersect of intersects) {
      const object = intersect.object;
      
      // Check if this is a cube primitive - support multiple ways cubes can be created
      let cubeObject = null;
      let isCube = false;
      
      // Method 1: Check if the object itself is a cube (direct cube mesh)
      if ((object as THREE.Mesh).geometry && (object as THREE.Mesh).geometry.type === 'BoxGeometry') {
        cubeObject = object;
        isCube = true;
      }
      // Method 2: Check if parent has cube userData (hotbar/nav created cubes)
      else if (object.parent && 
               object.parent.userData?.type === 'model' && 
               object.parent.userData?.primitiveType === 'cube') {
        cubeObject = object.parent;
        isCube = true;
      }
      // Method 3: Check if object has cube userData directly
      else if (object.userData?.type === 'model' && 
               object.userData?.primitiveType === 'cube') {
        cubeObject = object;
        isCube = true;
      }
      // Method 4: Check if object name indicates it's a cube
      else if (object.name && object.name.includes('cube')) {
        cubeObject = object;
        isCube = true;
      }
      // Method 5: Check if parent name indicates it's a cube
      else if (object.parent && object.parent.name && object.parent.name.includes('cube')) {
        cubeObject = object.parent;
        isCube = true;
      }
      
      if (isCube && cubeObject) {
        const worldPosition = intersect.point;
        
        // Calculate which face was hit based on intersection point relative to cube center
        const cubePosition = new THREE.Vector3();
        cubeObject.getWorldPosition(cubePosition);
        
        // Get the relative position of the hit point
        const relativePoint = worldPosition.clone().sub(cubePosition);
        
        // Get cube's bounding box to determine size
        const box = new THREE.Box3().setFromObject(cubeObject);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Determine which face based on which axis has the largest absolute value
        let face = 0;
        const absX = Math.abs(relativePoint.x);
        const absY = Math.abs(relativePoint.y);
        const absZ = Math.abs(relativePoint.z);
        
        if (absX > absY && absX > absZ) {
          // X-axis dominant
          face = relativePoint.x > 0 ? 0 : 1; // Right or Left
        } else if (absY > absZ) {
          // Y-axis dominant
          face = relativePoint.y > 0 ? 2 : 3; // Top or Bottom
        } else {
          // Z-axis dominant
          face = relativePoint.z > 0 ? 4 : 5; // Front or Back
        }
        
        positionHighlightOnFace(cubeObject, face, worldPosition);
        foundCube = true;
        break;
      }
    }
    
      // Hide highlight if no cube is being looked at
      if (!foundCube && highlightMesh.current) {
        highlightMesh.current.visible = false;
      }
    } else {
      // Hide highlight if no cube is selected in hotbar
      if (highlightMesh.current) {
        highlightMesh.current.visible = false;
      }
    }
  });

  // Load saved position on mount
  useEffect(() => {
    if (!enabled) return;

    const savedPosition = loadPosition();
    
    if (savedPosition && !hasSetInitialPosition.current) {
      // Set initial position from saved position
      camera.position.set(savedPosition.x, savedPosition.y, savedPosition.z);
      hasSetInitialPosition.current = true;

      // Initialize rotation values based on current camera rotation
      targetRotationX.current = camera.rotation.x;
      targetRotationY.current = camera.rotation.y;
      currentRotationX.current = camera.rotation.x;
      currentRotationY.current = camera.rotation.y;
    } else if (!hasSetInitialPosition.current) {
      // Use provided initial position
      camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
      hasSetInitialPosition.current = true;

      // Initialize rotation values based on current camera rotation
      targetRotationX.current = camera.rotation.x;
      targetRotationY.current = camera.rotation.y;
      currentRotationX.current = camera.rotation.x;
      currentRotationY.current = camera.rotation.y;
    }
  }, [camera, enabled, initialPosition]);

  // Save position on unmount
  useEffect(() => {
    return () => {
      if (camera) {
        savePosition({
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        });
        // Position saved on component unmount
      }
    };
  }, [camera]);

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

    const onLockStateChange = (): void => {
      setIsLocked(!!document.pointerLockElement);
    };

    // @ts-ignore
    const onLockError = (event: Event): void => {
      //console.warn('Pointer Lock Error:', event);
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

    const handleCanvasClick = (event: MouseEvent): void => {
      // First ensure event.target is an Element
      if (!(event.target instanceof Element)) return;
      
      // Check if the click target or any parent element is from our code components
      const isCodeComponent = (
        // Check for react-live components
        (event.target as Element).closest('.react-live') !== null ||
        // Check for our code container components
        (event.target as Element).closest('.code-container') !== null ||
        // Check ancestor elements for editor-related classes
        (event.target as Element).closest('.editor-container') !== null ||
        (event.target as Element).closest('.preview-container') !== null ||
        // Check for HTML elements from drei
        (event.target as Element).closest('.drei-html') !== null ||
        // Check for ddata attribute we can add to code components
        (event.target as Element).closest('[data-no-pointer-lock]') !== null ||
        // Check if element contains any text nodes with code-related content
        /code|editor|preview|live/i.test((event.target as Element).className || '')
      );

      // Skip pointer lock if the click is inside our code components
      if (isCodeComponent) {
        event.stopPropagation();
        return;
      }

      // Explicitly check that the target is the canvas element itself
      if (event.target === gl.domElement && !isLocked && enabled) {
        // Ensure there's no active HTML element that would cause issues
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body && activeElement !== gl.domElement) {
          // If an HTML element has focus, it might be a UI element - don't lock
          if (activeElement instanceof HTMLElement && 
              !activeElement.classList.contains('canvas-container')) {
            return;
          }
        }
        
        try {
          controls.current.connect();
        } catch (err) {
          console.error('Error locking pointer:', err);
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
    const handleKeyDown = (e: KeyboardEvent): void => {
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
            // Jump when on the ground with gravity enabled
            verticalVelocity.current = JUMP_FORCE;
            isOnGround.current = false;
          } else {
            // Move up when gravity is disabled
            moveUp.current = true;
          }
          break;
        case 'ControlLeft':
          moveDown.current = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
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

  // @ts-ignore
  useFrame((state, delta) => {
    if (!enabled) return;

    // Adjust speed for smooth movement
    const actualSpeed = speed * delta;

    // Movement directions
    const direction = new Vector3();
    const sideDirection = new Vector3();

    // Forward/backward control
    if (moveForward.current) direction.z = -1;
    if (moveBackward.current) direction.z = 1;

    // Left/right control
    if (moveLeft.current) sideDirection.x = -1;
    if (moveRight.current) sideDirection.x = 1;

    // Touch controls - optimized for nipplejs integration
    if (touchState?.moveJoystick?.active) {
      // The values from nipplejs are already normalized (-1 to 1)
      // Apply movement with increased sensitivity for mobile
      const mobileSpeed = 2.0; // Increased speed for mobile to compensate for touchscreen precision
      
      // Apply joystick movement values directly with a slight curve for better control
      // Apply a small deadzone to prevent drift
      const deadzone = 0.1;
      const moveX = Math.abs(touchState.moveJoystick.currentX) > deadzone ? touchState.moveJoystick.currentX : 0;
      const moveY = Math.abs(touchState.moveJoystick.currentY) > deadzone ? touchState.moveJoystick.currentY : 0;
      
      // Apply with slight power curve for better precision (x^2 preserves sign)
      const applyPowerCurve = (value: number) => {
        return Math.sign(value) * Math.pow(Math.abs(value), 1.3);
      };
      
      sideDirection.x = applyPowerCurve(moveX) * mobileSpeed;
      direction.z = applyPowerCurve(moveY) * mobileSpeed; // Note: already inverted in TouchControls
    }

    // Look controls with improved smoothing for nipplejs
    if (touchState?.lookJoystick?.active) {
      prevTouchActive.current = true;

      // Get current camera euler angles
      cameraEuler.current.setFromQuaternion(camera.quaternion);

      // nipplejs provides more consistent values for look control
      const lookSensitivity = 0.08; // Adjusted sensitivity for nipplejs
      
      // Apply a small deadzone to prevent camera drift
      const deadzone = 0.1;
      const lookX = Math.abs(touchState.lookJoystick.currentX) > deadzone ? touchState.lookJoystick.currentX : 0;
      const lookY = Math.abs(touchState.lookJoystick.currentY) > deadzone ? touchState.lookJoystick.currentY : 0;
      
      // Apply rotation deltas with progressive sensitivity (faster for larger movements)
      // This makes small adjustments more precise while allowing quick turns
      const xMagnitude = Math.abs(lookX);
      const yMagnitude = Math.abs(lookY);
      
      // Apply horizontal rotation (yaw) with magnitude-based sensitivity
      if (xMagnitude > 0) {
        // Apply a power curve for more precise control
        const rotationFactor = lookSensitivity * (1 + Math.pow(xMagnitude, 1.5) * 2);
        cameraEuler.current.y -= lookX * rotationFactor;
      }
      
      // Apply vertical rotation (pitch) with magnitude-based sensitivity
      if (yMagnitude > 0) {
        // Apply a power curve for more precise control
        const pitchFactor = lookSensitivity * (1 + Math.pow(yMagnitude, 1.5) * 1.5);
        const pitchDelta = lookY * pitchFactor;
        cameraEuler.current.x -= pitchDelta;
      }

      // Clamp the pitch to avoid flipping
      const maxPitch = Math.PI / 2 - 0.1;
      cameraEuler.current.x = Math.max(-maxPitch, Math.min(maxPitch, cameraEuler.current.x));

      // Convert euler angles back to quaternion
      cameraQuaternion.current.setFromEuler(cameraEuler.current);

      // Apply dynamic smoothing based on movement magnitude
      // Fast movements get less smoothing for responsiveness
      // Slow/precise movements get more smoothing for stability
      const maxSmoothingFactor = 0.3;  // Maximum smoothing (for slow movements)
      const minSmoothingFactor = 0.05; // Minimum smoothing (for fast movements)
      
      // Calculate smoothing factor based on movement magnitude
      const moveMagnitude = Math.max(xMagnitude, yMagnitude);
      const dynamicFactor = maxSmoothingFactor - (moveMagnitude * (maxSmoothingFactor - minSmoothingFactor));
      
      // Apply smoothed rotation using slerp with dynamic factor
      camera.quaternion.slerp(cameraQuaternion.current, Math.min(1, Math.max(0.05, dynamicFactor)));
    } else if (prevTouchActive.current) {
      // When touch has just ended, apply one final smoothing for a graceful stop
      prevTouchActive.current = false;
      
      // Get current camera euler angles
      cameraEuler.current.setFromQuaternion(camera.quaternion);
      
      // Convert euler angles back to quaternion
      cameraQuaternion.current.setFromEuler(cameraEuler.current);
      
      // Apply a gentler final smoothing to prevent abrupt stops
      camera.quaternion.slerp(cameraQuaternion.current, 0.2);
    }

    // Normalize for consistent diagonal movement
    if (direction.length() > 0) direction.normalize();
    if (sideDirection.length() > 0) sideDirection.normalize();

    // Apply camera rotation to movement
    direction.applyQuaternion(camera.quaternion);
    sideDirection.applyQuaternion(camera.quaternion);

    // Keep movement horizontal
    direction.y = 0;
    sideDirection.y = 0;

    // Apply horizontal movement with speed
    camera.position.addScaledVector(direction, actualSpeed);
    camera.position.addScaledVector(sideDirection, actualSpeed);

    // Gravity system
    if (gravityEnabled) {
      // Check floor collision
      if (camera.position.y <= floorHeight + 1.8) {
        // 1.8 = camera/player height
        camera.position.y = floorHeight + 1.8;
        verticalVelocity.current = 0;
        isOnGround.current = true;
      } else {
        // Apply free-fall gravity
        verticalVelocity.current -= GRAVITY;
        isOnGround.current = false;
      }

      // Update vertical position
      camera.position.y += verticalVelocity.current;
    } else {
      // Traditional vertical movement (no gravity)
      if (moveUp.current) camera.position.y += actualSpeed;
      if (moveDown.current) camera.position.y -= actualSpeed;
    }

    // Check if we need to save the position (every 5 seconds)
    const now = Date.now();
    if (now - lastPositionSave.current > saveInterval) {
      savePosition({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      });
      lastPositionSave.current = now;
    }
  });

  useEffect(() => {
    if (controls.current) {
      // Prevent context menu on right click
      const handleContextMenu = (e: MouseEvent): void => {
        e.preventDefault();
      };

      // Debug key handler
      const handleKeyPress = (e: KeyboardEvent): void => {
        if (e.key === 'F9') {
          // Toggle visibility of collision meshes for debugging
          scene.traverse((object) => {
            if (
              (object as THREE.Mesh).isMesh &&
              (object.name.includes('collider') ||
                object.name.includes('image-collider') ||
                object.name.includes('model-collider'))
            ) {
              const mesh = object as THREE.Mesh;
              const material = mesh.material as THREE.MeshBasicMaterial;
              if (material) {
                material.visible = !material.visible;
                material.opacity = material.visible ? 0.5 : 0;
                material.color.set(material.visible ? 0xff0000 : 0xffffff);
                // console.log(`Set ${object.name} visibility to ${material.visible}`);
              }
            }
          });
          // console.log('Toggled collision mesh visibility (F9)');
        }
      };

      const handleClick = (e: MouseEvent): void => {
        // Para cliques simulados de dispositivos móveis, não exija o pointer lock
        // @ts-ignore - acessando propriedade personalizada isSimulated
        const isMobileClick = e.isSimulated === true;

        // Log para debug (pode remover após confirmar funcionamento)
        // console.log('Mouse event:', e.type, e.button, 'isMobileClick:', isMobileClick, e);

        if (!enabled || (!isLocked && !isMobileClick)) return;

        // We don't need to create a new direction vector or raycaster here
        // since we're using the same raycaster that's updated every frame

        // Get ALL objects in the scene
        const allObjects: THREE.Object3D[] = [];
        scene.traverse((object) => {
          if ((object as THREE.Mesh).isMesh && object.name !== 'raycasterHelper') {
            allObjects.push(object);
          }
        });

        // Use the existing raycaster that's already updated with the laser direction
        const intersects = raycaster.current.intersectObjects(allObjects, true);

        if (e.button === 2) {
          // Right click - DELETE objects (always allow removal regardless of selection)
          e.preventDefault();

          if (intersects.length > 0) {
            // Get the first intersected object
            const intersectedObject = intersects[0].object;

            // Find the parent with userData by traversing up
            let parent: THREE.Object3D | null = intersectedObject;
            let foundObject: THREE.Object3D | null = null;

            // Traverse up the parent chain
            while (parent) {
              if (
                parent.userData &&
                (parent.userData.type === 'image' ||
                  parent.userData.type === 'model' ||
                  parent.userData.type === 'video') &&
                parent.userData.id
              ) {
                foundObject = parent;
                break;
              }
              parent = parent.parent;
            }

            if (foundObject) {
              // Dispatch remove event with object data
              const removeEvent = new CustomEvent('removeObject', {
                detail: {
                  type: foundObject.userData.type,
                  id: foundObject.userData.id
                },
              });
              window.dispatchEvent(removeEvent);
            }
          }
        } else if (e.button === 0) {
          // Left click - Handle cube placement or general object addition
          e.preventDefault();

          // Check if a cube is selected in hotbar
          const isCubeSelected = selectedHotbarItem && 
                                ((selectedHotbarItem.url as string)?.includes('primitive://cube') || 
                                 (selectedHotbarItem.fileName as string)?.toLowerCase().includes('cube'));

          if (isCubeSelected && intersects.length > 0) {
            // Use the SAME logic as the highlighting system to ensure consistency
            let foundCube = false;
            let targetCube = null;
            let face = 0;
            let worldPosition = null;
            
            for (const intersect of intersects) {
              const object = intersect.object;
              
              // Check if this is a cube primitive - support multiple ways cubes can be created
              let cubeObject = null;
              let isCube = false;
              
              // Method 1: Check if the object itself is a cube (direct cube mesh)
              if ((object as THREE.Mesh).geometry && (object as THREE.Mesh).geometry.type === 'BoxGeometry') {
                cubeObject = object;
                isCube = true;
              }
              // Method 2: Check if parent has cube userData (hotbar/nav created cubes)
              else if (object.parent && 
                       object.parent.userData?.type === 'model' && 
                       object.parent.userData?.primitiveType === 'cube') {
                cubeObject = object.parent;
                isCube = true;
              }
              // Method 3: Check if object has cube userData directly
              else if (object.userData?.type === 'model' && 
                       object.userData?.primitiveType === 'cube') {
                cubeObject = object;
                isCube = true;
              }
              // Method 4: Check if object name indicates it's a cube
              else if (object.name && object.name.includes('cube')) {
                cubeObject = object;
                isCube = true;
              }
              // Method 5: Check if parent name indicates it's a cube
              else if (object.parent && object.parent.name && object.parent.name.includes('cube')) {
                cubeObject = object.parent;
                isCube = true;
              }
              
              if (isCube && cubeObject) {
                targetCube = cubeObject;
                worldPosition = intersect.point;
                
                // Calculate which face was hit based on intersection point relative to cube center
                const cubePosition = new THREE.Vector3();
                cubeObject.getWorldPosition(cubePosition);
                
                // Get the relative position of the hit point
                const relativePoint = worldPosition.clone().sub(cubePosition);
                
                // Get cube's bounding box to determine size
                const box = new THREE.Box3().setFromObject(cubeObject);
                const size = new THREE.Vector3();
                box.getSize(size);
                
                // Determine which face based on which axis has the largest absolute value
                const absX = Math.abs(relativePoint.x);
                const absY = Math.abs(relativePoint.y);
                const absZ = Math.abs(relativePoint.z);
                
                if (absX > absY && absX > absZ) {
                  // X-axis dominant
                  face = relativePoint.x > 0 ? 0 : 1; // Right or Left
                } else if (absY > absZ) {
                  // Y-axis dominant
                  face = relativePoint.y > 0 ? 2 : 3; // Top or Bottom
                } else {
                  // Z-axis dominant
                  face = relativePoint.z > 0 ? 4 : 5; // Front or Back
                }
                
                foundCube = true;
                break;
              }
            }
            
            if (foundCube && targetCube && worldPosition) {
              // Calculate face normal and position based on face index (same as highlighting)
              const faceNormals = [
                new THREE.Vector3(1, 0, 0),   // Right face (+X)
                new THREE.Vector3(-1, 0, 0),  // Left face (-X)
                new THREE.Vector3(0, 1, 0),   // Top face (+Y)
                new THREE.Vector3(0, -1, 0),  // Bottom face (-Y)
                new THREE.Vector3(0, 0, 1),   // Front face (+Z)
                new THREE.Vector3(0, 0, -1),  // Back face (-Z)
              ];

              if (face >= 0 && face < faceNormals.length) {
                const normal = faceNormals[face].clone();
                
                // Get cube position
                const cubePosition = new THREE.Vector3();
                targetCube.getWorldPosition(cubePosition);
                
                // Calculate the new cube position (1 unit away from the face)
                const newPosition = cubePosition.clone().add(normal);
                
                // Round to grid for Minecraft-like snapping
                newPosition.x = Math.round(newPosition.x);
                newPosition.y = Math.round(newPosition.y);
                newPosition.z = Math.round(newPosition.z);
                
                // Dispatch cube placement event
                console.log('FPSControls: Dispatching addObject event for cube snap', {
                  position: [newPosition.x, newPosition.y, newPosition.z],
                  cubePosition: cubePosition.toArray(),
                  face: face,
                  normal: normal.toArray()
                });
                const addEvent = new CustomEvent('addObject', {
                  detail: {
                    position: [newPosition.x, newPosition.y, newPosition.z],
                    type: 'cube',
                    snapToFace: true,
                  },
                });
                window.dispatchEvent(addEvent);
                             }
             } else {
               // Regular placement on any surface when no cube is found
               const hitPoint = intersects[0].point;
              const addEvent = new CustomEvent('addObject', {
                detail: {
                  position: [Math.round(hitPoint.x), Math.round(hitPoint.y), Math.round(hitPoint.z)],
                  type: 'cube',
                },
              });
              window.dispatchEvent(addEvent);
            }
          } else if (intersects.length > 0) {
            // Regular object placement
            const hitPoint = intersects[0].point;
            const addEvent = new CustomEvent('addObject', {
              detail: {
                position: [hitPoint.x, hitPoint.y, hitPoint.z],
              },
            });
            window.dispatchEvent(addEvent);
          } else {
            // No intersection - place at fixed distance
            const targetPosition = new THREE.Vector3();
            targetPosition.copy(camera.position);
            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            targetPosition.addScaledVector(direction, 10);

            const addEvent = new CustomEvent('addObject', {
              detail: {
                position: [targetPosition.x, targetPosition.y, targetPosition.z],
              },
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

    return undefined; // Return undefined when controls.current is falsy
  }, [enabled, isLocked, scene, camera, selectedHotbarItem]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      isMobile.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      onMobileChange?.(isMobile.current);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [onMobileChange]);

  // Touch event handlers
  useEffect(() => {
    if (!enabled) return;

    // Enhanced touch integration for nipplejs
    // This acts as a bridge between the nipplejs controls and the FPS system
    
    // Set up event listeners for the custom events that will be dispatched by TouchControls
    const handleJoystickEvent = (event: CustomEvent) => {
      if (event.detail && event.detail.type) {
        // Handle different joystick events
        switch (event.detail.type) {
          case 'move:start':
            // Reset any stuck state that might have occurred
            if (moveForward.current && moveBackward.current) {
              moveForward.current = false;
              moveBackward.current = false;
            }
            if (moveLeft.current && moveRight.current) {
              moveLeft.current = false;
              moveRight.current = false;
            }
            break;
            
          case 'look:start':
            // Reset camera rotation smoothing
            prevTouchActive.current = true;
            break;
            
          case 'move:end':
            // Ensure movement stops
            if (touchState?.moveJoystick) {
              // Force update the touch state to ensure movement stops
              onTouchStateChange?.({
                moveJoystick: {
                  active: false,
                  currentX: 0,
                  currentY: 0
                },
                lookJoystick: touchState.lookJoystick
              });
            }
            break;
            
          case 'look:end':
            // Ensure looking stops smoothly
            if (touchState?.lookJoystick) {
              // Force update the touch state to ensure rotation stops
              onTouchStateChange?.({
                moveJoystick: touchState.moveJoystick,
                lookJoystick: {
                  active: false,
                  currentX: 0,
                  currentY: 0
                }
              });
            }
            break;
            
          case 'look:move':
            // Handle camera rotation from right joystick
            if (controls.current && event.detail.x !== undefined && event.detail.y !== undefined) {
              // Update touch state for camera rotation
              // This will be handled by the useFrame hook that already has 
              // proper camera rotation logic for touch joysticks
              onTouchStateChange?.({
                moveJoystick: touchState?.moveJoystick || {
                  active: false,
                  currentX: 0,
                  currentY: 0
                },
                lookJoystick: {
                  active: true,
                  currentX: event.detail.x,
                  currentY: event.detail.y
                }
              });
            }
            break;
        }
      }
    };

    // Listen for joystick events
    window.addEventListener('joystick-event', handleJoystickEvent as EventListener);

    return () => {
      // Clean up event listeners
      window.removeEventListener('joystick-event', handleJoystickEvent as EventListener);
    };
  }, [enabled, onTouchStateChange, touchState]);

  // Add event handler for saving position on page close
  useEffect(() => {
    if (!enabled || !camera) return;
    
    // Create handler function that saves position without blocking
    const handleBeforeUnload = () => {
      // Quickly save position data synchronously
      if (camera) {
        try {
          localStorage.setItem(
            POSITION_STORAGE_KEY, 
            JSON.stringify({
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z
            })
          );
        } catch (e) {
          // Silent fail - don't block page close
        }
      }
    };
    
    // Add event listener with capture phase to ensure it runs early
    window.addEventListener('beforeunload', handleBeforeUnload, { capture: true });
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload, { capture: true });
    };
  }, [camera, enabled]);

  // Create highlight mesh for cube faces
  useEffect(() => {
    if (!enabled) return;

    // Create highlight mesh with better visibility
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // Green color for better visibility
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthTest: false, // Render on top
      depthWrite: false,
    });
    
    highlightMesh.current = new THREE.Mesh(geometry, material);
    highlightMesh.current.visible = false;
    highlightMesh.current.renderOrder = 999; // Render last
    scene.add(highlightMesh.current);

    return () => {
      if (highlightMesh.current) {
        scene.remove(highlightMesh.current);
        highlightMesh.current.geometry.dispose();
        (highlightMesh.current.material as THREE.Material).dispose();
      }
    };
  }, [enabled, scene]);

  // Function to position highlight on cube face
  const positionHighlightOnFace = (cubeObject: THREE.Object3D, face: number, worldPosition: THREE.Vector3) => {
    if (!highlightMesh.current) return;

    const cubePosition = new THREE.Vector3();
    cubeObject.getWorldPosition(cubePosition);
    
    // Get cube's bounding box to determine actual size
    const box = new THREE.Box3().setFromObject(cubeObject);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Calculate face normal and position based on face index
    const faceNormals = [
      new THREE.Vector3(1, 0, 0),   // Right face (+X)
      new THREE.Vector3(-1, 0, 0),  // Left face (-X)
      new THREE.Vector3(0, 1, 0),   // Top face (+Y)
      new THREE.Vector3(0, -1, 0),  // Bottom face (-Y)
      new THREE.Vector3(0, 0, 1),   // Front face (+Z)
      new THREE.Vector3(0, 0, -1),  // Back face (-Z)
    ];

    if (face < 0 || face >= faceNormals.length) return;

    const normal = faceNormals[face].clone();
    
    // Calculate the face center position
    const faceCenter = cubePosition.clone();
    faceCenter.add(normal.clone().multiplyScalar(size.x * 0.5)); // Use half the cube size
    
    // Position highlight slightly in front of the face
    const highlightPosition = faceCenter.clone().add(normal.clone().multiplyScalar(0.01));
    
    highlightMesh.current.position.copy(highlightPosition);
    
    // Set the rotation to align with the face normal
    if (Math.abs(normal.x) > 0.9) {
      // X-axis faces (left/right)
      highlightMesh.current.rotation.set(0, normal.x > 0 ? Math.PI/2 : -Math.PI/2, 0);
    } else if (Math.abs(normal.y) > 0.9) {
      // Y-axis faces (top/bottom)
      highlightMesh.current.rotation.set(normal.y > 0 ? -Math.PI/2 : Math.PI/2, 0, 0);
    } else {
      // Z-axis faces (front/back)
      highlightMesh.current.rotation.set(0, normal.z > 0 ? 0 : Math.PI, 0);
    }
    
    // Scale the highlight to match the cube face size
    const faceSize = Math.max(size.x, size.y, size.z);
    highlightMesh.current.scale.setScalar(faceSize * 1.01);
    
    highlightMesh.current.visible = true;
  };

  return (
    <>
      <PointerLockControls ref={controls} camera={camera} domElement={gl.domElement} />
    </>
  );
};

export default FPSControls;
