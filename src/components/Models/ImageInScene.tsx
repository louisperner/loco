import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';

// Define types for the props needed by the InternalImage component
interface InternalImageProps {
  src: string;
  onLoad?: (texture: THREE.Texture) => void;
  onError?: (error: ErrorEvent) => void;
}

// InternalImage component for loading images with proper handling of app-file:// URLs
const InternalImage: React.FC<InternalImageProps> = ({ src, onLoad }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  // @ts-ignore
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Handle loading app-file URLs
  useEffect(() => {
    const loadImage = async () => {
      if (src && (src.startsWith('app-file://') || src.startsWith('file://'))) {
        try {
          if (window.electron && window.electron.loadImageFromAppFile) {
            const result = await window.electron.loadImageFromAppFile(src);
            if (result.success && result.url) {
              setImageSrc(result.url);
            } else {
              console.error('Failed to load image from app-file URL:', result.error);
              setImageSrc(src); // Fallback to original source
            }
          } else {
            console.warn('electron.loadImageFromAppFile not available, using original src');
            setImageSrc(src);
          }
        } catch (error) {
          console.error('Error loading image from app-file URL:', error);
          setImageSrc(src);
        }
      } else {
        setImageSrc(src);
      }
      setIsLoading(false);
    };
    
    loadImage();
    
    // Cleanup function
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:') && imageSrc !== src) {
        try {
          // Check if this blob URL is in the cache before revoking
          if (window._imageBlobCache && !Object.values(window._imageBlobCache).includes(imageSrc)) {
            URL.revokeObjectURL(imageSrc);
          }
        } catch (error) {
          console.error('Error revoking blob URL:', error);
        }
      }
    };
  }, [src, imageSrc]);
  
  // Use Three.js TextureLoader to load the image
  const texture = useLoader(TextureLoader, imageSrc);
  
  // Call onLoad callback when texture is ready
  useEffect(() => {
    if (texture && onLoad) {
      onLoad(texture);
    }
  }, [texture, onLoad]);
  
  // Create a mesh with the loaded texture
  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
};

// Export the InternalImage component
export default InternalImage; 