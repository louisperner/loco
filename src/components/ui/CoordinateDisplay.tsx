import React, { useState, useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';

interface CoordinateDisplayProps {
  cameraRef: MutableRefObject<THREE.Camera>;
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ cameraRef }) => {
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });
  const [rotations, setRotations] = useState({ x: 0, y: 0, z: 0 });
  const [direction, setDirection] = useState({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    const updateCoordinates = () => {
      if (cameraRef.current) {
        const position = cameraRef.current.position;
        const rotation = cameraRef.current.rotation;
        
        // Calculate direction vector
        const directionVector = new THREE.Vector3(0, 0, -1);
        directionVector.applyQuaternion(cameraRef.current.quaternion);
        
        setCoordinates({
          x: Math.round(position.x * 100) / 100,
          y: Math.round(position.y * 100) / 100,
          z: Math.round(position.z * 100) / 100,
        });
        setRotations({
          x: Math.round(rotation.x * 100) / 100,
          y: Math.round(rotation.y * 100) / 100,
          z: Math.round(rotation.z * 100) / 100,
        });
        setDirection({
          x: Math.round(directionVector.x * 100) / 100,
          y: Math.round(directionVector.y * 100) / 100,
          z: Math.round(directionVector.z * 100) / 100,
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
            xyz: {coordinates.x}, {coordinates.y}, {coordinates.z}
            <br />
            {/* v0.2:  */}
            {/* rot: {rotations.x}, {rotations.y}, {rotations.z} */}
            {/* <br /> */}
            {/* dir: {direction.x}, {direction.y}, {direction.z} */}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoordinateDisplay;
