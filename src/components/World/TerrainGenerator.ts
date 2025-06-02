// Terrain Generator for Infinite Procedural Worlds
// Inspired by Minecraft's terrain generation

export interface BlockType {
  id: string;
  name: string;
  color: string;
  material?: 'stone' | 'dirt' | 'grass' | 'sand' | 'water' | 'wood' | 'leaves';
}

export const BLOCK_TYPES: Record<string, BlockType> = {
  AIR: { id: 'air', name: 'Air', color: 'transparent' },
  STONE: { id: 'stone', name: 'Stone', color: '#6b7280', material: 'stone' },
  DIRT: { id: 'dirt', name: 'Dirt', color: '#8b4513', material: 'dirt' },
  GRASS: { id: 'grass', name: 'Grass', color: '#4ade80', material: 'grass' },
  SAND: { id: 'sand', name: 'Sand', color: '#eab308', material: 'sand' },
  WATER: { id: 'water', name: 'Water', color: '#3b82f6', material: 'water' },
  WOOD: { id: 'wood', name: 'Wood', color: '#8b4513', material: 'wood' },
  LEAVES: { id: 'leaves', name: 'Leaves', color: '#22c55e', material: 'leaves' },
  COAL_ORE: { id: 'coal_ore', name: 'Coal Ore', color: '#1f2937', material: 'stone' },
  IRON_ORE: { id: 'iron_ore', name: 'Iron Ore', color: '#9ca3af', material: 'stone' },
  GOLD_ORE: { id: 'gold_ore', name: 'Gold Ore', color: '#fbbf24', material: 'stone' },
  DIAMOND_ORE: { id: 'diamond_ore', name: 'Diamond Ore', color: '#06b6d4', material: 'stone' },
};

export interface ChunkCoord {
  x: number;
  z: number;
}

export interface Block {
  type: BlockType;
  position: [number, number, number];
}

export interface Chunk {
  coord: ChunkCoord;
  blocks: Block[][][]; // 3D array [x][y][z]
  generated: boolean;
  meshGenerated: boolean;
}

export class TerrainGenerator {
  private static instance: TerrainGenerator;
  private chunks: Map<string, Chunk> = new Map();
  private seed: number;
  
  // Terrain generation parameters
  private readonly CHUNK_SIZE = 16;
  private readonly WORLD_HEIGHT = 128;
  private readonly SEA_LEVEL = 64;
  private readonly MOUNTAIN_HEIGHT = 32;
  
  // Noise parameters for different terrain features
  private readonly TERRAIN_SCALE = 0.01;
  private readonly CAVE_SCALE = 0.05;
  private readonly ORE_SCALE = 0.1;
  
  constructor(seed: number = Math.random() * 1000000) {
    this.seed = seed;
  }
  
  static getInstance(seed?: number): TerrainGenerator {
    if (!TerrainGenerator.instance) {
      TerrainGenerator.instance = new TerrainGenerator(seed);
    }
    return TerrainGenerator.instance;
  }
  
  // Simple noise function (Perlin-like)
  private noise(x: number, y: number = 0, z: number = 0): number {
    // Simple pseudo-random noise based on coordinates and seed
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Return value between -1 and 1
  }
  
  // Octave noise for more natural terrain
  private octaveNoise(x: number, y: number, z: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return value / maxValue;
  }
  
  // Generate height map for terrain
  private getTerrainHeight(x: number, z: number): number {
    const baseHeight = this.octaveNoise(x * this.TERRAIN_SCALE, 0, z * this.TERRAIN_SCALE, 6);
    const mountainNoise = this.octaveNoise(x * this.TERRAIN_SCALE * 0.5, 0, z * this.TERRAIN_SCALE * 0.5, 4);
    
    // Combine different noise layers for varied terrain
    const height = this.SEA_LEVEL + 
                  (baseHeight * 16) + 
                  (mountainNoise * this.MOUNTAIN_HEIGHT);
    
    return Math.floor(Math.max(0, Math.min(this.WORLD_HEIGHT - 1, height)));
  }
  
  // Check if position should have caves
  private isCave(x: number, y: number, z: number): boolean {
    if (y > this.SEA_LEVEL - 10) return false; // No caves near surface
    
    const caveNoise = this.octaveNoise(x * this.CAVE_SCALE, y * this.CAVE_SCALE, z * this.CAVE_SCALE, 3);
    return caveNoise > 0.6; // Cave threshold
  }
  
  // Generate ore deposits
  private getOreType(x: number, y: number, z: number): BlockType | null {
    if (y > this.SEA_LEVEL) return null; // No ores above sea level
    
    const oreNoise = this.octaveNoise(x * this.ORE_SCALE, y * this.ORE_SCALE, z * this.ORE_SCALE, 2);
    
    // Different ores at different depths and rarity
    if (y < 16 && oreNoise > 0.8) return BLOCK_TYPES.DIAMOND_ORE;
    if (y < 32 && oreNoise > 0.7) return BLOCK_TYPES.GOLD_ORE;
    if (y < 48 && oreNoise > 0.6) return BLOCK_TYPES.IRON_ORE;
    if (y < 64 && oreNoise > 0.5) return BLOCK_TYPES.COAL_ORE;
    
    return null;
  }
  
  // Generate trees
  private shouldGenerateTree(x: number, z: number, surfaceY: number): boolean {
    if (surfaceY < this.SEA_LEVEL + 2) return false; // No trees too close to water
    
    const treeNoise = this.octaveNoise(x * 0.1, 0, z * 0.1, 2);
    return treeNoise > 0.7; // Tree generation threshold
  }
  
  // Generate a single tree
  private generateTree(chunk: Chunk, localX: number, localZ: number, surfaceY: number): void {
    const treeHeight = 4 + Math.floor(Math.random() * 3); // 4-6 blocks tall
    
    // Tree trunk
    for (let y = surfaceY + 1; y <= surfaceY + treeHeight; y++) {
      if (y < this.WORLD_HEIGHT) {
        chunk.blocks[localX][y][localZ] = {
          type: BLOCK_TYPES.WOOD,
          position: [localX, y, localZ]
        };
      }
    }
    
    // Tree leaves (simple sphere)
    const leavesY = surfaceY + treeHeight;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          const leafX = localX + dx;
          const leafY = leavesY + dy;
          const leafZ = localZ + dz;
          
          // Check bounds
          if (leafX >= 0 && leafX < this.CHUNK_SIZE && 
              leafZ >= 0 && leafZ < this.CHUNK_SIZE && 
              leafY >= 0 && leafY < this.WORLD_HEIGHT) {
            
            // Simple sphere shape for leaves
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance <= 2.5 && Math.random() > 0.3) {
              chunk.blocks[leafX][leafY][leafZ] = {
                type: BLOCK_TYPES.LEAVES,
                position: [leafX, leafY, leafZ]
              };
            }
          }
        }
      }
    }
  }
  
  // Generate a chunk
  generateChunk(chunkX: number, chunkZ: number): Chunk {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    if (this.chunks.has(chunkKey)) {
      return this.chunks.get(chunkKey)!;
    }
    
    const chunk: Chunk = {
      coord: { x: chunkX, z: chunkZ },
      blocks: [],
      generated: false,
      meshGenerated: false
    };
    
    // Initialize 3D array
    for (let x = 0; x < this.CHUNK_SIZE; x++) {
      chunk.blocks[x] = [];
      for (let y = 0; y < this.WORLD_HEIGHT; y++) {
        chunk.blocks[x][y] = [];
        for (let z = 0; z < this.CHUNK_SIZE; z++) {
          chunk.blocks[x][y][z] = {
            type: BLOCK_TYPES.AIR,
            position: [x, y, z]
          };
        }
      }
    }
    
    // Generate terrain for each column in the chunk
    for (let x = 0; x < this.CHUNK_SIZE; x++) {
      for (let z = 0; z < this.CHUNK_SIZE; z++) {
        const worldX = chunkX * this.CHUNK_SIZE + x;
        const worldZ = chunkZ * this.CHUNK_SIZE + z;
        
        const surfaceHeight = this.getTerrainHeight(worldX, worldZ);
        
        // Generate terrain column
        for (let y = 0; y <= surfaceHeight; y++) {
          if (this.isCave(worldX, y, worldZ)) {
            continue; // Leave as air for caves
          }
          
          let blockType: BlockType;
          
          // Check for ores first
          const oreType = this.getOreType(worldX, y, worldZ);
          if (oreType) {
            blockType = oreType;
          }
          // Surface blocks
          else if (y === surfaceHeight) {
            if (surfaceHeight < this.SEA_LEVEL - 5) {
              blockType = BLOCK_TYPES.SAND; // Beach/desert
            } else {
              blockType = BLOCK_TYPES.GRASS; // Grass on surface
            }
          }
          // Sub-surface blocks
          else if (y > surfaceHeight - 4) {
            blockType = BLOCK_TYPES.DIRT; // Dirt layer
          }
          // Deep blocks
          else {
            blockType = BLOCK_TYPES.STONE; // Stone deep underground
          }
          
          chunk.blocks[x][y][z] = {
            type: blockType,
            position: [x, y, z]
          };
        }
        
        // Fill water areas
        if (surfaceHeight < this.SEA_LEVEL) {
          for (let y = surfaceHeight + 1; y <= this.SEA_LEVEL; y++) {
            chunk.blocks[x][y][z] = {
              type: BLOCK_TYPES.WATER,
              position: [x, y, z]
            };
          }
        }
        
        // Generate trees on grass surfaces
        if (surfaceHeight >= this.SEA_LEVEL && 
            chunk.blocks[x][surfaceHeight][z].type === BLOCK_TYPES.GRASS &&
            this.shouldGenerateTree(worldX, worldZ, surfaceHeight)) {
          this.generateTree(chunk, x, z, surfaceHeight);
        }
      }
    }
    
    chunk.generated = true;
    this.chunks.set(chunkKey, chunk);
    return chunk;
  }
  
  // Get chunk at world coordinates
  getChunkAt(worldX: number, worldZ: number): Chunk {
    const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / this.CHUNK_SIZE);
    return this.generateChunk(chunkX, chunkZ);
  }
  
  // Get block at world coordinates
  getBlockAt(worldX: number, worldY: number, worldZ: number): Block | null {
    if (worldY < 0 || worldY >= this.WORLD_HEIGHT) return null;
    
    const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / this.CHUNK_SIZE);
    const chunk = this.generateChunk(chunkX, chunkZ);
    
    const localX = worldX - chunkX * this.CHUNK_SIZE;
    const localZ = worldZ - chunkZ * this.CHUNK_SIZE;
    
    if (localX < 0 || localX >= this.CHUNK_SIZE || 
        localZ < 0 || localZ >= this.CHUNK_SIZE) {
      return null;
    }
    
    return chunk.blocks[localX][worldY][localZ];
  }
  
  // Set block at world coordinates
  setBlockAt(worldX: number, worldY: number, worldZ: number, blockType: BlockType): void {
    if (worldY < 0 || worldY >= this.WORLD_HEIGHT) return;
    
    const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / this.CHUNK_SIZE);
    const chunk = this.generateChunk(chunkX, chunkZ);
    
    const localX = worldX - chunkX * this.CHUNK_SIZE;
    const localZ = worldZ - chunkZ * this.CHUNK_SIZE;
    
    if (localX < 0 || localX >= this.CHUNK_SIZE || 
        localZ < 0 || localZ >= this.CHUNK_SIZE) {
      return;
    }
    
    chunk.blocks[localX][worldY][localZ] = {
      type: blockType,
      position: [localX, worldY, localZ]
    };
    
    // Mark chunk as needing mesh regeneration
    chunk.meshGenerated = false;
  }
  
  // Get all chunks within render distance
  getChunksInRange(centerX: number, centerZ: number, renderDistance: number): Chunk[] {
    const chunks: Chunk[] = [];
    const centerChunkX = Math.floor(centerX / this.CHUNK_SIZE);
    const centerChunkZ = Math.floor(centerZ / this.CHUNK_SIZE);
    
    for (let x = centerChunkX - renderDistance; x <= centerChunkX + renderDistance; x++) {
      for (let z = centerChunkZ - renderDistance; z <= centerChunkZ + renderDistance; z++) {
        chunks.push(this.generateChunk(x, z));
      }
    }
    
    return chunks;
  }
  
  // Cleanup distant chunks to save memory
  cleanupDistantChunks(centerX: number, centerZ: number, maxDistance: number): void {
    const centerChunkX = Math.floor(centerX / this.CHUNK_SIZE);
    const centerChunkZ = Math.floor(centerZ / this.CHUNK_SIZE);
    
    const chunksToRemove: string[] = [];
    
    this.chunks.forEach((chunk, key) => {
      const distance = Math.sqrt(
        Math.pow(chunk.coord.x - centerChunkX, 2) + 
        Math.pow(chunk.coord.z - centerChunkZ, 2)
      );
      
      if (distance > maxDistance) {
        chunksToRemove.push(key);
      }
    });
    
    chunksToRemove.forEach(key => {
      this.chunks.delete(key);
    });
  }
  
  // Get chunk key
  static getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }
  
  // Reset generator with new seed
  reset(newSeed?: number): void {
    this.chunks.clear();
    if (newSeed !== undefined) {
      this.seed = newSeed;
    }
  }
} 