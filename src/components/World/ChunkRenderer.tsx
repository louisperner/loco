import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TerrainGenerator, Chunk, Block, BLOCK_TYPES } from './TerrainGenerator';

interface ChunkRendererProps {
  chunk: Chunk;
  renderDistance: number;
  enableCulling?: boolean;
}

interface ChunkMesh {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instancedMesh: THREE.InstancedMesh;
}

// Shared geometries and materials for performance
const sharedGeometries = {
  cube: new THREE.BoxGeometry(1, 1, 1),
};

const sharedMaterials = {
  stone: new THREE.MeshStandardMaterial({ color: '#6b7280' }),
  dirt: new THREE.MeshStandardMaterial({ color: '#8b4513' }),
  grass: new THREE.MeshStandardMaterial({ color: '#4ade80' }),
  sand: new THREE.MeshStandardMaterial({ color: '#eab308' }),
  water: new THREE.MeshStandardMaterial({ 
    color: '#3b82f6', 
    transparent: true, 
    opacity: 0.8,
    side: THREE.DoubleSide 
  }),
  wood: new THREE.MeshStandardMaterial({ color: '#8b4513' }),
  leaves: new THREE.MeshStandardMaterial({ 
    color: '#22c55e',
    transparent: true,
    opacity: 0.8 
  }),
  coal_ore: new THREE.MeshStandardMaterial({ color: '#1f2937' }),
  iron_ore: new THREE.MeshStandardMaterial({ color: '#9ca3af' }),
  gold_ore: new THREE.MeshStandardMaterial({ color: '#fbbf24' }),
  diamond_ore: new THREE.MeshStandardMaterial({ color: '#06b6d4' }),
};

export const ChunkRenderer: React.FC<ChunkRendererProps> = ({ 
  chunk, 
  renderDistance,
  enableCulling = true 
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [instancedMeshes, setInstancedMeshes] = useState<Map<string, THREE.InstancedMesh>>(new Map());
  
  // Calculate world position of chunk
  const chunkWorldX = chunk.coord.x * 16;
  const chunkWorldZ = chunk.coord.z * 16;
  
  // Face culling optimization - only render faces that are exposed
  const isBlockExposed = (x: number, y: number, z: number): boolean => {
    const block = chunk.blocks[x]?.[y]?.[z];
    if (!block || block.type === BLOCK_TYPES.AIR) return false;
    
    // Check all 6 faces
    const neighbors = [
      chunk.blocks[x + 1]?.[y]?.[z], // Right
      chunk.blocks[x - 1]?.[y]?.[z], // Left
      chunk.blocks[x]?.[y + 1]?.[z], // Top
      chunk.blocks[x]?.[y - 1]?.[z], // Bottom
      chunk.blocks[x]?.[y]?.[z + 1], // Front
      chunk.blocks[x]?.[y]?.[z - 1], // Back
    ];
    
    // Block is exposed if at least one neighbor is air or doesn't exist
    return neighbors.some(neighbor => !neighbor || neighbor.type === BLOCK_TYPES.AIR);
  };
  
  // Generate optimized mesh for chunk using instanced rendering
  const generateChunkMesh = useMemo(() => {
    if (!chunk.generated) return new Map();
    
    // Group blocks by type for instanced rendering
    const blockGroups = new Map<string, THREE.Vector3[]>();
    
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 128; y++) {
        for (let z = 0; z < 16; z++) {
          const block = chunk.blocks[x]?.[y]?.[z];
          if (!block || block.type === BLOCK_TYPES.AIR) continue;
          
          // Only render exposed blocks for performance
          if (!isBlockExposed(x, y, z)) continue;
          
          const blockType = block.type.id;
          if (!blockGroups.has(blockType)) {
            blockGroups.set(blockType, []);
          }
          
          blockGroups.get(blockType)!.push(new THREE.Vector3(
            chunkWorldX + x,
            y,
            chunkWorldZ + z
          ));
        }
      }
    }
    
    return blockGroups;
  }, [chunk, chunkWorldX, chunkWorldZ]);
  
  // Create instanced meshes for each block type
  useEffect(() => {
    if (!generateChunkMesh.size) return;
    
    const newInstancedMeshes = new Map<string, THREE.InstancedMesh>();
    
    generateChunkMesh.forEach((positions, blockType) => {
      if (positions.length === 0) return;
      
      const material = sharedMaterials[blockType as keyof typeof sharedMaterials] || sharedMaterials.stone;
      const instancedMesh = new THREE.InstancedMesh(
        sharedGeometries.cube,
        material,
        positions.length
      );
      
      // Set positions for each instance
      const matrix = new THREE.Matrix4();
      positions.forEach((position: THREE.Vector3, index: number) => {
        matrix.setPosition(position.x, position.y, position.z);
        instancedMesh.setMatrixAt(index, matrix);
      });
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      
      // Add to group
      if (groupRef.current) {
        groupRef.current.add(instancedMesh);
      }
      
      newInstancedMeshes.set(blockType, instancedMesh);
    });
    
    setInstancedMeshes(newInstancedMeshes);
    
    // Cleanup function
    return () => {
      newInstancedMeshes.forEach(mesh => {
        if (groupRef.current) {
          groupRef.current.remove(mesh);
        }
        mesh.dispose();
      });
    };
  }, [generateChunkMesh]);
  
  // Frustum culling and distance culling
  useFrame(() => {
    if (!enableCulling || !groupRef.current) return;
    
    // Calculate distance from camera to chunk center
    const chunkCenter = new THREE.Vector3(
      chunkWorldX + 8,
      64, // Middle height
      chunkWorldZ + 8
    );
    
    const distanceToCamera = camera.position.distanceTo(chunkCenter);
    
    // Distance culling
    const maxRenderDistance = renderDistance * 16; // Convert chunk distance to world units
    const shouldBeVisible = distanceToCamera <= maxRenderDistance;
    
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
      groupRef.current.visible = shouldBeVisible;
    }
    
    // LOD system - reduce detail for distant chunks
    if (shouldBeVisible && instancedMeshes.size > 0) {
      const lodLevel = distanceToCamera > maxRenderDistance * 0.7 ? 'low' : 'high';
      
      instancedMeshes.forEach(mesh => {
        if (lodLevel === 'low') {
          // Use simpler materials for distant chunks
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.roughness = 1;
            mesh.material.metalness = 0;
          }
        } else {
          // Restore full quality for nearby chunks
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
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

interface WorldRendererProps {
  playerPosition: THREE.Vector3;
  renderDistance?: number;
  enableCulling?: boolean;
  terrainSeed?: number;
}

export const WorldRenderer: React.FC<WorldRendererProps> = ({
  playerPosition,
  renderDistance = 4,
  enableCulling = true,
  terrainSeed
}) => {
  const [terrainGenerator] = useState(() => TerrainGenerator.getInstance(terrainSeed));
  const [visibleChunks, setVisibleChunks] = useState<Chunk[]>([]);
  const lastPlayerChunk = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  
  // Update visible chunks when player moves
  useFrame(() => {
    const currentChunkX = Math.floor(playerPosition.x / 16);
    const currentChunkZ = Math.floor(playerPosition.z / 16);
    
    // Only update if player moved to a different chunk
    if (currentChunkX !== lastPlayerChunk.current.x || 
        currentChunkZ !== lastPlayerChunk.current.z) {
      
      lastPlayerChunk.current = { x: currentChunkX, z: currentChunkZ };
      
      // Get chunks in render distance
      const chunks = terrainGenerator.getChunksInRange(
        playerPosition.x,
        playerPosition.z,
        renderDistance
      );
      
      setVisibleChunks(chunks);
      
      // Cleanup distant chunks to save memory
      terrainGenerator.cleanupDistantChunks(
        playerPosition.x,
        playerPosition.z,
        renderDistance + 2 // Keep a buffer
      );
    }
  });
  
  return (
    <group>
      {visibleChunks.map(chunk => (
        <ChunkRenderer
          key={`${chunk.coord.x},${chunk.coord.z}`}
          chunk={chunk}
          renderDistance={renderDistance}
          enableCulling={enableCulling}
        />
      ))}
    </group>
  );
}; 