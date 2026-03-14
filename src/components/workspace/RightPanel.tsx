import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useExecutionStore } from '@/stores/executionStore';
import type { Node } from '@xyflow/react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

// --- Inspector Tab ---
function InspectorTab() {
  const { nodes, selectedNodeId, updateNodeData } = useWorkflowStore();
  const selectedNode = useMemo(
    () => (nodes as Node<NodeData>[]).find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  if (!selectedNode) {
    return (
      <div className="p-4 text-sm text-syn-text-secondary font-ui">
        <p className="text-syn-text-muted mb-2 text-xs font-mono">No node selected</p>
        <p>Select a node on the canvas to view and edit its configuration.</p>
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
        <p className="text-[10px] font-mono text-syn-text-muted">{selectedNode.id}</p>
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
            <span className="text-xs font-ui text-syn-text-secondary mb-1 block">System Prompt</span>
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
            <select
              value={d.config.model}
              onChange={(e) => updateNodeData(selectedNode.id, { config: { ...d.config, model: e.target.value } })}
              className="w-full h-8 px-3 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
            >
              <option value="llama-3.3-70b">llama-3.3-70b · Groq · FREE</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash · Google · FREE</option>
              <option value="mistral-7b">mistral-7b · Mistral · FREE</option>
              <option value="gpt-4o">gpt-4o · OpenAI · PAID</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet · Anthropic · PAID</option>
            </select>
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
            <select
              value={d.config.method}
              onChange={(e) => updateNodeData(selectedNode.id, { config: { ...d.config, method: e.target.value } })}
              className="w-full h-8 px-3 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </label>
        )}
      </div>

      <button className="w-full h-9 bg-syn-violet text-foreground text-sm font-display font-semibold rounded-md hover:brightness-110 active:scale-[0.97] transition-all">
        Save Changes ⌘S
      </button>
    </div>
  );
}

// --- AI Debugger Tab ---
function DebuggerTab() {
  const { timeline } = useExecutionStore();
  const { executionResults } = useWorkflowStore();
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    success: 'bg-syn-teal text-syn-teal',
    error: 'bg-syn-red text-syn-red',
    running: 'bg-syn-violet text-syn-violet',
    skipped: 'bg-syn-text-muted text-syn-text-muted',
  };

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
        {timeline.map((step, i) => (
          <button
            key={step.nodeId}
            onClick={() => setExpandedNode(step.nodeId === expandedNode ? null : step.nodeId)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-ui border transition-all',
              step.status === 'success' && 'border-syn-teal/30 bg-syn-teal/10 text-syn-teal',
              step.status === 'error' && 'border-syn-red/30 bg-syn-red/10 text-syn-red',
              step.status === 'running' && 'border-syn-violet/30 bg-syn-violet/10 text-syn-violet',
              step.status === 'skipped' && 'border-syn-border bg-syn-raised text-syn-text-muted',
            )}
          >
            <span>{step.icon}</span>
            <span>{step.nodeName}</span>
            <span className="text-[9px] opacity-70">{step.duration}ms</span>
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
            <div key={step.nodeId} className="border border-syn-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedNode(isOpen ? null : step.nodeId)}
                className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-syn-hover transition-all"
              >
                <span className="text-xs">{step.icon}</span>
                <span className="text-xs font-display font-medium text-foreground flex-1">{step.nodeName}</span>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded', statusColors[step.status]?.split(' ')[0] + '/20', statusColors[step.status]?.split(' ')[1])}>
                  {step.status}
                </span>
                <span className="text-[10px] text-syn-text-muted">{step.duration}ms</span>
              </button>

              {isOpen && (
                <div className="border-t border-syn-border p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  {result.input && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-syn-text-muted font-ui">Input</span>
                      <pre className="text-[11px] font-mono text-syn-text-code bg-syn-void p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {result.output && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-syn-text-muted font-ui">Output</span>
                      <pre className="text-[11px] font-mono text-syn-text-code bg-syn-void p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.output, null, 2)}
                      </pre>
                    </div>
                  )}
                  {result.error && (
                    <div>
                      <p className="text-xs font-mono text-syn-red mb-2">{result.error}</p>
                      <button className="text-xs font-ui text-syn-violet border border-syn-violet/30 rounded px-3 py-1.5 hover:bg-syn-violet/10 transition-all">
                        🔮 Suggest Fix
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Comments Tab ---
function CommentsTab() {
  const { comments, selectedNodeId } = useWorkflowStore();
  const filtered = selectedNodeId
    ? comments.filter((c) => c.nodeId === selectedNodeId)
    : comments;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 && (
          <p className="text-xs text-syn-text-muted font-ui">No comments yet.</p>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-syn-teal/20 flex items-center justify-center text-[10px] font-bold text-syn-teal">
                {c.userName.split(' ').map((n) => n[0]).join('')}
              </div>
              <span className="text-xs font-ui font-bold text-foreground">{c.userName}</span>
              <span className="text-[10px] text-syn-text-muted">
                {Math.round((Date.now() - c.timestamp.getTime()) / 60000)}m ago
              </span>
            </div>
            <p className="text-[13px] font-ui text-foreground pl-9">{c.text}</p>
            <div className="pl-9 flex gap-1">
              {Object.entries(c.reactions).map(([emoji, users]) => (
                <button key={emoji} className="text-xs px-1.5 py-0.5 rounded bg-syn-raised border border-syn-border hover:border-syn-border-active transition-all">
                  {emoji} {users.length}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-syn-border">
        <textarea
          placeholder="Add a comment..."
          rows={2}
          className="w-full px-3 py-2 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground placeholder:text-syn-text-muted resize-none focus:outline-none focus:border-syn-violet transition-all"
        />
      </div>
    </div>
  );
}

// --- Right Panel ---
export default function RightPanel() {
  const { activeRightTab, setActiveRightTab } = useUIStore();

  const tabs = [
    { id: 'inspector' as const, label: 'Inspector' },
    { id: 'debugger' as const, label: 'AI Debugger' },
    { id: 'comments' as const, label: 'Comments' },
  ];

  return (
    <div className="h-full bg-syn-surface flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="h-11 flex items-center border-b border-syn-border relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRightTab(tab.id)}
            className={cn(
              'flex-1 h-full text-xs font-ui transition-colors relative',
              activeRightTab === tab.id ? 'text-foreground' : 'text-syn-text-muted hover:text-syn-text-secondary'
            )}
          >
            {tab.label}
            {activeRightTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-syn-violet rounded-full transition-all duration-250" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeRightTab === 'inspector' && <InspectorTab />}
        {activeRightTab === 'debugger' && <DebuggerTab />}
        {activeRightTab === 'comments' && <CommentsTab />}
      </div>
    </div>
  );
}
