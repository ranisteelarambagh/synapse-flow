import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RightTab = 'inspector' | 'debugger' | 'comments';
export type MobileTab = 'canvas' | 'nodes' | 'inspector' | 'terminal';
export type MobileDrawer = 'none' | 'left' | 'right';

interface UIStore {
  // Desktop panels
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  activeRightTab: RightTab;
  commandPaletteOpen: boolean;

  // Mobile / responsive
  mobileDrawer: MobileDrawer;
  activeMobileTab: MobileTab;
  showShortcuts: boolean;
  showStats: boolean;
  canvasSearchOpen: boolean;
  canvasSearchQuery: string;

  // Actions — desktop
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setActiveRightTab: (tab: RightTab) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;

  // Actions — mobile/global
  setMobileDrawer: (d: MobileDrawer) => void;
  setActiveMobileTab: (t: MobileTab) => void;
  toggleShortcuts: () => void;
  setShowStats: (v: boolean) => void;
  setCanvasSearchOpen: (v: boolean) => void;
  setCanvasSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      leftPanelOpen: true,
      rightPanelOpen: true,
      bottomPanelOpen: false,
      activeRightTab: 'inspector',
      commandPaletteOpen: false,
      mobileDrawer: 'none',
      activeMobileTab: 'canvas',
      showShortcuts: false,
      showStats: true,
      canvasSearchOpen: false,
      canvasSearchQuery: '',

      toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
      setActiveRightTab: (tab) => set({ activeRightTab: tab }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
      setMobileDrawer: (d) => set({ mobileDrawer: d }),
      setActiveMobileTab: (t) => set({ activeMobileTab: t }),
      toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),
      setShowStats: (v) => set({ showStats: v }),
      setCanvasSearchOpen: (v) => set({ canvasSearchOpen: v, canvasSearchQuery: v ? '' : '' }),
      setCanvasSearchQuery: (q) => set({ canvasSearchQuery: q }),
    }),
    {
      name: 'synapse-ui',
      partialize: (state) => ({
        leftPanelOpen: state.leftPanelOpen,
        rightPanelOpen: state.rightPanelOpen,
        bottomPanelOpen: state.bottomPanelOpen,
        activeRightTab: state.activeRightTab,
        showStats: state.showStats,
      }),
    }
  )
);
