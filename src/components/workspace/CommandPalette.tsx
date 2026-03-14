import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { NODE_TEMPLATES } from '@/lib/nodeTemplates';
import { Search } from 'lucide-react';

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  const results = useMemo(() => {
    const lc = query.toLowerCase();
    const nodes = NODE_TEMPLATES.filter(
      (t) => t.label.toLowerCase().includes(lc) || t.description.toLowerCase().includes(lc)
    ).map((t) => ({ type: 'node' as const, id: t.nodeType, label: t.label, icon: t.icon, desc: t.description }));

    const actions = [
      { id: 'run', label: 'Run Workflow', icon: '▶', desc: '⌘R' },
      { id: 'save', label: 'Save', icon: '💾', desc: '⌘S' },
      { id: 'export', label: 'Export JSON', icon: '📤', desc: '' },
      { id: 'share', label: 'Share Workspace', icon: '🔗', desc: '' },
    ].filter((a) => a.label.toLowerCase().includes(lc))
     .map((a) => ({ type: 'action' as const, ...a }));

    return [...nodes.slice(0, 6), ...actions];
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Escape') setCommandPaletteOpen(false);
    if (e.key === 'Enter' && results[selectedIndex]) {
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[640px] max-w-[90vw] bg-syn-raised border border-syn-border-active rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center px-4 h-12 border-b border-syn-border">
          <Search className="w-4 h-4 text-syn-text-muted mr-3" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes, actions, collaborators..."
            className="flex-1 bg-transparent text-base font-ui text-foreground outline-none placeholder:text-syn-text-muted"
          />
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="text-sm text-syn-text-muted p-3 text-center font-ui">No results found.</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              className={cn(
                'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-left transition-all',
                i === selectedIndex ? 'bg-syn-hover border-l-2 border-syn-violet' : 'border-l-2 border-transparent'
              )}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => setCommandPaletteOpen(false)}
            >
              <span className="text-sm w-5 text-center">{r.icon}</span>
              <span className="text-[13px] font-ui text-foreground flex-1">{r.label}</span>
              {r.desc && <span className="text-[10px] text-syn-text-muted">{r.desc}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
