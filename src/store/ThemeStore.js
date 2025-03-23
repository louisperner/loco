import { create } from 'zustand';

// Chave para armazenar no localStorage
const STORAGE_KEY = 'theme-colors';

// Valores padrão em formato rgba
const defaultTheme = {
  gridColor: "rgba(0, 0, 0, 1)", 
  backgroundColor: "rgba(0, 0, 0, 1)",
  floorPlaneColor: "rgba(50, 0, 77, 1)",
  gridOpacity: 40,
  backgroundOpacity: 100,
  floorPlaneOpacity: 50,
  groundSize: 30,
  isGroundInfinite: false,
  
  // Sky settings
  skyVisible: true,
  skyDistance: 450000,
  skySunPosition: [0, 1, 0],
  skyInclination: 0,
  skyAzimuth: 0.25,
  skyTurbidity: 10,
  skyRayleigh: 2,
  skyOpacity: 1,
  
  // Stars settings
  starsVisible: true,
  starsRadius: 100,
  starsDepth: 50,
  starsCount: 5000,
  starsFactor: 4,
  starsSaturation: 0,
  starsFade: true
};

// Carregar cores salvas do localStorage ou usar valores padrão
const loadSavedTheme = () => {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (!savedTheme) return defaultTheme;
    
    const parsedTheme = JSON.parse(savedTheme);
    // Merge com defaultTheme para garantir que todas as propriedades existam
    return { ...defaultTheme, ...parsedTheme };
  } catch (error) {
    console.error('Error loading saved theme:', error);
    return defaultTheme;
  }
};

// Carrega o tema salvo ou usa o padrão
const initialState = loadSavedTheme();

export const useThemeStore = create((set) => ({
  // Inicializa com o tema salvo ou o padrão
  ...initialState,
  
  // Funções para atualizar cores com persistência
  setGridColor: (color) => set(state => {
    const newState = { ...state, gridColor: color };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),

  setBackgroundColor: (color) => set(state => {
    const newState = { ...state, backgroundColor: color };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),

  setFloorPlaneColor: (color) => set(state => {
    const newState = { ...state, floorPlaneColor: color };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),
  
  // Funções para atualizar opacidades com persistência
  setGridOpacity: (opacity) => set(state => {
    const newState = { ...state, gridOpacity: opacity };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),

  setBackgroundOpacity: (opacity) => set(state => {
    const newState = { ...state, backgroundOpacity: opacity };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),

  setFloorPlaneOpacity: (opacity) => set(state => {
    const newState = { ...state, floorPlaneOpacity: opacity };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),
  
  // Funções para ajustar o tamanho do ground e modo infinito
  setGroundSize: (size) => set(state => {
    const newState = { ...state, groundSize: size };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),
  
  setGroundInfinite: (isInfinite) => set(state => {
    const newState = { ...state, isGroundInfinite: isInfinite };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),
  
  // Função para resetar as cores para o padrão
  resetColors: () => set(state => {
    const newState = { ...state, ...defaultTheme };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),
  
  // Generic function to update any theme property
  setTheme: (themeUpdate) => set(state => {
    const newState = { ...state, ...themeUpdate };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  }),
  
  // Funções para aplicar cor com opacidade
  getColorWithOpacity: (color, opacity) => {
    if (!color) return 'rgba(0, 0, 0, 0)';
    
    // Se for transparente, retorna com a opacidade desejada
    if (color === 'transparent') {
      return `rgba(0, 0, 0, 0)`;
    }
    
    // Se já for uma cor com alpha (rgba)
    if (color.includes('rgba')) {
      return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${opacity/100})`);
    }
    
    // Para outras cores, assumir que é uma string rgba válida e retornar com opacity ajustada
    try {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return `rgba(${r}, ${g}, ${b}, ${opacity/100})`;
      }
      
      // Se não for rgba, tentar tratar como hex
      if (color.startsWith('#')) {
        let r = 0, g = 0, b = 0;
        
        if (color.length === 4) {
          // #RGB format
          r = parseInt(color[1] + color[1], 16);
          g = parseInt(color[2] + color[2], 16);
          b = parseInt(color[3] + color[3], 16);
        } else if (color.length >= 7) {
          // #RRGGBB format
          r = parseInt(color.substring(1, 3), 16);
          g = parseInt(color.substring(3, 5), 16);
          b = parseInt(color.substring(5, 7), 16);
        }
        
        return `rgba(${r}, ${g}, ${b}, ${opacity/100})`;
      }
    } catch (e) {
      console.error('Error parsing color:', e);
      return color;
    }
    
    return color;
  }
})); 