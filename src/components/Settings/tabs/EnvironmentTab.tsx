import React from 'react';
import { Switch } from '@/components/ui/switch';
import { SettingValue } from '../types';

interface EnvironmentTabProps {
  environmentSettings: {
    skyVisible: boolean;
    skyDistance: number;
    skyInclination: number;
    skyAzimuth: number;
    skyTurbidity: number;
    skyRayleigh: number;
    skyOpacity: number;
    starsVisible: boolean;
    starsRadius: number;
    starsDepth: number;
    starsCount: number;
    starsFactor: number;
    starsSaturation: number;
    starsFade: boolean;
  };
  onEnvironmentSettingChange: (setting: string, value: SettingValue) => void;
  gravityEnabled: boolean;
  onGravityToggle: (enabled: boolean) => void;
}

export function EnvironmentTab({
  environmentSettings,
  onEnvironmentSettingChange,
  gravityEnabled,
  onGravityToggle
}: EnvironmentTabProps) {
  return (
    <div className="space-y-6">
      {/* Sky Settings */}
      <div className="space-y-3 bg-[#222222] p-3 rounded-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Sky</h3>
          <Switch 
            checked={environmentSettings.skyVisible}
            onCheckedChange={(checked) => onEnvironmentSettingChange('skyVisible', checked)}
          />
        </div>
        
        {environmentSettings.skyVisible && (
          <div className="space-y-3 mt-3">
            {/* Sky Distance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Distance</span>
                <span className="text-xs text-white/70">{environmentSettings.skyDistance}</span>
              </div>
              <input 
                type="range" 
                min="100000" 
                max="1000000" 
                step="10000"
                value={environmentSettings.skyDistance}
                onChange={(e) => onEnvironmentSettingChange('skyDistance', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sky Inclination */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Inclination</span>
                <span className="text-xs text-white/70">{environmentSettings.skyInclination}</span>
              </div>
              <input 
                type="range" 
                min="-1" 
                max="1" 
                step="0.1"
                value={environmentSettings.skyInclination}
                onChange={(e) => onEnvironmentSettingChange('skyInclination', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sky Azimuth */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Azimuth</span>
                <span className="text-xs text-white/70">{environmentSettings.skyAzimuth}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={environmentSettings.skyAzimuth}
                onChange={(e) => onEnvironmentSettingChange('skyAzimuth', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sky Turbidity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Turbidity</span>
                <span className="text-xs text-white/70">{environmentSettings.skyTurbidity}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="0.1"
                value={environmentSettings.skyTurbidity}
                onChange={(e) => onEnvironmentSettingChange('skyTurbidity', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sky Rayleigh */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Rayleigh</span>
                <span className="text-xs text-white/70">{environmentSettings.skyRayleigh}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="4" 
                step="0.1"
                value={environmentSettings.skyRayleigh}
                onChange={(e) => onEnvironmentSettingChange('skyRayleigh', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sky Opacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Opacity</span>
                <span className="text-xs text-white/70">{environmentSettings.skyOpacity}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={environmentSettings.skyOpacity}
                onChange={(e) => onEnvironmentSettingChange('skyOpacity', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stars Settings */}
      <div className="space-y-3 bg-[#222222] p-3 rounded-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Stars</h3>
          <Switch 
            checked={environmentSettings.starsVisible}
            onCheckedChange={(checked) => onEnvironmentSettingChange('starsVisible', checked)}
          />
        </div>
        
        {environmentSettings.starsVisible && (
          <div className="space-y-3 mt-3">
            {/* Stars Radius */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Radius</span>
                <span className="text-xs text-white/70">{environmentSettings.starsRadius}</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="200" 
                step="10"
                value={environmentSettings.starsRadius}
                onChange={(e) => onEnvironmentSettingChange('starsRadius', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Stars Depth */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Depth</span>
                <span className="text-xs text-white/70">{environmentSettings.starsDepth}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1"
                value={environmentSettings.starsDepth}
                onChange={(e) => onEnvironmentSettingChange('starsDepth', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Stars Count */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Count</span>
                <span className="text-xs text-white/70">{environmentSettings.starsCount}</span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="10000" 
                step="1000"
                value={environmentSettings.starsCount}
                onChange={(e) => onEnvironmentSettingChange('starsCount', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Stars Factor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Factor</span>
                <span className="text-xs text-white/70">{environmentSettings.starsFactor}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={environmentSettings.starsFactor}
                onChange={(e) => onEnvironmentSettingChange('starsFactor', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Stars Saturation */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Saturation</span>
                <span className="text-xs text-white/70">{environmentSettings.starsSaturation}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={environmentSettings.starsSaturation}
                onChange={(e) => onEnvironmentSettingChange('starsSaturation', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Stars Fade */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Fade</span>
              <Switch 
                checked={environmentSettings.starsFade}
                onCheckedChange={(checked) => onEnvironmentSettingChange('starsFade', checked)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Gravity Settings */}
      <div className="flex items-center justify-between bg-[#222222] p-3 rounded-md">
        <div>
          <span className="text-sm text-white/90 block">Gravity</span>
          <span className="text-xs text-white/50 block">Enable physics gravity</span>
        </div>
        <Switch 
          checked={gravityEnabled}
          onCheckedChange={onGravityToggle}
        />
      </div>
    </div>
  );
} 