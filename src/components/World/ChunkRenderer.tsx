import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
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

// Single cube geometry for all objects
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

// Enhanced materials for different cube types with collision properties
const createSpaceCubeMaterial = (color: string, type: string) => {
  const baseColor = new THREE.Color(color);
  
  switch (type) {
    case 'energy_crystal':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.1,
        metalness: 0.3,
        emissive: baseColor.clone().multiplyScalar(0.3),
        transparent: true,
        opacity: 0.9
      });
    
    case 'cargo_container':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.4,
        metalness: 0.8,
        emissive: baseColor.clone().multiplyScalar(0.05)
      });
    
    case 'metal_fragment':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.6,
        metalness: 0.9
      });
    
    case 'large_wreckage':
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.8,
        metalness: 0.7,
        emissive: baseColor.clone().multiplyScalar(0.02)
      });
    
    default: // small_debris, asteroid_chunk
      return new THREE.MeshStandardMaterial({ 
        color: baseColor,
        roughness: 0.9,
        metalness: 0.2
      });
  }
};

// Individual physics cube component
const PhysicsCube: React.FC<{
  object: SpaceObject;
  material: THREE.Material;
  fadeOpacity: number;
}> = ({ object, material, fadeOpacity }) => {
  // Create physics box with mass and position
  const [ref, api] = useBox(() => ({
    mass: object.mass || 1,
    position: object.position,
    rotation: object.rotation,
    type: object.isFloating ? 'Dynamic' : 'Static',
    material: {
      friction: 0.4,
      restitution: 0.3,
    },
    args: [object.scale, object.scale, object.scale], // Box dimensions
  }));

  // Apply material opacity for fade animation
  useEffect(() => {
    if (material && 'opacity' in material) {
      material.transparent = true;
      material.opacity = fadeOpacity;
      material.needsUpdate = true;
    }
  }, [material, fadeOpacity]);

  return (
    <mesh
      ref={ref}
      material={material}
      geometry={cubeGeometry}
      scale={[object.scale, object.scale, object.scale]}
      castShadow
      receiveShadow
      userData={{
        type: 'space_cube',
        objectType: object.type.id,
        mass: object.mass,
        hasCollision: object.hasCollision
      }}
    />
  );
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
  const [fadeProgress, setFadeProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(enableFadeAnimation);
  
  // Calculate world position of chunk center
  const chunkWorldX = chunk.coord.x * 200; // Space chunks are 200 units
  const chunkWorldZ = chunk.coord.z * 200;
  
  // Calculate distance from player for fade animation
  const distanceFromPlayer = useMemo(() => {
    if (!playerPosition) return 0;
    const chunkCenterX = chunkWorldX + 100;
    const chunkCenterZ = chunkWorldZ + 100;
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
    const animationDuration = 1500; // 1.5 seconds fade in for sparse objects
    
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

  // Generate physics cubes with collision
  const physicsCubes = useMemo(() => {
    if (!chunk.generated || !chunk.objects.length) return [];
    
    return chunk.objects.map((object, index) => {
      const material = createSpaceCubeMaterial(object.color, object.type.id);
      
      return (
        <PhysicsCube
          key={`${chunk.coord.x}-${chunk.coord.z}-${index}`}
          object={object}
          material={material}
          fadeOpacity={fadeProgress}
        />
      );
    });
  }, [chunk, fadeProgress]);
  
  // Frustum culling and distance culling
  useFrame(() => {
    if (!enableCulling || !groupRef.current) return;
    
    // Calculate distance from camera to chunk center
    const chunkCenter = new THREE.Vector3(
      chunkWorldX + 100,
      0, // Space objects can be at any Y
      chunkWorldZ + 100
    );
    
    const distanceToCamera = camera.position.distanceTo(chunkCenter);
    
    // Distance culling for sparse space
    const maxRenderDistance = renderDistance * 200; // Convert chunk distance to world units
    const shouldBeVisible = distanceToCamera <= maxRenderDistance;
    
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
      groupRef.current.visible = shouldBeVisible;
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, 0, 0]}
      visible={isVisible}
    >
      {physicsCubes}
    </group>
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
  renderDistance = 3, // Reduced for sparse space
  enableCulling = true,
  terrainSeed,
  enableFadeAnimation = true
}) => {
  const [spaceGenerator] = useState(() => SpaceGenerator.getInstance(terrainSeed));
  const [visibleChunks, setVisibleChunks] = useState<Map<string, { chunk: SpaceChunk; generationTime: number }>>(new Map());
  const lastPlayerChunk = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  
  // Update visible chunks when player moves
  useFrame(() => {
    const currentChunkX = Math.floor(playerPosition.x / 200); // Space chunks are 200 units
    const currentChunkZ = Math.floor(playerPosition.z / 200);
    
    // Only update if player moved to a different chunk
    if (currentChunkX !== lastPlayerChunk.current.x || 
        currentChunkZ !== lastPlayerChunk.current.z) {
      
      lastPlayerChunk.current = { x: currentChunkX, z: currentChunkZ };
      
      // Get chunks in render distance
      const newVisibleChunks = new Map<string, { chunk: SpaceChunk; generationTime: number }>();
      const currentTime = Date.now();
      
      // Generate chunks in a spiral pattern for sparse space
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
          const fadeDelay = enableFadeAnimation ? distance * 300 : 0; // 300ms per distance unit for sparse space
          
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