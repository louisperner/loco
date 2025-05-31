import React from 'react';
import { useImageStore, Image } from '@/store/useImageStore';
import { useGameStore, ImageTexture } from '@/store/useGameStore';

interface TextureSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const TextureSelector: React.FC<TextureSelectorProps> = ({ isOpen, onClose }) => {
  const images = useImageStore((state) => state.images);
  const { selectedImageTexture, setSelectedImageTexture } = useGameStore();

  if (!isOpen) return null;

  const handleTextureSelect = (image: Image) => {
    const texture: ImageTexture = {
      id: image.id,
      url: image.src, // Image store uses 'src' not 'url'
      fileName: image.fileName || 'texture.jpg'
    };
    // @ts-ignore
    setSelectedImageTexture(texture);
    onClose();
  };

  const handleClearTexture = () => {
    setSelectedImageTexture(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Cube Texture</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={handleClearTexture}
            className={`px-4 py-2 rounded mr-2 ${
              !selectedImageTexture 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            No Texture (Default Green)
          </button>
          {selectedImageTexture && (
            <span className="text-sm text-gray-300">
              {/* @ts-ignore */}
              Current: {selectedImageTexture.fileName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                // @ts-ignore
                selectedImageTexture?.id === image.id
                  ? 'border-green-500 ring-2 ring-green-400'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              onClick={() => handleTextureSelect(image)}
            >
              <img
                src={image.src}
                alt={image.fileName || 'Texture'}
                className="w-full h-24 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-1">
                <p className="text-xs text-white truncate">
                  {image.fileName || 'Unnamed'}
                </p>
              </div>
              {/* @ts-ignore */}
              {selectedImageTexture?.id === image.id && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No images in inventory</p>
            <p className="text-sm mt-2">Add images to use them as cube textures</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextureSelector; 