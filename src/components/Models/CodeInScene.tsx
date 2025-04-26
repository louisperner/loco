import React, { useState, useRef, useEffect } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { Object3D, Vector3 } from 'three';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
// @ts-ignore
import { useDrag } from '@use-gesture/react';
import { CodeInSceneProps, TransformMode } from './types';
import { ThreeEvent, useThree, useFrame } from '@react-three/fiber';
import { BiSolidCameraHome } from 'react-icons/bi';
import { FaArrowsAlt } from 'react-icons/fa';
import { BsArrowsMove } from 'react-icons/bs';
import { TbRotate360 } from 'react-icons/tb';
import * as THREE from 'three';

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
    lookAtUser: initialLookAtUser = false,
  } = codeData;

  // Ref to the group
  const groupRef = useRef<Object3D>(null);
  const transformControlsRef = useRef<any>(null);
  
  // State for control elements
  const [hovered, setHovered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [localCode, setLocalCode] = useState<string>(code);
  const [lookAtUser, setLookAtUser] = useState<boolean>(initialLookAtUser);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { camera } = useThree();

  // Initial position setup
  useEffect(() => {
    if (groupRef.current) {
      // For new code blocks (position is [0,0,0]), position it in front of the camera
      if (initialPosition[0] === 0 && initialPosition[1] === 0 && initialPosition[2] === 0) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        // Position the image 2 units in front of the camera
        const distance = 5;
        const position = new THREE.Vector3();
        position.copy(camera.position).add(cameraDirection.multiplyScalar(distance));
        
        groupRef.current.position.copy(position);
        
        // Make the image face the camera
        groupRef.current.lookAt(camera.position);
        
        // Save the initial position and rotation
        const currentRotation: [number, number, number] = [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        ];

        handleUpdate({
          position: [position.x, position.y, position.z],
          rotation: currentRotation
        });
      } else {
        groupRef.current.position.set(...initialPosition);
        groupRef.current.rotation.set(...initialRotation);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update position and rotation in useFrame to ensure synchronization
  useFrame(() => {
    if (groupRef.current && lookAtUser) {
      const lookAtPosition = new THREE.Vector3();
      camera.getWorldPosition(lookAtPosition);
      groupRef.current.lookAt(lookAtPosition);
      
      // Save new rotation after lookAt
      const newRotation: [number, number, number] = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ];
      
      if (JSON.stringify(newRotation) !== JSON.stringify(codeData.rotation)) {
        onUpdate({
          ...codeData,
          rotation: newRotation
        });
      }
    }
  });

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

  // Function to update all changes
  const handleUpdate = (changes: Partial<typeof codeData>): void => {
    if (groupRef.current) {
      // Convert Vector3 and Euler to arrays if needed
      const currentPosition: [number, number, number] = changes.position || [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z
      ];
      const currentRotation: [number, number, number] = changes.rotation || [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ];

      onUpdate({
        ...codeData,
        ...changes,
        position: currentPosition,
        rotation: currentRotation,
        scale,
        lookAtUser,
      });
    }
  };

  // Look at user handler
  const handleLookAtUser = (value: boolean): void => {
    setLookAtUser(value);
    handleUpdate({ lookAtUser: value });
  };

  // Handle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      // Save changes when exiting edit mode
      handleUpdate({
        code: localCode,
      });
    }
  };

  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
  };

  // Drag gesture
  const bind = useDrag(({ offset: [x, y] }: { offset: [number, number] }) => {
    if (groupRef.current) {
      const position = new Vector3(x / 100, -y / 100, 0);
      position.applyQuaternion(groupRef.current.quaternion);
      groupRef.current.position.add(position);
      
      handleUpdate({
        position: groupRef.current.position.toArray() as [number, number, number],
      });
    }
  }, {
    // Configurações adicionais para evitar problemas de captura de ponteiro
    pointer: {
      capture: false,
      buttons: 1 // Apenas botão esquerdo do mouse
    },
    // Desativa eventos de ponteiro nativos, usando apenas mouse para maior compatibilidade
    eventOptions: { 
      passive: true,
      capture: false
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

  // Prevent infinite loops with TransformControls
  useEffect(() => {
    if (transformControlsRef.current && groupRef.current) {
      const controls = transformControlsRef.current;
      
      // Important - allow all rotation axes to be modified
      if (transformMode === 'rotate') {
        controls.showX = true;
        controls.showY = true;
        controls.showZ = true;
      }

      // This function is defined outside to properly remove the listener
      const handleDraggingChanged = (event: { value: boolean }) => {
        if (event.value) {
          // While dragging, prevent updating to avoid recursive matrix calculation
          groupRef.current!.matrixAutoUpdate = false;
        } else {
          groupRef.current!.matrixAutoUpdate = true;
          groupRef.current!.updateMatrix();
          
          // Save position and rotation after dragging
          handleUpdate({
            position: [
              groupRef.current!.position.x,
              groupRef.current!.position.y,
              groupRef.current!.position.z
            ],
            rotation: [
              groupRef.current!.rotation.x,
              groupRef.current!.rotation.y,
              groupRef.current!.rotation.z
            ]
          });
        }
      };
      
      controls.addEventListener('dragging-changed', handleDraggingChanged);

      return () => {
        controls.removeEventListener('dragging-changed', handleDraggingChanged);
      };
    }
  }, [showControls, transformMode]);

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

  // Control panel component
  const ControlPanel: React.FC = () => (
    <div
      className="flex items-center gap-2 p-2 bg-gray-800/80 rounded-lg absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 transition-all duration-300"
      style={{
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
        zIndex: 1000,
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleLookAtUser(!lookAtUser);
        }}
        className={`p-1.5 rounded-md ${lookAtUser ? 'bg-blue-500' : 'bg-gray-700'} hover:opacity-80 transition-colors`}
        title="Look at user"
      >
        <BiSolidCameraHome size={14} className="text-white" />
      </button>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowControls(!showControls);
        }}
        className={`p-1.5 rounded-md ${showControls ? 'bg-blue-500' : 'bg-gray-700'} hover:opacity-80 transition-colors`}
        title="Show transform controls"
      >
        <FaArrowsAlt size={14} className="text-white" />
      </button>
      
      {showControls && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setTransformMode(
              transformMode === 'translate' ? 'rotate' :
              transformMode === 'rotate' ? 'scale' : 'translate'
            );
          }}
          className="p-1.5 rounded-md bg-blue-500 hover:opacity-80 transition-colors"
          title={`Current mode: ${transformMode}`}
        >
          {transformMode === 'translate' && <BsArrowsMove size={14} className="text-white" />}
          {transformMode === 'rotate' && <TbRotate360 size={14} className="text-white" />}
          {transformMode === 'scale' && <FaArrowsAlt size={14} className="text-white" />}
        </button>
      )}
    </div>
  );

  return (
    <>
      {showControls && groupRef.current && (
        <TransformControls
          ref={transformControlsRef}
          object={groupRef.current}
          mode={transformMode}
          size={0.7}
          space="world"
          showX={true}
          showY={true}
          showZ={true}
          rotationSnap={null}
          translationSnap={0.5}
        />
      )}
      
      <group
        ref={groupRef}
        position={initialPosition}
        rotation={initialRotation}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (onSelect) onSelect({ ...codeData, type: 'code' });
        }}
      >
        <Html
          transform
          occlude="blending"
          distanceFactor={10}
          position={[0, 0, -5]}
          style={{
            width: '300px',
            height: 'auto',
            opacity: 0.95,
            pointerEvents: 'none'
          }}
          className="drei-html-wrapper"
        >
          <div
            style={{ pointerEvents: 'auto' }}
            onPointerOver={(e) => { e.stopPropagation(); handlePointerOver(); }}
            onPointerOut={(e) => { e.stopPropagation(); handlePointerOut(); }}
            onClick={(e) => { e.stopPropagation(); handleClick(e as any); }}
            onContextMenu={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleRightClick(e as any);
            }}
            onPointerDown={(e) => { e.stopPropagation(); handleInteraction(e as any); }}
            onMouseDown={(e) => { e.stopPropagation(); handleInteraction(e as any); }}
            {...bind()}
          >
            <div 
              className="code-header flex justify-between items-center bg-[#252526] px-3 py-2 border-b border-gray-700 mb-2 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleInteraction(e as any);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleInteraction(e as any);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleInteraction(e as any);
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                  <path d="M8 18L3 12L8 6M16 6L21 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-gray-300 text-sm font-medium truncate">
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
              className="code-container bg-[#1e1e1e] rounded-lg overflow-hidden shadow-xl border border-gray-700 transform-gpu relative"
              onClick={(e) => {
                e.stopPropagation();
                handleInteraction(e as any);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleInteraction(e as any);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleInteraction(e as any);
              }}
              data-no-pointer-lock="true"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <LiveProvider
                code={localCode}
                noInline={noInline}
                language={language}
                theme={customTheme as any}
                enableTypeScript
              >
                <div 
                  className="code-content"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(e as any);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleInteraction(e as any);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handleInteraction(e as any);
                  }}
                  data-no-pointer-lock="true"
                >
                  {editMode ? (
                    <div 
                      ref={editorRef}
                      className="editor-container p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(e as any);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleInteraction(e as any);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handleInteraction(e as any);
                      }}
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
                      className="preview-container"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(e as any);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleInteraction(e as any);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handleInteraction(e as any);
                      }}
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
              <ControlPanel />
            </div>
          </div>
        </Html>
      </group>
    </>
  );
};

export default CodeInScene; 