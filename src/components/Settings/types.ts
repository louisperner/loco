import { ReactNode, MutableRefObject, RefObject } from 'react';
import { RgbaColor } from 'react-colorful';

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

export type ColorType = 'grid' | 'floorPlane' | 'background' | 'crosshair';

export interface SettingsTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

// Define possible value types for settings
export type SettingValue = string | number | boolean | [number, number, number] | RgbaColor;

export interface SettingsPanelProps {
  children?: ReactNode;
  onToggle?: (isOpen: boolean) => void;
  tabs?: SettingsTab[];
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onColorChange?: (type: string, color: string | RgbaColor) => void;
  onResetColors?: () => void;
  isResetAnimating?: boolean;
  colorChanged?: string | null;
  showColorPicker?: string | null;
  onColorPickerChange?: (type: string | null) => void;
  colorPickerRefs?: MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
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
  onCrosshairSettingChange?: (setting: string, value: SettingValue) => void;
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
  onEnvironmentSettingChange?: (setting: string, value: SettingValue) => void;
  showCoordinates?: boolean;
  onCoordinatesToggle?: (show: boolean) => void;
}

export interface ColorPickerControlProps {
  color: string;
  colorKey: string;
  showColorPicker: string | null;
  onColorPickerChange: (type: string | null) => void;
  onColorChange: (type: string, color: string | RgbaColor) => void;
  colorPickerRefs: MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  colorPickerContainerRef: RefObject<HTMLDivElement>;
}
