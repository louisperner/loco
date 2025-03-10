import { create } from 'zustand';

export const usePageStore = create((set) => ({
  page: 'play',
  updatePage: (page) => set(() => ({ page: page })),
}));
