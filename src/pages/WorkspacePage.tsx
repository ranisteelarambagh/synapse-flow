import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Topbar from '@/components/workspace/Topbar';
import Canvas from '@/components/workspace/Canvas';
import LeftPanel from '@/components/workspace/LeftPanel';
import RightPanel from '@/components/workspace/RightPanel';
import BottomPanel from '@/components/workspace/BottomPanel';
import CommandPalette from '@/components/workspace/CommandPalette';
import MobileNav from '@/components/workspace/MobileNav';
import StatsBar from '@/components/workspace/StatsBar';
import ShortcutsPanel from '@/components/workspace/ShortcutsPanel';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspace } from '@/hooks/useWorkspace';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelRightClose, X } from 'lucide-react';

// ─── Drawer backdrop ──────────────────────────────────────────────────────────
function DrawerBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="md:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
  );
}

// ─── Panel toggle buttons on canvas ───────────────────────────────────────────
function CanvasFloatingToggles() {
  const { leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel } = useUIStore();

  return (
    <>
      {/* Left toggle */}
      <button
        onClick={toggleLeftPanel}
        className="hidden md:flex absolute left-2 top-2 z-10 w-8 h-8 items-center justify-center bg-syn-surface/90 backdrop-blur-sm border border-syn-border rounded-lg text-syn-text-muted hover:text-foreground hover:bg-syn-hover hover:border-syn-border-active transition-all shadow-sm"
        title={leftPanelOpen ? 'Close nodes panel' : 'Open nodes panel'}
      >
        <PanelLeftClose className={cn('w-3.5 h-3.5 transition-transform', !leftPanelOpen && 'rotate-180')} />
      </button>

      {/* Right toggle */}
      <button
        onClick={toggleRightPanel}
        className="hidden md:flex absolute right-2 top-2 z-10 w-8 h-8 items-center justify-center bg-syn-surface/90 backdrop-blur-sm border border-syn-border rounded-lg text-syn-text-muted hover:text-foreground hover:bg-syn-hover hover:border-syn-border-active transition-all shadow-sm"
        title={rightPanelOpen ? 'Close inspector' : 'Open inspector'}
      >
        <PanelRightClose className={cn('w-3.5 h-3.5 transition-transform', !rightPanelOpen && 'rotate-180')} />
      </button>
    </>
  );
}

// ─── Main workspace page ──────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = id || 'demo';

  const {
    leftPanelOpen, rightPanelOpen, bottomPanelOpen,
    mobileDrawer, setMobileDrawer, activeMobileTab,
    toggleBottomPanel, toggleShortcuts, setCommandPaletteOpen,
    toggleLeftPanel, toggleRightPanel,
  } = useUIStore();

  useWorkspace(workspaceId);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

    if (e.key === '`' && !e.metaKey && !e.ctrlKey && !inInput) {
      e.preventDefault();
      toggleBottomPanel();
    }
    if (e.key === '?' && !inInput) {
      e.preventDefault();
      toggleShortcuts();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
      e.preventDefault();
      toggleLeftPanel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
      e.preventDefault();
      toggleRightPanel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
    }
  }, [toggleBottomPanel, toggleShortcuts, setCommandPaletteOpen, toggleLeftPanel, toggleRightPanel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const closeMobileDrawer = useCallback(() => setMobileDrawer('none'), [setMobileDrawer]);

  // On mobile, canvas area is always full-screen — panels are drawers
  return (
    <div className="h-screen w-screen flex flex-col bg-syn-void overflow-hidden">
      {/* ── Topbar ─────────────────────────────────────────────────── */}
      <Topbar />

      {/* ── Stats bar (desktop only) ───────────────────────────────── */}
      <StatsBar />

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {/* ── Left Panel — desktop sidebar / mobile drawer ─────────── */}
        {/* Mobile drawer backdrop */}
        {mobileDrawer === 'left' && <DrawerBackdrop onClose={closeMobileDrawer} />}

        <div
          className={cn(
            'shrink-0 border-r border-syn-border overflow-hidden transition-all',
            // Desktop: collapse by width
            'hidden md:block',
            leftPanelOpen ? 'md:w-[280px]' : 'md:w-0',
          )}
          style={{ transitionDuration: '240ms', transitionTimingFunction: 'cubic-bezier(0.16,1,0.32,1)' }}
        >
          {/* Desktop content — always mounted */}
          <LeftPanel />
        </div>

        {/* Mobile drawer — slides from left */}
        <div
          className={cn(
            'md:hidden fixed top-12 bottom-16 left-0 z-[60] w-[300px] border-r border-syn-border-active overflow-hidden transition-transform',
            mobileDrawer === 'left' ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{
            background: 'hsl(var(--bg-surface))',
            transitionDuration: '260ms',
            transitionTimingFunction: 'cubic-bezier(0.16,1,0.32,1)',
          }}
        >
          <div className="flex items-center justify-between h-10 px-3 border-b border-syn-border shrink-0">
            <span className="text-[11px] font-ui uppercase tracking-widest text-syn-text-muted">Node Library</span>
            <button onClick={closeMobileDrawer} className="text-syn-text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[calc(100%-40px)] overflow-y-auto">
            <LeftPanel />
          </div>
        </div>

        {/* ── Canvas ───────────────────────────────────────────────── */}
        <div className={cn(
          'relative overflow-hidden min-h-0',
          // Mobile: full screen (panels are drawers), Desktop: flex-1
          'flex-1',
          // On mobile terminal tab, hide canvas slightly — still mount for RF
          activeMobileTab === 'terminal' ? 'md:flex-1' : 'flex-1'
        )}>
          <Canvas />
          <CanvasFloatingToggles />
        </div>

        {/* ── Right Panel — desktop sidebar / mobile drawer ────────── */}
        {mobileDrawer === 'right' && <DrawerBackdrop onClose={closeMobileDrawer} />}

        <div
          className={cn(
            'shrink-0 border-l border-syn-border overflow-hidden transition-all',
            'hidden md:block',
            rightPanelOpen ? 'md:w-[320px]' : 'md:w-0',
          )}
          style={{ transitionDuration: '240ms', transitionTimingFunction: 'cubic-bezier(0.16,1,0.32,1)' }}
        >
          <RightPanel />
        </div>

        {/* Mobile right drawer */}
        <div
          className={cn(
            'md:hidden fixed top-12 bottom-16 right-0 z-[60] w-[min(340px,100vw)] border-l border-syn-border-active overflow-hidden transition-transform',
            mobileDrawer === 'right' ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{
            background: 'hsl(var(--bg-surface))',
            transitionDuration: '260ms',
            transitionTimingFunction: 'cubic-bezier(0.16,1,0.32,1)',
          }}
        >
          <div className="flex items-center justify-between h-10 px-3 border-b border-syn-border shrink-0">
            <span className="text-[11px] font-ui uppercase tracking-widest text-syn-text-muted">Inspector</span>
            <button onClick={closeMobileDrawer} className="text-syn-text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[calc(100%-40px)] overflow-y-auto">
            <RightPanel />
          </div>
        </div>
      </div>

      {/* ── Bottom Panel / Terminal ─────────────────────────────────── */}
      {/* Desktop */}
      <div className="hidden md:block">
        <BottomPanel />
      </div>
      {/* Mobile terminal drawer from bottom */}
      {activeMobileTab === 'terminal' && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-[60] h-[45vh] border-t border-syn-border-active"
          style={{ background: 'hsl(var(--bg-surface))' }}>
          <BottomPanel />
        </div>
      )}

      {/* ── Mobile bottom nav ──────────────────────────────────────── */}
      <MobileNav />

      {/* ── Modals ────────────────────────────────────────────────── */}
      <CommandPalette />
      <ShortcutsPanel />
    </div>
  );
}
