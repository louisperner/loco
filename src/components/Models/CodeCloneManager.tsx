import React, { useEffect, useRef } from 'react';
import { CodeCloneManagerProps, CodeBlockDataType } from './types';
import CodeInScene from './CodeInScene';
import { useCodeStore } from '../../store/useCodeStore';

const CodeCloneManager: React.FC<CodeCloneManagerProps> = ({ onSelect }) => {
  const { codeBlocks, updateCodeBlock } = useCodeStore();
  const initialMountRef = useRef(true);

  // When first mounting, check for any code blocks with undefined isInScene and set them to true
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;

      // Fix any code blocks with undefined isInScene values
      codeBlocks.forEach(codeBlock => {
        if (codeBlock.isInScene === undefined) {
          updateCodeBlock(codeBlock.id, { isInScene: true });
        }
      });
    }
  }, [codeBlocks, updateCodeBlock]);

  // Listen for removeObject events
  useEffect(() => {
    const handleRemoveObject = (event: CustomEvent) => {
      const { type, id } = event.detail;
      
      // When a code block is removed via right-click, update its isInScene property
      if (type === 'code' && id) {
        updateCodeBlock(id, { isInScene: false });
      }
    };

    // Add event listener for removeObject events
    window.addEventListener('removeObject', handleRemoveObject as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('removeObject', handleRemoveObject as EventListener);
    };
  }, [updateCodeBlock]);

  return (
    <>
      {codeBlocks
        .filter(codeBlock => codeBlock.isInScene)
        .map(codeBlock => (
          <CodeInScene
            key={codeBlock.id}
            codeData={codeBlock}
            onRemove={() => {
              // Dispatch custom event
              const removeEvent = new CustomEvent('removeObject', {
                detail: { type: 'code', id: codeBlock.id }
              });
              window.dispatchEvent(removeEvent);
              
              // Update isInScene
              updateCodeBlock(codeBlock.id, { isInScene: false });
            }}
            onUpdate={(updatedData: CodeBlockDataType) => {
              updateCodeBlock(codeBlock.id, updatedData);
            }}
            onSelect={onSelect}
          />
        ))}
    </>
  );
};

export default CodeCloneManager; 