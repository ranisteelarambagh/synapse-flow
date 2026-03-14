import { useEffect } from 'react';
import Topbar from '@/components/workspace/Topbar';
import Canvas from '@/components/workspace/Canvas';
import LeftPanel from '@/components/workspace/LeftPanel';
import RightPanel from '@/components/workspace/RightPanel';
import BottomPanel from '@/components/workspace/BottomPanel';
import CommandPalette from '@/components/workspace/CommandPalette';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';

export default function WorkspacePage() {
  const {
    leftPanelOpen, rightPanelOpen, bottomPanelOpen,
    toggleLeftPanel, toggleRightPanel, toggleBottomPanel,
  } = useUIStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          toggleBottomPanel();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleBottomPanel]);

  return (
    <div className="h-screen w-screen flex flex-col bg-syn-void overflow-hidden">
      <Topbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div
          className={cn(
            'shrink-0 border-r border-syn-border transition-all overflow-hidden',
            leftPanelOpen ? 'w-[280px]' : 'w-0'
          )}
          style={{ transitionDuration: '250ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.32, 1)' }}
        >
          <LeftPanel />
        </div>

        {/* Toggle buttons */}
        {!leftPanelOpen && (
          <button
            onClick={toggleLeftPanel}
            className="absolute left-2 top-2 z-10 p-1.5 bg-syn-surface border border-syn-border rounded-md text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
          >
            <PanelLeftClose className="w-4 h-4 rotate-180" />
          </button>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <Canvas />

          {/* Panel collapse toggles on canvas edges */}
          {leftPanelOpen && (
            <button
              onClick={toggleLeftPanel}
              className="absolute left-2 top-2 z-10 p-1.5 bg-syn-surface/80 backdrop-blur-sm border border-syn-border rounded-md text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
          {rightPanelOpen && (
            <button
              onClick={toggleRightPanel}
              className="absolute right-2 top-2 z-10 p-1.5 bg-syn-surface/80 backdrop-blur-sm border border-syn-border rounded-md text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Panel */}
        <div
          className={cn(
            'shrink-0 border-l border-syn-border transition-all overflow-hidden',
            rightPanelOpen ? 'w-[320px]' : 'w-0'
          )}
          style={{ transitionDuration: '250ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.32, 1)' }}
        >
          <RightPanel />
        </div>

        {!rightPanelOpen && (
          <button
            onClick={toggleRightPanel}
            className="absolute right-2 top-2 z-10 p-1.5 bg-syn-surface border border-syn-border rounded-md text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
          >
            <PanelRightClose className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      <BottomPanel />
      <CommandPalette />
    </div>
  );
}
