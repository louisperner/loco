import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';

// Types
export interface WebFrame {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  originalPosition: [number, number, number];
  originalRotation: [number, number, number];
}

export interface CrosshairSettings {
  visible: boolean;
  size: number;
  color: string;
  thickness: number;
  style: string;
}

export interface VisibilitySettings {
  floorVisible: boolean;
  gridVisible: boolean;
  floorPlaneVisible: boolean;
  backgroundVisible: boolean;
  minimapVisible: boolean;
}

export interface EnvironmentSettings {
  skyVisible: boolean;
  skyDistance: number;
  skySunPosition: [number, number, number];
  skyInclination: number;
  skyAzimuth: number;
  skyTurbidity: number;
  skyRayleigh: number;
  skyOpacity: number;
  starsVisible: boolean;
  starsRadius: number;
  starsDepth: number;
  starsCount: number;
  starsFactor: number;
  starsSaturation: number;
  starsFade: boolean;
}

export interface HotbarItem {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface HotbarContextType {
  selectedHotbarItem: HotbarItem | null;
  setSelectedHotbarItem: (item: HotbarItem | null) => void;
}

// Create a context for the hotbar selection
export const HotbarContext = React.createContext<HotbarContextType>({
  selectedHotbarItem: null,
  setSelectedHotbarItem: () => {},
});

interface GameState {
  // UI States
  uiVisible: boolean;
  showCatalog: boolean;
  showHelp: boolean;
  showSettings: boolean;
  showInventory: boolean;
  isSpotlightOpen: boolean;
  showDrawingOverlay: boolean;

  // Mode states
  currentMode: string;
  movementEnabled: boolean;
  viewMode: string;

  // Frame states
  frames: WebFrame[];
  selectedFrame: number | null;
  pendingWebsiteUrl: string | null;

  // Preview states
  showPreview: boolean;
  confirmedPosition: [number, number, number] | null;
  confirmedRotation: [number, number, number] | null;

  // Settings states
  activeTab: string;
  isResetAnimating: boolean;
  colorChanged: string | null;
  canvasInteractive: boolean;
  showColorPicker: string | null;
  selectedTheme: string | null;

  // Hotbar states
  selectedHotbarItem: HotbarItem | null;

  // Visibility states
  visibilitySettings: VisibilitySettings;

  // Crosshair states
  crosshairSettings: CrosshairSettings;

  // Ground states
  gravityEnabled: boolean;
  groundShape: string;

  // Environment settings
  environmentSettings: EnvironmentSettings;

  // Show coordinates
  showCoordinates: boolean;

  // Actions
  setUiVisible: (visible: boolean) => void;
  setShowCatalog: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowInventory: (show: boolean) => void;
  setIsSpotlightOpen: (isOpen: boolean) => void;

  setCurrentMode: (mode: string) => void;
  setMovementEnabled: (enabled: boolean) => void;

  setFrames: (frames: WebFrame[]) => void;
  addFrame: (url: string, position?: [number, number, number], rotation?: [number, number, number]) => void;
  removeFrame: (frameId: number) => void;
  restoreFramePosition: (frameId: number) => void;
  updateFrameUrl: (frameId: number, newUrl: string) => void;
  setSelectedFrame: (frameId: number | null) => void;
  setPendingWebsiteUrl: (url: string | null) => void;

  setShowPreview: (show: boolean) => void;
  setConfirmedPosition: (position: [number, number, number] | null) => void;
  setConfirmedRotation: (rotation: [number, number, number] | null) => void;

  setActiveTab: (tab: string) => void;
  setIsResetAnimating: (isAnimating: boolean) => void;
  setColorChanged: (type: string | null) => void;
  setCanvasInteractive: (interactive: boolean) => void;
  setShowColorPicker: (type: string | null) => void;
  setSelectedTheme: (theme: string | null) => void;

  setSelectedHotbarItem: (item: HotbarItem | null) => void;

  setVisibilitySetting: (setting: keyof VisibilitySettings, value: boolean) => void;

  setCrosshairSetting: <K extends keyof CrosshairSettings>(setting: K, value: CrosshairSettings[K]) => void;

  setGravityEnabled: (enabled: boolean) => void;
  setGroundShape: (shape: string) => void;

  setEnvironmentSetting: <K extends keyof EnvironmentSettings>(setting: K, value: EnvironmentSettings[K]) => void;

  // Complex actions
  handleModeChange: (mode: string) => void;
  handleToggleHelp: () => void;
  handleCancel: () => void;
  handlePositionConfirm: (position: [number, number, number], rotation: [number, number, number]) => void;
  handleSpotlightVisibility: (isVisible: boolean) => void;

  // Adicionar esta nova ação
  resetCrosshairAndVisibilitySettings: () => void;

  // Show coordinates
  setShowCoordinates: (show: boolean) => void;

  // Drawing overlay actions
  setShowDrawingOverlay: (show: boolean) => void;
}

// Add the missing interface
type GameStateActions = Pick<
  GameState,
  | 'setUiVisible'
  | 'setShowCatalog'
  | 'setShowHelp'
  | 'setShowSettings'
  | 'setShowInventory'
  | 'setIsSpotlightOpen'
  | 'setCurrentMode'
  | 'setMovementEnabled'
  | 'setFrames'
  | 'addFrame'
  | 'removeFrame'
  | 'restoreFramePosition'
  | 'updateFrameUrl'
  | 'setSelectedFrame'
  | 'setPendingWebsiteUrl'
  | 'setShowPreview'
  | 'setConfirmedPosition'
  | 'setConfirmedRotation'
  | 'setActiveTab'
  | 'setIsResetAnimating'
  | 'setColorChanged'
  | 'setCanvasInteractive'
  | 'setShowColorPicker'
  | 'setSelectedTheme'
  | 'setSelectedHotbarItem'
  | 'setVisibilitySetting'
  | 'setCrosshairSetting'
  | 'setGravityEnabled'
  | 'setGroundShape'
  | 'setEnvironmentSetting'
  | 'handleModeChange'
  | 'handleToggleHelp'
  | 'handleCancel'
  | 'handlePositionConfirm'
  | 'handleSpotlightVisibility'
  | 'resetCrosshairAndVisibilitySettings'
  | 'setShowCoordinates'
  | 'setShowDrawingOverlay'
>;

export const useGameStore = create<GameState & GameStateActions>()(
  persist(
    (set, get) => ({
      // UI States
      uiVisible: true,
      showCatalog: false,
      showHelp: false,
      showSettings: false,
      showInventory: false,
      isSpotlightOpen: false,
      showDrawingOverlay: false,

      // Mode states
      currentMode: 'live',
      movementEnabled: true,
      viewMode: '3D',

      // Frame states
      frames: [],
      selectedFrame: null,
      pendingWebsiteUrl: null,

      // Preview states
      showPreview: false,
      confirmedPosition: null,
      confirmedRotation: null,

      // Settings states
      activeTab: 'cores',
      isResetAnimating: false,
      colorChanged: null,
      canvasInteractive: true,
      showColorPicker: null,
      selectedTheme: null,

      // Hotbar states
      selectedHotbarItem: null,

      // Visibility states
      visibilitySettings: {
        floorVisible: true,
        gridVisible: true,
        floorPlaneVisible: true,
        backgroundVisible: true,
        minimapVisible: false,
      },

      // Crosshair states
      crosshairSettings: {
        visible: true,
        size: 10,
        color: 'white',
        thickness: 2,
        style: 'circle',
      },

      // Ground states
      gravityEnabled: false,
      groundShape: 'circle',

      // Environment settings
      environmentSettings: {
        skyVisible: false,
        skyDistance: 450000,
        skySunPosition: [0, 1, 0],
        skyInclination: 0,
        skyAzimuth: 0.25,
        skyTurbidity: 10,
        skyRayleigh: 0,
        skyOpacity: 1,
        starsVisible: true,
        starsRadius: 100,
        starsDepth: 50,
        starsCount: 5000,
        starsFactor: 4,
        starsSaturation: 0,
        starsFade: true,
      },

      // Show coordinates
      showCoordinates: true,

      // Actions
      setUiVisible: (visible: boolean) => set({ uiVisible: visible }),
      setShowCatalog: (show: boolean) => set({ showCatalog: show }),
      setShowHelp: (show: boolean) => set({ showHelp: show }),
      setShowSettings: (show: boolean) => set({ showSettings: show }),
      setShowInventory: (show: boolean) => set({ showInventory: show }),
      setIsSpotlightOpen: (isOpen: boolean) => set({ isSpotlightOpen: isOpen }),

      setCurrentMode: (mode: string) => set({ currentMode: mode }),
      setMovementEnabled: (enabled: boolean) => set({ movementEnabled: enabled }),

      setFrames: (frames: WebFrame[]) => set({ frames }),
      addFrame: (url: string, position?: [number, number, number], rotation?: [number, number, number]) => {
        const { confirmedPosition, confirmedRotation, frames } = get();
        const finalPosition = position || confirmedPosition;
        const finalRotation = rotation || confirmedRotation;

        if (!finalPosition || !finalRotation) return;

        set({
          frames: [
            ...frames,
            {
              id: Date.now().toString(),
              url,
              position: finalPosition,
              rotation: finalRotation,
              originalPosition: finalPosition,
              originalRotation: finalRotation,
            },
          ],
          confirmedPosition: null,
          confirmedRotation: null,
          showPreview: false,
          pendingWebsiteUrl: null,
        });
      },
      removeFrame: (frameId: number) => {
        set((state) => ({
          frames: state.frames.filter((frame) => frame.id !== frameId.toString()),
        }));
      },
      restoreFramePosition: (frameId: number) => {
        set((state) => ({
          frames: state.frames.map((frame) => {
            if (frame.id === frameId.toString() && frame.originalPosition && frame.originalRotation) {
              return {
                ...frame,
                position: frame.originalPosition,
                rotation: frame.originalRotation,
              };
            }
            return frame;
          }),
        }));
      },
      updateFrameUrl: (frameId: number, newUrl: string) => {
        set((state) => ({
          frames: state.frames.map((frame) => (frame.id === frameId.toString() ? { ...frame, url: newUrl } : frame)),
        }));
      },
      setSelectedFrame: (frameId: number | null) => set({ selectedFrame: frameId }),
      setPendingWebsiteUrl: (url: string | null) => set({ pendingWebsiteUrl: url }),

      setShowPreview: (show: boolean) => set({ showPreview: show }),
      setConfirmedPosition: (position: [number, number, number] | null) => set({ confirmedPosition: position }),
      setConfirmedRotation: (rotation: [number, number, number] | null) => set({ confirmedRotation: rotation }),

      setActiveTab: (tab: string) => set({ activeTab: tab }),
      setIsResetAnimating: (isAnimating: boolean) => set({ isResetAnimating: isAnimating }),
      setColorChanged: (type: string | null) => set({ colorChanged: type }),
      setCanvasInteractive: (interactive: boolean) => set({ canvasInteractive: interactive }),
      setShowColorPicker: (type: string | null) => set({ showColorPicker: type }),
      setSelectedTheme: (theme: string | null) => set({ selectedTheme: theme }),

      setSelectedHotbarItem: (item: HotbarItem | null) => set({ selectedHotbarItem: item }),

      setVisibilitySetting: (setting: keyof VisibilitySettings, value: boolean) =>
        set((state) => ({
          visibilitySettings: {
            ...state.visibilitySettings,
            [setting]: value,
          },
        })),

      setCrosshairSetting: (setting: keyof CrosshairSettings, value: CrosshairSettings[typeof setting]) =>
        set((state) => ({
          crosshairSettings: {
            ...state.crosshairSettings,
            [setting]: value,
          },
        })),

      setGravityEnabled: (enabled: boolean) => set({ gravityEnabled: enabled }),
      setGroundShape: (shape: string) => set({ groundShape: shape }),

      setEnvironmentSetting: (setting: keyof EnvironmentSettings, value: EnvironmentSettings[typeof setting]) =>
        set((state) => ({
          environmentSettings: {
            ...state.environmentSettings,
            [setting]: value,
          },
        })),

      // Complex actions
      handleModeChange: (mode: string) => {
        const { pendingWebsiteUrl } = get();

        set({
          currentMode: mode,
          movementEnabled: mode === 'live',
        });

        if (mode === 'build') {
          set({
            showPreview: true,
            confirmedPosition: null,
            confirmedRotation: null,
          });
        } else {
          set({
            showPreview: false,
            confirmedPosition: null,
            confirmedRotation: null,
          });

          if (pendingWebsiteUrl) {
            set({ pendingWebsiteUrl: null });
          }
        }
      },

      handleToggleHelp: () => {
        const currentShowHelp = get().showHelp;
        set({ showHelp: !currentShowHelp });
      },

      handleCancel: () => {
        set({
          showPreview: false,
          confirmedPosition: null,
          confirmedRotation: null,
          pendingWebsiteUrl: null,
        });
      },

      handlePositionConfirm: (position: [number, number, number], rotation: [number, number, number]) => {
        const { pendingWebsiteUrl, addFrame } = get();

        set({
          confirmedPosition: position,
          confirmedRotation: rotation,
        });

        if (pendingWebsiteUrl) {
          setTimeout(() => {
            addFrame(pendingWebsiteUrl, position, rotation);
          }, 300);
        }
      },

      handleSpotlightVisibility: (isVisible: boolean) => {
        set({
          showPreview: isVisible,
          isSpotlightOpen: isVisible,
        });

        if (!isVisible) {
          set({
            confirmedPosition: null,
            confirmedRotation: null,
          });
        }
      },

      // Adicionar essa nova ação para resetar as configurações
      resetCrosshairAndVisibilitySettings: () => {
        set({
          crosshairSettings: {
            visible: true,
            size: 10,
            color: 'white',
            thickness: 2,
            style: 'circle',
          },
                visibilitySettings: {
        floorVisible: true,
        gridVisible: true,
        floorPlaneVisible: true,
        backgroundVisible: true,
        minimapVisible: false,
      },
        });
      },

      // Show coordinates
      setShowCoordinates: (show: boolean) => set({ showCoordinates: show }),

      // Drawing overlay actions
      setShowDrawingOverlay: (show: boolean) =>
        set({
          showDrawingOverlay: show,
          ...(show ? { movementEnabled: false, canvasInteractive: false } : { movementEnabled: true, canvasInteractive: true }),
        }),
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        frames: state.frames,
        gravityEnabled: state.gravityEnabled,
        groundShape: state.groundShape,
        crosshairSettings: state.crosshairSettings,
        visibilitySettings: state.visibilitySettings,
        selectedTheme: state.selectedTheme,
        environmentSettings: state.environmentSettings,
      }),
    },
  ),
);
