import React, { useState, useCallback } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useGameStore } from '../../store/useGameStore';
import { useImageStore } from '../../store/useImageStore';
import * as THREE from 'three';

// This component handles the Drawing Overlay using TLDraw
const DrawingOverlay: React.FC = () => {
  const { showDrawingOverlay, setShowDrawingOverlay } = useGameStore();
  const { addImage } = useImageStore();
  const [editor, setEditor] = useState<Editor | null>(null);

  // Get camera position to place drawing in front of user
  const getCameraPosition = (): [number, number, number] => {
    // Default position if camera not available
    let position: [number, number, number] = [0, 0, 0];
    
    // If main camera is available in the window object
    if (window.mainCamera) {
      const camera = window.mainCamera;
      // Create direction vector pointing forward from camera
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      // Get current camera position
      const pos = new THREE.Vector3();
      pos.copy(camera.position);
      
      // Move in the direction the camera is facing
      direction.multiplyScalar(5); // Place 5 units in front of camera
      pos.add(direction);
      
      position = [pos.x, pos.y, pos.z];
    }
    
    return position;
  };

  // Handle saving the drawing
  const handleSave = useCallback(async () => {
    if (!editor) return;

    try {
      // Get all shapes or selected shapes
      const selectedShapeIds = editor.getSelectedShapeIds();
      const shapesToExport = selectedShapeIds.length > 0
        ? selectedShapeIds
        : Array.from(editor.getCurrentPageShapes()).map(shape => shape.id);

      // If no shapes, just close
      if (shapesToExport.length === 0) {
        setShowDrawingOverlay(false);
        return;
      }

      // Export the SVG
      const svg = await editor.getSvg(shapesToExport);
      if (!svg) {
        console.error('Failed to export SVG');
        return;
      }

      // Convert SVG to a Blob
      svg.setAttribute('style', 'background-color: transparent;');
      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      
      // Create a temporary image URL from the Blob
      const imageUrl = URL.createObjectURL(blob);
      
      // Create a temporary canvas for rendering the SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      const img = new Image();
      
      img.onload = () => {
        // Set canvas dimensions to match the SVG
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Clear canvas with transparency
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG on the canvas
        ctx?.drawImage(img, 0, 0);
        
        // Convert canvas to PNG blob
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            console.error('Failed to convert to PNG');
            return;
          }
          
          // Create a data URL from the PNG blob
          const reader = new FileReader();
          reader.onloadend = () => {
            // Create a unique file name based on timestamp
            const fileName = `drawing-${Date.now()}.png`;
            
            // Get camera position for placing the drawing
            const position = getCameraPosition();
            
            // Add the image to the image store
            addImage({
              src: reader.result as string,
              fileName,
              position, // Use camera-based position
              rotation: [0, 0, 0],
              scale: 1,
              width: canvas.width,
              height: canvas.height,
              alt: 'Drawing',
              hasTransparency: true
            });
            
            // Close the drawing overlay
            setShowDrawingOverlay(false);
            
            // Clean up
            URL.revokeObjectURL(imageUrl);
          };
          reader.readAsDataURL(pngBlob);
        }, 'image/png');
      };
      
      // Load the SVG image
      img.src = imageUrl;
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  }, [editor, setShowDrawingOverlay, addImage]);

  // Handle closing without saving
  const handleClose = useCallback(() => {
    setShowDrawingOverlay(false);
  }, [setShowDrawingOverlay]);

  // Store the editor instance when TLDraw mounts
  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  if (!showDrawingOverlay) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      <div className="bg-[#202020] p-4 flex justify-between items-center">
        <h2 className="text-white text-xl font-bold">Drawing Canvas</h2>
        <div className="flex space-x-4">
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save to Canvas
          </button>
          <button 
            onClick={handleClose} 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="flex-grow">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
};

export default DrawingOverlay; 