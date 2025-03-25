// RGBA color object interface
export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Convert colors to RGBA format
export const hexToRgba = (hex: string, alpha: number = 1): RgbaColor => {
  if (!hex || hex === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  
  // Remove # if it exists
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b, a: alpha };
};

// Convert RGBA object to string
export const rgbaToString = ({ r, g, b, a }: RgbaColor): string => {
  if (a === 0) return 'transparent';
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Convert string RGBA to object
export const stringToRgba = (rgbaStr: string): RgbaColor => {
  if (!rgbaStr || rgbaStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  
  // Handle rgba format
  const rgbaMatch = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
    };
  }
  
  // Handle hex format
  return hexToRgba(rgbaStr);
};

// Parse any color format to RGBA object
export const parseColor = (color: string | RgbaColor | undefined): RgbaColor => {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof color === 'object') return color;
  return stringToRgba(color);
};

// Get color with opacity
export const getColorWithOpacity = (color: string | RgbaColor, opacity: number): string => {
  const rgba = parseColor(color);
  return rgbaToString({ ...rgba, a: opacity });
};

// Button color style interface
export interface ButtonColorStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
}

// Generate button color style with transparency check
export const getButtonColorStyle = (color: string | RgbaColor): ButtonColorStyle => {
  const rgba = parseColor(color);
  if (rgba.a === 0) {
    return {
      backgroundColor: 'transparent',
      backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 5px 5px'
    };
  }
  return { backgroundColor: rgbaToString(rgba) };
}; 