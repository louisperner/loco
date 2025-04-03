import { create } from 'zustand';
import { StoreImageData, StoreVideoData } from '@/components/Models/types';
import { PrimitiveModelData } from '@/components/Models/types';

// Default sample images and videos for texture selection
const defaultImages: StoreImageData[] = [
  {
    id: 'default-image-1',
    fileName: 'defaultTexture1.jpg',
    thumbnailUrl: 'https://placehold.co/200x200/222222/4ade80?text=Texture+1',
    url: 'https://placehold.co/512x512/222222/4ade80?text=Texture+1'
  },
  {
    id: 'default-image-2',
    fileName: 'defaultTexture2.jpg',
    thumbnailUrl: 'https://placehold.co/200x200/222222/2dd4bf?text=Texture+2',
    url: 'https://placehold.co/512x512/222222/2dd4bf?text=Texture+2'
  },
  {
    id: 'default-image-3',
    fileName: 'defaultTexture3.jpg',
    thumbnailUrl: 'https://placehold.co/200x200/222222/a78bfa?text=Texture+3',
    url: 'https://placehold.co/512x512/222222/a78bfa?text=Texture+3'
  }
];

const defaultVideos: StoreVideoData[] = [
  {
    id: 'default-video-1',
    fileName: 'defaultVideo1.mp4',
    thumbnailUrl: 'https://placehold.co/200x200/222222/4ade80?text=Video+1',
    url: 'https://placehold.co/512x512/222222/4ade80?text=Video+1'
  }
];

interface StoreState {
  images: StoreImageData[];
  videos: StoreVideoData[];
  primitiveModels: PrimitiveModelData[];
  setImages: (images: StoreImageData[]) => void;
  setVideos: (videos: StoreVideoData[]) => void;
  addImage: (image: StoreImageData) => void;
  addVideo: (video: StoreVideoData) => void;
  addPrimitiveModel: (model: PrimitiveModelData) => void;
  removeImage: (id: string) => void;
  removeVideo: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  images: defaultImages,
  videos: defaultVideos,
  primitiveModels: [],
  setImages: (images: StoreImageData[]) => set({ images }),
  setVideos: (videos: StoreVideoData[]) => set({ videos }),
  addImage: (image: StoreImageData) => set((state) => ({ images: [...state.images, image] })),
  addVideo: (video: StoreVideoData) => set((state) => ({ videos: [...state.videos, video] })),
  addPrimitiveModel: (model: PrimitiveModelData) => set((state) => ({ 
    primitiveModels: [...state.primitiveModels, model] 
  })),
  removeImage: (id: string) => set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
  removeVideo: (id: string) => set((state) => ({ videos: state.videos.filter((vid) => vid.id !== id) })),
})); 