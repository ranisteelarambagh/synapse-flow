import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NODE_TEMPLATES, CATEGORY_LABELS, CATEGORY_ICONS, type NodeTemplate } from '@/lib/nodeTemplates';
import { useWorkflowStore, type NodeData, type NodeCategory } from '@/stores/workflowStore';
import type { Node } from '@xyflow/react';

const categoryAccents: Record<NodeCategory, string> = {
  ai: '#6C63FF',
  tool: '#00D4AA',
  logic: '#FFB800',
  io: '#FF4757',
};

function NodeCard({ template }: { template: NodeTemplate }) {
  const accent = categoryAccents[template.category];

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/synapse-node', template.nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group h-[60px] rounded-md cursor-grab active:cursor-grabbing flex items-center gap-3 px-3 bg-syn-raised hover:bg-syn-hover transition-all duration-150 hover:scale-[1.015]"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <span className="text-sm">{template.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-display font-medium text-foreground">{template.label}</div>
        <div className="text-[11px] text-syn-text-muted truncate">{template.description}</div>
      </div>
    </div>
  );
}

function CategorySection({ category, templates, search }: { category: NodeCategory; templates: NodeTemplate[]; search: string }) {
  const [open, setOpen] = useState(true);
  const filtered = templates.filter((t) =>
    t.label.toLowerCase().includes(search) || t.description.toLowerCase().includes(search)
  );

  if (filtered.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-ui uppercase tracking-widest text-syn-text-muted hover:text-syn-text-secondary transition-colors"
      >
        <span>{CATEGORY_ICONS[category]}</span>
        <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 px-2 pb-2">
          {filtered.map((t) => (
            <NodeCard key={t.nodeType} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

const statusDots: Record<string, string> = {
  idle: 'bg-syn-border-active',
  running: 'bg-syn-teal animate-pulse-dot',
  success: 'bg-syn-teal',
  error: 'bg-syn-red',
};

export default function LeftPanel() {
  const [search, setSearch] = useState('');
  const { nodes } = useWorkflowStore();
  const lc = search.toLowerCase();

  const grouped = useMemo(() => {
    const cats: NodeCategory[] = ['ai', 'tool', 'logic', 'io'];
    return cats.map((c) => ({
      category: c,
      templates: NODE_TEMPLATES.filter((t) => t.category === c),
    }));
  }, []);

  return (
    <div className="h-full bg-syn-surface flex flex-col overflow-hidden">
      {/* Node Library */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-syn-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
              placeholder="Search nodes..."
              className="w-full h-8 pl-8 pr-3 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground placeholder:text-syn-text-muted focus:outline-none focus:border-syn-violet focus:shadow-[0_0_0_2px_rgba(108,99,255,0.2)] transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {grouped.map(({ category, templates }) => (
            <CategorySection key={category} category={category} templates={templates} search={lc} />
          ))}
        </div>
      </div>

      {/* Workspace Tree */}
      <div className="border-t border-syn-border">
        <div className="px-3 py-2 text-[11px] font-ui uppercase tracking-widest text-syn-text-muted">
          Workspace Tree
        </div>
        <div className="max-h-[200px] overflow-y-auto pb-2">
          {(nodes as Node<NodeData>[]).map((node) => {
            const d = node.data as unknown as NodeData;
            return (
              <button
                key={node.id}
                className="w-full h-8 flex items-center gap-2 px-3 text-left hover:bg-syn-hover transition-colors"
              >
                <span className="text-xs">{d.icon}</span>
                <span className="text-xs font-ui text-foreground flex-1 truncate">{d.label}</span>
                <div className={cn('w-2 h-2 rounded-full', statusDots[d.status] || statusDots.idle)} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
