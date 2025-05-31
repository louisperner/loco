import React, { useState, useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';
import { getCompassDirection, getPitchAngle, getDirectionStats } from '@/utils/userDirection';

interface DirectionDisplayProps {
  cameraRef: MutableRefObject<THREE.Camera>;
}

const DirectionDisplay: React.FC<DirectionDisplayProps> = ({ cameraRef }) => {
  const [direction, setDirection] = useState({ x: 0, y: 0, z: -1 });
  const [compassDirection, setCompassDirection] = useState('North');
  const [pitchAngle, setPitchAngle] = useState(0);
  const [stats, setStats] = useState({
    totalEntries: 0,
    timeSpan: 0,
    averageDirection: { x: 0, y: 0, z: -1 },
    mostCommonCompassDirection: 'North'
  });

  useEffect(() => {
    const updateDirection = () => {
      if (cameraRef.current) {
        // Calculate direction vector
        const directionVector = new THREE.Vector3(0, 0, -1);
        directionVector.applyQuaternion(cameraRef.current.quaternion);
        
        const newDirection = {
          x: directionVector.x,
          y: directionVector.y,
          z: directionVector.z
        };
        
        setDirection(newDirection);
        setCompassDirection(getCompassDirection(newDirection));
        setPitchAngle(getPitchAngle(newDirection));
      }
    };

    const updateStats = () => {
      setStats(getDirectionStats());
    };

    // Update direction on each animation frame
    const animationId = requestAnimationFrame(function animate() {
      updateDirection();
      requestAnimationFrame(animate);
    });

    // Update stats every 5 seconds
    const statsInterval = setInterval(updateStats, 5000);
    updateStats(); // Initial stats update

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(statsInterval);
    };
  }, [cameraRef]);

  return (
    <div className='fixed top-4 right-4 bg-black/60 text-white px-3 py-2 rounded shadow-lg z-50 border border-gray-700 opacity-80 select-none'>
      <div className='flex flex-col space-y-1 font-mono text-[10px]'>
        <div className='text-blue-300 font-semibold'>Direction Tracking</div>
        
        <div className='flex flex-col space-y-0.5'>
          <div>Compass: <span className='text-green-300'>{compassDirection}</span></div>
          <div>Pitch: <span className='text-yellow-300'>{Math.round(pitchAngle)}°</span></div>
          <div className='text-gray-400'>
            Dir: {Math.round(direction.x * 100) / 100}, {Math.round(direction.y * 100) / 100}, {Math.round(direction.z * 100) / 100}
          </div>
        </div>

        {stats.totalEntries > 0 && (
          <div className='border-t border-gray-600 pt-1 mt-1'>
            <div className='text-purple-300 text-[9px]'>History Stats</div>
            <div className='text-[9px] text-gray-400'>
              <div>Entries: {stats.totalEntries}</div>
              <div>Most Common: {stats.mostCommonCompassDirection}</div>
              <div>Time: {Math.round(stats.timeSpan / 1000 / 60)}min</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectionDisplay; 