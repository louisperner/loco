import { create, StateCreator } from 'zustand';
import { StoreImageData, StoreVideoData } from '@/components/Models/types';

interface StoreState {
  images: StoreImageData[];
  videos: StoreVideoData[];
  setImages: (images: StoreImageData[]) => void;
  setVideos: (videos: StoreVideoData[]) => void;
  addImage: (image: StoreImageData) => void;
  addVideo: (video: StoreVideoData) => void;
  removeImage: (id: string) => void;
  removeVideo: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  images: [],
  videos: [],
  setImages: (images: StoreImageData[]) => set({ images }),
  setVideos: (videos: StoreVideoData[]) => set({ videos }),
  addImage: (image: StoreImageData) => set((state) => ({ images: [...state.images, image] })),
  addVideo: (video: StoreVideoData) => set((state) => ({ videos: [...state.videos, video] })),
  removeImage: (id: string) => set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
  removeVideo: (id: string) => set((state) => ({ videos: state.videos.filter((vid) => vid.id !== id) })),
})); 