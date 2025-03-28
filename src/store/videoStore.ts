import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { VideoDataType } from '../components/Models/types';

interface VideoStore {
  videos: Array<Partial<VideoDataType> & { id: string }>;
  addVideo: (video: Partial<VideoDataType>) => string;
  removeVideo: (id: string) => void;
  updateVideo: (id: string, data: Partial<VideoDataType>) => void;
  getVideo: (id: string) => (Partial<VideoDataType> & { id: string }) | undefined;
  clearVideos: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [],
  
  addVideo: (video) => {
    const id = video.id || uuidv4();
    set((state) => ({
      videos: [...state.videos, { ...video, id }]
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
})); 