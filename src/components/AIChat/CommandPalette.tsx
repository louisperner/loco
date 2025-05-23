import React from 'react';
import { Image as ImageIcon, Video, Maximize, Box, Square, Circle, Slash, Code } from 'lucide-react';
// import { useImageStore } from '@/store/useImageStore';
// import { useVideoStore } from '@/store/videoStore';
import { useCodeStore } from '@/store/useCodeStore';
import { useGameStore } from '@/store/useGameStore';
//import { useModelStore } from '@/store/useModelStore';
import { getCameraPosition, getCameraRotation } from './utils/aiChatUtils';
import { createPrimitive } from './utils/primitiveHandlers';

type CommandOption = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  command: string;
  action: () => void;
};

interface CommandPaletteProps {
  inputValue: string;
  setShowCommandPalette: (show: boolean) => void;
  setCommandFeedback: (feedback: string | null) => void;
  setInputValue: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  modelInputRef: React.RefObject<HTMLInputElement | null>;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  inputValue,
  setShowCommandPalette,
  setCommandFeedback,
  setInputValue,
  fileInputRef,
  videoInputRef,
  modelInputRef,
}) => {
  // const { addImage } = useImageStore();
  // const { addVideo } = useVideoStore();
  const { addCodeBlock } = useCodeStore();
  const { setShowDrawingOverlay } = useGameStore();
  // const { addModel } = useModelStore();

  // Handle primitive shapes (cube, sphere, plane)
  const handlePrimitiveSelect = (type: 'cube' | 'sphere' | 'plane') => {
    // Get camera position
    let position = getCameraPosition(3);
    // let rotation = getCameraRotation();
    
    // For cubes, snap to grid
    if (type === 'cube') {
      position = [
        Math.round(position[0]),
        Math.round(position[1]), // Allow placement below y=0
        Math.round(position[2])
      ] as [number, number, number];
    }
    
    // Create primitive
    createPrimitive(type, position);
    
    // Close command palette
    setShowCommandPalette(false);
    
    // Add feedback
    setCommandFeedback(`Created ${type} at position [${position.join(', ')}]`);
  };
  
  // Handle code block creation
  const handleCodeAdd = () => {
    const position = getCameraPosition(3);
    const rotation = getCameraRotation();
    
    // Create default code
    const defaultCode = `// Write your React code here
function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem' }}>
      <h3>Counter: {count}</h3>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#4ade80', 
          border: 'none', 
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
    </div>
  );
}

render(<Counter />);`;
    
    // Add code block to the store
    addCodeBlock({
      code: defaultCode,
      fileName: 'Code Block',
      position,
      rotation,
      scale: 1,
      isInScene: true,
      noInline: true,
      language: 'jsx',
    });
    
    // Close command palette
    setShowCommandPalette(false);
    
    // Add feedback
    setCommandFeedback('Added code block');
  };
  
  // Handle screenshot
  const handleScreenshot = () => {
    // Trigger screenshot if available
    const takeScreenshot = (window as unknown as { takeScreenshot?: () => void }).takeScreenshot;
    if (takeScreenshot) {
      takeScreenshot();
      
      // Close command palette
      setShowCommandPalette(false);
      
      // Add feedback
      setCommandFeedback('Screenshot taken');
    } else {
      setCommandFeedback('Screenshot functionality not available');
    }
  };

  // Command palette options
  const commandOptions: CommandOption[] = [
    { id: 'image', label: 'Image', icon: ImageIcon, command: 'add image', action: () => fileInputRef.current?.click() },
    { id: 'video', label: 'Video', icon: Video, command: 'add video', action: () => videoInputRef.current?.click() },
    { id: 'screenshot', label: 'Screenshot', icon: Maximize, command: 'add screenshot', action: () => handleScreenshot() },
    { id: '3d-model', label: '3D Model', icon: Box, command: 'add model', action: () => modelInputRef.current?.click() },
    { id: 'cube', label: 'Cube', icon: Square, command: 'create cube', action: () => handlePrimitiveSelect('cube') },
    { id: 'sphere', label: 'Sphere', icon: Circle, command: 'create sphere', action: () => handlePrimitiveSelect('sphere') },
    { id: 'plane', label: 'Plane', icon: Square, command: 'create plane', action: () => handlePrimitiveSelect('plane') },
    { id: 'draw', label: 'Draw', icon: Slash, command: 'draw', action: () => setShowDrawingOverlay(true) },
    { id: 'code', label: 'Code', icon: Code, command: 'add code', action: () => handleCodeAdd() },
  ];
  
  // Filter command options based on input
  const getFilteredCommands = () => {
    if (!inputValue || inputValue === '/') {
      return commandOptions;
    }
    
    const searchTerm = inputValue.slice(1).toLowerCase();
    return commandOptions.filter(option => 
      option.label.toLowerCase().includes(searchTerm) || 
      option.command.toLowerCase().includes(searchTerm)
    );
  };
  
  // Handle command selection
  const handleCommandSelect = (action: () => void) => {
    // Execute the action
    action();
    
    // Clear input and close command palette
    setInputValue('');
    setShowCommandPalette(false);
  };

  const filteredCommands = getFilteredCommands();
  const isFullView = !inputValue.includes('/minimal');
  
  return (
    <div className="absolute bottom-[calc(100%+0.4rem)] left-0 right-0 bg-[#1A1A1A] rounded-xl shadow-xl border border-[#333333] overflow-hidden z-10 animate-in fade-in duration-200">
      <div className="p-2 text-xs text-white/70 border-b border-[#333333] bg-[#222222] flex items-center">
        <Slash size={14} className="mr-1.5 text-yellow-400" />
        <span>Commands</span>
      </div>
      <div className={`grid ${isFullView ? 'grid-cols-4' : 'grid-cols-9'} gap-2 p-3`}>
        {filteredCommands.map((option, index) => (
          <button
            key={option.id}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 
                     hover:bg-[#333333] rounded-lg text-center transition-colors 
                     border border-[#333333] hover:border-[#444444] 
                     animate-in fade-in zoom-in-95 duration-300`}
            onClick={() => handleCommandSelect(option.action)}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-yellow-400">
              <option.icon size={18} />
            </div>
            {isFullView && (
              <span className="text-xs text-white/80 font-medium">{option.label}</span>
            )}
          </button>
        ))}
      </div>
      {filteredCommands.length === 0 && (
        <div className="p-3 text-center text-white/50 text-sm">
          No commands match &apos;{inputValue}&apos;
        </div>
      )}
    </div>
  );
};

export default CommandPalette; 