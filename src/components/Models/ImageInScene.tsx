import React, { useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { InternalImageProps } from './types';
import { processImageUrl, revokeBlobUrl } from './utils';
import LoadingIndicator from '../Scene/LoadingIndicator';

interface InternalImageComponentProps {
  imageSrc: string;
  onLoad?: (texture: THREE.Texture) => void;
}

// Internal component to handle the actual image loading
const InternalImage: React.FC<InternalImageComponentProps> = ({ imageSrc, onLoad }) => {
  // Use Three.js TextureLoader to load the image
  const texture = useLoader(TextureLoader, imageSrc);
  
  // Call onLoad callback when texture is ready
  useEffect(() => {
    if (texture && onLoad) {
      onLoad(texture as THREE.Texture);
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

// InternalImage component for loading images with proper handling of app-file:// URLs
const ImageInScene: React.FC<InternalImageProps> = ({ src, onLoad }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  
  // Handle loading app-file URLs
  useEffect(() => {
    const loadImage = async () => {
      setIsProcessing(true);
      try {
        const processedUrl = await processImageUrl(src);
        setImageSrc(processedUrl);
      } catch (error) {
        console.error('Error processing image URL:', error);
        setImageSrc(src);
      } finally {
        setIsProcessing(false);
      }
    };
    
    loadImage();
    
    // Cleanup function
    return () => {
      revokeBlobUrl(imageSrc, src);
    };
  }, [src, imageSrc]);
  
  if (isProcessing) {
    return <LoadingIndicator message="Processing image..." />;
  }
  
  return (
    <Suspense fallback={<LoadingIndicator message="Loading image..." />}>
      <InternalImage imageSrc={imageSrc} onLoad={onLoad} />
    </Suspense>
  );
};

// Export the ImageInScene component
export default ImageInScene; 