import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  // Cores padrão
  floorColor: "#6366f1",
  gridColor: "#818cf8", 
  backgroundColor: "#000000",
  floorPlaneColor: "#191f2a80", // Nova cor para o plano do chão, com transparência
  
  // Opacidades (0-100)
  floorOpacity: 100,
  gridOpacity: 100,
  backgroundOpacity: 100,
  floorPlaneOpacity: 50, // Opacidade padrão para o plano do chão
  
  // Funções para atualizar cores
  setFloorColor: (color) => set({ floorColor: color }),
  setGridColor: (color) => set({ gridColor: color }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setFloorPlaneColor: (color) => set({ floorPlaneColor: color }),
  
  // Funções para atualizar opacidades
  setFloorOpacity: (opacity) => set({ floorOpacity: opacity }),
  setGridOpacity: (opacity) => set({ gridOpacity: opacity }),
  setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
  setFloorPlaneOpacity: (opacity) => set({ floorPlaneOpacity: opacity }),
  
  // Funções para aplicar cor com opacidade
  getColorWithOpacity: (color, opacity) => {
    if (!color) return '';
    
    // Se já for uma cor com alpha (rgba, hsla), extrai os componentes e define o alpha
    if (color.includes('rgba')) {
      return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${opacity/100})`);
    } else if (color.includes('rgb')) {
      return color.replace(/rgb\(([^)]+)\)/, `rgba($1,${opacity/100})`);
    } else if (color.includes('hsla')) {
      return color.replace(/hsla\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `hsla($1,$2,$3,${opacity/100})`);
    } else if (color.includes('hsl')) {
      return color.replace(/hsl\(([^)]+)\)/, `hsla($1,${opacity/100})`);
    }
    
    // Para cores hex
    if (color.startsWith('#')) {
      // Converte hex para rgba
      let r = 0, g = 0, b = 0;
      
      if (color.length === 4) {
        // #RGB format
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else if (color.length === 7) {
        // #RRGGBB format
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
      }
      
      return `rgba(${r}, ${g}, ${b}, ${opacity/100})`;
    }
    
    return color;
  },
  
  // Função para resetar cores para o padrão
  resetColors: () => set({ 
    floorColor: "#6366f1", 
    gridColor: "#818cf8", 
    backgroundColor: "#000000",
    floorPlaneColor: "#191f2a80",
    floorOpacity: 100,
    gridOpacity: 100,
    backgroundOpacity: 100,
    floorPlaneOpacity: 50
  }),
})); 