import React from 'react';

interface CrosshairProps {
  visible?: boolean;
  size?: number;
  color?: string;
  thickness?: number;
  style?: 'circle' | 'dot' | 'cross' | 'plus' | 'classic';
}

const Crosshair: React.FC<CrosshairProps> = ({ 
  visible = true, 
  size = 5, 
  color = 'white', 
  thickness = 1, 
  style = 'circle' 
}) => {
  if (!visible) return null;
  
  // Different crosshair styles
  switch (style) {
    case 'circle': // Circular crosshair
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
    
    case 'dot': // Center dot
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
    
    case 'cross': // Simple cross
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
    
    case 'plus': { // Cross with space in center
      const gap = size / 4;
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
          {/* Left horizontal line */}
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
          {/* Right horizontal line */}
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
          {/* Top vertical line */}
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
          {/* Bottom vertical line */}
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
    }
      
    default:
      return null;
  }
};

export default Crosshair; 