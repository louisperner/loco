import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { VideoDataType } from '../components/Models/types';

// Storage key for persistence
const STORAGE_KEY = 'loco-video-store';

interface VideoStore {
  videos: Array<Partial<VideoDataType> & { id: string }>;
  addVideo: (video: Partial<VideoDataType>) => string;
  removeVideo: (id: string) => void;
  updateVideo: (id: string, data: Partial<VideoDataType>) => void;
  getVideo: (id: string) => (Partial<VideoDataType> & { id: string }) | undefined;
  clearVideos: () => void;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [],
      
      addVideo: (video) => {
        const id = video.id || uuidv4();
        const newVideo = { 
          ...video, 
          id, 
          isInScene: video.isInScene === undefined ? true : video.isInScene 
        };
        set((state) => ({
          videos: [...state.videos, newVideo]
        }));
        return id;
      },
      
      removeVideo: (id) => {
        set((state) => ({
          videos: state.videos.filter(video => video.id !== id)
        }));
      },
      
      updateVideo: (id, data) => {
        set((state) => ({
          videos: state.videos.map(video => 
            video.id === id ? { ...video, ...data } : video
          )
        }));
      },
      
      getVideo: (id) => {
        return get().videos.find(video => video.id === id);
      },
      
      clearVideos: () => {
        set({ videos: [] });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        videos: state.videos.map(video => ({
          id: video.id,
          src: video.src,
          fileName: video.fileName,
          thumbnailUrl: video.thumbnailUrl,
          position: video.position,
          rotation: video.rotation,
          scale: video.scale,
          lookAtUser: video.lookAtUser,
          isPlaying: video.isPlaying,
          volume: video.volume,
          loop: video.loop,
          isInScene: video.isInScene
        }))
      })
    }
  )
); 