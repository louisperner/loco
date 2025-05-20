import { InventoryItem } from '../utils/inventoryUtils';
import { ImageDataType, ModelDataType, VideoDataType } from '../components/Models/types';
import * as THREE from 'three';

// =====================================================
// GLOBAL TYPE DECLARATIONS - MODULE AUGMENTATION
// =====================================================
// Using module augmentation to avoid conflicts when
// merging Window interface declarations
// =====================================================

// Define a type for primitive models to avoid any
interface PrimitiveModelData {
  id: string;
  isPrimitive: boolean;
  primitiveType: 'cube' | 'sphere' | 'plane';
  color?: string;
  textureUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  [key: string]: unknown;
}

// Extend the Window interface
export {}; 