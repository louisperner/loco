import React from 'react';
import { Switch } from '@/components/ui/switch';
import { RgbaColor } from 'react-colorful';
import { ColorPickerControl } from '../ColorPickerControl';
import { SettingValue } from '../types';

interface CrosshairTabProps {
  colors: {
    crosshair?: string;
  };
  crosshairSettings: {
    visible: boolean;
    size: number;
    thickness: number;
    style: 'classic' | 'dot' | 'cross' | 'plus';
  };
  onCrosshairSettingChange: (setting: string, value: SettingValue) => void;
  onColorChange: (type: string, color: string | RgbaColor) => void;
  showColorPicker: string | null;
  onColorPickerChange: (type: string | null) => void;
  colorPickerRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  colorPickerContainerRef: React.RefObject<HTMLDivElement>;
}

export function CrosshairTab({
  colors,
  crosshairSettings,
  onCrosshairSettingChange,
  onColorChange,
  showColorPicker,
  onColorPickerChange,
  colorPickerRefs,
  colorPickerContainerRef
}: CrosshairTabProps) {
  return (
    <div className="space-y-6">
      {/* Crosshair Settings */}
      <div className="space-y-3 bg-[#222222] p-3 rounded-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Crosshair</h3>
          <Switch 
            checked={crosshairSettings.visible}
            onCheckedChange={(checked) => onCrosshairSettingChange('visible', checked)}
          />
        </div>
        
        {crosshairSettings.visible && (
          <div className="space-y-3 mt-3">
            {/* Crosshair Color */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Color</span>
              <div className="flex items-center space-x-3">
                <ColorPickerControl
                  color={colors.crosshair || 'rgba(255, 255, 255, 1)'}
                  colorKey="crosshair"
                  showColorPicker={showColorPicker}
                  onColorPickerChange={onColorPickerChange}
                  onColorChange={onColorChange}
                  colorPickerRefs={colorPickerRefs}
                  colorPickerContainerRef={colorPickerContainerRef}
                />
              </div>
            </div>

            {/* Crosshair Style */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Style</span>
                <select
                  value={crosshairSettings.style}
                  onChange={(e) => onCrosshairSettingChange('style', e.target.value)}
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
                <span className="text-xs text-white/70">{crosshairSettings.size}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={crosshairSettings.size}
                onChange={(e) => onCrosshairSettingChange('size', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Crosshair Thickness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Thickness</span>
                <span className="text-xs text-white/70">{crosshairSettings.thickness}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={crosshairSettings.thickness}
                onChange={(e) => onCrosshairSettingChange('thickness', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 