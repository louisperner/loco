// Space-themed procedural world generator with cube-only objects
export interface SpaceObject {
  type: SpaceObjectType;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  color: string;
  material?: string;
  userData?: any;
  hasCollision?: boolean;
  mass?: number;
  isFloating?: boolean;
}

export interface SpaceObjectType {
  id: string;
  name: string;
  density: number; // How common this object is
  minScale: number;
  maxScale: number;
  colors: readonly string[];
  hasCollision: boolean;
  mass: number;
}

// Define space object types - all cubes with different properties
export const SPACE_OBJECT_TYPES = {
  SMALL_DEBRIS: {
    id: 'small_debris',
    name: 'Small Space Debris',
    density: 0.3,
    minScale: 0.5,
    maxScale: 1.5,
    colors: ['#4a4a4a', '#6b6b6b', '#8b7355', '#5a5a5a', '#3a3a3a'],
    hasCollision: true,
    mass: 1
  },
  METAL_FRAGMENT: {
    id: 'metal_fragment',
    name: 'Metal Fragment',
    density: 0.2,
    minScale: 1.0,
    maxScale: 3.0,
    colors: ['#7f8c8d', '#95a5a6', '#bdc3c7', '#34495e'],
    hasCollision: true,
    mass: 3
  },
  ASTEROID_CHUNK: {
    id: 'asteroid_chunk',
    name: 'Asteroid Chunk',
    density: 0.1,
    minScale: 2.0,
    maxScale: 6.0,
    colors: ['#5a5a5a', '#7b7b7b', '#9b8366', '#6a6a6a', '#4a4a4a'],
    hasCollision: true,
    mass: 8
  },
  ENERGY_CRYSTAL: {
    id: 'energy_crystal',
    name: 'Energy Crystal',
    density: 0.05,
    minScale: 1.5,
    maxScale: 4.0,
    colors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080'],
    hasCollision: true,
    mass: 2
  },
  CARGO_CONTAINER: {
    id: 'cargo_container',
    name: 'Cargo Container',
    density: 0.02,
    minScale: 3.0,
    maxScale: 8.0,
    colors: ['#2c3e50', '#34495e', '#e74c3c', '#f39c12'],
    hasCollision: true,
    mass: 15
  },
  LARGE_WRECKAGE: {
    id: 'large_wreckage',
    name: 'Large Wreckage',
    density: 0.01,
    minScale: 5.0,
    maxScale: 15.0,
    colors: ['#34495e', '#2c3e50', '#7f8c8d', '#95a5a6'],
    hasCollision: true,
    mass: 25
  }
} as const;

export interface SpaceChunk {
  coord: { x: number; z: number };
  objects: SpaceObject[];
  generated: boolean;
  generationTime: number;
}

export class SpaceGenerator {
  private static instance: SpaceGenerator;
  private seed: number;
  private chunks: Map<string, SpaceChunk> = new Map();
  private chunkSize = 200; // Larger chunks for sparser space
  private maxObjectsPerChunk = 8; // Much fewer objects for empty space

  private constructor(seed: number = 12345) {
    this.seed = seed;
  }

  public static getInstance(seed?: number): SpaceGenerator {
    if (!SpaceGenerator.instance || (seed !== undefined && SpaceGenerator.instance.seed !== seed)) {
      SpaceGenerator.instance = new SpaceGenerator(seed);
    }
    return SpaceGenerator.instance;
  }

  // Simple pseudo-random number generator
  private random(x: number, y: number, z: number = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  // 3D noise function for space density
  private noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    const A = this.random(X, Y) + Z;
    const AA = this.random(A, Y + 1);
    const AB = this.random(A + 1, Y + 1);
    const B = this.random(X + 1, Y) + Z;
    const BA = this.random(B, Y + 1);
    const BB = this.random(B + 1, Y + 1);
    
    return this.lerp(w, 
      this.lerp(v, 
        this.lerp(u, this.random(AA, Z), this.random(BA, Z)),
        this.lerp(u, this.random(AB, Z), this.random(BB, Z))
      ),
      this.lerp(v,
        this.lerp(u, this.random(AA, Z + 1), this.random(BA, Z + 1)),
        this.lerp(u, this.random(AB, Z + 1), this.random(BB, Z + 1))
      )
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  // Generate space objects for a chunk
  public generateChunk(chunkX: number, chunkZ: number): SpaceChunk {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    if (this.chunks.has(chunkKey)) {
      return this.chunks.get(chunkKey)!;
    }

    const chunk: SpaceChunk = {
      coord: { x: chunkX, z: chunkZ },
      objects: [],
      generated: false,
      generationTime: Date.now()
    };

    // Generate space objects
    const objects: SpaceObject[] = [];
    const baseX = chunkX * this.chunkSize;
    const baseZ = chunkZ * this.chunkSize;

    // Determine object density based on distance from origin (0,0)
    const distanceFromOrigin = Math.sqrt(chunkX * chunkX + chunkZ * chunkZ);
    const densityMultiplier = Math.max(0.05, 1 - (distanceFromOrigin * 0.08)); // Much sparser space

    // Generate different types of space objects
    const objectTypes = Object.values(SPACE_OBJECT_TYPES);
    
    for (let i = 0; i < this.maxObjectsPerChunk * densityMultiplier; i++) {
      const x = baseX + this.random(i, chunkX, chunkZ) * this.chunkSize;
      const z = baseZ + this.random(i + 100, chunkX, chunkZ) * this.chunkSize;
      
      // Use 3D noise to determine if an object should be placed here
      const density = this.noise3D(x * 0.005, 0, z * 0.005); // Lower frequency for sparser distribution
      if (density < 0.6) continue; // Higher threshold for much sparser space

      // Determine object type based on noise and distance
      let selectedType: SpaceObjectType = SPACE_OBJECT_TYPES.SMALL_DEBRIS as SpaceObjectType;
      const typeRandom = this.random(i + 200, chunkX, chunkZ);
      
      if (distanceFromOrigin > 5) {
        // Far from origin - more likely to have larger debris
        if (typeRandom < 0.05) selectedType = SPACE_OBJECT_TYPES.LARGE_WRECKAGE as SpaceObjectType;
        else if (typeRandom < 0.15) selectedType = SPACE_OBJECT_TYPES.CARGO_CONTAINER as SpaceObjectType;
        else if (typeRandom < 0.25) selectedType = SPACE_OBJECT_TYPES.ASTEROID_CHUNK as SpaceObjectType;
        else if (typeRandom < 0.40) selectedType = SPACE_OBJECT_TYPES.ENERGY_CRYSTAL as SpaceObjectType;
        else if (typeRandom < 0.70) selectedType = SPACE_OBJECT_TYPES.METAL_FRAGMENT as SpaceObjectType;
        else selectedType = SPACE_OBJECT_TYPES.SMALL_DEBRIS as SpaceObjectType;
      } else {
        // Near origin - mostly small debris and fragments
        if (typeRandom < 0.10) selectedType = SPACE_OBJECT_TYPES.CARGO_CONTAINER as SpaceObjectType;
        else if (typeRandom < 0.20) selectedType = SPACE_OBJECT_TYPES.ASTEROID_CHUNK as SpaceObjectType;
        else if (typeRandom < 0.35) selectedType = SPACE_OBJECT_TYPES.ENERGY_CRYSTAL as SpaceObjectType;
        else if (typeRandom < 0.65) selectedType = SPACE_OBJECT_TYPES.METAL_FRAGMENT as SpaceObjectType;
        else selectedType = SPACE_OBJECT_TYPES.SMALL_DEBRIS as SpaceObjectType;
      }

      // Generate Y position with much more variation for 3D floating space
      const y = (this.random(i + 300, chunkX, chunkZ) - 0.5) * 100; // More spread in 3D space

      // Generate scale within type bounds
      const scaleRandom = this.random(i + 400, chunkX, chunkZ);
      const scale = selectedType.minScale + scaleRandom * (selectedType.maxScale - selectedType.minScale);

      // Generate rotation for floating objects
      const rotation: [number, number, number] = [
        this.random(i + 500, chunkX, chunkZ) * Math.PI * 2,
        this.random(i + 600, chunkX, chunkZ) * Math.PI * 2,
        this.random(i + 700, chunkX, chunkZ) * Math.PI * 2
      ];

      // Select color
      const colorIndex = Math.floor(this.random(i + 800, chunkX, chunkZ) * selectedType.colors.length);
      const color = selectedType.colors[colorIndex];

      objects.push({
        type: selectedType,
        position: [x, y, z],
        scale,
        rotation,
        color,
        hasCollision: selectedType.hasCollision,
        mass: selectedType.mass,
        isFloating: true,
        userData: {
          chunkCoord: { x: chunkX, z: chunkZ },
          objectIndex: i
        }
      });
    }

    chunk.objects = objects;
    chunk.generated = true;
    this.chunks.set(chunkKey, chunk);

    return chunk;
  }

  // Get object at specific position
  public getObjectAt(x: number, y: number, z: number): SpaceObject | null {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunk = this.generateChunk(chunkX, chunkZ);

    // Find closest object within reasonable distance
    let closestObject: SpaceObject | null = null;
    let closestDistance = Infinity;

    for (const obj of chunk.objects) {
      const distance = Math.sqrt(
        Math.pow(obj.position[0] - x, 2) +
        Math.pow(obj.position[1] - y, 2) +
        Math.pow(obj.position[2] - z, 2)
      );

      if (distance < obj.scale && distance < closestDistance) {
        closestDistance = distance;
        closestObject = obj;
      }
    }

    return closestObject;
  }

  // Add object at position
  public addObjectAt(x: number, y: number, z: number, type: SpaceObjectType): void {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunk = this.generateChunk(chunkX, chunkZ);

    const newObject: SpaceObject = {
      type,
      position: [x, y, z],
      scale: (type.minScale + type.maxScale) / 2,
      rotation: [0, 0, 0],
      color: type.colors[0],
      hasCollision: type.hasCollision,
      mass: type.mass,
      isFloating: true,
      userData: {
        chunkCoord: { x: chunkX, z: chunkZ },
        objectIndex: chunk.objects.length,
        userPlaced: true
      }
    };

    chunk.objects.push(newObject);
  }

  // Remove object at position
  public removeObjectAt(x: number, y: number, z: number): boolean {
    const obj = this.getObjectAt(x, y, z);
    if (!obj || !obj.userData?.chunkCoord) return false;

    const chunkKey = `${obj.userData.chunkCoord.x},${obj.userData.chunkCoord.z}`;
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return false;

    const index = chunk.objects.indexOf(obj);
    if (index > -1) {
      chunk.objects.splice(index, 1);
      return true;
    }

    return false;
  }

  // Clean up distant chunks
  public cleanupDistantChunks(playerX: number, playerZ: number, maxDistance: number): void {
    const playerChunkX = Math.floor(playerX / this.chunkSize);
    const playerChunkZ = Math.floor(playerZ / this.chunkSize);

    for (const [chunkKey, chunk] of this.chunks.entries()) {
      const distance = Math.sqrt(
        Math.pow(chunk.coord.x - playerChunkX, 2) + 
        Math.pow(chunk.coord.z - playerChunkZ, 2)
      );

      if (distance > maxDistance + 2) {
        this.chunks.delete(chunkKey);
      }
    }
  }

  // Regenerate world with new seed
  public regenerateWorld(newSeed?: number): void {
    if (newSeed !== undefined) {
      this.seed = newSeed;
    }
    this.chunks.clear();
  }

  // Get all chunks
  public getAllChunks(): SpaceChunk[] {
    return Array.from(this.chunks.values());
  }
}

// Export for backward compatibility
export const TerrainGenerator = SpaceGenerator;
export type Chunk = SpaceChunk;
export type Block = SpaceObject;
export const BLOCK_TYPES = SPACE_OBJECT_TYPES; 