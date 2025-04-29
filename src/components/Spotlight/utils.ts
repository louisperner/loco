import * as THREE from 'three';

// Parse AI response for command execution
export const parseAIResponseForCommands = (response: string) => {
  // Check for commands like "Add a cube" or "Create a sphere"
  const objectMatches = response.match(/add\s+(a\s+)?(cube|sphere|plane)/gi);
  if (objectMatches) {
    const type = objectMatches[0].toLowerCase();
    if (type.includes('cube')) {
      return 'cube';
    } else if (type.includes('sphere')) {
      return 'sphere';
    } else if (type.includes('plane')) {
      return 'plane';
    }
  }
  
  // Check for "Draw" command
  if (response.match(/start\s+drawing|drawing\s+mode|enable\s+drawing/gi)) {
    return 'draw';
  }
  
  // Check for "Code" command
  if (response.match(/add\s+(a\s+)?code(\s+block)?|create\s+(a\s+)?code(\s+block)?/gi)) {
    return 'code';
  }
  
  return null;
};

// Define a type for window with mainCamera
interface WindowWithCamera extends Window {
  mainCamera?: THREE.Camera;
}

// Get camera position and rotation
export const getCameraPositionAndRotation = (window: WindowWithCamera): { 
  position: [number, number, number]; 
  rotation: [number, number, number];
} => {
  let position: [number, number, number] = [0, 1, 0];
  let rotation: [number, number, number] = [0, 0, 0];
  
  if (window.mainCamera) {
    const camera = window.mainCamera;
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    const pos = new THREE.Vector3();
    pos.copy(camera.position);
    direction.multiplyScalar(3); // Place 3 units in front of camera
    pos.add(direction);
    position = [pos.x, pos.y, pos.z];
    rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z];
  }
  
  return { position, rotation };
}; 