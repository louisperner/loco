import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, TransformControls } from '@react-three/drei';
import { InternalVideoProps, TransformMode, VideoInSceneProps } from './types';
import { processVideoUrl, revokeBlobUrl } from './utils';
// Import the same icons used in ImageCloneManager
import { BiSolidCameraHome } from 'react-icons/bi';
import { FaExpand, FaCompress, FaArrowsAlt, FaPlay, FaPause } from 'react-icons/fa';
import { MdDelete, MdLoop } from 'react-icons/md';
import { BsArrowsMove } from 'react-icons/bs';
import { TbRotate360 } from 'react-icons/tb';
import { BiReset } from 'react-icons/bi';
import { TbVolume, TbVolumeOff } from 'react-icons/tb';

// Internal video component for handling the actual video display
const InternalVideo: React.FC<InternalVideoProps> = ({ 
  src, 
  isPlaying = true, 
  volume = 0.5, 
  loop = true, 
  onLoad
}) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTexture = useRef<THREE.VideoTexture | null>(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  const [videoAspect, setVideoAspect] = useState<number>(16/9); // Default 16:9 aspect ratio
  const playStateRef = useRef<boolean>(isPlaying);
  
  // Update ref when props change to avoid stale closures
  useEffect(() => {
    playStateRef.current = isPlaying;
  }, [isPlaying]);
  
  // Load the video with proper URL processing
  useEffect(() => {
    let isMounted = true;
    
    const loadVideo = async () => {
      try {
        console.log('Processing video URL:', src);
        const processedUrl = await processVideoUrl(src);
        console.log('Processed video URL:', processedUrl);
        if (isMounted && processedUrl) {
          setVideoSrc(processedUrl);
        }
      } catch (error) {
        console.error('Error processing video URL:', error);
        if (isMounted && src) {
          setVideoSrc(src);
        }
      }
    };
    
    loadVideo();
    
    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (videoTexture.current) {
        videoTexture.current.dispose();
      }
      if (videoSrc !== src && videoSrc.startsWith('blob:')) {
        try {
          revokeBlobUrl(videoSrc, src);
        } catch (error) {
          console.error('Error revoking video blob URL:', error);
        }
      }
    };
  }, [src]);
  
  // Create the video element and texture
  useEffect(() => {
    if (!videoSrc) return;
    
    console.log('Creating video element with source:', videoSrc);
    
    // Clean up previous video/texture if they exist
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
    }
    
    if (videoTexture.current) {
      videoTexture.current.dispose();
      videoTexture.current = null;
    }
    
    // Create new video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = loop;
    video.muted = volume === 0;
    video.volume = volume;
    video.playsInline = true;
    
    // Handle events first before setting src
    const handleMetadata = () => {
      console.log('Video metadata loaded:', video.videoWidth, video.videoHeight);
      if (video.videoWidth && video.videoHeight) {
        const aspect = video.videoWidth / video.videoHeight;
        setVideoAspect(aspect);
      }
    };
    
    const handleCanPlay = () => {
      console.log('Video can play, creating texture');
      
      // Create texture
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      
      videoTexture.current = texture;
      setTextureLoaded(true);
      
      if (onLoad) {
        onLoad(video);
      }
      
      // Play video if needed - use a timeout to avoid race conditions
      if (playStateRef.current) {
        setTimeout(() => {
          if (playStateRef.current && video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => {
                if (e.name !== 'AbortError') {
                  console.error('Error playing video:', e);
                }
              });
            }
          }
        }, 50);
      }
    };
    
    const handleError = (e: Event) => {
      console.error('Error loading video:', video.error, e);
    };
    
    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    // Save the video element reference
    videoRef.current = video;
    
    // Set src and load
    video.src = videoSrc;
    video.load();
    
    return () => {
      // Remove event listeners
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      
      // Cleanup
      video.pause();
      video.src = '';
      video.load();
      
      if (videoTexture.current) {
        videoTexture.current.dispose();
        videoTexture.current = null;
      }
    };
  }, [videoSrc, loop, volume, onLoad]);
  
  // Handle changes to isPlaying
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      console.log('Attempting to play video');
      
      // Use timeout to avoid race conditions with creation/loading
      setTimeout(() => {
        if (videoRef.current && videoRef.current.paused) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              if (e.name !== 'AbortError') {
                console.error('Error playing video:', e);
              }
            });
          }
        }
      }, 50);
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);
  
  // Control volume when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
    }
  }, [volume]);
  
  // Handle loop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = loop;
    }
  }, [loop]);
  
  return (
    <>
      {textureLoaded && videoTexture.current && (
        <mesh>
          <planeGeometry args={[1, 1/videoAspect]} />
          <meshBasicMaterial map={videoTexture.current} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
};

// Style constants to match ImageInScene
const iconButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '4px',
  backgroundColor: '#444',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
};

const VideoInScene: React.FC<VideoInSceneProps> = ({ videoData, onRemove, onUpdate, onSelect }) => {
  const { 
    src, 
    position = [0, 0, -2],
    rotation = [0, 0, 0],
    lookAtUser: initialLookAtUser = false,
    isPlaying: initialIsPlaying = true,
    volume: initialVolume = 0.5,
    loop: initialLoop = true,
    scale: initialScale = 1,
  } = videoData;

  const [lookAtUser, setLookAtUser] = useState<boolean>(initialLookAtUser);
  const [isPlaying, setIsPlaying] = useState<boolean>(initialIsPlaying);
  const [volume, setVolume] = useState<number>(initialVolume);
  const [loop, setLoop] = useState<boolean>(initialLoop);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [scale, setScale] = useState<number>(initialScale);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (lookAtUser && groupRef.current && camera) {
      const updateRotation = () => {
        if (groupRef.current && camera) {
          groupRef.current.lookAt(camera.position);
        }
      };
      
      updateRotation();
      return () => {};
    }
    return undefined;
  }, [camera, lookAtUser, position]);

  // Function to save changes
  const saveChanges = (changes: Partial<typeof videoData>): void => {
    if (groupRef.current) {
      // Convert Vector3 and Euler to arrays
      const currentPosition: [number, number, number] = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z
      ];
      const currentRotation: [number, number, number] = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ];

      const updatedData = {
        ...videoData,
        ...changes,
        position: currentPosition,
        rotation: currentRotation,
        scale,
      };
      onUpdate(updatedData);
    }
  };

  // Handlers with automatic saving
  const handleLookAtUser = (value: boolean): void => {
    setLookAtUser(value);
    saveChanges({ lookAtUser: value });
  };

  const handlePlayPause = (): void => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    saveChanges({ isPlaying: newIsPlaying });
  };

  const handleVolumeChange = (newVolume: number): void => {
    setVolume(newVolume);
    saveChanges({ volume: newVolume });
  };

  const handleLoopToggle = (): void => {
    const newLoop = !loop;
    setLoop(newLoop);
    saveChanges({ loop: newLoop });
  };

  const handleScale = (increase: boolean): void => {
    const newScale = increase ? scale * 1.2 : scale / 1.2;
    setScale(newScale);
    saveChanges({ scale: newScale });
  };

  // Save position and rotation when changed via TransformControls
  useEffect(() => {
    if (groupRef.current && showControls) {
      const controls = document.querySelector('.transform-controls');
      
      const handleChange = (): void => {
        if (groupRef.current) {
          const newPosition: [number, number, number] = [
            groupRef.current.position.x,
            groupRef.current.position.y,
            groupRef.current.position.z
          ];
          const newRotation: [number, number, number] = [
            groupRef.current.rotation.x,
            groupRef.current.rotation.y,
            groupRef.current.rotation.z
          ];
          
          const updatedData = {
            ...videoData,
            position: newPosition,
            rotation: newRotation,
            scale
          };
          
          onUpdate(updatedData);
        }
      };

      // Add listeners for TransformControls events
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
    
    return undefined;
  }, [showControls, videoData, scale, onUpdate]);

  // Update position and rotation in useFrame to ensure synchronization
  useFrame((): null => {
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
      
      if (JSON.stringify(newRotation) !== JSON.stringify(videoData.rotation)) {
        onUpdate({
          ...videoData,
          rotation: newRotation
        });
      }
    }
    return null; // Return a value to satisfy TypeScript
  });

  const handleClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    if (onSelect) {
      onSelect({ ...videoData, type: 'video' });
    }
  };

  // Add context menu handler for right-click deletion
  const handleContextMenu = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    e.nativeEvent.preventDefault();
    
    // Dispatch removeObject event for right-click deletion
    const removeEvent = new CustomEvent('removeObject', {
      detail: {
        type: 'video',
        id: videoData.id
      }
    });
    window.dispatchEvent(removeEvent);
  };

  // Updated Control Panel to match ImageInScene style
  const ControlPanel: React.FC = () => (
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
        onClick={handlePlayPause}
        style={{
          ...iconButtonStyle,
          backgroundColor: isPlaying ? '#4a90e2' : '#444',
        }}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
      </button>

      <button 
        onClick={() => handleLoopToggle()}
        style={{
          ...iconButtonStyle,
          backgroundColor: loop ? '#4a90e2' : '#444',
        }}
        title="Loop video"
      >
        <MdLoop size={16} />
      </button>

      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          style={{
            ...iconButtonStyle,
            backgroundColor: volume > 0 ? '#4a90e2' : '#444',
          }}
          title="Volume"
        >
          {volume > 0 ? <TbVolume size={16} /> : <TbVolumeOff size={16} />}
        </button>
        
        {showVolumeSlider && (
          <div style={{
            position: 'absolute',
            bottom: '38px',
            left: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              style={{ width: '80px', height: '20px' }}
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => handleLookAtUser(!lookAtUser)}
        style={{
          ...iconButtonStyle,
          backgroundColor: lookAtUser ? '#4a90e2' : '#444',
        }}
        title="Look at user"
      >
        <BiSolidCameraHome size={16} />
      </button>
      
      <button 
        onClick={() => handleScale(true)}
        style={iconButtonStyle}
        title="Scale up"
      >
        <FaExpand size={14} />
      </button>
      
      <button 
        onClick={() => handleScale(false)}
        style={iconButtonStyle}
        title="Scale down"
      >
        <FaCompress size={14} />
      </button>
      
      <button 
        onClick={() => setShowControls(!showControls)}
        style={{
          ...iconButtonStyle,
          backgroundColor: showControls ? '#4a90e2' : '#444',
        }}
        title="Show transform controls"
      >
        <FaArrowsAlt size={14} />
      </button>
      
      {showControls && (
        <button 
          onClick={() => setTransformMode(
            transformMode === 'translate' ? 'rotate' :
            transformMode === 'rotate' ? 'scale' : 'translate'
          )}
          style={{
            ...iconButtonStyle,
            backgroundColor: '#4a90e2',
          }}
          title={`Current mode: ${transformMode}`}
        >
          {transformMode === 'translate' && <BsArrowsMove size={16} />}
          {transformMode === 'rotate' && <TbRotate360 size={16} />}
          {transformMode === 'scale' && <BiReset size={16} />}
        </button>
      )}
      
      <button 
        onClick={onRemove}
        style={{
          ...iconButtonStyle,
          backgroundColor: '#e24a4a',
        }}
        title="Delete video"
      >
        <MdDelete size={16} />
      </button>
    </div>
  );

  return (
    <>
      {showControls && groupRef.current && (
        // @ts-ignore - Using TransformControls with groupRef
        <TransformControls 
          object={groupRef.current}
          mode={transformMode}
          size={1}
          space="local"
          showX={true}
          showY={true}
          showZ={true}
          rotationSnap={Math.PI / 24}
          translationSnap={0.5}
          onObjectChange={() => {
            if (groupRef.current) {
              const newPosition: [number, number, number] = [
                groupRef.current.position.x,
                groupRef.current.position.y,
                groupRef.current.position.z
              ];
              const newRotation: [number, number, number] = [
                groupRef.current.rotation.x,
                groupRef.current.rotation.y,
                groupRef.current.rotation.z
              ];
              
              onUpdate({
                ...videoData,
                position: newPosition,
                rotation: newRotation,
                scale
              });
            }
          }}
        />
      )}
      <group 
        ref={groupRef} 
        position={new THREE.Vector3(...position)} 
        rotation={new THREE.Euler(...rotation)} 
        scale={scale}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        userData={{ type: 'video', id: videoData.id }}
        name={`video-${videoData.id}`}
      >
        {/* Add invisible mesh for raycasting with args relative to video size */}
        <mesh 
          name={`video-collider-${videoData.id}`} 
          position={[0, -0.2, 0]} 
        >
          <planeGeometry args={[1, 0.5625]} />
          <meshBasicMaterial 
            visible={false} 
            transparent={true} 
            opacity={0} 
            side={THREE.DoubleSide}
            alphaTest={0.5}
          />
        </mesh>
        
        <InternalVideo 
          src={src}
          isPlaying={isPlaying}
          volume={volume}
          loop={loop}
        />
        
        {isHovered && (
          <Html
            transform
            distanceFactor={1.5}
            position={[0, -0.4, 0]}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
          >
            <ControlPanel />
          </Html>
        )}
      </group>
    </>
  );
};

export default VideoInScene; 