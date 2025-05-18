import * as THREE from 'three';

// Parse position from a string like "0,0,0" or "x:0 y:0 z:0"
export const parsePosition = (posStr: string): [number, number, number] | null => {
  if (!posStr) return null;
  
  // Try x:0 y:0 z:0 format
  if (posStr.includes('x:') || posStr.includes('y:') || posStr.includes('z:')) {
    const xMatch = posStr.match(/x:(-?\d+(\.\d+)?)/);
    const yMatch = posStr.match(/y:(-?\d+(\.\d+)?)/);
    const zMatch = posStr.match(/z:(-?\d+(\.\d+)?)/);
    
    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const z = zMatch ? parseFloat(zMatch[1]) : 0;
    
    return [x, y, z];
  }
  
  // Try comma-separated format
  const parts = posStr.split(',').map(part => parseFloat(part.trim()));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return [parts[0], parts[1], parts[2]];
  }
  
  return null;
};

// Extract number from string like "create 5 cubes"
export const extractNumber = (str: string): number => {
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

// Get camera position for placing objects
export const getCameraPosition = (offsetDistance = 3): [number, number, number] => {
  if (!window.mainCamera) return [0, 1, 0];
  
  const camera = window.mainCamera;
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);

  const pos = new THREE.Vector3();
  pos.copy(camera.position);
  direction.multiplyScalar(offsetDistance); // Place units in front of camera
  pos.add(direction);
  
  return [pos.x, pos.y, pos.z];
};

// Get camera rotation
export const getCameraRotation = (): [number, number, number] => {
  if (!window.mainCamera) return [0, 0, 0];
  const camera = window.mainCamera;
  return [camera.rotation.x, camera.rotation.y, camera.rotation.z];
};

// Format message preview (truncate long messages)
export const formatMessagePreview = (content: string, maxLength = 60) => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}; 