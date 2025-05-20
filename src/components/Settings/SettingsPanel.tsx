import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  SlidePanel,
  SlidePanelTrigger,
  SlidePanelContent,
  SlidePanelHeader,
  SlidePanelTitle,
  SlidePanelBody,
  SlidePanelFooter,
  SlidePanelClose,
} from '@/components/ui/slide-panel';
import { FaCog, FaTimes, FaPalette, FaLayerGroup, FaAdjust, FaGlobeAmericas, FaDesktop, FaRobot, FaServer } from 'react-icons/fa';
import { ColorsTab } from './tabs/ColorsTab';
import { GroundTab } from './tabs/GroundTab';
import { CrosshairTab } from './tabs/CrosshairTab';
import { EnvironmentTab } from './tabs/EnvironmentTab';
import InterfaceSettings from './InterfaceSettings';
import { OpenRouterTab } from './tabs/OpenRouterTab';
import { OllamaTab } from './tabs/OllamaTab';
import { SettingsPanelProps, SettingsTab, SettingValue } from './types';
import { loadSettings, saveSettings } from './utils';
import { RgbaColor } from 'react-colorful';
import { UserIcon, Save, Cloud, CheckCircle, Download, Database } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import UserProfile from '../Game/UserProfile';
import { syncSettingsToFirestore, loadSettingsFromFirestore, syncSettings, syncAllLocalStorage } from '@/utils/local-storage-sync';
import { SyncContext } from '@/main';

interface CrosshairSettings {
  visible: boolean;
  size: number;
  thickness: number;
  style: 'classic' | 'dot' | 'cross' | 'plus';
}

// Interface for TabsContent component props
interface TabsContentProps {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// TabsContent component to handle tab navigation and content display
const TabsContent: React.FC<TabsContentProps> = ({ tabs, activeTab, onTabChange }) => {
  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className='space-y-4'>
      {/* Tabs navigation */}
      <div className='flex mb-2 p-1 bg-white/10 rounded-lg z-50'>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`flex-1 py-1 px-2 text-xs font-medium ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className={`mr-1 ${activeTab === tab.id ? 'text-black' : ''}`}>{tab.icon}</span>}
            {/* {tab.label} */}
          </Button>
        ))}
      </div>

      {/* Active tab content */}
      <div className='animate-fadeIn'>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  );
};

export function SettingsPanel({
  children,
  onToggle,
  tabs,
  isOpen,
  onClose,
  activeTab = 'cores',
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
  selectedTheme = 'dark',
  onThemeSelect,
  showCoordinates = true,
  onCoordinatesToggle,
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
}: SettingsPanelProps) {
  // Mark unused variables with void operator to avoid lint warnings
  void children;
  void colorChanged;

  // Get auth state and functions from context
  const { currentUser, toggleAuthModal } = useAuthStore();
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const { setSyncing } = useContext(SyncContext);

  // Toggle user profile modal
  const handleUserProfileToggle = useCallback((): void => {
    setShowUserProfile(!showUserProfile);
  }, [showUserProfile]);

  // Handle sync all localStorage to cloud
  const handleSyncAllStorage = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      toggleAuthModal(true);
      return;
    }

    try {
      setSyncStatus('Syncing all data...');
      const success = await syncAllLocalStorage(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus('All data synced!');
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus('No data to sync');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error syncing all data:', error);
      setSyncStatus('Sync failed');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [currentUser, toggleAuthModal, setSyncing]);

  // Handle sync settings to cloud
  const handleSyncSettings = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      toggleAuthModal(true);
      return;
    }

    try {
      setSyncStatus('Syncing settings...');
      const success = await syncSettings(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus('Settings synced!');
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus('No settings to sync');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error syncing settings:', error);
      setSyncStatus('Sync failed');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [currentUser, toggleAuthModal, setSyncing]);

  // Add this callback after handleSyncSettings to specifically save to cloud
  const handleSaveToCloud = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      toggleAuthModal(true);
      return;
    }

    try {
      setSyncStatus('Saving to cloud...');
      const success = await syncSettingsToFirestore(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus('Saved to cloud!');
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus('No settings to save');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error saving settings to cloud:', error);
      setSyncStatus('Save failed');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [currentUser, toggleAuthModal, setSyncing]);

  // Add this callback to specifically load from cloud
  const handleLoadFromCloud = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      toggleAuthModal(true);
      return;
    }

    try {
      setSyncStatus('Loading from cloud...');
      const success = await loadSettingsFromFirestore(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus('Settings loaded!');
        // No need for timeout as page will reload
      } else {
        setSyncStatus('No settings found in cloud');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error loading settings from cloud:', error);
      setSyncStatus('Load failed');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [currentUser, toggleAuthModal, setSyncing]);

  const [open, setOpen] = useState(isOpen || false);
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);

  // Custom type to handle the crosshair case
  type ColorPickerRefType = {
    [key: string]: HTMLDivElement | null;
  };

  // Create a default colorPickerRefs if not provided
  const defaultColorPickerRefs = useRef<ColorPickerRefType>({});
  const effectiveColorPickerRefs = colorPickerRefs || defaultColorPickerRefs;

  // Create handler functions with proper types
  const handleColorChange: (type: string, color: string | RgbaColor) => void = onColorChange || (() => {});
  const handleOpacityChange: (type: string, value: number) => void = onOpacityChange || (() => {});
  const handleResetColors: () => void = onResetColors || (() => {});
  const handleColorPickerChange: (type: string | null) => void = onColorPickerChange || (() => {});
  const handleGroundSizeChange: (value: number) => void = onGroundSizeChange || (() => {});
  const handleGroundInfiniteToggle: (value: boolean) => void = onGroundInfiniteToggle || (() => {});
  const handleGroundShapeChange: (shape: string) => void = onGroundShapeChange || (() => {});
  const handleVisibilityChange: (setting: string, checked: boolean) => void = onVisibilityChange || (() => {});
  const handleCrosshairSettingChange: (setting: string, value: SettingValue) => void =
    onCrosshairSettingChange || (() => {});
  const handleEnvironmentSettingChange: (setting: string, value: SettingValue) => void =
    onEnvironmentSettingChange || (() => {});
  const handleGravityToggle: (enabled: boolean) => void = onGravityToggle || (() => {});
  const handleTabChange: (tab: string) => void = onTabChange || (() => {});
  const handleCoordinatesToggle: (show: boolean) => void = onCoordinatesToggle || (() => {});


  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = loadSettings();
    if (savedSettings) {
      // Apply saved settings
      if (onColorChange) {
        Object.entries(savedSettings.colors).forEach(([type, color]) => {
          onColorChange(type, color);
        });
      }

      if (onOpacityChange) {
        Object.entries(savedSettings.opacities).forEach(([type, value]) => {
          onOpacityChange(type, value);
        });
      }

      if (onGroundSizeChange) onGroundSizeChange(savedSettings.groundSize);
      if (onGroundInfiniteToggle) onGroundInfiniteToggle(savedSettings.isGroundInfinite);
      if (onGroundShapeChange) onGroundShapeChange(savedSettings.groundShape);
      if (onGridPatternChange) onGridPatternChange(savedSettings.gridPattern);

      if (onCrosshairSettingChange) {
        Object.entries(savedSettings.crosshairSettings).forEach(([setting, value]) => {
          onCrosshairSettingChange(setting, value);
        });
      }

      if (onVisibilityChange) {
        Object.entries(savedSettings.visibilitySettings).forEach(([setting, value]) => {
          onVisibilityChange(setting, value);
        });
      }

      if (onGravityToggle) onGravityToggle(savedSettings.gravityEnabled);
      if (onThemeSelect) onThemeSelect(savedSettings.selectedTheme);

      if (onEnvironmentSettingChange) {
        Object.entries(savedSettings.environmentSettings).forEach(([setting, value]) => {
          onEnvironmentSettingChange(setting, value);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const currentSettings = {
      colors,
      opacities,
      groundSize,
      isGroundInfinite,
      groundShape,
      gridPattern,
      crosshairSettings,
      visibilitySettings,
      gravityEnabled,
      selectedTheme,
      environmentSettings,
    };
    saveSettings(currentSettings);
  }, [
    colors,
    opacities,
    groundSize,
    isGroundInfinite,
    groundShape,
    gridPattern,
    crosshairSettings,
    visibilitySettings,
    gravityEnabled,
    selectedTheme,
    environmentSettings,
  ]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onToggle?.(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showColorPicker) return;

      // Check if click is inside any of the color picker containers
      const isColorPickerClick = Object.values(effectiveColorPickerRefs.current).some(
        (ref) => ref && ref.contains(event.target as Node),
      );

      // Check if click is inside the color picker container
      const isInsideContainer = colorPickerContainerRef.current?.contains(event.target as Node);

      if (!isColorPickerClick && !isInsideContainer) {
        onColorPickerChange?.(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showColorPicker, onColorPickerChange]);

  // Define the tabs for settings panel
  const definedTabs: SettingsTab[] = [
    {
      id: 'colors',
      label: 'Colors',
      icon: <FaPalette size='14' />,
      content: (
        <ColorsTab
          colors={colors}
          visibilitySettings={{
            background: !!visibilitySettings.background,
            grid: !!visibilitySettings.grid,
            floorPlane: !!visibilitySettings.floorPlane,
          }}
          onVisibilityChange={handleVisibilityChange}
          onColorChange={handleColorChange}
          onResetColors={handleResetColors}
          isResetAnimating={!!isResetAnimating}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={handleColorPickerChange}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
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
            floorPlane: colors.floorPlane || '',
            grid: colors.grid || '',
          }}
          visibilitySettings={{
            floorPlane: !!visibilitySettings.floorPlane,
            grid: !!visibilitySettings.grid,
            minimap: !!visibilitySettings.minimap,
          }}
          onVisibilityChange={handleVisibilityChange}
          onColorChange={handleColorChange}
          groundSize={groundSize}
          onGroundSizeChange={handleGroundSizeChange}
          isGroundInfinite={!!isGroundInfinite}
          onGroundInfiniteToggle={handleGroundInfiniteToggle}
          groundShape={groundShape as 'circle' | 'square' | 'hexagon'}
          onGroundShapeChange={handleGroundShapeChange}
          gridPattern={gridPattern as 'lines' | 'dots' | 'dashed'}
          onGridPatternChange={(onGridPatternChange as (pattern: string) => void) || (() => {})}
          opacities={{ grid: opacities.grid || 1, floorPlane: opacities.floorPlane || 1 }}
          onOpacityChange={handleOpacityChange}
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
      content: <InterfaceSettings showCoordinates={showCoordinates} onCoordinatesToggle={handleCoordinatesToggle} />,
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
  ];

  // Use provided tabs or defined tabs
  const activeTabs = tabs || definedTabs;

  return (
    <SlidePanel open={open} onOpenChange={handleOpenChange}>
      {/* User profile button in the top-right corner */}

      {/* User profile modal */}
      {showUserProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#222222] rounded-lg shadow-xl max-w-md w-full m-4">
            <UserProfile onClose={() => setShowUserProfile(false)} />
          </div>
        </div>
      )}
      <div className='fixed top-[70px] right-6 z-50 bg-white hover:bg-white/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10 select-none'>
        {!currentUser && (
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
      </div>
      <SlidePanelTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10 select-none'
        >
          <FaCog className='w-6 h-6 text-white' />
        </Button>
      </SlidePanelTrigger>
      <SlidePanelContent title='Settings'>
        <div className='bg-[#1a1a1a] flex flex-col h-full text-white z-50'>
          <SlidePanelHeader>
            <SlidePanelTitle>Settings</SlidePanelTitle>
            <SlidePanelClose asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-white/70 hover:text-white/90 transition-colors duration-200 rounded-full p-2 hover:bg-white/10'
                onClick={() => onClose && onClose()}
              >
                <FaTimes className='w-4 h-4' />
              </Button>
            </SlidePanelClose>
          </SlidePanelHeader>

          <SlidePanelBody>
            {activeTabs ? (
              <TabsContent tabs={activeTabs} activeTab={activeTab} onTabChange={handleTabChange} />
            ) : (
              <TabsContent tabs={activeTabs} activeTab={activeTab} onTabChange={handleTabChange} />
            )}
          </SlidePanelBody>

          {/* <SlidePanelFooter>
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-gray-400">
                {syncStatus && (
                  <span className="flex items-center">
                    {syncStatus === 'Synced!' || syncStatus === 'Settings synced!' || syncStatus === 'Settings loaded!' || syncStatus === 'Saved to cloud!' || syncStatus === 'All data synced!' ? 
                      <CheckCircle className="w-4 h-4 mr-1 text-green-400" /> : null}
                    {syncStatus}
                  </span>
                )}
              </span>
              {currentUser && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-white bg-[#7d3296] hover:bg-[#9149a8] rounded flex items-center"
                    onClick={handleSyncAllStorage}
                    title="Sync all data with cloud (cloud-first approach)"
                  >
                    <Database className="w-3 h-3 mr-1" />
                    All Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-white bg-[#7d3296] hover:bg-[#9149a8] rounded flex items-center"
                    onClick={handleSyncSettings}
                    title="Sync settings with cloud (cloud-first approach)"
                  >
                    <Cloud className="w-3 h-3 mr-1" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-white bg-[#444] hover:bg-[#555] rounded flex items-center"
                    onClick={handleSaveToCloud}
                    title="Save current settings to cloud"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-white bg-[#444] hover:bg-[#555] rounded flex items-center"
                    onClick={handleLoadFromCloud}
                    title="Load settings from cloud"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Load
                  </Button>
                </div>
              )}
            </div>
          </SlidePanelFooter> */}
        </div>
      </SlidePanelContent>
    </SlidePanel>
  );
}
