import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RgbaColorPicker, RgbaColor } from 'react-colorful';
import { FaUndo } from 'react-icons/fa';
import { parseColor } from '../utils';

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
          <div 
            className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
            style={{ backgroundColor: colors.background }}
            onClick={() => onColorPickerChange('background')}
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
                  color={parseColor(colors.background)}
                  onChange={(color) => onColorChange('background', color)}
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
            checked={visibilitySettings.grid}
            onCheckedChange={(checked) => onVisibilityChange('grid', checked)}
          />
          <div 
            className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
            style={{ backgroundColor: colors.grid }}
            onClick={() => onColorPickerChange('grid')}
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
                  color={parseColor(colors.grid)}
                  onChange={(color) => onColorChange('grid', color)}
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
            checked={visibilitySettings.floorPlane}
            onCheckedChange={(checked) => onVisibilityChange('floorPlane', checked)}
          />
          <div 
            className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
            style={{ backgroundColor: colors.floorPlane }}
            onClick={() => onColorPickerChange('floorPlane')}
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
                  color={parseColor(colors.floorPlane)}
                  onChange={(color) => onColorChange('floorPlane', color)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 