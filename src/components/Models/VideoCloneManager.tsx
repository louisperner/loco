import React from 'react';
import { VideoCloneManagerProps, VideoDataType } from './types';
import VideoInScene from './VideoInScene';
import { useVideoStore } from '../../store/videoStore';

const VideoCloneManager: React.FC<VideoCloneManagerProps> = ({ onSelect }) => {
  const { videos, removeVideo, updateVideo } = useVideoStore();

  // Render each video from the store
  return (
    <>
      {videos
        .filter(video => video.isInScene !== false) // Only render videos that are in scene
        .map((video: Partial<VideoDataType> & { id: string }, index: number) => {
          // Type assertion to convert video to VideoDataType
          const typedVideo = video as unknown as VideoDataType;
          return (
            <VideoInScene 
              key={`video-${video.id || index}`} 
              videoData={typedVideo}
              onRemove={() => removeVideo(video.id)}
              onUpdate={(updatedData) => updateVideo(video.id, updatedData)}
              onSelect={onSelect}
            />
          );
        })}
    </>
  );
};

export default VideoCloneManager; 