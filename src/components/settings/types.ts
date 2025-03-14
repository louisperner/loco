export interface LocoSettings {
  colors: {
    grid?: string;
    floorPlane?: string;
    background?: string;
    crosshair?: string;
  };
  opacities: {
    grid: number;
    floorPlane: number;
    background: number;
  };
  groundSize: number;
  isGroundInfinite: boolean;
  groundShape: 'square' | 'circle' | 'hexagon';
  gridPattern: 'lines' | 'dots' | 'dashed';
  crosshairSettings: {
    visible: boolean;
    size: number;
    thickness: number;
    style: 'classic' | 'dot' | 'cross' | 'plus';
  };
  visibilitySettings: {
    floor: boolean;
    grid: boolean;
    floorPlane: boolean;
    background: boolean;
  };
  gravityEnabled: boolean;
  selectedTheme: string;
  environmentSettings: {
    skyVisible: boolean;
    skyDistance: number;
    skySunPosition?: [number, number, number];
    skyInclination: number;
    skyAzimuth: number;
    skyTurbidity: number;
    skyRayleigh: number;
    skyOpacity: number;
    starsVisible: boolean;
    starsRadius: number;
    starsDepth: number;
    starsCount: number;
    starsFactor: number;
    starsSaturation: number;
    starsFade: boolean;
  };
}

export interface SettingsTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface SettingsPanelProps {
  children?: React.ReactNode;
  onToggle?: (isOpen: boolean) => void;
  tabs?: SettingsTab[];
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onColorChange?: (type: string, color: any) => void;
  onResetColors?: () => void;
  isResetAnimating?: boolean;
  colorChanged?: string | null;
  showColorPicker?: string | null;
  onColorPickerChange?: (type: string | null) => void;
  colorPickerRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  colors: {
    grid?: string;
    floorPlane?: string;
    background?: string;
    crosshair?: string;
  };
  opacities: {
    grid: number;
    floorPlane: number;
    background: number;
  };
  onOpacityChange?: (type: string, value: number) => void;
  groundSize: number;
  onGroundSizeChange?: (value: number) => void;
  isGroundInfinite: boolean;
  onGroundInfiniteToggle?: (value: boolean) => void;
  groundShape: 'square' | 'circle' | 'hexagon';
  onGroundShapeChange?: (shape: string) => void;
  gridPattern: 'lines' | 'dots' | 'dashed';
  onGridPatternChange?: (pattern: string) => void;
  crosshairSettings: {
    visible: boolean;
    size: number;
    thickness: number;
    style: 'classic' | 'dot' | 'cross' | 'plus';
  };
  onCrosshairSettingChange?: (setting: string, value: any) => void;
  visibilitySettings: {
    floor: boolean;
    grid: boolean;
    floorPlane: boolean;
    background: boolean;
  };
  onVisibilityChange?: (setting: string, value: boolean) => void;
  gravityEnabled: boolean;
  onGravityToggle?: (enabled: boolean) => void;
  selectedTheme: string;
  onThemeSelect?: (theme: string) => void;
  environmentSettings: {
    skyVisible: boolean;
    skyDistance: number;
    skySunPosition?: [number, number, number];
    skyInclination: number;
    skyAzimuth: number;
    skyTurbidity: number;
    skyRayleigh: number;
    skyOpacity: number;
    starsVisible: boolean;
    starsRadius: number;
    starsDepth: number;
    starsCount: number;
    starsFactor: number;
    starsSaturation: number;
    starsFade: boolean;
  };
  onEnvironmentSettingChange?: (setting: string, value: any) => void;
} 