import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useGameStore } from '../../../store/useGameStore';
import { useModelStore } from '../../../store/useModelStore';

const PerformanceTab: React.FC = () => {
  const { cullingSettings, setCullingSettings, showCullingSphere, setShowCullingSphere } = useGameStore();
  const { addModel } = useModelStore();

  const handleCullingEnabledChange = (enabled: boolean) => {
    // console.log('PerformanceTab: Setting culling enabled to:', enabled);
    setCullingSettings({ enabled });
  };

  const handleCanvasRadiusChange = (value: number[]) => {
    // console.log('PerformanceTab: Setting canvas radius to:', value[0]);
    setCullingSettings({ canvasRadius: value[0] });
  };

  const handleMinimapRadiusChange = (value: number[]) => {
    // console.log('PerformanceTab: Setting minimap radius to:', value[0]);
    setCullingSettings({ minimapRadius: value[0] });
  };

  const createTestCubes = () => {
    const colors = ['#4ade80', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6'];
    
    // Create cubes at different distances to test culling
    for (let i = 0; i < 5; i++) {
      const distance = 10 + (i * 15); // 10, 25, 40, 55, 70 units away
      const angle = (i * Math.PI * 2) / 5; // Spread them in a circle
      
      addModel({
        url: 'primitive://cube',
        fileName: `test-cube-${distance}u.gltf`,
        position: [
          Math.cos(angle) * distance,
          2,
          Math.sin(angle) * distance
        ] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: 1,
        isInScene: true,
        isPrimitive: true,
        primitiveType: 'cube' as const,
        color: colors[i],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Performance Settings</h3>
        
        {/* Culling Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">Enable Object Culling</label>
              <p className="text-xs text-gray-400">Hide distant objects to improve performance</p>
            </div>
            <Switch
              checked={cullingSettings.enabled}
              onCheckedChange={handleCullingEnabledChange}
            />
          </div>

          {cullingSettings.enabled && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Canvas Culling Distance</label>
                  <span className="text-xs text-gray-400">{cullingSettings.canvasRadius} units</span>
                </div>
                                 <p className="text-xs text-gray-400 mb-2">
                   Objects beyond this distance won&apos;t render in the main view
                 </p>
                <Slider
                  value={[cullingSettings.canvasRadius]}
                  onValueChange={handleCanvasRadiusChange}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Minimap Culling Distance</label>
                  <span className="text-xs text-gray-400">{cullingSettings.minimapRadius} units</span>
                </div>
                                 <p className="text-xs text-gray-400 mb-2">
                   Objects beyond this distance won&apos;t render in the minimap
                 </p>
                <Slider
                  value={[cullingSettings.minimapRadius]}
                  onValueChange={handleMinimapRadiusChange}
                  min={100}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">Show Culling Sphere</label>
              <p className="text-xs text-gray-400">Visualize the culling area (debug)</p>
            </div>
            <Switch
              checked={showCullingSphere}
              onCheckedChange={setShowCullingSphere}
            />
          </div>
        </div>

        {/* Performance Tips */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">Performance Tips</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Lower canvas culling distance for better performance</li>
            <li>• Higher minimap culling distance shows more objects on map</li>
            <li>• Enable culling sphere to see the effective area</li>
            <li>• Press &apos;C&apos; to quickly toggle culling sphere visibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab; 