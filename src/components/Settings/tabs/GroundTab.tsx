import React from 'react';
import { Switch } from '@/components/ui/switch';
import { RgbaColor } from 'react-colorful';
import { ColorPickerControl } from '../ColorPickerControl';

interface GroundTabProps {
  colors: {
    floorPlane?: string;
    grid?: string;
  };
  visibilitySettings: {
    floorPlane: boolean;
    grid: boolean;
    minimap: boolean;
  };
  onVisibilityChange: (setting: string, checked: boolean) => void;
  onColorChange: (type: string, color: string | RgbaColor) => void;
  groundSize: number;
  onGroundSizeChange: (value: number) => void;
  isGroundInfinite: boolean;
  onGroundInfiniteToggle: (value: boolean) => void;
  groundShape: 'square' | 'circle' | 'hexagon';
  onGroundShapeChange: (shape: string) => void;
  gridPattern: 'lines' | 'dots' | 'dashed';
  onGridPatternChange: (pattern: string) => void;
  opacities: {
    grid: number;
    floorPlane: number;
  };
  onOpacityChange: (type: string, value: number) => void;
  showColorPicker: string | null;
  onColorPickerChange: (type: string | null) => void;
  colorPickerRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  colorPickerContainerRef: React.RefObject<HTMLDivElement>;
}

export function GroundTab({
  colors,
  visibilitySettings,
  onVisibilityChange,
  onColorChange,
  groundSize,
  onGroundSizeChange,
  isGroundInfinite,
  onGroundInfiniteToggle,
  groundShape,
  onGroundShapeChange,
  gridPattern,
  onGridPatternChange,
  opacities,
  onOpacityChange,
  showColorPicker,
  onColorPickerChange,
  colorPickerRefs,
  colorPickerContainerRef
}: GroundTabProps) {
  return (
    <div className="space-y-6">
      {/* Ground Settings */}
      <div className="space-y-3 bg-[#222222] p-3 rounded-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Ground</h3>
          <Switch 
            checked={visibilitySettings.floorPlane}
            onCheckedChange={(checked) => onVisibilityChange('floorPlane', checked)}
          />
        </div>
        
        {visibilitySettings.floorPlane && (
          <div className="space-y-3 mt-3">
            {/* Ground Color */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Color</span>
              <div className="flex items-center space-x-3">
                <ColorPickerControl
                  color={colors.floorPlane || 'rgba(100, 100, 100, 0.3)'}
                  colorKey="floorPlane"
                  showColorPicker={showColorPicker}
                  onColorPickerChange={onColorPickerChange}
                  onColorChange={onColorChange}
                  colorPickerRefs={colorPickerRefs}
                  colorPickerContainerRef={colorPickerContainerRef}
                />
              </div>
            </div>

            {/* Ground Shape */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Shape</span>
                <select
                  value={groundShape}
                  onChange={(e) => onGroundShapeChange(e.target.value)}
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
                onChange={(e) => onGroundSizeChange(parseInt(e.target.value))}
                disabled={isGroundInfinite}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Infinite Ground */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Infinite</span>
              <Switch 
                checked={isGroundInfinite}
                onCheckedChange={onGroundInfiniteToggle}
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
            checked={visibilitySettings.grid}
            onCheckedChange={(checked) => onVisibilityChange('grid', checked)}
          />
        </div>
        
        {visibilitySettings.grid && (
          <div className="space-y-3 mt-3">
            {/* Grid Color */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Color</span>
              <div className="flex items-center space-x-3">
                <ColorPickerControl
                  color={colors.grid || 'rgba(255, 255, 255, 0.5)'}
                  colorKey="grid"
                  showColorPicker={showColorPicker}
                  onColorPickerChange={onColorPickerChange}
                  onColorChange={onColorChange}
                  colorPickerRefs={colorPickerRefs}
                  colorPickerContainerRef={colorPickerContainerRef}
                />
              </div>
            </div>

            {/* Grid Pattern */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Pattern</span>
                <select
                  value={gridPattern}
                  onChange={(e) => onGridPatternChange(e.target.value)}
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
                <span className="text-xs text-white/70">{opacities.grid.toFixed(1)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={opacities.grid}
                onChange={(e) => onOpacityChange('grid', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Minimap Settings */}
      <div className="space-y-3 bg-[#222222] p-3 rounded-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Minimap</h3>
          <Switch 
            checked={visibilitySettings.minimap}
            onCheckedChange={(checked) => onVisibilityChange('minimap', checked)}
          />
        </div>
        
        {visibilitySettings.minimap && (
          <div className="mt-2 text-xs text-white/70">
            Shows a top-down minimap view of the scene in the bottom-right corner
          </div>
        )}
      </div>
    </div>
  );
} 