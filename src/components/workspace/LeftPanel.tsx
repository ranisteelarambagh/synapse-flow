import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, Search, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NODE_TEMPLATES, CATEGORY_LABELS, CATEGORY_ICONS, type NodeTemplate } from '@/lib/nodeTemplates';
import { useWorkflowStore, type NodeData, type NodeCategory } from '@/stores/workflowStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useCanvasApiStore } from '@/stores/canvasApiStore';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';
import type { Node } from '@xyflow/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const categoryAccents: Record<NodeCategory, string> = {
  ai:    '#6C63FF',
  tool:  '#00D4AA',
  logic: '#FFB800',
  io:    '#FF4757',
};

// ─── Draggable node card ──────────────────────────────────────────────────────
function NodeCard({ template }: { template: NodeTemplate }) {
  const { addToast } = useWorkflowStore();
  const accent = categoryAccents[template.category];

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/synapse-node', template.nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDoubleClick = () => {
    const cfg = NODE_CONFIGS[template.nodeType];
    if (!cfg) return;
    const canvasAddNode = useCanvasApiStore.getState().addNode;
    if (!canvasAddNode) { addToast({ type: 'warn', message: 'Canvas not ready' }); return; }
    const newNode: Node<NodeData> = {
      id: `${template.nodeType}-${nanoid(6)}`,
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
    addToast({ type: 'success', message: `Added "${cfg.label}" to canvas` });
  };

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={onDragStart}
            onDoubleClick={handleDoubleClick}
            className="group h-[58px] rounded-md cursor-grab active:cursor-grabbing flex items-center gap-3 px-3 bg-syn-raised hover:bg-syn-hover transition-all duration-150 hover:translate-x-0.5 hover:shadow-md"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <span className="text-[15px] shrink-0 group-hover:scale-110 transition-transform">
              {template.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-display font-medium text-foreground leading-tight">
                {template.label}
              </div>
              <div className="text-[10px] text-syn-text-muted truncate leading-tight mt-0.5">
                {template.description}
              </div>
            </div>
            <div
              className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: accent }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-[11px] max-w-[200px]">
          <p className="font-medium">{template.label}</p>
          <p className="text-syn-text-muted mt-0.5">{template.description}</p>
          <p className="text-syn-violet mt-1">Drag to canvas · Double-click to add</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CategorySection({
  category,
  templates,
  search,
}: {
  category: NodeCategory;
  templates: NodeTemplate[];
  search: string;
}) {
  const [open, setOpen] = useState(true);
  const filtered = templates.filter(
    t => t.label.toLowerCase().includes(search) || t.description.toLowerCase().includes(search)
  );

  if (filtered.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-ui uppercase tracking-widest text-syn-text-muted hover:text-syn-text-secondary transition-colors"
      >
        <span className="text-[11px]">{CATEGORY_ICONS[category]}</span>
        <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
        <span className="text-syn-text-muted text-[9px]">{filtered.length}</span>
        {open ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
      </button>
      {open && (
        <div className="flex flex-col gap-1 px-2 pb-1">
          {filtered.map(t => <NodeCard key={t.nodeType} template={t} />)}
        </div>
      )}
    </div>
  );
}

// ─── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const dotClass = {
    idle:    'bg-syn-border-active',
    running: 'bg-syn-teal animate-pulse-dot',
    success: 'bg-green-500',
    error:   'bg-syn-red',
  }[status] || 'bg-syn-border-active';
  return <div className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />;
}

// ─── Main LeftPanel ────────────────────────────────────────────────────────────
export default function LeftPanel() {
  const [search, setSearch] = useState('');
  const { nodes, selectedNodeId, selectNode } = useWorkflowStore();
  const nodeStatuses = useExecutionStore(s => s.nodeStatuses);
  const lc = search.toLowerCase();

  const grouped = useMemo(() => {
    const cats: NodeCategory[] = ['ai', 'tool', 'logic', 'io'];
    return cats.map(c => ({
      category: c,
      templates: NODE_TEMPLATES.filter(t => t.category === c),
    }));
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    selectNode(nodeId);
  }, [selectNode]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full bg-syn-surface flex flex-col overflow-hidden">
        {/* Search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-syn-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearch('')}
              placeholder="Search nodes..."
              className="w-full h-8 pl-8 pr-3 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground placeholder:text-syn-text-muted focus:outline-none focus:border-syn-violet focus:shadow-[0_0_0_2px_rgba(108,99,255,0.18)] transition-all"
              data-testid="input-search-nodes"
            />
          </div>
        </div>

        {/* Node library */}
        <div className="flex-1 overflow-y-auto">
          {grouped.map(({ category, templates }) => (
            <CategorySection key={category} category={category} templates={templates} search={lc} />
          ))}
        </div>

        {/* Workspace tree */}
        <div className="border-t border-syn-border shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-ui uppercase tracking-widest text-syn-text-muted">
            <Layers className="w-3 h-3" />
            <span>Workspace Tree</span>
            <span className="ml-auto text-[9px]">{nodes.length}</span>
          </div>
          <div className="max-h-[220px] overflow-y-auto pb-2">
            {nodes.length === 0 ? (
              <p className="text-[11px] text-syn-text-muted px-3 py-2 font-ui">
                No nodes yet. Drag from above.
              </p>
            ) : (
              (nodes as Node<NodeData>[]).map(node => {
                const d = node.data as unknown as NodeData;
                const liveStatus = nodeStatuses[node.id] || d.status;
                const isSelected = selectedNodeId === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    className={cn(
                      'w-full h-9 flex items-center gap-2.5 px-3 text-left transition-all group',
                      isSelected
                        ? 'bg-syn-violet/10 border-l-2 border-syn-violet'
                        : 'border-l-2 border-transparent hover:bg-syn-hover'
                    )}
                    data-testid={`button-tree-node-${node.id}`}
                  >
                    <span className="text-[12px] shrink-0">{d.icon}</span>
                    <span className={cn(
                      'text-[12px] font-ui flex-1 truncate transition-colors',
                      isSelected ? 'text-foreground' : 'text-syn-text-secondary group-hover:text-foreground'
                    )}>
                      {d.label}
                    </span>
                    <StatusDot status={liveStatus} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
