import React from 'react';
import { Bot, Layers, Settings, Image, Code, Box, Square, PenTool, Video, CircleIcon } from 'lucide-react';
import { SearchResult } from './types';

// Create JSX elements programmatically instead of using JSX syntax
const createIcon = (Icon: React.ElementType) => React.createElement(Icon, { className: "w-5 h-5" });

// List of available commands for regular spotlight mode
export const getAppCommands = (
  handlePrimitiveSelect: (type: 'cube' | 'sphere' | 'plane', specificPosition?: [number, number, number]) => void, 
  handleDraw: () => void,
  handleCodeAdd: () => void,
  setIsOpenRouterMode: (value: boolean) => void,
  fileInputRef: React.RefObject<HTMLInputElement>,
  videoInputRef: React.RefObject<HTMLInputElement>,
  modelInputRef: React.RefObject<HTMLInputElement>
): SearchResult[] => {
  return [
    { 
      id: 'cube', 
      title: 'Add Cube', 
      category: '3D Objects', 
      icon: createIcon(Box),
      action: () => handlePrimitiveSelect('cube')   
    },
    { 
      id: 'sphere', 
      title: 'Add Sphere', 
      category: '3D Objects', 
      icon: createIcon(CircleIcon),
      action: () => handlePrimitiveSelect('sphere')
    },
    { 
      id: 'plane', 
      title: 'Add Plane', 
      category: '3D Objects', 
      icon: createIcon(Square),
      action: () => handlePrimitiveSelect('plane')
    },
    { 
      id: 'image', 
      title: 'Add Image', 
      category: 'Media', 
      icon: createIcon(Image),
      action: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
      }
    },
    { 
      id: 'video', 
      title: 'Add Video', 
      category: 'Media', 
      icon: createIcon(Video),
      action: () => {
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
          videoInputRef.current.click();
        }
      }
    },
    { 
      id: 'model', 
      title: 'Add 3D Model', 
      category: '3D Objects', 
      icon: createIcon(Layers),
      action: () => {
        if (modelInputRef.current) {
          modelInputRef.current.value = '';
          modelInputRef.current.click();
        }
      }
    },
    { 
      id: 'draw', 
      title: 'Drawing Mode', 
      category: 'Tools', 
      icon: createIcon(PenTool),
      action: () => handleDraw()
    },
    { 
      id: 'code', 
      title: 'Add Code Block', 
      category: 'Development', 
      icon: createIcon(Code),
      action: () => handleCodeAdd()
    },
    { 
      id: 'settings', 
      title: 'Open Settings', 
      category: 'App', 
      icon: createIcon(Settings),
      action: () => { /* Settings functionality will be implemented later */ }
    },
    {
      id: 'ai',
      title: 'AI Assistant (OpenRouter)',
      category: 'Tools',
      icon: createIcon(Bot),
      action: () => {
        setIsOpenRouterMode(true);
      }
    }
  ];
};