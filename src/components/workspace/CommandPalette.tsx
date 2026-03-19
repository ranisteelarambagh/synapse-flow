import { useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useCanvasApiStore } from '@/stores/canvasApiStore';
import { NODE_TEMPLATES } from '@/lib/nodeTemplates';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';
import type { Node } from '@xyflow/react';
import type { NodeData } from '@/stores/workflowStore';
import { Search, Zap, Share2, Download, Layers } from 'lucide-react';
import { exportJSON, exportLangGraph, downloadFile } from '@/lib/exportUtils';

type ResultItem = {
  id: string;
  type: 'node' | 'action';
  label: string;
  icon: string;
  desc: string;
  action?: () => void;
};

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { nodes, edges, workspaceName, addToast, isRunning } = useWorkflowStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentNodeTypes, setRecentNodeTypes] = useState<string[]>([]);

  // Open/close via ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) { setQuery(''); setSelectedIndex(0); }
  }, [commandPaletteOpen]);

  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);

  // Helper to add a node to canvas via the canvas API bus
  const addNodeToCanvas = useCallback((nodeType: string) => {
    const cfg = NODE_CONFIGS[nodeType];
    if (!cfg) return;
    const canvasAddNode = useCanvasApiStore.getState().addNode;
    if (!canvasAddNode) { addToast({ type: 'warn', message: 'Canvas not ready' }); return; }

    const newNode: Node<NodeData> = {
      id: `${nodeType}-${nanoid(6)}`,
      type: 'synapse',
      position: { x: 150 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        label: cfg.label,
        category: cfg.category,
        nodeType: cfg.type,
        status: 'idle',
        icon: cfg.icon,
        config: { ...cfg.defaultConfig },
        inputs: cfg.inputs,
        outputs: cfg.outputs,
      },
    };

    canvasAddNode(newNode);
    setRecentNodeTypes(prev => [nodeType, ...prev.filter(t => t !== nodeType)].slice(0, 3));
    addToast({ type: 'success', message: `Added "${cfg.label}" to canvas` });
  }, [addToast]);

  const results = useMemo((): ResultItem[] => {
    const lc = query.toLowerCase();

    const nodeResults: ResultItem[] = NODE_TEMPLATES
      .filter(t => t.label.toLowerCase().includes(lc) || t.description.toLowerCase().includes(lc))
      .slice(0, 7)
      .map(t => ({
        type: 'node',
        id: t.nodeType,
        label: t.label,
        icon: t.icon,
        desc: t.description,
        action: () => { addNodeToCanvas(t.nodeType); close(); },
      }));

    const actions: ResultItem[] = [
      {
        id: 'run',
        type: 'action',
        label: isRunning ? 'Stop Execution' : 'Run Workflow',
        icon: isRunning ? '⏹' : '▶',
        desc: '⌘R',
        action: () => {
          addToast({ type: 'info', message: isRunning ? 'Stopping execution...' : 'Starting workflow...' });
          close();
        },
      },
      {
        id: 'save',
        type: 'action',
        label: 'Save Workflow',
        icon: '💾',
        desc: '⌘S',
        action: () => {
          useWorkflowStore.getState().setUnsavedChanges(false);
          addToast({ type: 'success', message: 'Workflow saved' });
          close();
        },
      },
      {
        id: 'export-json',
        type: 'action',
        label: 'Export as JSON',
        icon: '📄',
        desc: '',
        action: () => {
          const json = exportJSON(nodes as any, edges, workspaceName);
          downloadFile(json, `${workspaceName}.json`, 'application/json');
          close();
        },
      },
      {
        id: 'export-python',
        type: 'action',
        label: 'Export as Python / LangGraph',
        icon: '🐍',
        desc: '',
        action: () => {
          const py = exportLangGraph(nodes as any, edges, workspaceName);
          downloadFile(py, `${workspaceName}.py`, 'text/plain');
          close();
        },
      },
      {
        id: 'share',
        type: 'action',
        label: 'Copy Share Link',
        icon: '🔗',
        desc: '',
        action: async () => {
          await navigator.clipboard.writeText(window.location.href);
          addToast({ type: 'success', message: 'Share link copied!' });
          close();
        },
      },
      {
        id: 'fitview',
        type: 'action',
        label: 'Fit View',
        icon: '🗺',
        desc: '⌘⇧F',
        action: () => {
          useCanvasApiStore.getState().fitView?.();
          close();
        },
      },
    ].filter(a => a.label.toLowerCase().includes(lc));

    // If empty query, show recent nodes first
    if (!lc && recentNodeTypes.length > 0) {
      const recents = recentNodeTypes
        .map(type => NODE_TEMPLATES.find(t => t.nodeType === type))
        .filter(Boolean)
        .map(t => ({
          type: 'node' as const,
          id: `recent-${t!.nodeType}`,
          label: `↩ ${t!.label}`,
          icon: t!.icon,
          desc: 'Recently used',
          action: () => { addNodeToCanvas(t!.nodeType); close(); },
        }));
      return [...recents, ...nodeResults.slice(0, 4), ...actions];
    }

    return [...nodeResults, ...actions];
  }, [query, isRunning, nodes, edges, workspaceName, addNodeToCanvas, addToast, close, recentNodeTypes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && results[selectedIndex]) results[selectedIndex].action?.();
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center pt-[18vh]"
      onClick={close}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
      <div
        className="relative w-[640px] max-w-[90vw] bg-syn-raised border border-syn-border-active rounded-xl shadow-[0_32px_96px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 h-14 border-b border-syn-border gap-3">
          <Search className="w-4 h-4 text-syn-text-muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes, run actions, export..."
            className="flex-1 bg-transparent text-[15px] font-ui text-foreground outline-none placeholder:text-syn-text-muted caret-syn-violet"
          />
          <kbd className="shrink-0 text-[10px] font-ui px-1.5 py-0.5 bg-syn-hover border border-syn-border rounded text-syn-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="text-[13px] text-syn-text-muted px-4 py-6 text-center font-ui">
              No results for "{query}"
            </p>
          )}

          {/* Group: Nodes */}
          {results.some(r => r.type === 'node') && (
            <div className="px-2 pb-1">
              <p className="px-2 pb-1 pt-0.5 text-[10px] uppercase tracking-widest text-syn-text-muted font-ui">
                Nodes
              </p>
              {results
                .filter(r => r.type === 'node')
                .map((r, globalIdx) => {
                  const i = results.indexOf(r);
                  return (
                    <button
                      key={r.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-left transition-all',
                        i === selectedIndex
                          ? 'bg-syn-violet/15 border-l-2 border-syn-violet'
                          : 'border-l-2 border-transparent hover:bg-syn-hover/60'
                      )}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => r.action?.()}
                    >
                      <span className="text-base w-6 text-center shrink-0">{r.icon}</span>
                      <span className="text-[13px] font-ui text-foreground flex-1">{r.label}</span>
                      <span className="text-[10px] text-syn-text-muted font-ui truncate max-w-[200px]">{r.desc}</span>
                      {i === selectedIndex && (
                        <kbd className="text-[9px] px-1 py-0.5 bg-syn-violet/20 border border-syn-violet/40 rounded text-syn-violet ml-1">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {/* Group: Actions */}
          {results.some(r => r.type === 'action') && (
            <div className="px-2 pt-1 border-t border-syn-border/40">
              <p className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-widest text-syn-text-muted font-ui">
                Actions
              </p>
              {results
                .filter(r => r.type === 'action')
                .map(r => {
                  const i = results.indexOf(r);
                  return (
                    <button
                      key={r.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-left transition-all',
                        i === selectedIndex
                          ? 'bg-syn-violet/15 border-l-2 border-syn-violet'
                          : 'border-l-2 border-transparent hover:bg-syn-hover/60'
                      )}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => r.action?.()}
                    >
                      <span className="text-base w-6 text-center shrink-0">{r.icon}</span>
                      <span className="text-[13px] font-ui text-foreground flex-1">{r.label}</span>
                      {r.desc && (
                        <kbd className="text-[10px] px-1.5 py-0.5 bg-syn-hover border border-syn-border rounded text-syn-text-muted shrink-0">
                          {r.desc}
                        </kbd>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-syn-border px-4 py-2 flex items-center gap-3 text-[10px] font-ui text-syn-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-syn-hover border border-syn-border rounded">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-syn-hover border border-syn-border rounded">↵</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-syn-hover border border-syn-border rounded">ESC</kbd> close
          </span>
          <span className="ml-auto opacity-60">Results: {results.length}</span>
        </div>
      </div>
    </div>
  );
}
