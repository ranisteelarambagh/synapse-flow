import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type NodeData, type Comment } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useDebugger } from '@/hooks/useDebugger';
import { NODE_CONFIGS, MODELS, type FieldConfig } from '@/lib/nodeConfigs';
import type { Node } from '@xyflow/react';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, X, Send, Smile, Trash2, Loader2, CheckCheck, Bug, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';

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
        <span className="truncate">{MODELS.find(m => m.value === value)?.label || value}</span>
        <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-syn-raised border border-syn-border rounded-md shadow-lg max-h-56 overflow-y-auto">
            <div className="p-2 sticky top-0 bg-syn-raised border-b border-syn-border">
              <input
                autoFocus
                placeholder="Search models..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                className="w-full h-7 px-2 text-xs font-ui bg-syn-hover border border-syn-border rounded text-foreground focus:outline-none focus:border-syn-violet"
              />
            </div>
            {filtered.map(model => (
              <button
                key={model.value}
                onClick={() => { onChange(model.value); setOpen(false); setSearch(''); }}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs font-ui hover:bg-syn-hover transition-colors',
                  value === model.value && 'bg-syn-violet/20 text-syn-violet'
                )}
              >
                {model.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FieldRenderer({ field, value, onChange }: { field: FieldConfig; value: any; onChange: (v: any) => void }) {
  switch (field.type) {
    case 'textarea':
    case 'code':
      return (
        <label className="block">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-ui text-syn-text-secondary">{field.label}</span>
            {field.type === 'textarea' && (
              <span className="text-[10px] font-mono text-syn-text-muted">{(value || '').length} / ∞</span>
            )}
          </div>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(
              'w-full px-3 py-2 text-xs bg-syn-raised border border-syn-border rounded-md text-foreground resize-y min-h-[80px] max-h-[200px] focus:outline-none focus:border-syn-violet transition-all',
              field.monospace ? 'font-mono' : 'font-ui'
            )}
          />
        </label>
      );

    case 'select':
      return field.key === 'model' ? (
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">{field.label}</span>
          <ModelDropdown value={value || ''} onChange={onChange} />
        </label>
      ) : (
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">{field.label}</span>
          <div className="relative">
            <select
              value={value || ''}
              onChange={e => onChange(e.target.value)}
              className="w-full h-8 px-3 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground appearance-none focus:outline-none focus:border-syn-violet transition-all pr-8"
            >
              {(field.options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-syn-text-muted pointer-events-none" />
          </div>
        </label>
      );

    case 'slider':
      return (
        <div>
          <span className="text-xs font-ui text-syn-text-secondary mb-2 block">
            {field.label}: {value ?? field.min ?? 0}
          </span>
          <div className="px-1">
            <Slider
              value={[value ?? field.min ?? 0]}
              min={field.min ?? 0}
              max={field.max ?? 1}
              step={field.step ?? 0.1}
              onValueChange={([v]) => onChange(v)}
              className="[&_[role=slider]]:bg-syn-violet [&_[role=slider]]:border-syn-violet"
            />
          </div>
          {field.description && (
            <div className="flex justify-between text-[10px] text-syn-text-muted mt-1">
              {field.description.split('→').map((s, i) => <span key={i}>{s.trim()}</span>)}
            </div>
          )}
        </div>
      );

    case 'number':
      return (
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">{field.label}</span>
          <input
            type="number"
            value={value ?? ''}
            onChange={e => onChange(parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className="w-full h-8 px-3 text-sm font-ui bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
          />
        </label>
      );

    case 'url':
    case 'text':
      return (
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">{field.label}</span>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              'w-full h-8 px-3 text-sm bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all',
              field.type === 'url' ? 'font-mono text-xs' : 'font-ui'
            )}
          />
        </label>
      );

    case 'method-group':
      return (
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">Method</span>
          <div className="grid grid-cols-4 gap-1.5">
            {['GET', 'POST', 'PUT', 'DELETE'].map(method => (
              <button
                key={method}
                onClick={() => onChange(method)}
                className={cn(
                  'h-8 rounded-md text-xs font-ui transition-all',
                  value === method
                    ? 'bg-syn-violet text-white'
                    : 'bg-syn-raised border border-syn-border text-syn-text-secondary hover:bg-syn-hover'
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </label>
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between">
          <span className="text-xs font-ui text-syn-text-secondary">{field.label}</span>
          <button
            onClick={() => onChange(!value)}
            className={cn(
              'w-9 h-5 rounded-full transition-all duration-200 relative',
              value ? 'bg-syn-violet' : 'bg-syn-border-active'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                value ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      );

    case 'tags': {
      const tags: string[] = Array.isArray(value) ? value : [];
      return (
        <label className="block">
          <span className="text-xs font-ui text-syn-text-secondary mb-1 block">{field.label}</span>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-syn-violet/20 text-syn-violet rounded text-xs font-ui">
                {tag}
                <button onClick={() => onChange(tags.filter((_, j) => j !== i))}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder={field.placeholder || 'Add and press Enter'}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onChange([...tags, e.currentTarget.value.trim()]);
                e.currentTarget.value = '';
              }
            }}
            className="w-full h-7 px-2 text-xs font-ui bg-syn-raised border border-syn-border rounded text-foreground focus:outline-none focus:border-syn-violet transition-all"
          />
        </label>
      );
    }

    default:
      return null;
  }
}

function InspectorTab() {
  const { nodes, selectedNodeId, updateNodeData, workspaceName, setWorkspaceName, workflowDescription, setWorkflowDescription } = useWorkflowStore();
  const [workflowEditing, setWorkflowEditing] = useState(false);
  const [workflowEditValue, setWorkflowEditValue] = useState(workspaceName);

  const selectedNode = useMemo(
    () => (nodes as Node<NodeData>[]).find(n => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  if (!selectedNode) {
    return (
      <div className="p-4 space-y-4 overflow-y-auto h-full">
        <div>
          <span className="text-xs font-ui text-syn-text-secondary mb-2 block">Workflow Name</span>
          {workflowEditing ? (
            <input
              autoFocus
              value={workflowEditValue}
              onChange={e => setWorkflowEditValue(e.target.value)}
              onBlur={() => {
                setWorkflowEditing(false);
                if (workflowEditValue.trim()) setWorkspaceName(workflowEditValue.trim());
                else setWorkflowEditValue(workspaceName);
              }}
              onKeyDown={e => { if (e.key === 'Enter') { setWorkflowEditing(false); if (workflowEditValue.trim()) setWorkspaceName(workflowEditValue.trim()); } }}
              className="w-full h-8 px-3 text-sm font-ui bg-syn-raised border border-syn-border-active rounded-md text-foreground focus:outline-none caret-syn-violet"
            />
          ) : (
            <button
              onDoubleClick={() => { setWorkflowEditing(true); setWorkflowEditValue(workspaceName); }}
              className="w-full h-8 px-3 text-sm font-ui text-left text-foreground hover:bg-syn-hover rounded-md transition-all"
            >
              {workspaceName}
            </button>
          )}
        </div>
        <div>
          <span className="text-xs font-ui text-syn-text-secondary mb-2 block">Description</span>
          <textarea
            value={workflowDescription}
            onChange={e => setWorkflowDescription(e.target.value)}
            placeholder="Describe what this workflow does..."
            className="w-full px-3 py-2 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground resize-y min-h-[80px] max-h-[200px] focus:outline-none focus:border-syn-violet transition-all"
          />
        </div>
        <div className="pt-4 border-t border-syn-border">
          <span className="text-[11px] font-ui text-syn-text-secondary">
            {nodes.length} nodes · {nodes.length > 0 ? nodes.length - 1 : 0} edges · 0 runs
          </span>
        </div>
        <div className="text-[10px] font-ui text-syn-text-muted">Last saved: just now</div>
      </div>
    );
  }

  const d = selectedNode.data as unknown as NodeData;
  const nodeConfig = NODE_CONFIGS[d.nodeType];
  const fields = nodeConfig?.fields || [];

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{d.icon}</span>
          <span className="text-base font-display font-medium text-foreground">{d.label}</span>
          <span className={cn(
            'ml-auto text-[10px] px-1.5 py-0.5 rounded font-ui',
            d.status === 'running' ? 'bg-syn-teal/20 text-syn-teal' :
            d.status === 'success' ? 'bg-green-500/20 text-green-400' :
            d.status === 'error' ? 'bg-syn-red/20 text-syn-red' :
            'bg-syn-raised text-syn-text-muted'
          )}>
            {d.status}
          </span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`node_${selectedNode.id.substring(0, 6)}`)}
          className="text-[10px] font-mono text-syn-text-muted hover:text-syn-text-secondary transition-colors"
          title="Click to copy"
        >
          node_{selectedNode.id.substring(0, 6)}
        </button>
      </div>

      {/* Node Name */}
      <label className="block">
        <span className="text-xs font-ui text-syn-text-secondary mb-1 block">Node Name</span>
        <input
          value={d.label}
          onChange={e => updateNodeData(selectedNode.id, { label: e.target.value })}
          className="w-full h-8 px-3 text-sm font-ui bg-syn-raised border border-syn-border rounded-md text-foreground focus:outline-none focus:border-syn-violet transition-all"
        />
      </label>

      {/* Dynamic fields from NODE_CONFIGS */}
      {fields.map(field => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={d.config[field.key]}
          onChange={v => updateNodeData(selectedNode.id, { config: { ...d.config, [field.key]: v } })}
        />
      ))}

      <button
        onClick={() => useWorkflowStore.getState().addToast({ type: 'success', message: 'Node configuration saved!' })}
        className="w-full h-9 bg-syn-violet text-white text-sm font-display font-semibold rounded-md hover:brightness-110 active:scale-[0.97] transition-all"
        data-testid="button-save-node"
      >
        Save Changes ⌘S
      </button>
    </div>
  );
}

function DebuggerTab() {
  const { timeline, liveChunks } = useExecutionStore();
  const { executionResults, selectedNodeId, fixStreaming, fixSuggestion } = useWorkflowStore();
  const { requestFix, applyFix, scoreHallucination } = useDebugger();
  const [expandedNode, setExpandedNode] = useState<string | null>(selectedNodeId);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scoring, setScoring] = useState<string | null>(null);

  const handleScore = async (nodeId: string) => {
    setScoring(nodeId);
    const score = await scoreHallucination(nodeId);
    setScores(prev => ({ ...prev, [nodeId]: score }));
    setScoring(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 text-xs font-ui text-syn-text-secondary border-b border-syn-border flex items-center justify-between">
        <span>
          Last run: {timeline.length}  nodes ·{' '}
          {timeline.filter(s => s.status === 'error').length} errors
        </span>
        <div className="flex gap-1">
          <button className="px-2 py-1 rounded text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all text-[10px]">↺ Re-run</button>
          <button className="px-2 py-1 rounded text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all text-[10px]">✕ Clear</button>
        </div>
      </div>

      {/* Timeline pills */}
      <div className="flex gap-1 p-3 overflow-x-auto flex-wrap">
        {timeline.map(step => (
          <button
            key={step.nodeId}
            onClick={() => setExpandedNode(step.nodeId === expandedNode ? null : step.nodeId)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-ui border transition-all relative overflow-hidden',
              step.status === 'success' && 'border-green-500/30 bg-green-500/10 text-green-400',
              step.status === 'error' && 'border-syn-red/30 bg-syn-red/10 text-syn-red',
              step.status === 'running' && 'border-syn-violet/30 bg-syn-violet/10 text-syn-violet',
              step.status === 'skipped' && 'border-syn-border bg-syn-raised text-syn-text-muted',
            )}
          >
            {step.status === 'running' && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ animation: 'pillFill 1.5s ease-in-out infinite' }}
              />
            )}
            <span className="relative z-10">{step.icon}</span>
            <span className="relative z-10">{step.nodeName}</span>
            <span className="text-[9px] opacity-70 relative z-10">{step.duration}ms</span>
          </button>
        ))}
      </div>

      {/* Live chunk */}
      {Object.entries(liveChunks).filter(([_, v]) => v).map(([nodeId, chunk]) => (
        <div key={nodeId} className="mx-3 mb-2 p-2 bg-syn-violet/10 border border-syn-violet/30 rounded text-xs font-mono text-syn-text-code animate-fade-in-up">
          <span className="text-[10px] text-syn-violet font-ui block mb-1">Live output</span>
          {chunk}
          <span className="animate-pulse">▊</span>
        </div>
      ))}

      {/* Fix suggestion */}
      {fixSuggestion && (
        <div className="mx-3 mb-3 p-3 bg-syn-teal/10 border border-syn-teal/30 rounded-md animate-fade-in-up">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-syn-teal" />
            <span className="text-xs font-ui text-syn-teal font-medium">AI Suggested Fix</span>
          </div>
          <p className="text-[11px] font-ui text-syn-text-secondary mb-2">{fixSuggestion.explanation}</p>
          <div className="p-2 bg-syn-void/40 rounded text-[10px] font-mono text-foreground mb-2">
            {fixSuggestion.field}: {JSON.stringify(fixSuggestion.value)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => applyFix(fixSuggestion.nodeId, fixSuggestion.field, fixSuggestion.value)}
              className="flex-1 h-7 bg-syn-teal text-black text-xs font-ui font-medium rounded hover:brightness-110 transition-all"
            >
              Apply Fix
            </button>
            <button
              onClick={() => useWorkflowStore.getState().setFixSuggestion(null)}
              className="h-7 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Result Cards */}
      <div className="px-3 pb-3 space-y-2">
        {timeline.map(step => {
          const result = executionResults[step.nodeId];
          if (!result) return null;
          const isOpen = expandedNode === step.nodeId;

          return (
            <div key={step.nodeId} className={cn(
              'rounded-md border transition-all',
              step.status === 'success' && 'border-green-500/30 bg-green-500/5',
              step.status === 'error' && 'border-syn-red/30 bg-syn-red/5',
              step.status === 'skipped' && 'border-syn-border bg-syn-raised',
            )}>
              <button
                onClick={() => setExpandedNode(isOpen ? null : step.nodeId)}
                className="w-full p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-display text-foreground">{step.nodeName}</span>
                  <span className={cn('text-[10px] font-mono', step.status === 'success' ? 'text-green-400' : step.status === 'error' ? 'text-syn-red' : 'text-syn-text-muted')}>
                    {step.duration}ms
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-syn-border/40 pt-2">
                  {result.output && (
                    <div className="p-2 bg-syn-void/50 rounded text-[10px] font-mono text-syn-text-secondary">
                      {JSON.stringify(result.output).substring(0, 120)}...
                    </div>
                  )}
                  {result.error && (
                    <div className="p-2 bg-syn-red/5 rounded text-[10px] font-mono text-syn-red">
                      {result.error}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {step.status === 'error' && (
                      <button
                        onClick={() => requestFix(step.nodeId)}
                        disabled={fixStreaming}
                        className="flex-1 h-7 flex items-center justify-center gap-1.5 bg-syn-red/20 text-syn-red text-[11px] font-ui rounded hover:bg-syn-red/30 transition-all disabled:opacity-50"
                      >
                        {fixStreaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bug className="w-3 h-3" />}
                        Suggest Fix
                      </button>
                    )}
                    <button
                      onClick={() => handleScore(step.nodeId)}
                      disabled={scoring === step.nodeId}
                      className="flex-1 h-7 flex items-center justify-center gap-1.5 bg-syn-violet/10 text-syn-violet text-[11px] font-ui rounded hover:bg-syn-violet/20 transition-all"
                    >
                      {scoring === step.nodeId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {scores[step.nodeId] !== undefined ? `Score: ${scores[step.nodeId]}%` : 'Score'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const QUICK_EMOJIS = ['👍', '❤️', '💡', '🔥', '😮', '✅'];

function CommentCard({ comment, onReact, onDelete }: { comment: Comment; onReact: (id: string, emoji: string) => void; onDelete: (id: string) => void }) {
  const [showEmojis, setShowEmojis] = useState(false);
  const relTime = (() => {
    const m = Math.round((Date.now() - comment.timestamp.getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  })();

  return (
    <div className="p-3 rounded-md bg-syn-raised border border-syn-border hover:border-syn-border-active transition-all group animate-fade-in-up">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-syn-violet/20 flex items-center justify-center text-[10px] font-bold text-syn-violet">
            {comment.userName.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-[12px] font-ui font-medium text-foreground">{comment.userName}</span>
          <span className="text-[10px] text-syn-text-muted">{relTime}</span>
        </div>
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 text-syn-text-muted hover:text-syn-red transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <p className="text-[12px] font-ui text-syn-text-secondary leading-relaxed mb-2">{comment.text}</p>
      <div className="flex items-center gap-1 flex-wrap">
        {Object.entries(comment.reactions).map(([emoji, users]) => (
          users.length > 0 && (
            <button
              key={emoji}
              onClick={() => onReact(comment.id, emoji)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-syn-hover border border-syn-border hover:border-syn-border-active text-[11px] transition-all"
            >
              <span>{emoji}</span>
              <span className="text-[10px] text-syn-text-muted">{users.length}</span>
            </button>
          )
        ))}
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="text-syn-text-muted hover:text-foreground transition-colors ml-1"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        {showEmojis && (
          <div className="flex gap-1 animate-fade-in-up">
            {QUICK_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => { onReact(comment.id, e); setShowEmojis(false); }}
                className="text-base hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsTab() {
  const { comments, selectedNodeId, addComment, removeComment, addReaction } = useWorkflowStore();
  const [newText, setNewText] = useState('');

  const nodeComments = useMemo(
    () => comments.filter(c => c.nodeId === selectedNodeId),
    [comments, selectedNodeId]
  );

  const handleSubmit = () => {
    if (!newText.trim()) return;
    addComment({
      id: nanoid(),
      nodeId: selectedNodeId || undefined,
      userId: 'local-user',
      userName: 'You',
      text: newText.trim(),
      timestamp: new Date(),
      reactions: {},
    });
    setNewText('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-syn-border">
        <p className="text-[11px] font-ui text-syn-text-muted">
          {selectedNodeId ? `Comments on node · ${nodeComments.length} total` : 'Select a node to view its comments'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {nodeComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-syn-text-muted font-ui">No comments yet.</p>
            <p className="text-[11px] text-syn-text-muted font-ui mt-1">Be the first to add a note!</p>
          </div>
        ) : (
          nodeComments.map(c => (
            <CommentCard
              key={c.id}
              comment={c}
              onReact={(id, emoji) => addReaction(id, emoji, 'local-user')}
              onDelete={removeComment}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-syn-border">
        <div className="flex gap-2">
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
            placeholder="Add a comment... (⌘↵ to send)"
            rows={2}
            className="flex-1 px-3 py-2 text-xs font-ui bg-syn-raised border border-syn-border rounded-md text-foreground resize-none focus:outline-none focus:border-syn-violet transition-all"
          />
          <button
            onClick={handleSubmit}
            disabled={!newText.trim()}
            className="w-9 h-full flex items-center justify-center bg-syn-violet text-white rounded-md hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RightPanel() {
  const { rightPanelOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<'inspector' | 'debugger' | 'comments'>('inspector');

  if (!rightPanelOpen) return null;

  const tabs = [
    { id: 'inspector' as const, label: 'Inspector' },
    { id: 'debugger' as const, label: 'AI Debugger' },
    { id: 'comments' as const, label: 'Comments' },
  ];

  return (
    <div className="w-80 bg-syn-surface border-l border-syn-border flex flex-col shrink-0">
      <div className="h-10 border-b border-syn-border flex shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 text-xs font-ui transition-all relative',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-syn-text-secondary hover:text-foreground'
            )}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-syn-violet" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'inspector' && <InspectorTab />}
        {activeTab === 'debugger' && <DebuggerTab />}
        {activeTab === 'comments' && <CommentsTab />}
      </div>
    </div>
  );
}
