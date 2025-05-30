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
    [key: string]: any;
  };
  data: {
    models: any[];
    videos: any[];
    images: any[];
    webFrames: any[];
    hotbarItems: any[];
    playerPosition?: {
      x: number;
      y: number;
      z: number;
    };
    scrollPositions?: Record<string, any>;
    urlHistory?: any[];
    [key: string]: any;
  };
}

export interface LocoConfigMetadata {
  fileName: string;
  filePath: string;
  lastSaved: string;
  cloudSynced: boolean;
  cloudLastSync?: string;
} 