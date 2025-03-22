import React from 'react';

const Crosshair = ({ visible = true, size = 5, color = 'white', thickness = 1, style = 'circle' }) => {
  if (!visible) return null;
  
  // Estilos de mira diferentes
  switch (style) {
    case 'circle': // Mira circular
      return (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none z-[1000] bg-transparent`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderWidth: `${thickness}px`,
            borderColor: color
          }}
        />
      );
    
    case 'dot': // Ponto central
      return (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[1000]`}
          style={{
            width: `${size/2}px`,
            height: `${size/2}px`,
            backgroundColor: color
          }}
        />
      );
    
    case 'cross': // Cruz simples
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
          <div 
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${thickness}px`,
              backgroundColor: color,
              left: `${-size/2}px`,
              top: `${-thickness/2}px`
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: `${thickness}px`,
              height: `${size}px`,
              backgroundColor: color,
              left: `${-thickness/2}px`,
              top: `${-size/2}px`
            }}
          />
        </div>
      );
    
    case 'plus': // Cruz com espaço no centro
      const gap = size / 4;
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
          {/* Linha horizontal esquerda */}
          <div 
            style={{
              position: 'absolute',
              width: `${size/2 - gap}px`,
              height: `${thickness}px`,
              backgroundColor: color,
              right: `${gap + thickness/2}px`,
              top: `${-thickness/2}px`
            }}
          />
          {/* Linha horizontal direita */}
          <div 
            style={{
              position: 'absolute',
              width: `${size/2 - gap}px`,
              height: `${thickness}px`,
              backgroundColor: color,
              left: `${gap + thickness/2}px`,
              top: `${-thickness/2}px`
            }}
          />
          {/* Linha vertical superior */}
          <div 
            style={{
              position: 'absolute',
              width: `${thickness}px`,
              height: `${size/2 - gap}px`,
              backgroundColor: color,
              left: `${-thickness/2}px`,
              bottom: `${gap + thickness/2}px`
            }}
          />
          {/* Linha vertical inferior */}
          <div 
            style={{
              position: 'absolute',
              width: `${thickness}px`,
              height: `${size/2 - gap}px`,
              backgroundColor: color,
              left: `${-thickness/2}px`,
              top: `${gap + thickness/2}px`
            }}
          />
        </div>
      );
      
    default:
      return null;
  }
};

export default Crosshair; 