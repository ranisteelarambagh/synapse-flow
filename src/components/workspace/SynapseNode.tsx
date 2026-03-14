import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData, NodeCategory } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';

const categoryColorMap: Record<NodeCategory, { accent: string; bg: string; border: string }> = {
  ai: { accent: 'hsl(244 100% 69%)', bg: 'hsla(244, 100%, 69%, 0.12)', border: 'hsla(244, 100%, 69%, 0.3)' },
  tool: { accent: 'hsl(165 100% 42%)', bg: 'hsla(165, 100%, 42%, 0.12)', border: 'hsla(165, 100%, 42%, 0.3)' },
  logic: { accent: 'hsl(43 100% 50%)', bg: 'hsla(43, 100%, 50%, 0.12)', border: 'hsla(43, 100%, 50%, 0.3)' },
  io: { accent: 'hsl(354 100% 64%)', bg: 'hsla(354, 100%, 64%, 0.12)', border: 'hsla(354, 100%, 64%, 0.3)' },
};

const statusConfig = {
  idle: { className: 'border-syn-border', dot: 'bg-syn-border-active' },
  running: { className: 'animate-node-pulse border-syn-teal', dot: 'bg-syn-teal animate-pulse-dot' },
  success: { className: 'border-syn-teal', dot: 'bg-syn-teal' },
  error: { className: 'border-syn-red', dot: 'bg-syn-red' },
};

function SynapseNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  const colors = categoryColorMap[nodeData.category];
  const status = statusConfig[nodeData.status];

  const configPreview = useMemo(() => {
    const entries = Object.entries(nodeData.config).slice(0, 3);
    return entries.map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join(' · ');
  }, [nodeData.config]);

  return (
    <div
      className={cn(
        'w-[220px] rounded-lg overflow-hidden transition-all duration-150',
        selected ? 'border-2 border-syn-violet shadow-[0_0_0_4px_rgba(108,99,255,0.15),0_8px_32px_rgba(0,0,0,0.4)]' : `border ${status.className}`,
      )}
      style={{
        background: 'hsl(var(--bg-raised))',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 relative overflow-hidden"
        style={{
          background: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {nodeData.status === 'running' && (
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent}20, transparent)`,
            }}
          />
        )}
        <span className="text-sm relative z-10">{nodeData.icon}</span>
        <span className="text-[13px] font-display font-semibold text-foreground relative z-10 flex-1 truncate">
          {nodeData.label}
        </span>
        <div className={cn('w-2 h-2 rounded-full relative z-10', status.dot)} />
      </div>

      {/* Config preview */}
      {configPreview && (
        <div className="px-3 py-2 text-[11px] font-ui text-syn-text-secondary truncate">
          {configPreview}
        </div>
      )}

      {/* Handles */}
      <div className="flex justify-between px-3 py-1.5 text-[10px] text-syn-text-muted">
        <div className="flex flex-col gap-1">
          {(nodeData.inputs || []).map((input, i) => (
            <div key={input} className="flex items-center gap-1.5 relative">
              <Handle
                type="target"
                position={Position.Left}
                id={input}
                className="!w-2 !h-2 !border-2 !rounded-full !-left-3"
                style={{
                  background: colors.accent,
                  borderColor: 'hsl(var(--bg-void))',
                  top: 'auto',
                }}
              />
              <span>{input}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 items-end">
          {(nodeData.outputs || []).map((output, i) => (
            <div key={output} className="flex items-center gap-1.5 relative">
              <span>{output}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output}
                className="!w-2 !h-2 !border-2 !rounded-full !-right-3"
                style={{
                  background: colors.accent,
                  borderColor: 'hsl(var(--bg-void))',
                  top: 'auto',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {nodeData.status === 'error' && nodeData.description && (
        <div className="px-3 py-1.5 text-[10px] font-mono text-syn-red border-t border-syn-border truncate">
          {nodeData.description}
        </div>
      )}
    </div>
  );
}

export default memo(SynapseNode);
