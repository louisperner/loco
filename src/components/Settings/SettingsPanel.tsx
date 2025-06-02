import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FaTimes, FaPalette, FaLayerGroup, FaAdjust, FaGlobeAmericas, FaDesktop, FaRobot, FaServer, FaTachometerAlt, FaCubes } from 'react-icons/fa';
import { ColorsTab } from './tabs/ColorsTab';
import { GroundTab } from './tabs/GroundTab';
import { CrosshairTab } from './tabs/CrosshairTab';
import { EnvironmentTab } from './tabs/EnvironmentTab';
import { ProceduralWorldTab } from './tabs/ProceduralWorldTab';
import InterfaceSettings from './InterfaceSettings';
import { OpenRouterTab } from './tabs/OpenRouterTab';
import { OllamaTab } from './tabs/OllamaTab';
import PerformanceTab from './tabs/PerformanceTab';
import { SettingsPanelProps, SettingsTab } from './types';
import { RgbaColor } from 'react-colorful';
import UserProfile from '../Game/UserProfile';

interface CrosshairSettings {
  visible: boolean;
  size: number;
  thickness: number;
  style: 'classic' | 'dot' | 'cross' | 'plus';
}

// TabsContent component displays the active tab content
function TabsContent({ tabs, activeTab, onTabChange }: { tabs: SettingsTab[]; activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <div className="flex h-full">
      {/* Tab navigation */}
      <div className="w-36 bg-[#222222] p-2 flex flex-col space-y-1 min-h-[300px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-left ${
              activeTab === tab.id
                ? 'bg-[#7d3296] text-white'
                : 'text-white/70 hover:bg-[#333333] transition-colors'
            } transition-colors w-full`}
          >
            <span className="flex-shrink-0">{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

export function SettingsPanel({
  children,
  onToggle,
  tabs,
  isOpen,
  onClose,
  activeTab = 'colors',
  onTabChange,
  onColorChange,
  onResetColors,
  isResetAnimating,
  colorChanged,
  showColorPicker,
  onColorPickerChange,
  colorPickerRefs,
  colors = {},
  opacities = {
    grid: 1,
    floorPlane: 1,
    background: 1,
  },
  onOpacityChange,
  groundSize = 50,
  onGroundSizeChange,
  isGroundInfinite = false,
  onGroundInfiniteToggle,
  groundShape = 'square',
  onGroundShapeChange,
  gridPattern = 'lines',
  onGridPatternChange,
  crosshairSettings = {
    visible: true,
    size: 10,
    thickness: 2,
    style: 'classic',
  },
  onCrosshairSettingChange,
  visibilitySettings = {
    floor: true,
    grid: true,
    floorPlane: true,
    background: true,
    minimap: true,
  },
  onVisibilityChange,
  gravityEnabled = false,
  onGravityToggle,
  showCoordinates = true,
  onCoordinatesToggle,
  alwaysOnTop = false,
  onAlwaysOnTopToggle,
  environmentSettings = {
    skyVisible: false,
    skyDistance: 450000,
    skyInclination: 0,
    skyAzimuth: 0.25,
    skyTurbidity: 10,
    skyRayleigh: 0,
    skyOpacity: 1,
    starsVisible: true,
    starsRadius: 100,
    starsDepth: 50,
    starsCount: 5000,
    starsFactor: 4,
    starsSaturation: 0.5,
    starsFade: true,
  },
  onEnvironmentSettingChange,
  proceduralWorldSettings = {
    enabled: false,
    renderDistance: 3,
    terrainSeed: 12345,
    enableCulling: true,
    autoGenerate: true,
  },
  onProceduralWorldSettingChange,
  onRegenerateWorld,
}: SettingsPanelProps) {
  // Mark unused variables with void operator to avoid lint warnings
  void children;
  void onToggle;
  void colorChanged;

  // State hooks for internal component state
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(isOpen || false);
  
  // Color picker container ref for portal
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);

  // Set up the color picker refs if not provided
  const effectiveColorPickerRefs = colorPickerRefs || { current: {} };

  // When isOpen prop changes, update internal open state
  useEffect(() => {
    setOpen(isOpen || false);
  }, [isOpen]);

  // Tab change handler that also notifies parent
  const handleTabChange = useCallback(
    (newTab: string) => {
      if (onTabChange) {
        onTabChange(newTab);
      }
    },
    [onTabChange]
  );

  // Color change handler that notifies parent
  const handleColorChange = useCallback(
    (colorName: string, color: RgbaColor | string) => {
      if (onColorChange) {
        onColorChange(colorName, color);
      }
    },
    [onColorChange]
  );

  // Crosshair settings change handler with parent notification
  const handleCrosshairSettingChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (setting: string, value: any) => {
      if (onCrosshairSettingChange) {
        onCrosshairSettingChange(setting, value);
      }
    },
    [onCrosshairSettingChange]
  );

  // Environment settings change handler with parent notification
  const handleEnvironmentSettingChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (setting: string, value: any) => {
      if (onEnvironmentSettingChange) {
        onEnvironmentSettingChange(setting, value);
      }
    },
    [onEnvironmentSettingChange]
  );

  // Color picker change handler with parent notification
  const handleColorPickerChange = useCallback(
    (colorName: string | null) => {
      if (onColorPickerChange) {
        onColorPickerChange(colorName);
      }
    },
    [onColorPickerChange]
  );

  // Gravity toggle handler with parent notification
  const handleGravityToggle = useCallback((enabled: boolean) => {
    if (onGravityToggle) {
      onGravityToggle(enabled);
    }
  }, [onGravityToggle]);

  // Coordinates display toggle with parent notification
  const handleCoordinatesToggle = useCallback((show: boolean) => {
    if (onCoordinatesToggle) {
      onCoordinatesToggle(show);
    }
  }, [onCoordinatesToggle]);

  // Always on top toggle with parent notification
  const handleAlwaysOnTopToggle = useCallback((enabled: boolean) => {
    if (onAlwaysOnTopToggle) {
      onAlwaysOnTopToggle(enabled);
    }
  }, [onAlwaysOnTopToggle]);

  // Procedural world settings change handler with parent notification
  const handleProceduralWorldSettingChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (setting: string, value: any) => {
      if (onProceduralWorldSettingChange) {
        onProceduralWorldSettingChange(setting, value);
      }
    },
    [onProceduralWorldSettingChange]
  );

  // Regenerate world handler with parent notification
  const handleRegenerateWorld = useCallback(
    (newSeed?: number) => {
      if (onRegenerateWorld) {
        onRegenerateWorld(newSeed);
      }
    },
    [onRegenerateWorld]
  );

  // Define all the available tabs
  const definedTabs: SettingsTab[] = [
    {
      id: 'colors',
      label: 'Colors',
      icon: <FaPalette size='14' />,
      content: (
        <ColorsTab
          colors={colors}
          onColorChange={handleColorChange}
          onResetColors={onResetColors || (() => {})}
          isResetAnimating={isResetAnimating || false}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={handleColorPickerChange}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
          visibilitySettings={{
            background: visibilitySettings.background || false,
            grid: visibilitySettings.grid || false,
            floorPlane: visibilitySettings.floorPlane || false,
          }}
          onVisibilityChange={onVisibilityChange || (() => {})}
        />
      ),
    },
    {
      id: 'ground',
      label: 'Ground',
      icon: <FaLayerGroup size='14' />,
      content: (
        <GroundTab
          colors={{
            grid: colors.grid || '',
            floorPlane: colors.floorPlane || '',
          }}
          onColorChange={handleColorChange}
          groundSize={groundSize}
          onGroundSizeChange={onGroundSizeChange || (() => {})}
          isGroundInfinite={isGroundInfinite}
          onGroundInfiniteToggle={onGroundInfiniteToggle || (() => {})}
          groundShape={groundShape as 'square' | 'circle' | 'hexagon'}
          onGroundShapeChange={onGroundShapeChange || (() => {})}
          gridPattern={gridPattern as 'lines' | 'dots' | 'dashed'}
          onGridPatternChange={onGridPatternChange || (() => {})}
          opacities={{
            grid: opacities.grid || 1,
            floorPlane: opacities.floorPlane || 1,
          }}
          onOpacityChange={onOpacityChange || (() => {})}
          visibilitySettings={{
            grid: visibilitySettings.grid || false,
            floorPlane: visibilitySettings.floorPlane || false,
            minimap: visibilitySettings.minimap || false,
          }}
          onVisibilityChange={onVisibilityChange || (() => {})}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={handleColorPickerChange}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
        />
      ),
    },
    {
      id: 'crosshair',
      label: 'Crosshair',
      icon: <FaAdjust size='14' />,
      content: (
        <CrosshairTab
          crosshairSettings={crosshairSettings as CrosshairSettings}
          onCrosshairSettingChange={handleCrosshairSettingChange}
          onColorChange={handleColorChange}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={handleColorPickerChange}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
          colors={{ crosshair: colors.crosshair || '' }}
        />
      ),
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: <FaGlobeAmericas size='14' />,
      content: (
        <EnvironmentTab
          environmentSettings={environmentSettings}
          onEnvironmentSettingChange={handleEnvironmentSettingChange}
          gravityEnabled={!!gravityEnabled}
          onGravityToggle={handleGravityToggle}
        />
      ),
    },
    {
      id: 'interface',
      label: 'Interface',
      icon: <FaDesktop size='14' />,
      content: (
        <InterfaceSettings 
          showCoordinates={showCoordinates} 
          onCoordinatesToggle={handleCoordinatesToggle}
          alwaysOnTop={alwaysOnTop}
          onAlwaysOnTopToggle={handleAlwaysOnTopToggle}
        />
      ),
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <FaTachometerAlt size='14' />,
      content: <PerformanceTab />,
    },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      icon: <FaRobot size='14' />,
      content: <OpenRouterTab />,
    },
    {
      id: 'ollama',
      label: 'Ollama',
      icon: <FaServer size='14' />,
      content: <OllamaTab />,
    },
    {
      id: 'proceduralworld',
      label: 'Procedural World',
      icon: <FaCubes size='14' />,
      content: (
        <ProceduralWorldTab
          enabled={proceduralWorldSettings?.enabled || false}
          renderDistance={proceduralWorldSettings?.renderDistance || 3}
          terrainSeed={proceduralWorldSettings?.terrainSeed || 12345}
          enableCulling={proceduralWorldSettings?.enableCulling || true}
          autoGenerate={proceduralWorldSettings?.autoGenerate || true}
          onEnabledChange={(enabled) => handleProceduralWorldSettingChange('enabled', enabled)}
          onRenderDistanceChange={(distance) => handleProceduralWorldSettingChange('renderDistance', distance)}
          onTerrainSeedChange={(seed) => handleProceduralWorldSettingChange('terrainSeed', seed)}
          onEnableCullingChange={(enabled) => handleProceduralWorldSettingChange('enableCulling', enabled)}
          onAutoGenerateChange={(enabled) => handleProceduralWorldSettingChange('autoGenerate', enabled)}
          onRegenerateWorld={handleRegenerateWorld}
        />
      ),
    },
  ];

  // Use provided tabs or defined tabs
  const activeTabs = tabs || definedTabs;

  return (
    <>
      {/* User profile modal */}
      {showUserProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#222222] rounded-lg shadow-xl max-w-md w-full m-4">
            <UserProfile onClose={() => setShowUserProfile(false)} />
          </div>
        </div>
      )}

      {/* User profile button in top right */}
      {/* <div className='fixed top-[70px] right-6 z-50 bg-white hover:bg-white/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10 select-none'>
        {!currentUser && isFirebaseAvailable && (
          <button
            onClick={() => toggleAuthModal(true)}
            className='bg-[#222222] bg-opacity-80 p-2 rounded-full hover:bg-white/20 transition-colors flex items-center'
            title='Login'
          >
            <UserIcon className='w-6 h-6 text-white' />
          </button>
        )}
        {currentUser && (
          <button
            onClick={handleUserProfileToggle}
            className='bg-[#222222] bg-opacity-80 p-2 rounded-full hover:bg-[#7d3296] transition-colors flex items-center'
            title='User Profile'
          >
            <UserIcon className='w-6 h-6 text-white' />
          </button>
        )}
      </div> */}

      {/* Settings Button */}
      {/* <Button
        variant='ghost'
        size='icon'
        className='fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10 select-none'
        onClick={() => setOpen(true)}
      >
        <FaCog className='w-6 h-6 text-white' />
      </Button> */}

      {/* Settings Modal */}
      {open && (
        <>
          {/* Modal Backdrop */}
          <div 
            className='fixed inset-0 z-40 bg-black/30'
            onClick={() => {
              setOpen(false);
              if (onClose) onClose();
            }}
          ></div>

          {/* Settings Modal Content */}
          <div className='absolute inset-0 z-[9999] w-screen h-screen flex items-center justify-center pointer-events-none rounded-md'>
            <div className='relative w-screen h-screen lg:max-h-[70vh] lg:max-w-[800px] rounded-md shadow-2xl flex flex-col overflow-hidden text-white pointer-events-auto shadow-black/50 bg-[#1a1a1a]'>
              {/* Header */}
              <div className='p-3 bg-[#2C2C2C] border-b-4 border-[#222222] flex justify-between items-center'>
                <h2 className='text-xl font-bold pl-2'>Settings</h2>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-white/70 hover:text-white/90 transition-colors duration-200 rounded-full p-2 hover:bg-white/10'
                  onClick={() => {
                    setOpen(false);
                    if (onClose) onClose();
                  }}
                >
                  <FaTimes className='w-4 h-4' />
                </Button>
              </div>

              {/* Content */}
              {activeTabs ? (
                <TabsContent tabs={activeTabs} activeTab={activeTab} onTabChange={handleTabChange} />
              ) : (
                <TabsContent tabs={definedTabs} activeTab={activeTab} onTabChange={handleTabChange} />
              )}

              {/* Footer */}
              <div className="bg-[#222222] p-3">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-gray-400">
                    Settings
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
