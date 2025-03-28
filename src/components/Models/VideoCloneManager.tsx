import React, { useEffect, useRef } from 'react';
import { VideoCloneManagerProps, VideoDataType } from './types';
import VideoInScene from './VideoInScene';
import { useVideoStore } from '../../store/videoStore';

const VideoCloneManager: React.FC<VideoCloneManagerProps> = ({ onSelect }) => {
  const { videos, updateVideo } = useVideoStore();
  const initialMountRef = useRef(true);

  // When first mounting, check for any videos with undefined isInScene and set them to true
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;

      // Fix any videos with undefined isInScene values
      videos.forEach(video => {
        if (video.isInScene === undefined) {
          // console.log('Fixing video with undefined isInScene:', video.id);
          updateVideo(video.id, { isInScene: true });
        }
      });
    }
  }, [videos, updateVideo]);

  // Listen for removeObject events
  useEffect(() => {
    const handleRemoveObject = (event: CustomEvent) => {
      const { type, id } = event.detail;
      
      // When a video is removed via right-click, update its isInScene property
      if (type === 'video' && id) {
        // console.log('Received removeObject event for video:', id);
        updateVideo(id, { isInScene: false });
      }
    };

    // Add event listener for removeObject events
    window.addEventListener('removeObject', handleRemoveObject as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('removeObject', handleRemoveObject as EventListener);
    };
  }, [updateVideo]);

  // For debugging
  useEffect(() => {
    // console.log('VideoCloneManager - Current videos in store:', 
    //   videos.map(v => ({ id: v.id, isInScene: v.isInScene })));
  }, [videos]);

  // Render each video from the store
  return (
    <>
      {videos
        .filter(video => video.isInScene !== false) // Only render videos that are in scene
        .map((video: Partial<VideoDataType> & { id: string }, index: number) => {
          // console.log('Rendering video:', video.id, 'isInScene:', video.isInScene);
          // Type assertion to convert video to VideoDataType
          const typedVideo = video as unknown as VideoDataType;
          return (
            <VideoInScene 
              key={`video-${video.id || index}`} 
              videoData={typedVideo}
              onRemove={() => {
                // console.log('onRemove called for video:', video.id);
                updateVideo(video.id, { isInScene: false });
              }}
              onUpdate={(updatedData) => updateVideo(video.id, updatedData)}
              onSelect={onSelect}
            />
          );
        })}
    </>
  );
};

export default VideoCloneManager; 