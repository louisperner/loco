import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceGenerator, SpaceChunk, SpaceObject, SPACE_OBJECT_TYPES } from './TerrainGenerator';

interface SpaceChunkRendererProps {
  chunk: SpaceChunk;
  renderDistance: number;
  enableCulling?: boolean;
  animationDelay?: number;
  playerPosition?: THREE.Vector3;
  enableFadeAnimation?: boolean;
}

// Shared geometries for different space objects
const sharedGeometries = {
  sphere: new THREE.SphereGeometry(1, 16, 12),
  asteroid: new THREE.DodecahedronGeometry(1, 1),
  crystal: new THREE.OctahedronGeometry(1, 0),
  debris: new THREE.BoxGeometry(1, 1, 1),
  station: new THREE.CylinderGeometry(1, 1, 2, 8),
};

// Enhanced materials with space-like properties
const createSpaceMaterial = (color: string, type: string) => {
  const baseColor = new THREE.Color(color);
  
  switch (type) {
    case 'planet_small':
    case 'planet_large':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.8,
        metalness: 0.1,
        emissive: baseColor.clone().multiplyScalar(0.05)
      });
    
    case 'moon':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.9,
        metalness: 0.0
      });
    
    case 'crystal_formation':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.1,
        metalness: 0.3,
        emissive: baseColor.clone().multiplyScalar(0.2),
        transparent: true,
        opacity: 0.8
      });
    
    case 'space_station':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.3,
        metalness: 0.8,
        emissive: baseColor.clone().multiplyScalar(0.1)
      });
    
    default: // asteroids and debris
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.9,
        metalness: 0.2
      });
  }
};

// Get appropriate geometry for object type
const getGeometryForType = (type: string): THREE.BufferGeometry => {
  switch (type) {
    case 'planet_small':
    case 'planet_large':
    case 'moon':
      return sharedGeometries.sphere;
    case 'crystal_formation':
      return sharedGeometries.crystal;
    case 'space_station':
      return sharedGeometries.station;
    case 'debris':
      return sharedGeometries.debris;
    default: // asteroids
      return sharedGeometries.asteroid;
  }
};

export const SpaceChunkRenderer: React.FC<SpaceChunkRendererProps> = ({ 
  chunk, 
  renderDistance,
  enableCulling = true,
  animationDelay = 0,
  playerPosition,
  enableFadeAnimation = true
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [instancedMeshes, setInstancedMeshes] = useState<Map<string, THREE.InstancedMesh>>(new Map());
  const [fadeProgress, setFadeProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(enableFadeAnimation);
  
  // Calculate world position of chunk center
  const chunkWorldX = chunk.coord.x * 100; // Space chunks are 100 units
  const chunkWorldZ = chunk.coord.z * 100;
  
  // Calculate distance from player for fade animation
  const distanceFromPlayer = useMemo(() => {
    if (!playerPosition) return 0;
    const chunkCenterX = chunkWorldX + 50;
    const chunkCenterZ = chunkWorldZ + 50;
    return Math.sqrt(
      Math.pow(chunkCenterX - playerPosition.x, 2) + 
      Math.pow(chunkCenterZ - playerPosition.z, 2)
    );
  }, [chunkWorldX, chunkWorldZ, playerPosition]);

  // Fade animation effect
  useEffect(() => {
    if (!isAnimating || !enableFadeAnimation) {
      setFadeProgress(1);
      setIsAnimating(false);
      return;
    }

    const startTime = Date.now() + animationDelay;
    const animationDuration = 2000; // 2 seconds fade in
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Smooth fade in
      const easedProgress = progress * progress * (3 - 2 * progress); // Smoothstep
      
      setFadeProgress(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    // Start animation after delay
    const timeout = setTimeout(() => {
      requestAnimationFrame(animate);
    }, Math.max(0, animationDelay));
    
    return () => {
      clearTimeout(timeout);
    };
  }, [animationDelay, isAnimating, enableFadeAnimation]);

  // Generate optimized mesh for space objects using instanced rendering
  const generateSpaceObjectMesh = useMemo(() => {
    if (!chunk.generated || !chunk.objects.length) return new Map();
    
    // Group objects by type for instanced rendering
    const objectGroups = new Map<string, Array<{ object: SpaceObject; distance: number }>>();
    
    chunk.objects.forEach(obj => {
      const objectType = obj.type.id;
      if (!objectGroups.has(objectType)) {
        objectGroups.set(objectType, []);
      }
      
      // Calculate distance from player for LOD
      const distance = playerPosition ? 
        Math.sqrt(
          Math.pow(obj.position[0] - playerPosition.x, 2) +
          Math.pow(obj.position[1] - playerPosition.y, 2) +
          Math.pow(obj.position[2] - playerPosition.z, 2)
        ) : 0;
      
      objectGroups.get(objectType)!.push({ object: obj, distance });
    });
    
    return objectGroups;
  }, [chunk, playerPosition]);
  
  // Create instanced meshes for each object type with fade animation
  useEffect(() => {
    if (!generateSpaceObjectMesh.size) return;
    
    const newInstancedMeshes = new Map<string, THREE.InstancedMesh>();
    
    generateSpaceObjectMesh.forEach((objects, objectType) => {
      if (objects.length === 0) return;
      
      const geometry = getGeometryForType(objectType);
      const material = createSpaceMaterial(objects[0].object.color, objectType);
      
      // Apply fade animation to material
      if (enableFadeAnimation) {
        material.transparent = true;
        material.opacity = fadeProgress;
      }
      
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        objects.length
      );
      
      // Set positions and rotations for each instance
      const matrix = new THREE.Matrix4();
      const scale = new THREE.Vector3();
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      
             objects.forEach(({ object, distance }: { object: SpaceObject; distance: number }, index: number) => {
        // Apply LOD scaling based on distance
        let lodScale = 1;
        if (distance > renderDistance * 50) { // Half detail at far distance
          lodScale = 0.5;
        }
        
        scale.setScalar(object.scale * lodScale);
        position.set(object.position[0], object.position[1], object.position[2]);
        
        // Apply rotation
        quaternion.setFromEuler(new THREE.Euler(
          object.rotation[0],
          object.rotation[1], 
          object.rotation[2]
        ));
        
        matrix.compose(position, quaternion, scale);
        instancedMesh.setMatrixAt(index, matrix);
      });
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      
      // Add to group
      if (groupRef.current) {
        groupRef.current.add(instancedMesh);
      }
      
      newInstancedMeshes.set(objectType, instancedMesh);
    });
    
    setInstancedMeshes(newInstancedMeshes);
    
    // Cleanup function
    return () => {
      newInstancedMeshes.forEach(mesh => {
        if (groupRef.current) {
          groupRef.current.remove(mesh);
        }
        mesh.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
    };
  }, [generateSpaceObjectMesh, fadeProgress, enableFadeAnimation, renderDistance]);

  // Update fade animation
  useFrame(() => {
    if (enableFadeAnimation && instancedMeshes.size > 0) {
      instancedMeshes.forEach(mesh => {
        if (mesh.material instanceof THREE.Material && mesh.material.transparent) {
          mesh.material.opacity = fadeProgress;
          mesh.material.needsUpdate = true;
        }
      });
    }
  });
  
  // Frustum culling and distance culling
  useFrame(() => {
    if (!enableCulling || !groupRef.current) return;
    
    // Calculate distance from camera to chunk center
    const chunkCenter = new THREE.Vector3(
      chunkWorldX + 50,
      0, // Space objects can be at any Y
      chunkWorldZ + 50
    );
    
    const distanceToCamera = camera.position.distanceTo(chunkCenter);
    
    // Distance culling
    const maxRenderDistance = renderDistance * 100; // Convert chunk distance to world units
    const shouldBeVisible = distanceToCamera <= maxRenderDistance;
    
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
      groupRef.current.visible = shouldBeVisible;
    }
    
    // LOD system - adjust material properties for distant chunks
    if (shouldBeVisible && instancedMeshes.size > 0) {
      const lodLevel = distanceToCamera > maxRenderDistance * 0.7 ? 'low' : 'high';
      
      instancedMeshes.forEach(mesh => {
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          if (lodLevel === 'low') {
            // Reduce quality for distant chunks
            mesh.material.roughness = 1;
            mesh.material.metalness = 0;
            mesh.material.emissive.setScalar(0);
          } else {
            // Restore full quality for nearby chunks
            mesh.material.roughness = 0.8;
            mesh.material.metalness = 0.1;
          }
        }
      });
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, 0, 0]}
      visible={isVisible}
    />
  );
};

interface SpaceWorldRendererProps {
  playerPosition: THREE.Vector3;
  renderDistance?: number;
  enableCulling?: boolean;
  terrainSeed?: number;
  enableFadeAnimation?: boolean;
}

export const SpaceWorldRenderer: React.FC<SpaceWorldRendererProps> = ({
  playerPosition,
  renderDistance = 4,
  enableCulling = true,
  terrainSeed,
  enableFadeAnimation = true
}) => {
  const [spaceGenerator] = useState(() => SpaceGenerator.getInstance(terrainSeed));
  const [visibleChunks, setVisibleChunks] = useState<Map<string, { chunk: SpaceChunk; generationTime: number }>>(new Map());
  const lastPlayerChunk = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  
  // Update visible chunks when player moves
  useFrame(() => {
    const currentChunkX = Math.floor(playerPosition.x / 100); // Space chunks are 100 units
    const currentChunkZ = Math.floor(playerPosition.z / 100);
    
    // Only update if player moved to a different chunk
    if (currentChunkX !== lastPlayerChunk.current.x || 
        currentChunkZ !== lastPlayerChunk.current.z) {
      
      lastPlayerChunk.current = { x: currentChunkX, z: currentChunkZ };
      
      // Get chunks in render distance
      const newVisibleChunks = new Map<string, { chunk: SpaceChunk; generationTime: number }>();
      const currentTime = Date.now();
      
      // Generate chunks in a spiral pattern
      const chunksToGenerate: Array<{ x: number; z: number; distance: number }> = [];
      
      for (let x = currentChunkX - renderDistance; x <= currentChunkX + renderDistance; x++) {
        for (let z = currentChunkZ - renderDistance; z <= currentChunkZ + renderDistance; z++) {
          const distance = Math.sqrt(Math.pow(x - currentChunkX, 2) + Math.pow(z - currentChunkZ, 2));
          if (distance <= renderDistance) {
            chunksToGenerate.push({ x, z, distance });
          }
        }
      }
      
      // Sort by distance for smooth loading
      chunksToGenerate.sort((a, b) => a.distance - b.distance);
      
      // Generate chunks with staggered timing for fade effect
      chunksToGenerate.forEach(({ x, z, distance }, index) => {
        const chunkKey = `${x},${z}`;
        const existingChunk = visibleChunks.get(chunkKey);
        
        if (existingChunk) {
          // Keep existing chunk
          newVisibleChunks.set(chunkKey, existingChunk);
        } else {
          // Generate new chunk with fade delay
          const chunk = spaceGenerator.generateChunk(x, z);
          const fadeDelay = enableFadeAnimation ? distance * 200 : 0; // 200ms per distance unit
          
          newVisibleChunks.set(chunkKey, {
            chunk,
            generationTime: currentTime + fadeDelay
          });
        }
      });
      
      setVisibleChunks(newVisibleChunks);
      
      // Cleanup distant chunks to save memory
      spaceGenerator.cleanupDistantChunks(
        playerPosition.x,
        playerPosition.z,
        renderDistance + 2 // Keep a buffer
      );
    }
  });
  
  return (
    <group>
      {Array.from(visibleChunks.entries()).map(([chunkKey, { chunk, generationTime }]) => {
        const currentTime = Date.now();
        const animationDelay = Math.max(0, generationTime - currentTime);
        
        return (
          <SpaceChunkRenderer
            key={chunkKey}
            chunk={chunk}
            renderDistance={renderDistance}
            enableCulling={enableCulling}
            animationDelay={animationDelay}
            playerPosition={playerPosition}
            enableFadeAnimation={enableFadeAnimation}
          />
        );
      })}
    </group>
  );
};

// Export for backward compatibility
export const ChunkRenderer = SpaceChunkRenderer;
export const WorldRenderer = SpaceWorldRenderer; 