import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RgbaColor } from 'react-colorful';
import { FaUndo } from 'react-icons/fa';
import { ColorPickerControl } from '../ColorPickerControl';

interface ColorsTabProps {
  colors: {
    background?: string;
    grid?: string;
    floorPlane?: string;
  };
  visibilitySettings: {
    background: boolean;
    grid: boolean;
    floorPlane: boolean;
  };
  onVisibilityChange: (setting: string, checked: boolean) => void;
  onColorChange: (type: string, color: string | RgbaColor) => void;
  onResetColors: () => void;
  isResetAnimating: boolean;
  showColorPicker: string | null;
  onColorPickerChange: (type: string | null) => void;
  colorPickerRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  colorPickerContainerRef: React.RefObject<HTMLDivElement>;
}

export function ColorsTab({
  colors,
  visibilitySettings,
  onVisibilityChange,
  onColorChange,
  onResetColors,
  isResetAnimating,
  showColorPicker,
  onColorPickerChange,
  colorPickerRefs,
  colorPickerContainerRef
}: ColorsTabProps) {
  return (
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
            checked={visibilitySettings.background}
            onCheckedChange={(checked) => onVisibilityChange('background', checked)}
          />
          <ColorPickerControl
            color={colors.background || 'rgba(0, 0, 0, 1)'}
            colorKey="background"
            showColorPicker={showColorPicker}
            onColorPickerChange={onColorPickerChange}
            onColorChange={onColorChange}
            colorPickerRefs={colorPickerRefs}
            colorPickerContainerRef={colorPickerContainerRef}
          />
        </div>
      </div>
      
      {/* Grid */}
      <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
        <span className="text-sm text-white/90">Grid</span>
        <div className="flex items-center space-x-3">
          <Switch 
            checked={visibilitySettings.grid}
            onCheckedChange={(checked) => onVisibilityChange('grid', checked)}
          />
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
      
      {/* Floor Plane */}
      <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
        <span className="text-sm text-white/90">Floor Plane</span>
        <div className="flex items-center space-x-3">
          <Switch 
            checked={visibilitySettings.floorPlane}
            onCheckedChange={(checked) => onVisibilityChange('floorPlane', checked)}
          />
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
    </div>
  );
} 