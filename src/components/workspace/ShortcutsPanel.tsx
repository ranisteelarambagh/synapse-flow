import { useUIStore } from '@/stores/uiStore';
import { X, Keyboard } from 'lucide-react';

const groups = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['⌘', 'R'], label: 'Run workflow' },
      { keys: ['⌘', 'S'], label: 'Save workflow' },
      { keys: ['⌘', '⇧', 'F'], label: 'Fit view to canvas' },
      { keys: ['`'],          label: 'Toggle terminal' },
      { keys: ['?'],          label: 'Toggle shortcuts panel' },
    ],
  },
  {
    title: 'Canvas',
    shortcuts: [
      { keys: ['⌘', '+'],   label: 'Zoom in' },
      { keys: ['⌘', '-'],   label: 'Zoom out' },
      { keys: ['⌘', '0'],   label: 'Reset zoom' },
      { keys: ['Del'],       label: 'Delete selected node/edge' },
      { keys: ['⌘', 'Z'],   label: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], label: 'Redo' },
      { keys: ['Space'],     label: 'Pan canvas (drag)' },
    ],
  },
  {
    title: 'Node Actions',
    shortcuts: [
      { keys: ['Double-click'], label: 'Add node from library' },
      { keys: ['Drag'],         label: 'Move node on canvas' },
      { keys: ['Click'],        label: 'Select & inspect node' },
      { keys: ['Click', 'port'], label: 'Start connection' },
    ],
  },
  {
    title: 'Panels',
    shortcuts: [
      { keys: ['⌘', '['], label: 'Toggle left panel' },
      { keys: ['⌘', ']'], label: 'Toggle right panel' },
      { keys: ['⌘', 'B'], label: 'Toggle terminal panel' },
      { keys: ['Esc'],     label: 'Close palette / deselect' },
    ],
  },
];

export default function ShortcutsPanel() {
  const { showShortcuts, toggleShortcuts } = useUIStore();

  if (!showShortcuts) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center"
      onClick={toggleShortcuts}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-[640px] max-w-[94vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-syn-border-active shadow-[0_40px_120px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.04)] animate-fade-in-up"
        style={{ background: 'hsl(var(--bg-raised))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-syn-border"
          style={{ background: 'hsl(var(--bg-raised))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-syn-violet/20 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-syn-violet" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-foreground">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-syn-text-muted font-ui">Master Synapse with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={toggleShortcuts}
            className="w-7 h-7 flex items-center justify-center rounded-md text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 p-2">
          {groups.map(group => (
            <div key={group.title} className="p-4">
              <h3 className="text-[10px] font-ui uppercase tracking-widest text-syn-text-muted mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-syn-border/60" />
                {group.title}
                <span className="h-px flex-1 bg-syn-border/60" />
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 group">
                    <span className="text-[12px] font-ui text-syn-text-secondary group-hover:text-foreground transition-colors">
                      {s.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="px-1.5 py-0.5 text-[10px] font-ui bg-syn-hover border border-syn-border rounded text-syn-text-secondary min-w-[22px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-3 border-t border-syn-border text-center"
          style={{ background: 'hsl(var(--bg-raised))' }}>
          <p className="text-[11px] text-syn-text-muted font-ui">
            Press <kbd className="px-1.5 py-0.5 bg-syn-hover border border-syn-border rounded text-[10px]">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
