import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type RightTab = 'inspector' | 'debugger' | 'comments';

interface UIStore {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  activeRightTab: RightTab;
  commandPaletteOpen: boolean;

  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setActiveRightTab: (tab: RightTab) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      leftPanelOpen: true,
      rightPanelOpen: true,
      bottomPanelOpen: false,
      activeRightTab: 'inspector',
      commandPaletteOpen: false,

      toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
      setActiveRightTab: (tab) => set({ activeRightTab: tab }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
    }),
    {
      name: 'synapse-ui',
      partialize: (state) => ({
        leftPanelOpen: state.leftPanelOpen,
        rightPanelOpen: state.rightPanelOpen,
        bottomPanelOpen: state.bottomPanelOpen,
        activeRightTab: state.activeRightTab,
      }),
    }
  )
);
