import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  SlidePanel,
  SlidePanelTrigger,
  SlidePanelContent,
  SlidePanelHeader,
  SlidePanelTitle,
  SlidePanelBody,
  SlidePanelFooter,
  SlidePanelClose,
} from '@/components/ui/slide-panel';
import { FaCog, FaTimes, FaUndo, FaPalette, FaSlidersH, FaChevronRight, FaMagic, FaLayerGroup, FaAdjust, FaEye, FaEyeSlash, FaExpand, FaInfinity, FaCube } from 'react-icons/fa';
import { Switch } from './switch';
import { Slider } from './slider';
import { RgbaColorPicker } from 'react-colorful';

// Constants for localStorage keys
const SETTINGS_STORAGE_KEY = 'loco-settings';

// Interface for all settings
interface LocoSettings {
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

// Function to save settings to localStorage
const saveSettings = (settings: LocoSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Function to load settings from localStorage
const loadSettings = (): LocoSettings | null => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
};

// Utility function to parse color string to RGBA object
const parseColor = (color: string) => {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
};

// Define the tab interface
export interface SettingsTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface SettingsPanelProps {
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

// TabsContent component to handle tab navigation and content display
const TabsContent = ({ tabs, activeTab, onTabChange }: { 
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tabs navigation */}
      <div className="flex mb-2 p-1 bg-white/10 rounded-lg">
        {tabs.map((tab) => (
          <Button 
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`flex-1 py-1 px-2 text-xs font-medium ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-sm' 
                : 'text-white/70 hover:text-white/90 hover:bg-white/10'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && (
              <span className={`mr-1 ${activeTab === tab.id ? 'text-black' : ''}`}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </Button>
        ))}
      </div>
      
      {/* Active tab content */}
      <div className="animate-fadeIn">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export function SettingsPanel({ 
  children, 
  onToggle, 
  tabs,
  isOpen,
  onClose,
  activeTab = 'cores',
  onTabChange,
  onColorChange,
  onResetColors,
  isResetAnimating,
  colorChanged,
  showColorPicker,
  onColorPickerChange,
  colorPickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({}),
  colors = {},
  opacities = {
    grid: 1,
    floorPlane: 1,
    background: 1
  },
  onOpacityChange,
  groundSize = 50,
  onGroundSizeChange,
  isGroundInfinite = false,
  onGroundInfiniteToggle,
  groundShape = 'square',
  onGroundShapeChange,
  gridPattern = 'lines',
  onGridPatternChange,
  crosshairSettings = {
    visible: true,
    size: 10,
    thickness: 2,
    style: 'classic'
  },
  onCrosshairSettingChange,
  visibilitySettings = {
    floor: true,
    grid: true,
    floorPlane: true,
    background: true
  },
  onVisibilityChange,
  gravityEnabled = false,
  onGravityToggle,
  selectedTheme = 'dark',
  onThemeSelect,
  environmentSettings = {
    skyVisible: true,
    skyDistance: 450000,
    skyInclination: 0,
    skyAzimuth: 0.25,
    skyTurbidity: 10,
    skyRayleigh: 2,
    skyOpacity: 1,
    starsVisible: true,
    starsRadius: 100,
    starsDepth: 50,
    starsCount: 5000,
    starsFactor: 4,
    starsSaturation: 0.5,
    starsFade: true
  },
  onEnvironmentSettingChange
}: SettingsPanelProps) {
  const [open, setOpen] = useState(isOpen || false);
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = loadSettings();
    if (savedSettings) {
      // Apply saved settings
      onColorChange && Object.entries(savedSettings.colors).forEach(([type, color]) => {
        onColorChange(type, color);
      });
      onOpacityChange && Object.entries(savedSettings.opacities).forEach(([type, value]) => {
        onOpacityChange(type, value);
      });
      onGroundSizeChange && onGroundSizeChange(savedSettings.groundSize);
      onGroundInfiniteToggle && onGroundInfiniteToggle(savedSettings.isGroundInfinite);
      onGroundShapeChange && onGroundShapeChange(savedSettings.groundShape);
      onGridPatternChange && onGridPatternChange(savedSettings.gridPattern);
      onCrosshairSettingChange && Object.entries(savedSettings.crosshairSettings).forEach(([setting, value]) => {
        onCrosshairSettingChange(setting, value);
      });
      onVisibilityChange && Object.entries(savedSettings.visibilitySettings).forEach(([setting, value]) => {
        onVisibilityChange(setting, value);
      });
      onGravityToggle && onGravityToggle(savedSettings.gravityEnabled);
      onThemeSelect && onThemeSelect(savedSettings.selectedTheme);
      onEnvironmentSettingChange && Object.entries(savedSettings.environmentSettings).forEach(([setting, value]) => {
        onEnvironmentSettingChange(setting, value);
      });
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const currentSettings: LocoSettings = {
      colors,
      opacities,
      groundSize,
      isGroundInfinite,
      groundShape,
      gridPattern,
      crosshairSettings,
      visibilitySettings,
      gravityEnabled,
      selectedTheme,
      environmentSettings
    };
    saveSettings(currentSettings);
  }, [
    colors,
    opacities,
    groundSize,
    isGroundInfinite,
    groundShape,
    gridPattern,
    crosshairSettings,
    visibilitySettings,
    gravityEnabled,
    selectedTheme,
    environmentSettings
  ]);

  const defaultTabs: SettingsTab[] = [
    {
      id: 'cores',
      label: 'Colors',
      icon: <FaPalette className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* Reset Button */}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-blue-400 hover:text-blue-300 transition-all duration-300 ${isResetAnimating ? 'animate-spin' : ''}`}
              onClick={onResetColors}
            >
              <FaUndo size={12} className="mr-1" />
              <span className="text-xs">Reset</span>
            </Button>
          </div>
          
          {/* Background */}
          <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
            <span className="text-sm text-white/90">Background</span>
            <div className="flex items-center space-x-3">
              <Switch 
                checked={visibilitySettings?.background}
                onCheckedChange={(checked) => onVisibilityChange && onVisibilityChange('background', checked)}
              />
              <div 
                className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                style={{ backgroundColor: colors.background }}
                onClick={() => onColorPickerChange && onColorPickerChange('background')}
              />
              {showColorPicker === 'background' && (
                <div 
                  ref={(el) => {
                    if (colorPickerRefs.current) {
                      colorPickerRefs.current.background = el;
                    }
                  }}
                  className="absolute right-16 z-50"
                >
                  <div 
                    ref={colorPickerContainerRef}
                    className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
                  >
                    <RgbaColorPicker
                      color={colors.background ? parseColor(colors.background) : { r: 0, g: 0, b: 0, a: 1 }}
                      onChange={(color) => onColorChange && onColorChange('background', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Grid */}
          <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
            <span className="text-sm text-white/90">Grid</span>
            <div className="flex items-center space-x-3">
              <Switch 
                checked={visibilitySettings?.grid}
                onCheckedChange={(checked) => onVisibilityChange && onVisibilityChange('grid', checked)}
              />
              <div 
                className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                style={{ backgroundColor: colors.grid }}
                onClick={() => onColorPickerChange && onColorPickerChange('grid')}
              />
              {showColorPicker === 'grid' && (
                <div 
                  ref={(el) => {
                    if (colorPickerRefs.current) {
                      colorPickerRefs.current.grid = el;
                    }
                  }}
                  className="absolute right-16 z-50"
                >
                  <div 
                    ref={colorPickerContainerRef}
                    className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
                  >
                    <RgbaColorPicker
                      color={colors.grid ? parseColor(colors.grid) : { r: 255, g: 255, b: 255, a: 1 }}
                      onChange={(color) => onColorChange && onColorChange('grid', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Floor Plane */}
          <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
            <span className="text-sm text-white/90">Floor Plane</span>
            <div className="flex items-center space-x-3">
              <Switch 
                checked={visibilitySettings?.floorPlane}
                onCheckedChange={(checked) => onVisibilityChange && onVisibilityChange('floorPlane', checked)}
              />
              <div 
                className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                style={{ backgroundColor: colors.floorPlane }}
                onClick={() => onColorPickerChange && onColorPickerChange('floorPlane')}
              />
              {showColorPicker === 'floorPlane' && (
                <div 
                  ref={(el) => {
                    if (colorPickerRefs.current) {
                      colorPickerRefs.current.floorPlane = el;
                    }
                  }}
                  className="absolute right-16 z-50"
                >
                  <div 
                    ref={colorPickerContainerRef}
                    className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
                  >
                    <RgbaColorPicker
                      color={colors.floorPlane ? parseColor(colors.floorPlane) : { r: 128, g: 128, b: 128, a: 1 }}
                      onChange={(color) => onColorChange && onColorChange('floorPlane', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ground',
      label: 'Ground',
      icon: <FaLayerGroup className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* Ground Settings */}
          <div className="space-y-3 bg-[#222222] p-3 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/90">Ground</h3>
              <Switch 
                checked={visibilitySettings?.floorPlane}
                onCheckedChange={(checked) => onVisibilityChange && onVisibilityChange('floorPlane', checked)}
              />
            </div>
            
            {visibilitySettings?.floorPlane && (
              <div className="space-y-3 mt-3">
                {/* Ground Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">Color</span>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                      style={{ backgroundColor: colors.floorPlane }}
                      onClick={() => onColorPickerChange && onColorPickerChange('floorPlane')}
                    />
                    {showColorPicker === 'floorPlane' && (
                      <div 
                        ref={(el) => {
                          if (colorPickerRefs.current) {
                            colorPickerRefs.current.floorPlane = el;
                          }
                        }}
                        className="absolute right-16 z-50"
                      >
                        <div 
                          ref={colorPickerContainerRef}
                          className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
                        >
                          <RgbaColorPicker
                            color={colors.floorPlane ? parseColor(colors.floorPlane) : { r: 128, g: 128, b: 128, a: 1 }}
                            onChange={(color) => onColorChange && onColorChange('floorPlane', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ground Shape */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Shape</span>
                    <select
                      value={groundShape}
                      onChange={(e) => onGroundShapeChange && onGroundShapeChange(e.target.value as 'square' | 'circle' | 'hexagon')}
                      className="bg-[#333333] text-white/90 text-xs rounded-md border border-white/10 px-2 py-1"
                    >
                      <option value="square">Square</option>
                      <option value="circle">Circle</option>
                      <option value="hexagon">Hexagon</option>
                    </select>
                  </div>
                </div>

                {/* Ground Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Size</span>
                    <span className="text-xs text-white/70">{groundSize}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={groundSize}
                    onChange={(e) => onGroundSizeChange && onGroundSizeChange(parseInt(e.target.value))}
                    disabled={isGroundInfinite}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Infinite Ground */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">Infinite</span>
                  <Switch 
                    checked={isGroundInfinite}
                    onCheckedChange={(checked) => onGroundInfiniteToggle && onGroundInfiniteToggle(checked)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grid Settings */}
          <div className="space-y-3 bg-[#222222] p-3 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/90">Grid</h3>
              <Switch 
                checked={visibilitySettings?.grid}
                onCheckedChange={(checked) => onVisibilityChange && onVisibilityChange('grid', checked)}
              />
            </div>
            
            {visibilitySettings?.grid && (
              <div className="space-y-3 mt-3">
                {/* Grid Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">Color</span>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                      style={{ backgroundColor: colors.grid }}
                      onClick={() => onColorPickerChange && onColorPickerChange('grid')}
                    />
                    {showColorPicker === 'grid' && (
                      <div 
                        ref={(el) => {
                          if (colorPickerRefs.current) {
                            colorPickerRefs.current.grid = el;
                          }
                        }}
                        className="absolute right-16 z-50"
                      >
                        <div 
                          ref={colorPickerContainerRef}
                          className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
                        >
                          <RgbaColorPicker
                            color={colors.grid ? parseColor(colors.grid) : { r: 255, g: 255, b: 255, a: 1 }}
                            onChange={(color) => onColorChange && onColorChange('grid', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Pattern */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Pattern</span>
                    <select
                      value={gridPattern}
                      onChange={(e) => onGridPatternChange && onGridPatternChange(e.target.value as 'lines' | 'dots' | 'dashed')}
                      className="bg-[#333333] text-white/90 text-xs rounded-md border border-white/10 px-2 py-1"
                    >
                      <option value="lines">Lines</option>
                      <option value="dots">Dots</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>
                </div>

                {/* Grid Opacity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Opacity</span>
                    <span className="text-xs text-white/70">{opacities.grid || 1}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={opacities.grid || 1}
                    onChange={(e) => onOpacityChange && onOpacityChange('grid', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'crosshair',
      label: 'Crosshair',
      icon: <FaAdjust className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* Crosshair Settings */}
          <div className="space-y-3 bg-[#222222] p-3 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/90">Crosshair</h3>
              <Switch 
                checked={crosshairSettings?.visible}
                onCheckedChange={(checked) => onCrosshairSettingChange && onCrosshairSettingChange('visible', checked)}
              />
            </div>
            
            {crosshairSettings?.visible && (
              <div className="space-y-3 mt-3">
                {/* Crosshair Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">Color</span>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                      style={{ backgroundColor: colors.crosshair }}
                      onClick={() => onColorPickerChange && onColorPickerChange('crosshair')}
                    />
                    {showColorPicker === 'crosshair' && (
                      <div 
                        ref={(el) => {
                          if (colorPickerRefs.current) {
                            colorPickerRefs.current.crosshair = el;
                          }
                        }}
                        className="absolute right-16 z-50"
                      >
                        <div 
                          ref={colorPickerContainerRef}
                          className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
                        >
                          <RgbaColorPicker
                            color={colors.crosshair ? parseColor(colors.crosshair) : { r: 255, g: 255, b: 255, a: 1 }}
                            onChange={(color) => onColorChange && onColorChange('crosshair', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Crosshair Style */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Style</span>
                    <select
                      value={crosshairSettings?.style}
                      onChange={(e) => onCrosshairSettingChange && onCrosshairSettingChange('style', e.target.value as 'classic' | 'dot' | 'cross' | 'plus')}
                      className="bg-[#333333] text-white/90 text-xs rounded-md border border-white/10 px-2 py-1"
                    >
                      <option value="classic">Classic</option>
                      <option value="dot">Dot</option>
                      <option value="cross">Cross</option>
                      <option value="plus">Plus</option>
                    </select>
                  </div>
                </div>

                {/* Crosshair Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Size</span>
                    <span className="text-xs text-white/70">{crosshairSettings?.size}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={crosshairSettings?.size}
                    onChange={(e) => onCrosshairSettingChange && onCrosshairSettingChange('size', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Crosshair Thickness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Thickness</span>
                    <span className="text-xs text-white/70">{crosshairSettings?.thickness}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={crosshairSettings?.thickness}
                    onChange={(e) => onCrosshairSettingChange && onCrosshairSettingChange('thickness', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'ambiente',
      label: 'Environment',
      icon: <FaMagic className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* Sky Settings */}
          <div className="space-y-3 bg-[#222222] p-3 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/90">Sky</h3>
              <Switch 
                checked={environmentSettings.skyVisible}
                onCheckedChange={(checked) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyVisible', checked)}
              />
            </div>
            
            {environmentSettings.skyVisible && (
              <div className="space-y-3 mt-3">
                {/* Sky Distance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Distance</span>
                    <span className="text-xs text-white/70">{environmentSettings.skyDistance}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100000" 
                    max="1000000" 
                    step="10000"
                    value={environmentSettings.skyDistance}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyDistance', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sky Inclination */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Inclination</span>
                    <span className="text-xs text-white/70">{environmentSettings.skyInclination}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-1" 
                    max="1" 
                    step="0.1"
                    value={environmentSettings.skyInclination}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyInclination', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sky Azimuth */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Azimuth</span>
                    <span className="text-xs text-white/70">{environmentSettings.skyAzimuth}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={environmentSettings.skyAzimuth}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyAzimuth', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sky Turbidity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Turbidity</span>
                    <span className="text-xs text-white/70">{environmentSettings.skyTurbidity}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="0.1"
                    value={environmentSettings.skyTurbidity}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyTurbidity', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sky Rayleigh */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Rayleigh</span>
                    <span className="text-xs text-white/70">{environmentSettings.skyRayleigh}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="4" 
                    step="0.1"
                    value={environmentSettings.skyRayleigh}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyRayleigh', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sky Opacity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Opacity</span>
                    <span className="text-xs text-white/70">{environmentSettings.skyOpacity}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={environmentSettings.skyOpacity}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('skyOpacity', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stars Settings */}
          <div className="space-y-3 bg-[#222222] p-3 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/90">Stars</h3>
              <Switch 
                checked={environmentSettings.starsVisible}
                onCheckedChange={(checked) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsVisible', checked)}
              />
            </div>
            
            {environmentSettings.starsVisible && (
              <div className="space-y-3 mt-3">
                {/* Stars Radius */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Radius</span>
                    <span className="text-xs text-white/70">{environmentSettings.starsRadius}</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="200" 
                    step="10"
                    value={environmentSettings.starsRadius}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsRadius', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stars Depth */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Depth</span>
                    <span className="text-xs text-white/70">{environmentSettings.starsDepth}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    step="1"
                    value={environmentSettings.starsDepth}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsDepth', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stars Count */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Count</span>
                    <span className="text-xs text-white/70">{environmentSettings.starsCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="10000" 
                    step="1000"
                    value={environmentSettings.starsCount}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsCount', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stars Factor */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Factor</span>
                    <span className="text-xs text-white/70">{environmentSettings.starsFactor}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={environmentSettings.starsFactor}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsFactor', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stars Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Saturation</span>
                    <span className="text-xs text-white/70">{environmentSettings.starsSaturation}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={environmentSettings.starsSaturation}
                    onChange={(e) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsSaturation', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stars Fade */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">Fade</span>
                  <Switch 
                    checked={environmentSettings.starsFade}
                    onCheckedChange={(checked) => onEnvironmentSettingChange && onEnvironmentSettingChange('starsFade', checked)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gravity Settings */}
          <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
            <div>
              <span className="text-sm text-white/90 block">Gravity</span>
              <span className="text-xs text-white/50 block">Enable physics gravity</span>
            </div>
            <Switch 
              checked={gravityEnabled}
              onCheckedChange={(checked) => onGravityToggle && onGravityToggle(checked)}
            />
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onToggle?.(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showColorPicker) return;

      // Check if click is inside any of the color picker containers
      const isColorPickerClick = Object.values(colorPickerRefs.current).some(
        ref => ref && ref.contains(event.target as Node)
      );

      // Check if click is inside the color picker container
      const isInsideContainer = colorPickerContainerRef.current?.contains(event.target as Node);

      if (!isColorPickerClick && !isInsideContainer) {
        onColorPickerChange?.(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker, onColorPickerChange]);

  return (
    <SlidePanel open={open} onOpenChange={handleOpenChange}>
      <SlidePanelTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10"
        >
          <FaCog className="w-5 h-5" />
        </Button>
      </SlidePanelTrigger>
      <SlidePanelContent title="Settings">
        <div className="bg-[#1a1a1a] flex flex-col h-full text-white z-50">
          <SlidePanelHeader>
            <SlidePanelTitle>Settings</SlidePanelTitle>
            <SlidePanelClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/70 hover:text-white/90 transition-colors duration-200 rounded-full p-2 hover:bg-white/10"
                onClick={() => onClose && onClose()}
              >
                <FaTimes className="w-4 h-4" />
              </Button>
            </SlidePanelClose>
          </SlidePanelHeader>
          
          <SlidePanelBody>
            {tabs ? (
              <TabsContent 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={onTabChange || (() => {})} 
              />
            ) : (
              <TabsContent 
                tabs={defaultTabs} 
                activeTab={activeTab} 
                onTabChange={onTabChange || (() => {})} 
              />
            )}
          </SlidePanelBody>
          
          <SlidePanelFooter>
            <div className="text-xs text-white/40 text-center">
              <span className="font-light tracking-wide">Your virtual space • Design by Loco</span>
            </div>
          </SlidePanelFooter>
        </div>
      </SlidePanelContent>
    </SlidePanel>
  );
} 