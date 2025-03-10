import { create } from 'zustand';

export const useCodeStore = create((set) => ({
  code: '',
  transpiledCode: '',
  components: '',
  updateCode: (code) => set(() => ({ code: code })),
  updateTranspiledCode: (transpiledCode) => set(() => ({ transpiledCode: transpiledCode })),
  updateComponents: (components) => set(() => ({ components: components })),
}));
