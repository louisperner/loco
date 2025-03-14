// Converter cores para formato RGBA
export const hexToRgba = (hex, alpha = 1) => {
  if (hex === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  
  // Remover o # se existir
  hex = hex.replace('#', '');
  
  // Converter cores de 3 dígitos para 6 dígitos
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Converter para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b, a: alpha };
};

// Converter objeto RGBA para string
export const rgbaToString = (rgba) => {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
};

// Converter string RGBA para objeto
export const stringToRgba = (rgbaStr) => {
  if (rgbaStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  
  const match = rgbaStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: parseFloat(match[4])
    };
  }
  
  // Fallback para hex
  return hexToRgba(rgbaStr);
};

// Gerar estilo de cor com verificação de transparência
export const getButtonColorStyle = (color) => {
  if (color === 'transparent') {
    return {
      backgroundColor: 'transparent',
      backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 5px 5px'
    };
  }
  return { backgroundColor: color };
}; 