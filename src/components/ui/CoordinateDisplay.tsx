import React, { useState, useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';

interface CoordinateDisplayProps {
  cameraRef: MutableRefObject<THREE.Camera>;
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ cameraRef }) => {
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const updateCoordinates = () => {
      if (cameraRef.current) {
        const position = cameraRef.current.position;
        setCoordinates({
          x: Math.round(position.x * 100) / 100,
          y: Math.round(position.y * 100) / 100,
          z: Math.round(position.z * 100) / 100,
        });
      }
    };

    // Update coordinates on each animation frame
    const animationId = requestAnimationFrame(function animate() {
      updateCoordinates();
      requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [cameraRef]);

  return (
    <div className='fixed top-4 left-4 bg-black/60 text-white px-3 py-2 rounded shadow-lg z-50 border border-gray-700 opacity-30 select-none'>
      <div className='flex flex-col space-y-1 font-mono text-[10px]'>
        <div className='flex items-center'>
          <span>
            v0.1: {coordinates.x}, {coordinates.y}, {coordinates.z}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoordinateDisplay;
