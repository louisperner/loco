import React from 'react';
import { RgbaColorPicker, RgbaColor } from 'react-colorful';
import { parseColor } from './utils';

interface ColorPickerControlProps {
  color: string;
  colorKey: string;
  showColorPicker: string | null;
  onColorPickerChange: (type: string | null) => void;
  onColorChange: (type: string, color: string | RgbaColor) => void;
  colorPickerRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  colorPickerContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * A reusable color picker control component
 * Handles displaying the color swatch and the color picker popup
 */
export function ColorPickerControl({
  color,
  colorKey,
  showColorPicker,
  onColorPickerChange,
  onColorChange,
  colorPickerRefs,
  colorPickerContainerRef
}: ColorPickerControlProps) {
  return (
    <>
      <div 
        className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
        style={{ backgroundColor: color }}
        onClick={() => onColorPickerChange(colorKey)}
      />
      {showColorPicker === colorKey && (
        <div 
          ref={(el) => {
            if (colorPickerRefs.current) {
              colorPickerRefs.current[colorKey] = el;
            }
          }}
          className="absolute right-16 z-50"
        >
          <div 
            ref={colorPickerContainerRef}
            className="p-3 rounded-lg bg-[#333333] shadow-xl border border-white/10"
          >
            <RgbaColorPicker
              color={parseColor(color)}
              onChange={(color) => onColorChange(colorKey, color)}
            />
          </div>
        </div>
      )}
    </>
  );
} 