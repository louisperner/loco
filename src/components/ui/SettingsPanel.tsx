import React, { useState } from 'react';
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
import { FaCog, FaTimes } from 'react-icons/fa';

interface SettingsPanelProps {
  children?: React.ReactNode;
  onToggle?: (isOpen: boolean) => void;
}

export function SettingsPanel({ children, onToggle }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onToggle?.(newOpen);
  };

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
        <div className="flex flex-col h-full text-white">
          <SlidePanelHeader>
            <SlidePanelTitle>Settings</SlidePanelTitle>
            <SlidePanelClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/70 hover:text-white/90 transition-colors duration-200 rounded-full p-2 hover:bg-white/10"
              >
                <FaTimes className="w-4 h-4" />
              </Button>
            </SlidePanelClose>
          </SlidePanelHeader>
          
          <SlidePanelBody>
            {children}
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