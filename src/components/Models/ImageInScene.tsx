import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { InternalImageProps } from './types';
import { processImageUrl, revokeBlobUrl } from './utils';

// InternalImage component for loading images with proper handling of app-file:// URLs
const ImageInScene: React.FC<InternalImageProps> = ({ src, onLoad }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  
  // Handle loading app-file URLs
  useEffect(() => {
    const loadImage = async () => {
      try {
        const processedUrl = await processImageUrl(src);
        setImageSrc(processedUrl);
      } catch (error) {
        console.error('Error processing image URL:', error);
        setImageSrc(src);
      }
    };
    
    loadImage();
    
    // Cleanup function
    return () => {
      revokeBlobUrl(imageSrc, src);
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
export default ImageInScene; 