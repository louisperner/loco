import React, { useState, useRef, useEffect } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { Object3D, Vector3 } from 'three';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { useDrag } from '@use-gesture/react';
import { CodeInSceneProps, TransformMode } from './types';
import { ThreeEvent } from '@react-three/fiber';

// Custom PrismTheme type that matches our theme structure
type CustomPrismTheme = {
  plain: {
    color: string;
    backgroundColor: string;
  };
  styles: {
    types: string[];
    style: {
      color?: string;
      fontStyle?: string;
      opacity?: number;
    };
  }[];
};

// Create a custom wrapper for LivePreview to stop propagation
const SafeLivePreview: React.FC = (props) => {
  const handleInteraction = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={handleInteraction} 
      onMouseDown={handleInteraction}
      onPointerDown={handleInteraction}
      data-no-pointer-lock="true"
      className="safe-live-preview"
    >
      <LivePreview {...props} />
    </div>
  );
};

// Create a custom wrapper for LiveEditor to stop propagation
const SafeLiveEditor: React.FC<{onChange?: (code: string) => void, style?: React.CSSProperties}> = (props) => {
  const handleInteraction = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={handleInteraction} 
      onMouseDown={handleInteraction}
      onPointerDown={handleInteraction}
      data-no-pointer-lock="true"
      className="safe-live-editor"
    >
      <LiveEditor {...props} />
    </div>
  );
};

const CodeInScene: React.FC<CodeInSceneProps> = ({
  codeData,
  onRemove,
  onUpdate,
  onSelect,
}) => {
  const {
    code,
    position: initialPosition = [0, 1, 0],
    rotation: initialRotation = [0, 0, 0],
    scale: initialScale = 1,
    noInline = true,
    language = 'jsx',
  } = codeData;

  // Ref to the group
  const groupRef = useRef<Object3D>(null);
  
  // State for control elements
  const [hovered, setHovered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [localCode, setLocalCode] = useState<string>(code);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Handle pointer events
  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowControls(!showControls);
    if (onSelect) {
      onSelect({ ...codeData, type: 'code' });
    }
  };

  // Handle right click for context menu
  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Toggle transform mode
    setTransformMode(transformMode === 'translate' ? 'rotate' : 'translate');
  };

  // Transform controls handler
  const handleTransformChange = () => {
    if (groupRef.current) {
      const position = groupRef.current.position.toArray() as [number, number, number];
      const rotation = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z,
      ] as [number, number, number];
      
      onUpdate({
        ...codeData,
        position,
        rotation,
        scale,
      });
    }
  };

  // Handle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      // Save changes when exiting edit mode
      onUpdate({
        ...codeData,
        code: localCode,
      });
    }
  };

  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
  };

  // Drag gesture
  const bind = useDrag(({ offset: [x, y] }) => {
    if (groupRef.current) {
      const position = new Vector3(x / 100, -y / 100, 0);
      position.applyQuaternion(groupRef.current.quaternion);
      groupRef.current.position.add(position);
      
      onUpdate({
        ...codeData,
        position: groupRef.current.position.toArray() as [number, number, number],
      });
    }
  });

  // Custom theme for react-live
  const customTheme: CustomPrismTheme = {
    plain: {
      color: '#e6e6e6',
      backgroundColor: '#1e1e1e',
    },
    styles: [
      {
        types: ['prolog', 'comment', 'doctype', 'cdata'],
        style: {
          color: '#608b4e',
          fontStyle: 'italic',
        },
      },
      {
        types: ['namespace'],
        style: {
          opacity: 0.7,
        },
      },
      {
        types: ['string', 'attr-value'],
        style: {
          color: '#ce9178',
        },
      },
      {
        types: ['punctuation', 'operator'],
        style: {
          color: '#d4d4d4',
        },
      },
      {
        types: ['entity', 'url', 'symbol', 'number', 'boolean', 'variable', 'constant', 'property', 'regex', 'inserted'],
        style: {
          color: '#b5cea8',
        },
      },
      {
        types: ['atrule', 'keyword', 'attr-name', 'selector'],
        style: {
          color: '#c586c0',
        },
      },
      {
        types: ['function', 'deleted', 'tag'],
        style: {
          color: '#569cd6',
        },
      },
      {
        types: ['function-variable'],
        style: {
          color: '#4ec9b0',
        },
      },
      {
        types: ['tag', 'selector', 'keyword'],
        style: {
          color: '#569cd6',
        },
      },
    ],
  };

  // Handle all events to prevent them from bubbling up to the canvas
  const handleInteraction = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // Handle keyboard events when editor is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop propagation of all keyboard events when in edit mode
      if (editMode) {
        e.stopPropagation();
      }
    };

    // Add global event listener for keyboard events
    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editMode]);

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      rotation={initialRotation}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (onSelect) onSelect({ ...codeData, type: 'code' });
      }}
    >
      {showControls && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.7}
          onMouseUp={handleTransformChange}
        />
      )}

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, -5]}
        style={{
          width: '300px',
          height: 'auto',
          opacity: 0.95,
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        onPointerDown={handleInteraction}
        onMouseDown={handleInteraction}
        className="drei-html"
        {...bind()}
      >
         <div 
            className="code-header flex justify-between items-center bg-[#252526] px-3 py-2 border-b border-gray-700 mb-2 rounded-lg"
            onClick={handleInteraction}
            onMouseDown={handleInteraction}
            onPointerDown={handleInteraction}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                <path d="M8 18L3 12L8 6M16 6L21 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-gray-300 text-sm font-medium truncate">
                {/* {codeData.fileName || `Code Block: ${id.substring(0, 6)}`} */}
                code
              </span>
            </div>
            <div className="flex items-center">
              {editMode ? (
                <button
                  className="text-white p-1 rounded hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEditMode();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    className="text-white p-1 rounded hover:bg-gray-700 mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEditMode();
                    }}
                    title="Edit Code"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4V20H20V13M20 4L8 16M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className="text-white p-1 rounded hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        <div 
          className="code-container bg-[#1e1e1e] rounded-lg overflow-hidden shadow-xl border border-gray-700 transform-gpu"
          onClick={handleInteraction}
          onMouseDown={handleInteraction}
          onPointerDown={handleInteraction}
          data-no-pointer-lock="true"
        >
          <LiveProvider
            code={localCode}
            noInline={noInline}
            language={language}
            theme={customTheme as any}
            enableTypeScript
            
            // transformCode={(code) => {
            //   code = code.replace("useState", "React.useState");           
            //   return code;
            // }}
          >
            <div 
              className="code-content"
              onClick={handleInteraction}
              onMouseDown={handleInteraction}
              onPointerDown={handleInteraction}
              data-no-pointer-lock="true"
            >
              {editMode ? (
                <div 
                  ref={editorRef}
                  className="editor-container p-2"
                  onClick={handleInteraction}
                  onMouseDown={handleInteraction}
                  onPointerDown={handleInteraction}
                  data-no-pointer-lock="true"
                >
                  <SafeLiveEditor 
                    onChange={handleCodeChange}
                    style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '12px',
                      minHeight: '150px',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                  <div className="flex justify-end mt-2" data-no-pointer-lock="true">
                    <button
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs py-1 px-2 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEditMode();
                      }}
                      data-no-pointer-lock="true"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="preview-container p-4 bg-white"
                  onClick={handleInteraction}
                  onMouseDown={handleInteraction}
                  onPointerDown={handleInteraction}
                  data-no-pointer-lock="true"
                >
                  <SafeLivePreview />
                  <LiveError 
                    style={{ 
                      backgroundColor: '#FEE2E2',
                      color: '#B91C1C',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginTop: '8px',
                      display: 'block',
                      whiteSpace: 'pre-wrap'
                    }}
                  />
                </div>
              )}
            </div>
          </LiveProvider>
        </div>
      </Html>
    </group>
  );
};

export default CodeInScene; 