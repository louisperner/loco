import { create } from 'zustand';

interface PageState {
  page: string;
  updatePage: (page: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  page: 'play',
  updatePage: (page: string) => set(() => ({ page: page })),
})); 