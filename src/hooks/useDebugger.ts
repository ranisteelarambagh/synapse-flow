import { useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useExecutionStore } from '@/stores/executionStore';
import { nanoid } from 'nanoid';

const FIX_SUGGESTIONS: Record<string, { field: string; value: any; explanation: string }> = {
  'http-request': {
    field: 'url',
    value: 'https://api.example.com/v2/endpoint',
    explanation: 'The URL appears to be unreachable. Suggested fix: use v2 endpoint with retry logic.',
  },
  default: {
    field: 'systemPrompt',
    value: 'You are a helpful assistant. Handle errors gracefully and return structured JSON.',
    explanation: 'Adding error handling instructions to the system prompt should improve reliability.',
  },
};

export function useDebugger() {
  const { nodes, updateNodeData, setFixStreaming, setFixSuggestion, addToast } = useWorkflowStore();
  const { addLog } = useExecutionStore();

  const requestFix = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const d = node.data as any;
    setFixStreaming(true);
    setFixSuggestion(null);

    const suggestion = FIX_SUGGESTIONS[d.nodeType] || FIX_SUGGESTIONS.default;

    const words = suggestion.explanation.split(' ');
    let streamed = '';

    for (const word of words) {
      await new Promise(r => setTimeout(r, 60));
      streamed += (streamed ? ' ' : '') + word;
      setFixStreaming(true);
    }

    setFixStreaming(false);
    setFixSuggestion({
      nodeId,
      field: suggestion.field,
      value: suggestion.value,
      explanation: suggestion.explanation,
    });

    addLog({
      id: nanoid(),
      timestamp: new Date(),
      level: 'DEBUG',
      nodeName: d.label,
      message: `Fix suggestion generated for ${d.nodeType} node`,
    });
  }, [nodes, setFixStreaming, setFixSuggestion, addLog]);

  const applyFix = useCallback((nodeId: string, field: string, value: any) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const d = node.data as any;
    updateNodeData(nodeId, { config: { ...d.config, [field]: value } });
    setFixSuggestion(null);
    addToast({ type: 'success', message: 'Fix applied to node configuration' });
  }, [nodes, updateNodeData, setFixSuggestion, addToast]);

  const scoreHallucination = useCallback(async (nodeId: string): Promise<number> => {
    await new Promise(r => setTimeout(r, 600));
    return Math.round(Math.random() * 40 + 10);
  }, []);

  return { requestFix, applyFix, scoreHallucination };
}
