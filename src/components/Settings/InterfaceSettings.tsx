import React from 'react';
import { Switch } from '@/components/ui/switch';

interface InterfaceSettingsProps {
  showCoordinates: boolean;
  onCoordinatesToggle: (show: boolean) => void;
}

const InterfaceSettings: React.FC<InterfaceSettingsProps> = ({ showCoordinates, onCoordinatesToggle }) => {
  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <div className='font-medium text-sm'>Coordinate Display</div>
        <div className='flex items-center space-x-2'>
          <Switch checked={showCoordinates} onCheckedChange={onCoordinatesToggle} id='toggle-coordinates' />
          <label htmlFor='toggle-coordinates' className='text-sm'>
            Show coordinates
          </label>
        </div>
      </div>
    </div>
  );
};

export default InterfaceSettings;
