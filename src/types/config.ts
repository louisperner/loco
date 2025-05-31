export interface LocoConfig {
  version: string;
  lastModified: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  settings: {
    theme?: string;
    language?: string;
    autoSave?: boolean;
    cloudSync?: boolean;
    [key: string]: unknown;
  };
  data: {
    models: unknown[];
    videos: unknown[];
    images: unknown[];
    webFrames: unknown[];
    hotbarItems: unknown[];
    playerPosition?: {
      x: number;
      y: number;
      z: number;
    };
    scrollPositions?: Record<string, unknown>;
    urlHistory?: unknown[];
    [key: string]: unknown;
  };
}

export interface LocoConfigMetadata {
  fileName: string;
  filePath: string;
  lastSaved: string;
  cloudSynced: boolean;
  cloudLastSync?: string;
} 