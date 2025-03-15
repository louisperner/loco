import React, { useEffect, useState } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useImageStore } from '../../store/useImageStore';
import { BiSolidCameraHome, BiReset, BiBorderAll } from 'react-icons/bi';
import { MdInvertColors, MdHideImage, MdDelete } from 'react-icons/md';
import { FaExpand, FaCompress, FaArrowsAlt } from 'react-icons/fa';
import { TbRotate360, TbArrowBigUp, TbArrowBigDown, TbArrowBigLeft, TbArrowBigRight } from 'react-icons/tb';
import { BsArrowsMove } from 'react-icons/bs';
import * as THREE from 'three';

// Componente para renderizar uma imagem individual no espaço 3D
const ImageInScene = ({ imageData, onRemove, onUpdate }) => {
  const { 
    src, 
    width = 300, 
    height = 200, 
    position = [0, 0, -2],
    rotation = [0, 0, 0],
    lookAtUser: initialLookAtUser = false,
    invertColors: initialInvertColors = false,
    removeBackground: initialRemoveBackground = false,
    removeBorder: initialRemoveBorder = false,
    scale: initialScale = 1,
  } = imageData;

  const [lookAtUser, setLookAtUser] = useState(initialLookAtUser);
  const [invertColors, setInvertColors] = useState(initialInvertColors);
  const [removeBackground, setRemoveBackground] = useState(initialRemoveBackground);
  const [removeBorder, setRemoveBorder] = useState(initialRemoveBorder);
  const [showControls, setShowControls] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');
  const [scale, setScale] = useState(initialScale);
  const [isHovered, setIsHovered] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  const groupRef = React.useRef();
  const { camera } = useThree();

  // Handle app-file URLs
  useEffect(() => {
    const loadImage = async () => {
      if (src && (src.startsWith('app-file://') || src.startsWith('file://'))) {
        try {
          if (window.electron && window.electron.loadImageFromAppFile) {
            // console.log('Loading image from app-file URL:', src);
            const result = await window.electron.loadImageFromAppFile(src);
            if (result.success) {
              // console.log('Successfully loaded image as blob URL:', result.url);
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
    };
    
    loadImage();
    
    // Cleanup function to revoke blob URLs
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:') && imageSrc !== src) {
        try {
          // Check if this blob URL is in the cache before revoking
          if (window._imageBlobCache && !Object.values(window._imageBlobCache).includes(imageSrc)) {
            URL.revokeObjectURL(imageSrc);
            console.log('Revoked blob URL for image:', imageSrc);
          }
        } catch (error) {
          console.error('Error revoking blob URL:', error);
        }
      }
    };
  }, [src]);

  // Função para salvar as alterações
  const saveChanges = (changes) => {
    if (groupRef.current) {
      // Converte Vector3 e Euler para arrays
      const currentPosition = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z
      ];
      const currentRotation = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ];

      const updatedData = {
        ...imageData,
        ...changes,
        position: currentPosition,
        rotation: currentRotation,
        scale: scale,
      };
      onUpdate(updatedData);
    }
  };

  // Handlers com salvamento automático
  const handleLookAtUser = (value) => {
    setLookAtUser(value);
    saveChanges({ lookAtUser: value });
  };

  const handleInvertColors = (value) => {
    setInvertColors(value);
    saveChanges({ invertColors: value });
  };

  const handleRemoveBackground = (value) => {
    setRemoveBackground(value);
    saveChanges({ removeBackground: value });
  };

  const handleRemoveBorder = (value) => {
    setRemoveBorder(value);
    saveChanges({ removeBorder: value });
  };

  const handleScale = (increase) => {
    const newScale = increase ? scale * 1.2 : scale / 1.2;
    setScale(newScale);
    saveChanges({ scale: newScale });
  };

  const handleFineTune = (type, axis, value) => {
    if (groupRef.current) {
      if (type === 'position') {
        const currentPos = groupRef.current.position.toArray();
        const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        currentPos[axisIndex] += value;
        groupRef.current.position.fromArray(currentPos);
        saveChanges({ position: currentPos });
      } else if (type === 'rotation') {
        const currentRot = groupRef.current.rotation.toArray();
        const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        currentRot[axisIndex] += value;
        groupRef.current.rotation.fromArray(currentRot);
        saveChanges({ rotation: currentRot });
      }
    }
  };

  // Salvar posição e rotação quando mudar via TransformControls
  useEffect(() => {
    if (groupRef.current && showControls) {
      const controls = document.querySelector('.transform-controls');
      
      const handleChange = () => {
        if (groupRef.current) {
          const newPosition = groupRef.current.position.toArray();
          const newRotation = [
            groupRef.current.rotation.x,
            groupRef.current.rotation.y,
            groupRef.current.rotation.z
          ];
          
          const updatedData = {
            ...imageData,
            position: newPosition,
            rotation: newRotation,
            scale: scale
          };
          
          onUpdate(updatedData);
        }
      };

      // Adicionar listeners para os eventos do TransformControls
      if (controls) {
        controls.addEventListener('mouseup', handleChange);
        controls.addEventListener('change', handleChange);
      }

      return () => {
        if (controls) {
          controls.removeEventListener('mouseup', handleChange);
          controls.removeEventListener('change', handleChange);
        }
      };
    }
  }, [showControls, imageData, scale, onUpdate]);

  // Atualizar posição e rotação no useFrame para garantir sincronização
  useFrame(() => {
    if (groupRef.current) {
      if (lookAtUser) {
        const lookAtPosition = new THREE.Vector3();
        camera.getWorldPosition(lookAtPosition);
        groupRef.current.lookAt(lookAtPosition);
        
        // Salvar a nova rotação após lookAt
        const newRotation = [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        ];
        
        if (JSON.stringify(newRotation) !== JSON.stringify(imageData.rotation)) {
          onUpdate({
            ...imageData,
            rotation: newRotation
          });
        }
      }
    }
  });

  const ControlPanel = () => (
    <div
      style={{
        position: 'absolute',
        bottom: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        gap: '6px',
        color: 'white',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 1000,
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <button 
        onClick={() => handleLookAtUser(!lookAtUser)} 
        style={{
          ...iconButtonStyle,
          backgroundColor: lookAtUser ? '#666' : '#444'
        }}
        title={lookAtUser ? 'Disable Look at User' : 'Enable Look at User'}
      >
        <BiSolidCameraHome size={16} />
      </button>
      <button 
        onClick={() => {
          if (showControls && transformMode === 'translate') {
            setShowControls(false);
          } else {
            setShowControls(true);
            setTransformMode('translate');
          }
        }} 
        style={{
          ...iconButtonStyle,
          backgroundColor: showControls && transformMode === 'translate' ? '#666' : '#444'
        }}
        title={showControls && transformMode === 'translate' ? 'Disable Move' : 'Enable Move'}
      >
        <BsArrowsMove size={16} />
      </button>
      <button 
        onClick={() => {
          if (showControls && transformMode === 'rotate') {
            setShowControls(false);
          } else {
            setShowControls(true);
            setTransformMode('rotate');
          }
        }} 
        style={{
          ...iconButtonStyle,
          backgroundColor: showControls && transformMode === 'rotate' ? '#666' : '#444'
        }}
        title={showControls && transformMode === 'rotate' ? 'Disable Rotate' : 'Enable Rotate'}
      >
        <TbRotate360 size={16} />
      </button>
      <button 
        onClick={() => handleScale(true)} 
        style={iconButtonStyle}
        title="Scale Up"
      >
        <FaExpand size={14} />
      </button>
      <button 
        onClick={() => handleScale(false)} 
        style={iconButtonStyle}
        title="Scale Down"
      >
        <FaCompress size={14} />
      </button>
      <button 
        onClick={() => handleInvertColors(!invertColors)} 
        style={{
          ...iconButtonStyle,
          backgroundColor: invertColors ? '#666' : '#444'
        }}
        title="Invert Colors"
      >
        <MdInvertColors size={16} />
      </button>
      <button 
        onClick={() => handleRemoveBackground(!removeBackground)} 
        style={{
          ...iconButtonStyle,
          backgroundColor: removeBackground ? '#666' : '#444'
        }}
        title="Toggle Background"
      >
        <MdHideImage size={16} />
      </button>
      <button 
        onClick={() => handleRemoveBorder(!removeBorder)} 
        style={{
          ...iconButtonStyle,
          backgroundColor: removeBorder ? '#666' : '#444'
        }}
        title="Toggle Border"
      >
        <BiBorderAll size={16} />
      </button>
      <button 
        onClick={() => {
          setShowControls(false);
          setTransformMode('translate');
        }} 
        style={{
          ...iconButtonStyle,
          backgroundColor: showControls ? '#662222' : '#444'
        }}
        title="Disable Transform Controls"
      >
        <BiReset size={16} />
      </button>
      <button 
        onClick={onRemove} 
        style={{
          ...iconButtonStyle,
          backgroundColor: '#662222'
        }}
        title="Remove Image"
      >
        <MdDelete size={16} />
      </button>
    </div>
  );

  const FineTuneControls = () => (
    <div
      style={{
        position: 'absolute',
        top: '-80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px',
        borderRadius: '8px',
        display: showControls ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '4px',
        color: 'white',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 1000,
      }}
    >
      {transformMode === 'translate' && (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button
            onClick={() => handleFineTune('position', 'x', -0.1)}
            style={iconButtonStyle}
            title="Move Left"
          >
            <TbArrowBigLeft size={14} />
          </button>
          <button
            onClick={() => handleFineTune('position', 'x', 0.1)}
            style={iconButtonStyle}
            title="Move Right"
          >
            <TbArrowBigRight size={14} />
          </button>
          <button
            onClick={() => handleFineTune('position', 'y', 0.1)}
            style={iconButtonStyle}
            title="Move Up"
          >
            <TbArrowBigUp size={14} />
          </button>
          <button
            onClick={() => handleFineTune('position', 'y', -0.1)}
            style={iconButtonStyle}
            title="Move Down"
          >
            <TbArrowBigDown size={14} />
          </button>
        </div>
      )}
      {transformMode === 'rotate' && (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button
            onClick={() => handleFineTune('rotation', 'y', -Math.PI / 32)}
            style={iconButtonStyle}
            title="Rotate Left"
          >
            <TbArrowBigLeft size={14} />
          </button>
          <button
            onClick={() => handleFineTune('rotation', 'y', Math.PI / 32)}
            style={iconButtonStyle}
            title="Rotate Right"
          >
            <TbArrowBigRight size={14} />
          </button>
          <button
            onClick={() => handleFineTune('rotation', 'x', -Math.PI / 32)}
            style={iconButtonStyle}
            title="Rotate Up"
          >
            <TbArrowBigUp size={14} />
          </button>
          <button
            onClick={() => handleFineTune('rotation', 'x', Math.PI / 32)}
            style={iconButtonStyle}
            title="Rotate Down"
          >
            <TbArrowBigDown size={14} />
          </button>
        </div>
      )}
    </div>
  );

  const ImageContainer = () => (
    <div 
      style={{ 
        position: 'relative',
        paddingBottom: '45px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FineTuneControls />
      <div style={{
        position: 'relative',
        marginBottom: '5px',
      }}>
        <img
          src={imageSrc}
          alt={imageData.alt || 'Image'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            border: removeBorder ? 'none' : '2px solid white',
            borderRadius: removeBorder ? '0' : '4px',
            boxShadow: removeBorder ? 'none' : '0 0 10px rgba(0,0,0,0.5)',
            backgroundColor: removeBackground ? 'transparent' : 'rgba(255,255,255,0.8)',
            padding: removeBorder ? '0' : '8px',
            filter: invertColors ? 'invert(1)' : 'none',
            transition: 'all 0.3s ease-in-out',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        />
      </div>
      <ControlPanel />
    </div>
  );

  return (
    <>
      {showControls && (
        <TransformControls 
          object={groupRef.current} 
          mode={transformMode}
          size={0.75}
          space="local"
          showX={true}
          showY={true}
          showZ={true}
          rotationSnap={Math.PI / 24}
          translationSnap={0.5}
          onObjectChange={() => {
            if (groupRef.current) {
              const newPosition = groupRef.current.position.toArray();
              const newRotation = [
                groupRef.current.rotation.x,
                groupRef.current.rotation.y,
                groupRef.current.rotation.z
              ];
              
              onUpdate({
                ...imageData,
                position: newPosition,
                rotation: newRotation,
                scale: scale
              });
            }
          }}
        />
      )}
      <group 
        ref={groupRef} 
        position={position} 
        rotation={rotation} 
        scale={scale}
        onChange={() => {
          if (groupRef.current) {
            const newPosition = groupRef.current.position.toArray();
            const newRotation = [
              groupRef.current.rotation.x,
              groupRef.current.rotation.y,
              groupRef.current.rotation.z
            ];
            
            onUpdate({
              ...imageData,
              position: newPosition,
              rotation: newRotation,
              scale: scale
            });
          }
        }}
      >
        <Html
          transform
          distanceFactor={1.5}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: 'auto',
            userSelect: 'none',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <ImageContainer />
        </Html>
      </group>
    </>
  );
};

const iconButtonStyle = {
  backgroundColor: '#444',
  border: 'none',
  color: 'white',
  padding: '6px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: '#555'
  }
};

// Componente principal que gerencia imagens usando Zustand
const ImageCloneManager = () => {
  const { camera } = useThree();
  const images = useImageStore(state => state.images);
  const addImage = useImageStore(state => state.addImage);
  const removeImage = useImageStore(state => state.removeImage);
  const updateImage = useImageStore(state => state.updateImage);
  const loadSavedImages = useImageStore(state => state.loadSavedImages);

  // Load saved images from localStorage only once on mount
  useEffect(() => {
    loadSavedImages();
  }, []); // Empty dependency array to run only once on mount

  // Exportar a função addImage para o escopo global para compatibilidade
  useEffect(() => {
    // Garantir que a câmera esteja disponível globalmente
    window.mainCamera = camera;
    
    window.addImageToScene = (imageData) => {
      console.log('Chamando addImageToScene via window global', imageData);
      return addImage({ ...imageData, camera });
    };

    return () => {
      // Limpar a referência global ao desmontar
      window.addImageToScene = undefined;
    };
  }, [addImage, camera]);

  // console.log('ImageCloneManager renderizando com', images.length, 'imagens');

  // Renderizar cada imagem do store
  return (
    <>
      {images.map((image, index) => (
        <ImageInScene 
          key={`image-${image.id || index}`} 
          imageData={image}
          onRemove={() => removeImage(image.id)}
          onUpdate={(updatedData) => updateImage(image.id, updatedData)}
        />
      ))}
    </>
  );
};

export default ImageCloneManager; 