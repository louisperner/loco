import { create } from 'zustand';

interface CodeState {
  code: string;
  transpiledCode: string;
  components: string;
  updateCode: (code: string) => void;
  updateTranspiledCode: (transpiledCode: string) => void;
  updateComponents: (components: string) => void;
}

export const useCodeStore = create<CodeState>((set) => ({
  code: '',
  transpiledCode: '',
  components: '',
  updateCode: (code: string) => set(() => ({ code: code })),
  updateTranspiledCode: (transpiledCode: string) => set(() => ({ transpiledCode: transpiledCode })),
  updateComponents: (components: string) => set(() => ({ components: components })),
})); 