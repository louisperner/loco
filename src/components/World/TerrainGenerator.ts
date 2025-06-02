// Space-themed procedural world generator
export interface SpaceObject {
  type: SpaceObjectType;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  color: string;
  material?: string;
  userData?: any;
}

export interface SpaceObjectType {
  id: string;
  name: string;
  density: number; // How common this object is
  minScale: number;
  maxScale: number;
  colors: readonly string[];
}

// Define space object types
export const SPACE_OBJECT_TYPES = {
  ASTEROID_SMALL: {
    id: 'asteroid_small',
    name: 'Small Asteroid',
    density: 0.8,
    minScale: 0.5,
    maxScale: 2.0,
    colors: ['#4a4a4a', '#6b6b6b', '#8b7355', '#5a5a5a', '#3a3a3a']
  },
  ASTEROID_MEDIUM: {
    id: 'asteroid_medium',
    name: 'Medium Asteroid',
    density: 0.3,
    minScale: 2.0,
    maxScale: 5.0,
    colors: ['#5a5a5a', '#7b7b7b', '#9b8366', '#6a6a6a', '#4a4a4a']
  },
  ASTEROID_LARGE: {
    id: 'asteroid_large',
    name: 'Large Asteroid',
    density: 0.1,
    minScale: 5.0,
    maxScale: 12.0,
    colors: ['#6a6a6a', '#8b8b8b', '#ab9377', '#7a7a7a', '#5a5a5a']
  },
  PLANET_SMALL: {
    id: 'planet_small',
    name: 'Small Planet',
    density: 0.02,
    minScale: 15.0,
    maxScale: 25.0,
    colors: ['#4a90e2', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6']
  },
  PLANET_LARGE: {
    id: 'planet_large',
    name: 'Large Planet',
    density: 0.005,
    minScale: 30.0,
    maxScale: 50.0,
    colors: ['#3498db', '#e67e22', '#2ecc71', '#8e44ad', '#34495e']
  },
  MOON: {
    id: 'moon',
    name: 'Moon',
    density: 0.05,
    minScale: 3.0,
    maxScale: 8.0,
    colors: ['#bdc3c7', '#95a5a6', '#ecf0f1', '#d5dbdb', '#a6acaf']
  },
  SPACE_STATION: {
    id: 'space_station',
    name: 'Space Station',
    density: 0.001,
    minScale: 8.0,
    maxScale: 15.0,
    colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6']
  },
  CRYSTAL_FORMATION: {
    id: 'crystal_formation',
    name: 'Crystal Formation',
    density: 0.15,
    minScale: 1.0,
    maxScale: 4.0,
    colors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080']
  },
  DEBRIS: {
    id: 'debris',
    name: 'Space Debris',
    density: 0.4,
    minScale: 0.2,
    maxScale: 1.0,
    colors: ['#7f8c8d', '#95a5a6', '#bdc3c7', '#34495e']
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
  private chunkSize = 100; // Space chunks are larger
  private maxObjectsPerChunk = 25;

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
    const densityMultiplier = Math.max(0.1, 1 - (distanceFromOrigin * 0.05)); // Less dense further out

    // Generate different types of space objects
    const objectTypes = Object.values(SPACE_OBJECT_TYPES);
    
    for (let i = 0; i < this.maxObjectsPerChunk * densityMultiplier; i++) {
      const x = baseX + this.random(i, chunkX, chunkZ) * this.chunkSize;
      const z = baseZ + this.random(i + 100, chunkX, chunkZ) * this.chunkSize;
      
      // Use 3D noise to determine if an object should be placed here
      const density = this.noise3D(x * 0.01, 0, z * 0.01);
      if (density < 0.3) continue; // Skip if density is too low

             // Determine object type based on noise and distance
       let selectedType: SpaceObjectType = SPACE_OBJECT_TYPES.DEBRIS as SpaceObjectType;
       const typeRandom = this.random(i + 200, chunkX, chunkZ);
      
             if (distanceFromOrigin > 10) {
         // Far from origin - more likely to have large objects
         if (typeRandom < 0.01) selectedType = SPACE_OBJECT_TYPES.PLANET_LARGE as SpaceObjectType;
         else if (typeRandom < 0.03) selectedType = SPACE_OBJECT_TYPES.PLANET_SMALL as SpaceObjectType;
         else if (typeRandom < 0.04) selectedType = SPACE_OBJECT_TYPES.SPACE_STATION as SpaceObjectType;
         else if (typeRandom < 0.1) selectedType = SPACE_OBJECT_TYPES.ASTEROID_LARGE as SpaceObjectType;
         else if (typeRandom < 0.3) selectedType = SPACE_OBJECT_TYPES.ASTEROID_MEDIUM as SpaceObjectType;
         else if (typeRandom < 0.6) selectedType = SPACE_OBJECT_TYPES.ASTEROID_SMALL as SpaceObjectType;
         else if (typeRandom < 0.75) selectedType = SPACE_OBJECT_TYPES.MOON as SpaceObjectType;
         else if (typeRandom < 0.85) selectedType = SPACE_OBJECT_TYPES.CRYSTAL_FORMATION as SpaceObjectType;
         else selectedType = SPACE_OBJECT_TYPES.DEBRIS as SpaceObjectType;
       } else {
         // Near origin - more asteroids and debris
         if (typeRandom < 0.05) selectedType = SPACE_OBJECT_TYPES.MOON as SpaceObjectType;
         else if (typeRandom < 0.15) selectedType = SPACE_OBJECT_TYPES.ASTEROID_LARGE as SpaceObjectType;
         else if (typeRandom < 0.4) selectedType = SPACE_OBJECT_TYPES.ASTEROID_MEDIUM as SpaceObjectType;
         else if (typeRandom < 0.7) selectedType = SPACE_OBJECT_TYPES.ASTEROID_SMALL as SpaceObjectType;
         else if (typeRandom < 0.85) selectedType = SPACE_OBJECT_TYPES.CRYSTAL_FORMATION as SpaceObjectType;
         else selectedType = SPACE_OBJECT_TYPES.DEBRIS as SpaceObjectType;
       }

      // Generate Y position with some variation
      const y = (this.random(i + 300, chunkX, chunkZ) - 0.5) * 50; // Spread objects in 3D space

      // Generate scale within type bounds
      const scaleRandom = this.random(i + 400, chunkX, chunkZ);
      const scale = selectedType.minScale + scaleRandom * (selectedType.maxScale - selectedType.minScale);

      // Generate rotation
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