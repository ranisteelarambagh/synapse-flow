import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useExecutionStore } from '@/stores/executionStore';
import type { Node } from '@xyflow/react';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, X } from 'lucide-react';

const MODELS = [
  { value: 'llama-3.3-70b', label: 'llama-3.3-70b · Groq · FREE' },
  { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash · Google · FREE' },
  { value: 'mistral-7b', label: 'mistral-7b · Mistral · FREE' },
  { value: 'gpt-4o', label: 'gpt-4o · OpenAI · PAID' },
  { value: 'claude-3-5-sonnet', label: 'claude-3-5-sonnet · Anthropic · PAID' },
];

function ModelDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = MODELS.filter(m => m.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-8 px-3 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground flex items-center justify-between hover:border-syn-border-active transition-all"
      >
        <span>{MODELS.find(m => m.value === value)?.label || value}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-syn-raised border border-syn-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-syn-raised border-b border-syn-border">
            <input
              autoFocus
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-7 px-2 text-xs font-ui bg-syn-hover border border-syn-border rounded text-foreground focus:outline-none focus:border-syn-violet"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
            />
          </div>
          {filtered.map(model => (
            <button
              key={model.value}
              onClick={() => {
                onChange(model.value);
                setOpen(false);
                setSearch('');
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-xs font-ui hover:bg-syn-hover transition-colors',
                value === model.value && 'bg-syn-violet/20 text-syn-violet'
              )}
            >
              {model.label}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function InspectorTab() {
  const { nodes, selectedNodeId, updateNodeData, workspaceName, setWorkspaceName, workflowDescription, setWorkflowDescription } = useWorkflowStore();
  const [workflowEditing, setWorkflowEditing] = useState(false);
  const [workflowEditValue, setWorkflowEditValue] = useState(workspaceName);

  const selectedNode = useMemo(
    () => (nodes as Node<NodeData>[]).find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  // When no node selected, show workflow metadata
  if (!selectedNode) {
    return (
      <div className="p-4 space-y-4 overflow-y-auto h-full">
        {/* Workflow name */}
        <div>
          <span className="text-xs font-ui text-syn-text-secondary mb-2 block">Workflow Name</span>
          {workflowEditing ? (
            <input
              autoFocus
              value={workflowEditValue}
              onChange={(e) => setWorkflowEditValue(e.target.value)}
              onBlur={() => {
                setWorkflowEditing(false);
                if (workflowEditValue.trim()) setWorkspaceName(workflowEditValue.trim());
                else setWorkflowEditValue(workspaceName);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setWorkflowEditing(false);
                  if (workflowEditValue.trim()) setWorkspaceName(workflowEditValue.trim());
                }
              }}
              className="w-full h-8 px-3 text-sm font-ui bg-syn-raised border border-syn-border-active rounded-md text-foreground focus:outline-none caret-syn-violet"
            />
          ) : (
            <button
              onDoubleClick={() => {
                setWorkflowEditing(true);
                setWorkflowEditValue(workspaceName);
              }}
              className="w-full h-8 px-3 text-sm font-ui text-left text-foreground hover:bg-syn-hover rounded-md transition-all"
            >
              {workspaceName}
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <span className="text-xs font-ui text-syn-text-secondary mb-2 block">Description</span>
          <textarea
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Describe what this workflow does..."
            className="w-full px-3 py-2 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground resize-y min-h-[80px] max-h-[200px] focus:outline-none focus:border-syn-violet transition-all"
          />
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-syn-border">
          <span className="text-[11px] font-ui text-syn-text-secondary">
            {nodes.length} nodes · {nodes.length - 1} edges · 0 runs
          </span>
        </div>

        {/* Last saved */}
        <div className="text-[10px] font-ui text-syn-text-muted">
          Last saved: just now
        </div>
      </div>
    );
  }

  const d = selectedNode.data as unknown as NodeData;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{d.icon}</span>
          <span className="text-base font-display font-medium text-foreground">{d.label}</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`node_${selectedNode.id.substring(0, 6)}`)}
          className="text-[10px] font-mono text-syn-text-muted hover:text-syn-text-secondary transition-colors"
          title="Click to copy"
        >
          node_{selectedNode.id.substring(0, 6)}
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">Node Name</span>
          <input
            value={d.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full h-8 px-3 text-sm font-ui bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
          />
        </label>

        {d.config.systemPrompt !== undefined && (
          <label className="block">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-ui text-syn-text-secondary">System Prompt</span>
              <span className="text-[10px] font-mono text-syn-text-muted">
                {d.config.systemPrompt?.length || 0} / ∞
              </span>
            </div>
            <textarea
              value={d.config.systemPrompt || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { config: { ...d.config, systemPrompt: e.target.value } })}
              rows={4}
              className="w-full px-3 py-2 text-xs font-mono bg-syn-raised border border-syn-border rounded-md text-foreground resize-y min-h-[80px] max-h-[200px] focus:outline-none focus:border-syn-violet transition-all"
            />
          </label>
        )}

        {d.config.model !== undefined && (
          <label className="block">
            <span className="text-xs font-ui text-syn-text-secondary mb-1 block">Model</span>
            <ModelDropdown
              value={d.config.model}
              onChange={(v) => updateNodeData(selectedNode.id, { config: { ...d.config, model: v } })}
            />
          </label>
        )}

        {d.config.temperature !== undefined && (
          <div>
            <span className="text-xs font-ui text-syn-text-secondary mb-2 block">
              Temperature: {d.config.temperature}
            </span>
            <div className="px-1">
              <Slider
                value={[d.config.temperature]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([v]) => updateNodeData(selectedNode.id, { config: { ...d.config, temperature: v } })}
                className="[&_[role=slider]]:bg-syn-violet [&_[role=slider]]:border-syn-violet"
              />
            </div>
            <div className="flex justify-between text-[10px] text-syn-text-muted mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        )}

        {d.config.maxTokens !== undefined && (
          <label className="block">
            <span className="text-xs font-ui text-syn-text-secondary mb-1 block">Max Tokens</span>
            <input
              type="number"
              value={d.config.maxTokens}
              onChange={(e) => updateNodeData(selectedNode.id, { config: { ...d.config, maxTokens: parseInt(e.target.value) || 0 } })}
              className="w-full h-8 px-3 text-sm font-ui bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
            />
          </label>
        )}

        {d.config.url !== undefined && (
          <label className="block">
            <span className="text-xs font-ui text-syn-text-secondary mb-1 block">URL</span>
            <input
              value={d.config.url}
              onChange={(e) => updateNodeData(selectedNode.id, { config: { ...d.config, url: e.target.value } })}
              className="w-full h-8 px-3 text-xs font-mono bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
            />
          </label>
        )}

        {d.config.method !== undefined && (
          <label className="block">
            <span className="text-xs font-ui text-syn-text-secondary mb-1 block">Method</span>
            <div className="grid grid-cols-4 gap-2">
              {['GET', 'POST', 'PUT', 'DELETE'].map(method => (
                <button
                  key={method}
                  onClick={() => updateNodeData(selectedNode.id, { config: { ...d.config, method } })}
                  className={cn(
                    'h-8 rounded-md text-xs font-ui transition-all',
                    d.config.method === method
                      ? 'bg-syn-violet text-foreground'
                      : 'bg-syn-raised border border-syn-border text-syn-text-secondary hover:bg-syn-hover'
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </label>
        )}
      </div>

      <button className="w-full h-9 bg-syn-violet text-foreground text-sm font-display font-semibold rounded-md hover:brightness-110 active:scale-[0.97] transition-all">
        Save Changes ⌘S
      </button>
    </div>
  );
}

function DebuggerTab() {
  const { timeline } = useExecutionStore();
  const { executionResults } = useWorkflowStore();
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      {/* Summary */}
      <div className="p-3 text-xs font-ui text-syn-text-secondary border-b border-syn-border flex items-center justify-between">
        <span>Last run: 2.3s · 4 nodes · 1 error</span>
        <div className="flex gap-1">
          <button className="px-2 py-1 rounded text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all text-[10px]">↺ Re-run</button>
          <button className="px-2 py-1 rounded text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all text-[10px]">✕ Clear</button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex gap-1 p-3 overflow-x-auto">
        {timeline.map((step) => (
          <button
            key={step.nodeId}
            onClick={() => setExpandedNode(step.nodeId === expandedNode ? null : step.nodeId)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-ui border transition-all relative overflow-hidden',
              step.status === 'success' && 'border-syn-teal/30 bg-syn-teal/10 text-syn-teal',
              step.status === 'error' && 'border-syn-red/30 bg-syn-red/10 text-syn-red',
              step.status === 'running' && 'border-syn-violet/30 bg-syn-violet/10 text-syn-violet',
              step.status === 'skipped' && 'border-syn-border bg-syn-raised text-syn-text-muted',
            )}
          >
            {step.status === 'running' && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: 'pillFill 1s ease-in-out forwards',
                }}
              />
            )}
            <span className="relative z-10">{step.icon}</span>
            <span className="relative z-10">{step.nodeName}</span>
            <span className="text-[9px] opacity-70 relative z-10">{step.duration}ms</span>
          </button>
        ))}
      </div>

      {/* Result Cards */}
      <div className="px-3 pb-3 space-y-2">
        {timeline.map((step) => {
          const result = executionResults[step.nodeId];
          if (!result) return null;
          const isOpen = expandedNode === step.nodeId;

          return (
            <button
              key={step.nodeId}
              onClick={() => setExpandedNode(isOpen ? null : step.nodeId)}
              className={cn(
                'w-full text-left p-3 rounded-md border transition-all',
                step.status === 'success' && 'border-syn-teal/30 bg-syn-teal/5 hover:bg-syn-teal/10',
                step.status === 'error' && 'border-syn-red/30 bg-syn-red/5 hover:bg-syn-red/10'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-display">{step.nodeName}</span>
                <span className={cn('text-[10px] font-mono', step.status === 'success' ? 'text-syn-teal' : 'text-syn-red')}>
                  {step.duration}ms
                </span>
              </div>

              {isOpen && result && (
                <div className="mt-3 pt-3 border-t border-syn-border/50 space-y-2 text-[11px] font-mono text-syn-text-secondary">
                  <div className="p-2 bg-syn-void/50 rounded truncate">
                    {JSON.stringify(result.output).substring(0, 100)}...
                  </div>
                  {result.error && (
                    <div className="p-2 bg-syn-red/5 rounded text-syn-red">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RightPanel() {
  const { rightPanelOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<'inspector' | 'debugger'>('inspector');

  if (!rightPanelOpen) return null;

  return (
    <div className="w-80 bg-syn-surface border-l border-syn-border flex flex-col shrink-0">
      {/* Tabs */}
      <div className="h-10 border-b border-syn-border flex">
        <button
          onClick={() => setActiveTab('inspector')}
          className={cn(
            'flex-1 text-xs font-ui transition-all',
            activeTab === 'inspector'
              ? 'text-foreground border-b-2 border-syn-violet'
              : 'text-syn-text-secondary hover:text-foreground'
          )}
        >
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('debugger')}
          className={cn(
            'flex-1 text-xs font-ui transition-all',
            activeTab === 'debugger'
              ? 'text-foreground border-b-2 border-syn-violet'
              : 'text-syn-text-secondary hover:text-foreground'
          )}
        >
          AI Debugger
        </button>
      </div>

      {/* Content */}
      {activeTab === 'inspector' && <InspectorTab />}
      {activeTab === 'debugger' && <DebuggerTab />}
    </div>
  );
}
