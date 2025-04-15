import React, { useState, useRef } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { Object3D, Vector3 } from 'three';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { useDrag } from '@use-gesture/react';
import { a, useSpring } from '@react-spring/three';
import { CodeInSceneProps, TransformMode } from './types';

const CodeInScene: React.FC<CodeInSceneProps> = ({
  codeData,
  onRemove,
  onUpdate,
  onSelect,
}) => {
  const {
    id,
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
  
  // Spring animation for hover effect
  const { hoverScale } = useSpring({
    hoverScale: hovered ? 1.05 : 1,
    config: { mass: 1, tension: 280, friction: 60 },
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
  const customTheme = {
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

  return (
    <a.group
      ref={groupRef}
      position={initialPosition}
      rotation={initialRotation}
      scale={hoverScale.to((s) => [s * scale, s * scale, s * scale])}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect({ ...codeData, type: 'code' });
      }}
    >
      {showControls && (
        <TransformControls
          object={groupRef}
          mode={transformMode}
          size={0.7}
          onMouseUp={handleTransformChange}
        />
      )}

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0]}
        style={{
          width: '300px',
          height: 'auto',
          opacity: 0.95,
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        {...bind()}
      >
        <div className="code-container bg-[#1e1e1e] rounded-lg overflow-hidden shadow-xl border border-gray-700 transform-gpu">
          <div className="code-header flex justify-between items-center bg-[#252526] px-3 py-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                <path d="M8 18L3 12L8 6M16 6L21 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-gray-300 text-sm font-medium truncate">
                {codeData.fileName || `Code Block: ${id.substring(0, 6)}`}
              </span>
            </div>
            <div className="flex items-center">
              {editMode ? (
                <button
                  className="text-white p-1 rounded hover:bg-gray-700"
                  onClick={toggleEditMode}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    className="text-white p-1 rounded hover:bg-gray-700 mr-1"
                    onClick={toggleEditMode}
                    title="Edit Code"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4V20H20V13M20 4L8 16M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className="text-white p-1 rounded hover:bg-gray-700"
                    onClick={() => onRemove()}
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

          <LiveProvider
            code={localCode}
            noInline={noInline}
            language={language}
            theme={customTheme}
            scope={{
              useState,
              useEffect: React.useEffect,
            }}
          >
            <div className="code-content">
              {editMode ? (
                <div className="editor-container p-2">
                  <LiveEditor 
                    onChange={handleCodeChange}
                    style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '12px',
                      minHeight: '150px',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs py-1 px-2 rounded"
                      onClick={toggleEditMode}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-container p-4 bg-white">
                  <LivePreview />
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
    </a.group>
  );
};

export default CodeInScene; 