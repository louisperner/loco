import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TerrainGenerator, BLOCK_TYPES, BlockType } from '../components/World/TerrainGenerator';
import { useModelStore } from '../store/useModelStore';

interface ProceduralBlockUserData {
  isProceduralBlock: boolean;
  blockType: string;
  chunkCoord?: { x: number; z: number };
  isPlayerPlaced?: boolean;
}

interface ProceduralWorldSettings {
  enabled: boolean;
  renderDistance: number;
  terrainSeed: number;
  enableCulling: boolean;
  autoGenerate: boolean;
}

interface WorldInteraction {
  placeBlock: (x: number, y: number, z: number, blockType: BlockType) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  getBlockAt: (x: number, y: number, z: number) => BlockType | null;
}

export const useProceduralWorld = (
  playerPosition: THREE.Vector3,
  settings: ProceduralWorldSettings
): {
  terrainGenerator: TerrainGenerator | null;
  worldInteraction: WorldInteraction;
  isWorldLoaded: boolean;
  regenerateWorld: (newSeed?: number) => void;
  toggleWorldGeneration: () => void;
} => {
  const [terrainGenerator, setTerrainGenerator] = useState<TerrainGenerator | null>(null);
  const [isWorldLoaded, setIsWorldLoaded] = useState(false);
  const { addModel, removeModel, models } = useModelStore();
  const lastGeneratedChunks = useRef<Set<string>>(new Set());
  
  // Initialize terrain generator
  useEffect(() => {
    if (settings.enabled && !terrainGenerator) {
      const generator = TerrainGenerator.getInstance(settings.terrainSeed);
      setTerrainGenerator(generator);
      setIsWorldLoaded(true);
    } else if (!settings.enabled && terrainGenerator) {
      setTerrainGenerator(null);
      setIsWorldLoaded(false);
    }
  }, [settings.enabled, settings.terrainSeed, terrainGenerator]);
  
  // Auto-generate chunks around player
  useEffect(() => {
    if (!settings.autoGenerate || !terrainGenerator || !settings.enabled) return;
    
    const generateChunksAroundPlayer = () => {
      const chunkX = Math.floor(playerPosition.x / 16);
      const chunkZ = Math.floor(playerPosition.z / 16);
      
      // Generate chunks in a radius around player
      for (let x = chunkX - settings.renderDistance; x <= chunkX + settings.renderDistance; x++) {
        for (let z = chunkZ - settings.renderDistance; z <= chunkZ + settings.renderDistance; z++) {
          const chunkKey = `${x},${z}`;
          
          if (!lastGeneratedChunks.current.has(chunkKey)) {
            // Generate chunk and convert to models for existing system compatibility
            const chunk = terrainGenerator.generateChunk(x, z);
            convertChunkToModels(chunk);
            lastGeneratedChunks.current.add(chunkKey);
          }
        }
      }
      
      // Cleanup distant chunks
      const chunksToRemove: string[] = [];
      lastGeneratedChunks.current.forEach(chunkKey => {
        const [x, z] = chunkKey.split(',').map(Number);
        const distance = Math.sqrt(Math.pow(x - chunkX, 2) + Math.pow(z - chunkZ, 2));
        
        if (distance > settings.renderDistance + 1) {
          chunksToRemove.push(chunkKey);
          removeChunkModels(x, z);
        }
      });
      
      chunksToRemove.forEach(key => {
        lastGeneratedChunks.current.delete(key);
      });
    };
    
    // Throttle chunk generation
    const interval = setInterval(generateChunksAroundPlayer, 1000);
    
    return () => clearInterval(interval);
  }, [playerPosition, settings, terrainGenerator]);
  
  // Convert chunk to models for compatibility with existing system
  const convertChunkToModels = (chunk: any) => {
    if (!chunk.generated) return;
    
    const chunkWorldX = chunk.coord.x * 16;
    const chunkWorldZ = chunk.coord.z * 16;
    
    // Sample blocks to avoid too many models (performance optimization)
    const sampleRate = 2; // Only place every 2nd block
    
    for (let x = 0; x < 16; x += sampleRate) {
      for (let z = 0; z < 16; z += sampleRate) {
        // Only generate surface and near-surface blocks
        for (let y = 60; y < 80; y++) {
          const block = chunk.blocks[x]?.[y]?.[z];
          if (!block || block.type === BLOCK_TYPES.AIR) continue;
          
          // Skip underground blocks unless they're exposed
          if (y < 70 && !isBlockExposed(chunk, x, y, z)) continue;
          
          const worldX = chunkWorldX + x;
          const worldY = y;
          const worldZ = chunkWorldZ + z;
          
          // Create model for this block
          const modelId = `procedural-block-${worldX}-${worldY}-${worldZ}`;
          
                     addModel({
             id: modelId,
             url: 'primitive://cube',
             fileName: `${block.type.name.toLowerCase()}.gltf`,
             position: [worldX, worldY, worldZ] as [number, number, number],
             rotation: [0, 0, 0] as [number, number, number],
             scale: 1,
             isInScene: true,
             isPrimitive: true,
             primitiveType: 'cube' as const,
             color: block.type.color,
             userData: {
               isProceduralBlock: true,
               blockType: block.type.id,
               chunkCoord: { x: chunk.coord.x, z: chunk.coord.z }
             } as ProceduralBlockUserData
           });
        }
      }
    }
  };
  
  // Check if block is exposed (has at least one air neighbor)
  const isBlockExposed = (chunk: any, x: number, y: number, z: number): boolean => {
    const neighbors = [
      chunk.blocks[x + 1]?.[y]?.[z],
      chunk.blocks[x - 1]?.[y]?.[z],
      chunk.blocks[x]?.[y + 1]?.[z],
      chunk.blocks[x]?.[y - 1]?.[z],
      chunk.blocks[x]?.[y]?.[z + 1],
      chunk.blocks[x]?.[y]?.[z - 1],
    ];
    
    return neighbors.some(neighbor => !neighbor || neighbor.type === BLOCK_TYPES.AIR);
  };
  
  // Remove models for a chunk
  const removeChunkModels = (chunkX: number, chunkZ: number) => {
    const chunkWorldX = chunkX * 16;
    const chunkWorldZ = chunkZ * 16;
    
    // Find and remove all models in this chunk
    const modelsToRemove = models.filter(model => {
      const userData = model.userData as ProceduralBlockUserData;
      if (!userData?.isProceduralBlock) return false;
      
      const modelChunk = userData.chunkCoord;
      return modelChunk && modelChunk.x === chunkX && modelChunk.z === chunkZ;
    });
    
    modelsToRemove.forEach(model => {
      if (model.id) {
        removeModel(model.id);
      }
    });
  };
  
  // World interaction methods
  const worldInteraction: WorldInteraction = {
    placeBlock: (x: number, y: number, z: number, blockType: BlockType) => {
      if (!terrainGenerator) return;
      
      // Update terrain generator
      terrainGenerator.setBlockAt(x, y, z, blockType);
      
      // Add model to scene
      const modelId = `placed-block-${x}-${y}-${z}`;
             addModel({
         id: modelId,
         url: 'primitive://cube',
         fileName: `${blockType.name.toLowerCase()}.gltf`,
         position: [x, y, z] as [number, number, number],
         rotation: [0, 0, 0] as [number, number, number],
         scale: 1,
         isInScene: true,
         isPrimitive: true,
         primitiveType: 'cube' as const,
         color: blockType.color,
         userData: {
           isProceduralBlock: true,
           blockType: blockType.id,
           isPlayerPlaced: true
         } as ProceduralBlockUserData
       });
    },
    
    removeBlock: (x: number, y: number, z: number) => {
      if (!terrainGenerator) return;
      
      // Update terrain generator
      terrainGenerator.setBlockAt(x, y, z, BLOCK_TYPES.AIR);
      
             // Remove model from scene
       const modelToRemove = models.find(model => {
         const pos = model.position;
         const userData = model.userData as ProceduralBlockUserData;
         return pos && 
                Math.round(pos[0]) === x && 
                Math.round(pos[1]) === y && 
                Math.round(pos[2]) === z &&
                userData?.isProceduralBlock;
       });
      
      if (modelToRemove && modelToRemove.id) {
        removeModel(modelToRemove.id);
      }
    },
    
    getBlockAt: (x: number, y: number, z: number) => {
      if (!terrainGenerator) return null;
      
      const block = terrainGenerator.getBlockAt(x, y, z);
      return block ? block.type : null;
    }
  };
  
  // Regenerate world with new seed
  const regenerateWorld = (newSeed?: number) => {
    if (!terrainGenerator) return;
    
         // Clear existing procedural blocks
     const proceduralModels = models.filter(model => {
       const userData = model.userData as ProceduralBlockUserData;
       return userData?.isProceduralBlock;
     });
     proceduralModels.forEach(model => {
       if (model.id) {
         removeModel(model.id);
       }
     });
    
    // Reset terrain generator
    terrainGenerator.reset(newSeed);
    lastGeneratedChunks.current.clear();
    
    // Trigger regeneration
    setIsWorldLoaded(false);
    setTimeout(() => setIsWorldLoaded(true), 100);
  };
  
  // Toggle world generation
  const toggleWorldGeneration = () => {
         if (settings.enabled) {
       // Disable world generation and clean up
       const proceduralModels = models.filter(model => {
         const userData = model.userData as ProceduralBlockUserData;
         return userData?.isProceduralBlock;
       });
       proceduralModels.forEach(model => {
         if (model.id) {
           removeModel(model.id);
         }
       });
      lastGeneratedChunks.current.clear();
      setTerrainGenerator(null);
      setIsWorldLoaded(false);
    } else {
      // Enable world generation
      const generator = TerrainGenerator.getInstance(settings.terrainSeed);
      setTerrainGenerator(generator);
      setIsWorldLoaded(true);
    }
  };
  
  return {
    terrainGenerator,
    worldInteraction,
    isWorldLoaded,
    regenerateWorld,
    toggleWorldGeneration
  };
}; 