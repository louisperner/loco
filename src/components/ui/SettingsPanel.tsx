import React, { useState, ReactNode } from 'react';
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

// Define the tab interface
export interface SettingsTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface SettingsPanelProps {
  children?: React.ReactNode;
  onToggle?: (isOpen: boolean) => void;
  tabs?: SettingsTab[];
}

// TabsContent component to handle tab navigation and content display
const TabsContent = ({ tabs }: { tabs: SettingsTab[] }) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || '');

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tabs navigation */}
      <div className="flex mb-2 p-1 bg-white/10 rounded-lg">
        {tabs.map((tab) => (
          <Button 
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`flex-1 py-1 px-2 text-xs font-medium ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-sm' 
                : 'text-white/70 hover:text-white/90 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && (
              <span className={`mr-1 ${activeTab === tab.id ? 'text-black' : ''}`}>
                {tab.icon}
              </span>
            )}
            {tab.label}
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

export function SettingsPanel({ children, onToggle, tabs }: SettingsPanelProps) {
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
        <div className="bg-[#262626] flex flex-col h-full text-white z-50">
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
            {tabs ? <TabsContent tabs={tabs} /> : children}
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