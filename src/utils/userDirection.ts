import * as THREE from 'three';

// Interface for user direction data
export interface UserDirection {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  timestamp: number;
}

// Get current user direction from camera
export const getCurrentUserDirection = (camera: THREE.Camera): UserDirection => {
  // Calculate direction vector
  const directionVector = new THREE.Vector3(0, 0, -1);
  directionVector.applyQuaternion(camera.quaternion);
  
  return {
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    },
    rotation: {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: camera.rotation.z
    },
    direction: {
      x: directionVector.x,
      y: directionVector.y,
      z: directionVector.z
    },
    timestamp: Date.now()
  };
};

// Get direction vector as THREE.Vector3
export const getDirectionVector = (camera: THREE.Camera): THREE.Vector3 => {
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  return direction;
};

// Calculate angle between two direction vectors (in radians)
export const getAngleBetweenDirections = (dir1: { x: number; y: number; z: number }, dir2: { x: number; y: number; z: number }): number => {
  const vec1 = new THREE.Vector3(dir1.x, dir1.y, dir1.z);
  const vec2 = new THREE.Vector3(dir2.x, dir2.y, dir2.z);
  return vec1.angleTo(vec2);
};

// Convert direction to human-readable compass direction
export const getCompassDirection = (direction: { x: number; y: number; z: number }): string => {
  const angle = Math.atan2(direction.x, direction.z);
  const degrees = (angle * 180 / Math.PI + 360) % 360;
  
  if (degrees >= 337.5 || degrees < 22.5) return 'North';
  if (degrees >= 22.5 && degrees < 67.5) return 'Northeast';
  if (degrees >= 67.5 && degrees < 112.5) return 'East';
  if (degrees >= 112.5 && degrees < 157.5) return 'Southeast';
  if (degrees >= 157.5 && degrees < 202.5) return 'South';
  if (degrees >= 202.5 && degrees < 247.5) return 'Southwest';
  if (degrees >= 247.5 && degrees < 292.5) return 'West';
  if (degrees >= 292.5 && degrees < 337.5) return 'Northwest';
  
  return 'Unknown';
};

// Get pitch angle (looking up/down) in degrees
export const getPitchAngle = (direction: { x: number; y: number; z: number }): number => {
  const pitch = Math.asin(direction.y);
  return pitch * 180 / Math.PI;
};

// Check if user is looking at a specific position within a tolerance
export const isLookingAt = (
  userDirection: { x: number; y: number; z: number },
  userPosition: { x: number; y: number; z: number },
  targetPosition: { x: number; y: number; z: number },
  toleranceAngle: number = 15 // degrees
): boolean => {
  // Calculate direction to target
  const toTarget = new THREE.Vector3(
    targetPosition.x - userPosition.x,
    targetPosition.y - userPosition.y,
    targetPosition.z - userPosition.z
  ).normalize();
  
  const lookDirection = new THREE.Vector3(userDirection.x, userDirection.y, userDirection.z);
  
  const angle = lookDirection.angleTo(toTarget);
  const angleDegrees = angle * 180 / Math.PI;
  
  return angleDegrees <= toleranceAngle;
};

// Save user direction history (for analytics or replay)
const DIRECTION_HISTORY_KEY = 'user-direction-history';
const MAX_HISTORY_ENTRIES = 1000;

export const saveDirectionToHistory = (direction: UserDirection): void => {
  try {
    const history = getDirectionHistory();
    history.push(direction);
    
    // Keep only the most recent entries
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }
    
    localStorage.setItem(DIRECTION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving direction to history:', error);
  }
};

export const getDirectionHistory = (): UserDirection[] => {
  try {
    const saved = localStorage.getItem(DIRECTION_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading direction history:', error);
    return [];
  }
};

export const clearDirectionHistory = (): void => {
  try {
    localStorage.removeItem(DIRECTION_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing direction history:', error);
  }
};

// Get direction statistics
export const getDirectionStats = (): {
  totalEntries: number;
  timeSpan: number;
  averageDirection: { x: number; y: number; z: number };
  mostCommonCompassDirection: string;
} => {
  const history = getDirectionHistory();
  
  if (history.length === 0) {
    return {
      totalEntries: 0,
      timeSpan: 0,
      averageDirection: { x: 0, y: 0, z: -1 },
      mostCommonCompassDirection: 'North'
    };
  }
  
  // Calculate average direction
  const avgDirection = history.reduce(
    (acc, entry) => ({
      x: acc.x + entry.direction.x,
      y: acc.y + entry.direction.y,
      z: acc.z + entry.direction.z
    }),
    { x: 0, y: 0, z: 0 }
  );
  
  avgDirection.x /= history.length;
  avgDirection.y /= history.length;
  avgDirection.z /= history.length;
  
  // Normalize the average direction
  const length = Math.sqrt(avgDirection.x ** 2 + avgDirection.y ** 2 + avgDirection.z ** 2);
  if (length > 0) {
    avgDirection.x /= length;
    avgDirection.y /= length;
    avgDirection.z /= length;
  }
  
  // Find most common compass direction
  const compassCounts: { [key: string]: number } = {};
  history.forEach(entry => {
    const compass = getCompassDirection(entry.direction);
    compassCounts[compass] = (compassCounts[compass] || 0) + 1;
  });
  
  const mostCommonCompassDirection = Object.keys(compassCounts).reduce((a, b) => 
    compassCounts[a] > compassCounts[b] ? a : b
  );
  
  return {
    totalEntries: history.length,
    timeSpan: history[history.length - 1].timestamp - history[0].timestamp,
    averageDirection: avgDirection,
    mostCommonCompassDirection
  };
}; 