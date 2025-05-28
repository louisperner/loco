import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Palette, Image as ImageIcon, RotateCw } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { useModelStore } from '@/store/useModelStore';

interface CubeFace {
  id: string;
  name: string;
  texture?: string;
  color: string;
}

interface CubeCrafterProps {
  isOpen: boolean;
  onClose: () => void;
}

const CubeCrafter: React.FC<CubeCrafterProps> = ({ isOpen, onClose }) => {
  const images = useImageStore((state) => state.images);
  const { addModel } = useModelStore();
  
  const [cubeName, setCubeName] = useState('Custom Cube');
  const [selectedFace, setSelectedFace] = useState<string>('front');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTexturePicker, setShowTexturePicker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize cube faces with default colors
  const [cubeFaces, setCubeFaces] = useState<Record<string, CubeFace>>({
    front: { id: 'front', name: 'Front', color: '#4ade80' },
    back: { id: 'back', name: 'Back', color: '#4ade80' },
    left: { id: 'left', name: 'Left', color: '#4ade80' },
    right: { id: 'right', name: 'Right', color: '#4ade80' },
    top: { id: 'top', name: 'Top', color: '#4ade80' },
    bottom: { id: 'bottom', name: 'Bottom', color: '#4ade80' }
  });

  // Draw the cube net (unfolded cube) on canvas
  const drawCubeNet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const faceSize = 80;
    const padding = 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Define face positions in the net layout
    const facePositions = {
      top: { x: faceSize + padding, y: 0 },
      left: { x: 0, y: faceSize + padding },
      front: { x: faceSize + padding, y: faceSize + padding },
      right: { x: (faceSize + padding) * 2, y: faceSize + padding },
      back: { x: (faceSize + padding) * 3, y: faceSize + padding },
      bottom: { x: faceSize + padding, y: (faceSize + padding) * 2 }
    };

    // Draw each face
    Object.entries(facePositions).forEach(([faceId, pos]) => {
      const face = cubeFaces[faceId];
      
      // Draw face background
      if (face.texture) {
        // If texture exists, try to draw it
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, pos.x, pos.y, faceSize, faceSize);
          // Add border
          ctx.strokeStyle = selectedFace === faceId ? '#ffffff' : '#333333';
          ctx.lineWidth = selectedFace === faceId ? 3 : 1;
          ctx.strokeRect(pos.x, pos.y, faceSize, faceSize);
        };
        img.src = face.texture;
      } else {
        // Draw solid color
        ctx.fillStyle = face.color;
        ctx.fillRect(pos.x, pos.y, faceSize, faceSize);
      }
      
      // Draw border
      ctx.strokeStyle = selectedFace === faceId ? '#ffffff' : '#333333';
      ctx.lineWidth = selectedFace === faceId ? 3 : 1;
      ctx.strokeRect(pos.x, pos.y, faceSize, faceSize);
      
      // Draw face label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(face.name, pos.x + faceSize / 2, pos.y + faceSize / 2 + 4);
    });
  };

  // Handle canvas click to select face
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const faceSize = 80;
    const padding = 2;
    
    const facePositions = {
      top: { x: faceSize + padding, y: 0 },
      left: { x: 0, y: faceSize + padding },
      front: { x: faceSize + padding, y: faceSize + padding },
      right: { x: (faceSize + padding) * 2, y: faceSize + padding },
      back: { x: (faceSize + padding) * 3, y: faceSize + padding },
      bottom: { x: faceSize + padding, y: (faceSize + padding) * 2 }
    };

    // Check which face was clicked
    Object.entries(facePositions).forEach(([faceId, pos]) => {
      if (x >= pos.x && x <= pos.x + faceSize && y >= pos.y && y <= pos.y + faceSize) {
        setSelectedFace(faceId);
        setShowColorPicker(false);
        setShowTexturePicker(false);
      }
    });
  };

  // Update face color
  const updateFaceColor = (color: string) => {
    setCubeFaces(prev => ({
      ...prev,
      [selectedFace]: {
        ...prev[selectedFace],
        color,
        texture: undefined // Clear texture when setting color
      }
    }));
  };

  // Update face texture
  const updateFaceTexture = (textureUrl: string) => {
    setCubeFaces(prev => ({
      ...prev,
      [selectedFace]: {
        ...prev[selectedFace],
        texture: textureUrl
      }
    }));
    setShowTexturePicker(false);
  };

  // Apply texture/color to all faces
  const applyToAllFaces = () => {
    const currentFace = cubeFaces[selectedFace];
    const update = currentFace.texture 
      ? { texture: currentFace.texture, color: currentFace.color }
      : { texture: undefined, color: currentFace.color };

    setCubeFaces(prev => {
      const newFaces = { ...prev };
      Object.keys(newFaces).forEach(faceId => {
        newFaces[faceId] = { ...newFaces[faceId], ...update };
      });
      return newFaces;
    });
  };

  // Generate cube texture and save to inventory
  const saveCube = async () => {
    // Create a better thumbnail showing the cube net
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    if (!thumbnailCtx) return;

    // Create a 256x256 thumbnail
    thumbnailCanvas.width = 256;
    thumbnailCanvas.height = 256;

    // Draw a simplified cube net as thumbnail
    const faceSize = 64;
    const padding = 1;
    
    // Define face positions for thumbnail (smaller layout)
    const thumbnailFacePositions = {
      top: { x: faceSize + padding, y: 0 },
      left: { x: 0, y: faceSize + padding },
      front: { x: faceSize + padding, y: faceSize + padding },
      right: { x: (faceSize + padding) * 2, y: faceSize + padding },
      back: { x: (faceSize + padding) * 3, y: faceSize + padding },
      bottom: { x: faceSize + padding, y: (faceSize + padding) * 2 }
    };

    // Clear background
    thumbnailCtx.fillStyle = '#1A1A1A';
    thumbnailCtx.fillRect(0, 0, 256, 256);

    // Draw each face
    const drawPromises = Object.entries(thumbnailFacePositions).map(([faceId, pos]) => {
      return new Promise<void>((resolve) => {
        const face = cubeFaces[faceId];
        
        if (face.texture) {
          const img = new Image();
          img.onload = () => {
            thumbnailCtx.drawImage(img, pos.x, pos.y, faceSize, faceSize);
            // Add border
            thumbnailCtx.strokeStyle = '#333333';
            thumbnailCtx.lineWidth = 1;
            thumbnailCtx.strokeRect(pos.x, pos.y, faceSize, faceSize);
            resolve();
          };
          img.onerror = () => {
            // Fallback to color if texture fails
            thumbnailCtx.fillStyle = face.color;
            thumbnailCtx.fillRect(pos.x, pos.y, faceSize, faceSize);
            thumbnailCtx.strokeStyle = '#333333';
            thumbnailCtx.lineWidth = 1;
            thumbnailCtx.strokeRect(pos.x, pos.y, faceSize, faceSize);
            resolve();
          };
          img.src = face.texture;
        } else {
          // Draw solid color
          thumbnailCtx.fillStyle = face.color;
          thumbnailCtx.fillRect(pos.x, pos.y, faceSize, faceSize);
          thumbnailCtx.strokeStyle = '#333333';
          thumbnailCtx.lineWidth = 1;
          thumbnailCtx.strokeRect(pos.x, pos.y, faceSize, faceSize);
          resolve();
        }
      });
    });

    // Wait for all faces to be drawn
    await Promise.all(drawPromises);
    
    const thumbnailUrl = thumbnailCanvas.toDataURL();
    finalizeCubeSave(thumbnailUrl);
  };

  const finalizeCubeSave = (thumbnailUrl: string) => {
    // Generate a more unique ID for the cube
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `${cubeName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}-${randomSuffix}.cube`;
    
    // Create cube data that matches the Model interface
    const cubeData = {
      url: 'primitive://cube',
      fileName: uniqueFileName,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: 1,
      // Additional properties for custom cubes
      isPrimitive: true,
      primitiveType: 'cube' as const,
      color: cubeFaces.front.color,
      textureUrl: cubeFaces.front.texture,
      textureType: cubeFaces.front.texture ? 'image' as const : undefined,
      textureName: cubeName,
      thumbnailUrl,
      customCube: true,
      cubeFaces: { ...cubeFaces }, // Deep copy to avoid reference issues
      isInScene: false // This will be in inventory, not scene
    };

    // Add to model store
    addModel(cubeData);

    // Show success message
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(26, 26, 26, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(8px);
    `;
    toast.textContent = `Custom cube "${cubeName}" saved to inventory!`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);

    // Close the crafter
    onClose();
  };

  // Initialize canvas when component becomes visible
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the canvas is properly mounted in the DOM
      setTimeout(() => {
        drawCubeNet();
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Redraw canvas when faces change
  useEffect(() => {
    drawCubeNet();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubeFaces, selectedFace, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-xl border border-[#333333] p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white/20 rounded-sm"></div>
            </div>
            <h2 className="text-xl font-bold text-white">Cube Crafter</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333333] rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Cube Net */}
          <div className="space-y-4">
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Cube Net (Click faces to select)</h3>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={260}
                  onClick={handleCanvasClick}
                  className="border border-[#444444] rounded cursor-pointer bg-[#1A1A1A]"
                />
              </div>
              <div className="mt-3 text-center">
                <p className="text-white/70 text-sm">
                  Selected: <span className="text-green-400 font-medium">{cubeFaces[selectedFace]?.name}</span>
                </p>
              </div>
            </div>

            {/* Cube Name */}
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <label className="block text-white font-medium mb-2">Cube Name</label>
              <input
                type="text"
                value={cubeName}
                onChange={(e) => setCubeName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#444444] rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                placeholder="Enter cube name..."
              />
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="space-y-4">
            {/* Face Controls */}
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Face Controls</h3>
              
              {/* Color Picker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowTexturePicker(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#444444] rounded-lg hover:border-green-400 transition-colors text-white"
                  >
                    <Palette size={16} />
                    <span>Color</span>
                    <div 
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: cubeFaces[selectedFace]?.color }}
                    ></div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowTexturePicker(!showTexturePicker);
                      setShowColorPicker(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#444444] rounded-lg hover:border-green-400 transition-colors text-white"
                  >
                    <ImageIcon size={16} />
                    <span>Texture</span>
                  </button>
                </div>

                {showColorPicker && (
                  <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#444444]">
                    <input
                      type="color"
                      value={cubeFaces[selectedFace]?.color}
                      onChange={(e) => updateFaceColor(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                    <div className="mt-2 grid grid-cols-6 gap-1">
                      {['#4ade80', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateFaceColor(color)}
                          className="w-8 h-8 rounded border border-white/20 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {showTexturePicker && (
                  <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#444444] max-h-40 overflow-y-auto">
                                         <div className="grid grid-cols-4 gap-2">
                       {images.map((img) => (
                         <button
                           key={img.id}
                           onClick={() => updateFaceTexture(typeof img.src === 'string' ? img.src : '')}
                           className="aspect-square rounded border border-[#444444] hover:border-green-400 transition-colors overflow-hidden"
                         >
                           <img
                             src={typeof img.src === 'string' ? img.src : ''}
                             alt={typeof img.fileName === 'string' ? img.fileName : 'Texture'}
                             className="w-full h-full object-cover"
                           />
                         </button>
                       ))}
                    </div>
                    {images.length === 0 && (
                      <p className="text-white/50 text-center py-4">No textures available</p>
                    )}
                  </div>
                )}

                {/* Apply to All Faces */}
                <button
                  onClick={applyToAllFaces}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                >
                  <RotateCw size={16} />
                  <span>Apply to All Faces</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#2C2C2C] rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCubeFaces(prev => {
                      const newFaces = { ...prev };
                      Object.keys(newFaces).forEach(faceId => {
                        newFaces[faceId] = { ...newFaces[faceId], color: '#4ade80', texture: undefined };
                      });
                      return newFaces;
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#444444] rounded-lg hover:border-yellow-400 transition-colors text-white"
                >
                  Reset All Faces
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveCube}
              disabled={!cubeName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
            >
              <Save size={20} />
              <span>Save to Inventory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeCrafter; 