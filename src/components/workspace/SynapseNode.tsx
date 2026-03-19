import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData, NodeCategory } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useExecutionStore } from '@/stores/executionStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const categoryColorMap: Record<NodeCategory, { accent: string; bg: string; border: string; glow: string }> = {
  ai:    { accent: '#6C63FF', bg: 'rgba(108,99,255,0.10)', border: 'rgba(108,99,255,0.28)', glow: '0 0 24px rgba(108,99,255,0.35)' },
  tool:  { accent: '#00D4AA', bg: 'rgba(0,212,170,0.10)',  border: 'rgba(0,212,170,0.28)',  glow: '0 0 24px rgba(0,212,170,0.35)'  },
  logic: { accent: '#FFB800', bg: 'rgba(255,184,0,0.10)',  border: 'rgba(255,184,0,0.28)',  glow: '0 0 24px rgba(255,184,0,0.35)'  },
  io:    { accent: '#FF4757', bg: 'rgba(255,71,87,0.10)',  border: 'rgba(255,71,87,0.28)',  glow: '0 0 24px rgba(255,71,87,0.35)'  },
};

function Particles({ color }: { color: string }) {
  const particles = useMemo(() => (
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200,
      y: Math.random() * 80,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 1.5,
    }))
  ), []);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 0 }}
    >
      {particles.map(p => (
        <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill={color} opacity={0.6}>
          <animate
            attributeName="cy"
            values={`${p.y};${p.y - 20};${p.y}`}
            dur={`${p.duration}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.7;0"
            dur={`${p.duration}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

function Shimmer({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ borderRadius: 'inherit' }}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${color}30 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
}

function SynapseNode({ data, selected, id }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  const colors = categoryColorMap[nodeData.category] || categoryColorMap.ai;

  // Live status from executionStore overrides node data status during runs
  const liveStatus = useExecutionStore(s => s.nodeStatuses[id]);
  const status = (liveStatus || nodeData.status) as NodeData['status'];

  const { collaborators } = useCollaborationStore();
  const [copied, setCopied] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const prevStatusRef = useRef(status);

  // Trigger success flash when transitioning to 'success'
  useEffect(() => {
    if (prevStatusRef.current !== 'success' && status === 'success') {
      setSuccessFlash(true);
      const t = setTimeout(() => setSuccessFlash(false), 1200);
      return () => clearTimeout(t);
    }
    prevStatusRef.current = status;
  }, [status]);

  const configPreview = useMemo(() => {
    const entries = Object.entries(nodeData.config).slice(0, 3);
    return entries
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 20) : JSON.stringify(v)}`)
      .join(' · ');
  }, [nodeData.config]);

  const selectedByUser = useMemo(
    () => collaborators.find(c => c.activeNodeId === id),
    [collaborators, id]
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(`node_${id.substring(0, 6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Border style — priority: collaborator > selected > status
  const getBorderStyle = (): React.CSSProperties => {
    if (selectedByUser && !selected) {
      return {
        border: `2px solid ${selectedByUser.color}`,
        boxShadow: `0 0 0 3px ${selectedByUser.color}22`,
      };
    }
    if (selected) {
      return {
        border: '2px solid #6C63FF',
        boxShadow: '0 0 0 4px rgba(108,99,255,0.18), 0 8px 32px rgba(0,0,0,0.4)',
      };
    }
    if (status === 'running') {
      return {
        border: `1.5px solid ${colors.accent}`,
        boxShadow: colors.glow,
        animation: 'node-pulse 1.2s ease-in-out infinite',
      };
    }
    if (status === 'error') {
      return {
        border: '1.5px solid #FF4757',
        boxShadow: '0 0 16px rgba(255,71,87,0.4)',
        animation: 'node-error-pulse 1s ease-in-out infinite',
      };
    }
    if (successFlash) {
      return {
        border: `1.5px solid ${colors.accent}`,
        boxShadow: `0 0 20px ${colors.accent}60`,
        animation: 'node-success-flash 1.2s ease-out forwards',
      };
    }
    return { border: '1px solid hsl(var(--border-subtle))' };
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="w-[226px] rounded-lg overflow-visible transition-all duration-150 relative"
        style={{
          background: 'hsl(var(--bg-raised))',
          ...getBorderStyle(),
        }}
      >
        {/* Success confetti burst */}
        {successFlash && <Particles color={colors.accent} />}

        {/* Collaborator avatar badge */}
        {selectedByUser && !selected && (
          <div
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-foreground z-20 animate-presence-in"
            style={{
              background: selectedByUser.color + '44',
              boxShadow: `0 0 0 2px ${selectedByUser.color}`,
            }}
            title={`${selectedByUser.name} is viewing this node`}
          >
            {selectedByUser.name.split(' ').map(n => n[0]).join('')}
          </div>
        )}

        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 relative overflow-hidden"
          style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}
        >
          {status === 'running' && <Shimmer color={colors.accent} />}
          <span className="text-sm relative z-10 transition-transform duration-200 group-hover:scale-110">
            {nodeData.icon}
          </span>
          <span className="text-[13px] font-display font-semibold text-foreground relative z-10 flex-1 truncate leading-tight">
            {nodeData.label}
          </span>

          {/* Status dot with ring */}
          <div className="relative z-10 flex items-center">
            {status === 'running' && (
              <span
                className="absolute inline-flex w-4 h-4 rounded-full opacity-75 animate-ping"
                style={{ background: colors.accent, left: '-4px', top: '-4px' }}
              />
            )}
            <div
              className={cn('w-2 h-2 rounded-full relative', {
                'animate-pulse-dot': status === 'running',
              })}
              style={{
                background:
                  status === 'running' ? colors.accent :
                  status === 'success' || successFlash ? '#22c55e' :
                  status === 'error' ? '#FF4757' :
                  '#4A4D5C',
              }}
            />
          </div>
        </div>

        {/* Node ID button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopyId}
              className="w-full px-3 py-1 text-[10px] font-mono text-syn-text-muted hover:text-syn-violet transition-colors text-left hover:bg-syn-hover/40"
            >
              node_{id.substring(0, 6)}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {copied ? '✓ Copied!' : 'Click to copy node ID'}
          </TooltipContent>
        </Tooltip>

        {/* Config preview */}
        {configPreview && (
          <div className="px-3 py-1.5 text-[11px] font-ui text-syn-text-secondary truncate border-t border-syn-border/40">
            {configPreview}
          </div>
        )}

        {/* Ports */}
        <div className="flex justify-between px-3 py-2 text-[10px] text-syn-text-muted min-h-[32px]">
          {/* Inputs */}
          <div className="flex flex-col gap-1.5 justify-center">
            {(nodeData.inputs || []).map((input) => (
              <div key={input} className="flex items-center gap-1.5 group/handle">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={input}
                      className="!transition-all !duration-150 !rounded-full !border-2"
                      style={{
                        width: 10,
                        height: 10,
                        background: colors.accent,
                        borderColor: 'hsl(var(--bg-void))',
                        left: -5,
                        top: 'auto',
                        boxShadow: status === 'running' ? `0 0 6px ${colors.accent}` : undefined,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-[10px]">{input}</TooltipContent>
                </Tooltip>
                <span className="group-hover/handle:text-foreground transition-colors">{input}</span>
              </div>
            ))}
          </div>

          {/* Outputs */}
          <div className="flex flex-col gap-1.5 justify-center items-end">
            {(nodeData.outputs || []).map((output) => (
              <div key={output} className="flex items-center gap-1.5 group/handle">
                <span className="group-hover/handle:text-foreground transition-colors">{output}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={output}
                      className="!transition-all !duration-150 !rounded-full !border-2"
                      style={{
                        width: 10,
                        height: 10,
                        background: colors.accent,
                        borderColor: 'hsl(var(--bg-void))',
                        right: -5,
                        top: 'auto',
                        boxShadow: status === 'running' ? `0 0 6px ${colors.accent}` : undefined,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-[10px]">{output}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>

        {/* Error bar */}
        {status === 'error' && nodeData.description && (
          <div className="px-3 py-1.5 text-[10px] font-mono text-syn-red bg-syn-red/5 border-t border-syn-red/20 flex items-center gap-1.5 truncate">
            <span>⚠</span>
            <span className="truncate">{nodeData.description}</span>
          </div>
        )}

        {/* Running progress bar */}
        {status === 'running' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-lg">
            <div
              className="h-full animate-shimmer"
              style={{
                background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default memo(SynapseNode);
