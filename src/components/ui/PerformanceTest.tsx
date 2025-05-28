import React from 'react';
import { useModelStore } from '../../store/useModelStore';

const PerformanceTest: React.FC = () => {
  const { addModel } = useModelStore();

  const createMultipleCubes = (count: number, spread: number = 10) => {
    for (let i = 0; i < count; i++) {
      // Create cubes in a larger area to test culling
      const x = (Math.random() - 0.5) * spread * 2;
      const z = (Math.random() - 0.5) * spread * 2;
      const y = Math.random() * 5 + 1; // Random height between 1-6
      
      // Random colors for better visibility
      const colors = ['#4ade80', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#f97316'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      addModel({
        url: 'primitive://cube',
        fileName: 'test-cube.gltf',
        position: [Math.round(x), Math.round(y), Math.round(z)] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: 1,
        isInScene: true,
        isPrimitive: true,
        primitiveType: 'cube' as const,
        color,
      });
    }
  };

  return (
    <div className="hide bottom-20 right-4 bg-black/80 text-white p-3 rounded-lg text-sm backdrop-blur-sm border border-white/10 z-50">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-center">Performance Test</h3>
        <button
          onClick={() => {
            addModel({
              url: 'primitive://cube',
              fileName: 'test-cube.gltf',
              position: [0, 1, -5] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number],
              scale: 1,
              isInScene: true,
              isPrimitive: true,
              primitiveType: 'cube' as const,
              color: '#4ade80',
            });
          }}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
        >
          Add 1 Cube (5u away)
        </button>
        <button
          onClick={() => {
            addModel({
              url: 'primitive://cube',
              fileName: 'test-cube.gltf',
              position: [0, 1, -30] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number],
              scale: 1,
              isInScene: true,
              isPrimitive: true,
              primitiveType: 'cube' as const,
              color: '#ef4444',
            });
          }}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
        >
          Add 1 Cube (30u away)
        </button>
        <button
          onClick={() => createMultipleCubes(25, 10)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          25 Cubes (10u)
        </button>
        <button
          onClick={() => createMultipleCubes(50, 20)}
          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
        >
          50 Cubes (20u)
        </button>
        <button
          onClick={() => createMultipleCubes(100, 40)}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          100 Cubes (40u)
        </button>
        <div className="text-xs text-gray-400 text-center mt-2">
          Press &apos;C&apos; to toggle culling sphere (25u radius)
        </div>
      </div>
    </div>
  );
};

export default PerformanceTest; 