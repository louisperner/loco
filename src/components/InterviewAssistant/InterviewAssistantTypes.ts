import { ScreenRegion } from "../../utils/screenCapture";

// Logger interface
export interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

// Screenshot interface
export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
  region?: ScreenRegion;
}

// Position interface
export interface Position {
  x: number;
  y: number;
}

// Solution interface - must match store definition
export interface Solution {
  code: string;
  explanation: string;
  complexity: {
    time: string;
    space: string;
  };
}

// Model interface
export interface Model {
  id: string;
  name: string;
}

// Drag reference interface
export interface DragRef {
  startX: number;
  startY: number;
} 