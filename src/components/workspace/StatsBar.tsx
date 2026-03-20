import { useMemo } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { Node } from '@xyflow/react';
import type { NodeData } from '@/stores/workflowStore';

function Pip() {
  return <span className="w-1 h-1 rounded-full bg-syn-border-active shrink-0" />;
}

export default function StatsBar() {
  const { nodes, edges, isRunning, unsavedChanges } = useWorkflowStore();
  const logs = useExecutionStore(s => s.logs);
  const lastRunDuration = useExecutionStore(s => s.lastRunDuration);
  const executionTimeline = useExecutionStore(s => s.executionTimeline);
  const { showStats } = useUIStore();

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { ai: 0, tool: 0, logic: 0, io: 0 };
    (nodes as Node<NodeData>[]).forEach(n => {
      const cat = (n.data as any)?.category;
      if (cat && counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [nodes]);

  const errorCount = useMemo(() => (logs || []).filter(l => l.level === 'ERROR').length, [logs]);
  const successCount = useMemo(() => (executionTimeline || []).filter(t => t.status === 'success').length, [executionTimeline]);

  if (!showStats) return null;

  const hasAny = Object.values(categoryCount).some(v => v > 0);

  return (
    <div className="hidden sm:flex h-7 border-b border-syn-border/50 items-center px-4 gap-3 text-[11px] font-ui text-syn-text-muted overflow-x-auto shrink-0 scrollbar-hide"
      style={{ background: 'rgba(8,10,18,0.6)' }}>

      {/* Node counts by category */}
      {hasAny && (
        <div className="flex items-center gap-2 shrink-0">
          {categoryCount.ai > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
              {categoryCount.ai} AI
            </span>
          )}
          {categoryCount.tool > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]" />
              {categoryCount.tool} Tool
            </span>
          )}
          {categoryCount.logic > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
              {categoryCount.logic} Logic
            </span>
          )}
          {categoryCount.io > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" />
              {categoryCount.io} I/O
            </span>
          )}
          <Pip />
        </div>
      )}

      <span className="shrink-0">{edges.length} connection{edges.length !== 1 ? 's' : ''}</span>

      {lastRunDuration !== null && lastRunDuration !== undefined && (
        <>
          <Pip />
          <span className="shrink-0 text-syn-teal">
            Last run: {(lastRunDuration / 1000).toFixed(1)}s
          </span>
        </>
      )}

      {successCount > 0 && (
        <>
          <Pip />
          <span className="shrink-0 text-green-400">{successCount}/{(executionTimeline || []).length} nodes ✓</span>
        </>
      )}

      {errorCount > 0 && (
        <>
          <Pip />
          <span className="shrink-0 text-syn-red">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
        </>
      )}

      {isRunning && (
        <>
          <Pip />
          <span className="shrink-0 flex items-center gap-1.5 text-syn-teal">
            <span className="w-1.5 h-1.5 rounded-full bg-syn-teal animate-pulse-dot" />
            Executing...
          </span>
        </>
      )}

      {unsavedChanges && (
        <>
          <Pip />
          <span className="shrink-0 text-syn-amber">● Unsaved</span>
        </>
      )}

      <span className="ml-auto shrink-0 opacity-40 hover:opacity-70 cursor-pointer transition-opacity" title="Press ? for shortcuts">
        ? for shortcuts
      </span>
    </div>
  );
}
