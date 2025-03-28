import React, { useState, useRef, useEffect } from 'react';
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
import { FaCog, FaTimes, FaPalette, FaLayerGroup, FaAdjust, FaGlobeAmericas } from 'react-icons/fa';
import { ColorsTab } from './tabs/ColorsTab';
import { GroundTab } from './tabs/GroundTab';
import { CrosshairTab } from './tabs/CrosshairTab';
import { EnvironmentTab } from './tabs/EnvironmentTab';
import { SettingsPanelProps, SettingsTab } from './types';
import { loadSettings, saveSettings } from './utils';

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
    <div className="space-y-4">
      {/* Tabs navigation */}
      <div className="flex mb-2 p-1 bg-white/10 rounded-lg z-50">
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
            {tab.icon && (
              <span className={`mr-1 ${activeTab === tab.id ? 'text-black' : ''}`}>
                {tab.icon}
              </span>
            )}
            {/* {tab.label} */}
          </Button>
        ))}
      </div>
      
      {/* Active tab content */}
      <div className="animate-fadeIn">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
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
    background: 1
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
    style: 'classic'
  },
  onCrosshairSettingChange,
  visibilitySettings = {
    floor: true,
    grid: true,
    floorPlane: true,
    background: true
  },
  onVisibilityChange,
  gravityEnabled = false,
  onGravityToggle,
  selectedTheme = 'dark',
  onThemeSelect,
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
    starsFade: true
  },
  onEnvironmentSettingChange
}: SettingsPanelProps) {
  // Mark unused variables with void operator to avoid lint warnings
  void children;
  void colorChanged;

  const [open, setOpen] = useState(isOpen || false);
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);
  
  // Create a default colorPickerRefs if not provided
  const defaultColorPickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const effectiveColorPickerRefs = colorPickerRefs || defaultColorPickerRefs;

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
      environmentSettings
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
    environmentSettings
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
        ref => ref && ref.contains(event.target as Node)
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

  // Define default tabs if none are provided
  const defaultTabs: SettingsTab[] = [
    {
      id: 'cores',
      label: 'Colors',
      icon: <FaPalette className="w-4 h-4" />,
      content: (
        <ColorsTab 
          colors={colors}
          onColorChange={onColorChange || (() => {})}
          onResetColors={onResetColors || (() => {})}
          isResetAnimating={isResetAnimating || false}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={onColorPickerChange || (() => {})}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
          visibilitySettings={visibilitySettings}
          onVisibilityChange={onVisibilityChange || (() => {})}
        />
      )
    },
    {
      id: 'ground',
      label: 'Ground',
      icon: <FaLayerGroup className="w-4 h-4" />,
      content: (
        <GroundTab 
          colors={colors}
          visibilitySettings={visibilitySettings}
          onVisibilityChange={onVisibilityChange || (() => {})}
          onColorChange={onColorChange || (() => {})}
          groundSize={groundSize}
          onGroundSizeChange={onGroundSizeChange || (() => {})}
          isGroundInfinite={isGroundInfinite}
          onGroundInfiniteToggle={onGroundInfiniteToggle || (() => {})}
          groundShape={groundShape}
          onGroundShapeChange={onGroundShapeChange || (() => {})}
          gridPattern={gridPattern}
          onGridPatternChange={onGridPatternChange || (() => {})}
          opacities={opacities}
          onOpacityChange={onOpacityChange || (() => {})}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={onColorPickerChange || (() => {})}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
        />
      )
    },
    {
      id: 'crosshair',
      label: 'Crosshair',
      icon: <FaAdjust className="w-4 h-4" />,
      content: (
        <CrosshairTab 
          colors={colors}
          crosshairSettings={crosshairSettings}
          onCrosshairSettingChange={onCrosshairSettingChange || (() => {})}
          onColorChange={onColorChange || (() => {})}
          showColorPicker={showColorPicker || null}
          onColorPickerChange={onColorPickerChange || (() => {})}
          colorPickerRefs={effectiveColorPickerRefs}
          colorPickerContainerRef={colorPickerContainerRef as React.RefObject<HTMLDivElement>}
        />
      )
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: <FaGlobeAmericas className="w-4 h-4" />,
      content: (
        <EnvironmentTab 
          environmentSettings={environmentSettings}
          onEnvironmentSettingChange={onEnvironmentSettingChange || (() => {})}
          gravityEnabled={gravityEnabled}
          onGravityToggle={onGravityToggle || (() => {})}
        />
      )
    }
  ];

  return (
    <SlidePanel open={open} onOpenChange={handleOpenChange}>
      <SlidePanelTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10"
        >
          <FaCog className="w-5 h-5" />
        </Button>
      </SlidePanelTrigger>
      <SlidePanelContent title="Settings">
        <div className="bg-[#1a1a1a] flex flex-col h-full text-white z-50">
          <SlidePanelHeader>
            <SlidePanelTitle>Settings</SlidePanelTitle>
            <SlidePanelClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/70 hover:text-white/90 transition-colors duration-200 rounded-full p-2 hover:bg-white/10"
                onClick={() => onClose && onClose()}
              >
                <FaTimes className="w-4 h-4" />
              </Button>
            </SlidePanelClose>
          </SlidePanelHeader>
          
          <SlidePanelBody>
            {tabs ? (
              <TabsContent 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={onTabChange || (() => {})} 
              />
            ) : (
              <TabsContent 
                tabs={defaultTabs} 
                activeTab={activeTab} 
                onTabChange={onTabChange || (() => {})} 
              />
            )}
          </SlidePanelBody>
          
          <SlidePanelFooter>
            <div className="text-xs text-white/40 text-center">
              <span className="font-light tracking-wide">Your virtual space • Design by Loco</span>
            </div>
          </SlidePanelFooter>
        </div>
      </SlidePanelContent>
    </SlidePanel>
  );
} 