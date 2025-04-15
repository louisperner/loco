import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

/**
 * Store para gerenciar blocos de código no espaço 3D
 */
const STORAGE_KEY = 'scene-code-blocks';

// Code block interface
export interface CodeBlock {
  id: string;
  code: string;
  fileName?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  isInScene: boolean;
  noInline?: boolean;
  language?: string;
  [key: string]: unknown;
}

// Store type
interface CodeStore {
  codeBlocks: CodeBlock[];
  
  // Actions
  addCodeBlock: (codeBlock: Partial<CodeBlock>) => string;
  removeCodeBlock: (id: string) => void;
  updateCodeBlock: (id: string, data: Partial<CodeBlock>) => void;
  getCodeBlock: (id: string) => CodeBlock | undefined;
  clearCodeBlocks: () => void;
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      codeBlocks: [],
      
      addCodeBlock: (codeBlock) => {
        const id = codeBlock.id || uuidv4();
        const newCodeBlock = { 
          ...codeBlock, 
          id,
          code: codeBlock.code || '// Write your code here\nconst greeting = "Hello, World!";\nrender(<div>{greeting}</div>);',
          position: codeBlock.position || [0, 1, 0],
          rotation: codeBlock.rotation || [0, 0, 0],
          scale: codeBlock.scale || 1,
          noInline: codeBlock.noInline !== undefined ? codeBlock.noInline : true,
          language: codeBlock.language || 'jsx',
          isInScene: codeBlock.isInScene !== undefined ? codeBlock.isInScene : true
        } as CodeBlock;
        
        set((state) => ({
          codeBlocks: [...state.codeBlocks, newCodeBlock]
        }));
        
        return id;
      },
      
      removeCodeBlock: (id) => {
        set((state) => ({
          codeBlocks: state.codeBlocks.filter(codeBlock => codeBlock.id !== id)
        }));
      },
      
      updateCodeBlock: (id, data) => {
        set((state) => ({
          codeBlocks: state.codeBlocks.map(codeBlock => 
            codeBlock.id === id ? { ...codeBlock, ...data } : codeBlock
          )
        }));
      },
      
      getCodeBlock: (id) => {
        return get().codeBlocks.find(codeBlock => codeBlock.id === id);
      },
      
      clearCodeBlocks: () => {
        set({ codeBlocks: [] });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        codeBlocks: state.codeBlocks.map(codeBlock => ({
          id: codeBlock.id,
          code: codeBlock.code,
          fileName: codeBlock.fileName,
          position: codeBlock.position,
          rotation: codeBlock.rotation,
          scale: codeBlock.scale,
          isInScene: codeBlock.isInScene,
          noInline: codeBlock.noInline,
          language: codeBlock.language
        }))
      })
    }
  )
); 