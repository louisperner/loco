import React from 'react';
import { Switch } from '@/components/ui/switch';

interface InterfaceSettingsProps {
  showCoordinates: boolean;
  onCoordinatesToggle: (show: boolean) => void;
  alwaysOnTop?: boolean;
  onAlwaysOnTopToggle?: (enabled: boolean) => void;
}

const InterfaceSettings: React.FC<InterfaceSettingsProps> = ({
  showCoordinates,
  onCoordinatesToggle,
  alwaysOnTop = false,
  onAlwaysOnTopToggle
}) => {
  // Handle toggle change with explicit state
  const handleToggleChange = (checked: boolean) => {
    onCoordinatesToggle(checked);
  };

  const handleAlwaysOnTopToggle = (checked: boolean) => {
    if (onAlwaysOnTopToggle) {
      onAlwaysOnTopToggle(checked);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <div className='font-medium text-sm'>Coordinate Display</div>
        <div className='flex items-center space-x-2'>
          <Switch 
            checked={showCoordinates} 
            onCheckedChange={handleToggleChange} 
            id='toggle-coordinates' 
          />
          <label htmlFor='toggle-coordinates' className='text-sm'>
            Show coordinates
          </label>
        </div>
      </div>

      <div className='space-y-2'>
        <div className='font-medium text-sm'>Window Settings</div>
        <div className='flex items-center space-x-2'>
          <Switch 
            checked={alwaysOnTop} 
            onCheckedChange={handleAlwaysOnTopToggle} 
            id='toggle-always-on-top' 
          />
          <div className='flex flex-col'>
            <label htmlFor='toggle-always-on-top' className='text-sm'>
              Always on top
            </label>
            <span className='text-xs text-gray-400 mt-0.5'>
              Shortcuts: Cmd+↑ (top), Cmd+↓ (normal)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterfaceSettings;
