import React, { useState, useEffect } from 'react';
import { getPerformanceStats } from '../Models/ModelInScene';

interface PerformanceMonitorProps {
  visible?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ visible = true }) => {
  const [stats, setStats] = useState({ fps: 60, quality: 'high', materialCacheSize: 0 });

  useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      setStats(getPerformanceStats());
    };

    // Update stats every second
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return '#4ade80'; // green
      case 'medium': return '#fbbf24'; // yellow
      case 'low': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className=" top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-sm font-mono z-50 backdrop-blur-sm border border-white/10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span>FPS:</span>
          <span className={`font-bold ${stats.fps < 30 ? 'text-red-400' : stats.fps < 45 ? 'text-yellow-400' : 'text-green-400'}`}>
            {stats.fps}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Quality:</span>
          <span 
            className="font-bold uppercase text-xs px-2 py-1 rounded"
            style={{ 
              backgroundColor: getQualityColor(stats.quality) + '20',
              color: getQualityColor(stats.quality)
            }}
          >
            {stats.quality}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Cache:</span>
          <span className="text-gray-300">{stats.materialCacheSize}</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 