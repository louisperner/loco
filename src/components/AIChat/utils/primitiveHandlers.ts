import { getCameraPosition } from './aiChatUtils';
import { useModelStore } from '@/store/useModelStore';

// Create a primitive shape (cube, sphere, plane)
export const createPrimitive = (type: 'cube' | 'sphere' | 'plane', position: [number, number, number]) => {
  const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Create a simple SVG thumbnail
  const svgString = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#1A1A1A"/>
      ${
        type === 'cube'
          ? '<rect x="20" y="20" width="60" height="60" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
          : type === 'sphere'
            ? '<circle cx="50" cy="50" r="30" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
            : '<rect x="20" y="40" width="60" height="20" fill="#4ade80" stroke="#2dd4bf" stroke-width="2"/>'
      }
    </svg>
  `;

  // Add primitive to the model store
  const { addModel } = useModelStore.getState();
  addModel({
    id,
    url: `primitive://${type}`,
    fileName: `${type}.${type === 'plane' ? 'glb' : 'gltf'}`,
    position,
    rotation: [0, 0, 0], // Always keep primitives axis-aligned
    scale: 1,
    isInScene: true,
    isPrimitive: true,
    primitiveType: type,
    color: '#4ade80',
    thumbnailUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
  });
};

// Create primitive at camera position
export const createPrimitiveAtCamera = (type: 'cube' | 'sphere' | 'plane', count: number = 1, position: [number, number, number] = getCameraPosition(3)): [number, number, number] => {
  // For cubes, snap to grid
  if (type === 'cube') {
    position = [
      Math.round(position[0]),
      Math.max(0, Math.round(position[1])),
      Math.round(position[2])
    ];
  }
  
  // Create multiple items if count > 1
  for (let i = 0; i < count; i++) {
    let posOffset: [number, number, number];
    
    if (type === 'plane') {
      posOffset = [
        position[0] + (i % 3) * 2, 
        position[1], 
        position[2] + Math.floor(i / 3) * 2
      ];
    } else {
      posOffset = [
        position[0] + (i % 3), 
        position[1] + Math.floor(i / 9), 
        position[2] + Math.floor((i % 9) / 3)
      ];
    }
    
    createPrimitive(type, posOffset);
  }
  
  return position;
}; 