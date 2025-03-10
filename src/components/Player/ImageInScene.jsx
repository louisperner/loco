// import React, { useState, useRef } from 'react';
// import { Html } from '@react-three/drei';
// import * as THREE from 'three';

// /**
//  * Componente para renderizar imagens na cena 3D
//  */
// function ImageInScene({ imageData, position: initialPosition = [0, 0, 0], rotation: initialRotation = [0, 0, 0], onRemove }) {
//   const [hovered, setHovered] = useState(false);
//   const [dragging, setDragging] = useState(false);
//   const [scale, setScale] = useState(1);
//   const [position, setPosition] = useState(initialPosition);
//   const [rotation, setRotation] = useState(initialRotation);
//   const [removeBg, setRemoveBg] = useState(false);
//   const groupRef = useRef();
//   const dragStart = useRef({ x: 0, y: 0 });

//   // Se não tiver dados de imagem, não renderiza nada
//   if (!imageData || !imageData.src) {
//     console.warn('ImageInScene: No image data provided');
//     return null;
//   }

//   const handlePointerOver = (e) => {
//     e.stopPropagation();
//     setHovered(true);
//     document.body.style.cursor = 'pointer';
//   };

//   const handlePointerOut = (e) => {
//     e.stopPropagation();
//     setHovered(false);
//     document.body.style.cursor = 'auto';
//   };

//   const handlePointerEnter = (e) => {
//     e.stopPropagation();
//     setHovered(true);
//     document.body.style.cursor = 'pointer';
//   };

//   const handlePointerLeave = (e) => {
//     e.stopPropagation();
//     setHovered(false);
//     document.body.style.cursor = 'auto';
//   };

//   const handleWheel = (e) => {
//     e.stopPropagation();
//     // Ajusta o zoom da imagem
//     const newScale = scale - e.deltaY * 0.001;
//     setScale(Math.max(0.1, Math.min(3, newScale)));
//   };

//   const handleDragStart = (e) => {
//     e.stopPropagation();
//     setDragging(true);
//     dragStart.current = {
//       x: e.clientX,
//       y: e.clientY,
//       position: [...position],
//     };
//   };

//   const handleDragMove = (e) => {
//     if (!dragging) return;
//     e.stopPropagation();
    
//     const deltaX = (e.clientX - dragStart.current.x) * 0.01;
//     const deltaY = (e.clientY - dragStart.current.y) * -0.01;
    
//     setPosition([
//       dragStart.current.position[0] + deltaX,
//       dragStart.current.position[1] + deltaY,
//       position[2]
//     ]);
//   };

//   const handleDragEnd = (e) => {
//     e.stopPropagation();
//     setDragging(false);
//   };

//   // Calcula as proporções da imagem
//   const aspectRatio = imageData.width / imageData.height || 1;
//   const width = 2 * scale;
//   const height = width / aspectRatio;

//   return (
//     <group 
//       ref={groupRef}
//       position={position}
//       rotation={rotation}
//       onPointerOver={handlePointerOver}
//       onPointerOut={handlePointerOut}
//       onPointerEnter={handlePointerEnter}
//       onPointerLeave={handlePointerLeave}
//       onWheel={handleWheel}
//       onPointerDown={handleDragStart}
//       onPointerMove={handleDragMove}
//       onPointerUp={handleDragEnd}
//     >
//       {/* Moldura da imagem */}
//       <mesh 
//         position={[0, 0, -0.01]} 
//         scale={[width + 0.1, height + 0.1, 0.01]}
//         onPointerOver={handlePointerOver}
//         onPointerOut={handlePointerOut}
//         onPointerEnter={handlePointerEnter}
//         onPointerLeave={handlePointerLeave}
//       >
//         <boxGeometry args={[1, 1, 1]} />
//         <meshStandardMaterial color={hovered ? "#3b82f6" : "#9CA3AF"} />
//       </mesh>
      
//       {/* Plano para a imagem */}
//       <mesh 
//         position={[0, 0, 0]} 
//         scale={[width, height, 0.01]}
//         onPointerOver={handlePointerOver}
//         onPointerOut={handlePointerOut}
//         onPointerEnter={handlePointerEnter}
//         onPointerLeave={handlePointerLeave}
//       >
//         <boxGeometry args={[1, 1, 0.1]} />
//         <meshStandardMaterial color="#FFFFFF" />
//       </mesh>
      
//       {/* A imagem em si usando Html do drei */}
//       <Html
//         transform
//         scale={0.01}
//         position={[0, 0, 0.06]}
//         style={{ 
//           width: `${width * 100}px`, 
//           height: `${height * 100}px`,
//           pointerEvents: 'none'
//         }}
//       >
//         <div 
//           style={{ 
//             width: '100%', 
//             height: '100%', 
//             display: 'flex', 
//             alignItems: 'center', 
//             justifyContent: 'center',
//             overflow: 'hidden'
//           }}
//         >
//           <img 
//             src={imageData.src} 
//             alt={imageData.alt || 'Image in 3D scene'} 
//             style={{ 
//               maxWidth: '100%', 
//               maxHeight: '100%', 
//               objectFit: 'contain',
//               pointerEvents: 'none',
//               filter: removeBg ? 'grayscale(1) contrast(1.2) brightness(1.1)' : 'none'
//             }} 
//           />
//         </div>
//       </Html>
      
//       {/* Controls Panel */}
//       {hovered && (
//         <Html
//           transform
//           scale={0.01}
//           position={[0, height/1.8, 0.06]}
//           style={{ 
//             backgroundColor: 'rgba(0,0,0,0.7)', 
//             padding: '8px',
//             borderRadius: '4px',
//             color: 'white',
//             whiteSpace: 'nowrap',
//             display: 'flex',
//             gap: '8px',
//             alignItems: 'center',
//             pointerEvents: 'auto'
//           }}
//         >
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setRotation([rotation[0], rotation[1] + Math.PI/2, rotation[2]]);
//             }}
//             style={controlButtonStyle}
//           >
//             🔄
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setScale(Math.min(scale + 0.1, 3));
//             }}
//             style={controlButtonStyle}
//           >
//             ➕
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setScale(Math.max(scale - 0.1, 0.1));
//             }}
//             style={controlButtonStyle}
//           >
//             ➖
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setRemoveBg(!removeBg);
//             }}
//             style={{
//               ...controlButtonStyle,
//               backgroundColor: removeBg ? '#3b82f6' : 'transparent'
//             }}
//           >
//             🎨
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onRemove();
//             }}
//             style={controlButtonStyle}
//           >
//             ❌
//           </button>
//         </Html>
//       )}

//       {/* Image Info */}
//       {hovered && (
//         <Html
//           transform
//           scale={0.01}
//           position={[0, -height/1.8, 0.06]}
//           style={{ 
//             backgroundColor: 'rgba(0,0,0,0.7)', 
//             padding: '4px 8px',
//             borderRadius: '4px',
//             color: 'white',
//             whiteSpace: 'nowrap',
//             pointerEvents: 'none'
//           }}
//         >
//           {imageData.alt || imageData.title || 'Image'}
//           {imageData.fromUrl && (
//             <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
//               From: {imageData.fromUrl.substring(0, 30)}...
//             </div>
//           )}
//         </Html>
//       )}
//     </group>
//   );
// }

// const controlButtonStyle = {
//   background: 'transparent',
//   border: '1px solid white',
//   borderRadius: '4px',
//   color: 'white',
//   padding: '4px 8px',
//   cursor: 'pointer',
//   fontSize: '14px',
//   transition: 'background-color 0.2s',
//   ':hover': {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)'
//   }
// };

// export default ImageInScene; 