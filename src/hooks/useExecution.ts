import { useCallback, useRef } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useExecutionStore } from '@/stores/executionStore';
import { nanoid } from 'nanoid';

export function useExecution(workspaceId: string) {
  const { nodes, isRunning, setIsRunning, setNodeStatus, executionResults, setExecutionResults, addToast } = useWorkflowStore();
  const { addLog, setTimeline, setIsStreaming, clearLogs, setLiveChunk, setRunsRemaining, setNodeStatuses } = useExecutionStore();
  const cancelRef = useRef(false);

  const canRun = !isRunning && nodes.length > 0;

  const run = useCallback(async (userInput: string) => {
    if (!canRun) return;
    cancelRef.current = false;
    setIsRunning(true);
    setIsStreaming(true);
    clearLogs();

    const startTime = Date.now();
    const results: Record<string, any> = {};
    const statuses: Record<string, string> = {};
    const timelineSteps: any[] = [];

    addLog({ id: nanoid(), timestamp: new Date(), level: 'INFO', nodeName: 'System', message: `Workflow started — input: "${userInput || 'trigger'}"` });
    addLog({ id: nanoid(), timestamp: new Date(), level: 'DEBUG', nodeName: 'System', message: `Workspace: ${workspaceId} · Nodes: ${nodes.length}` });

    const orderedNodes = [...nodes].sort((a, b) => {
      const aType = (a.data as any).nodeType;
      const bType = (b.data as any).nodeType;
      if (aType === 'input' || aType === 'webhook') return -1;
      if (bType === 'input' || bType === 'webhook') return 1;
      if (aType === 'output') return 1;
      if (bType === 'output') return -1;
      return 0;
    });

    for (const node of orderedNodes) {
      if (cancelRef.current) {
        addLog({ id: nanoid(), timestamp: new Date(), level: 'WARN', nodeName: 'System', message: 'Execution cancelled by user' });
        break;
      }

      const d = node.data as any;
      const nodeId = node.id;

      statuses[nodeId] = 'running';
      setNodeStatuses({ ...statuses });
      setNodeStatus(nodeId, 'running');

      addLog({ id: nanoid(), timestamp: new Date(), level: 'INFO', nodeName: d.label, message: `Starting ${d.nodeType} node...` });

      const duration = Math.floor(Math.random() * 2000) + 200;
      const willFail = d.nodeType === 'http-request' && Math.random() > 0.5;

      await new Promise(r => setTimeout(r, Math.min(duration, 1500)));

      if (cancelRef.current) break;

      if (d.nodeType === 'agent' || d.nodeType === 'llm-call') {
        const chunks = ['Processing input...', ' Analyzing context...', ' Generating response...', ' Done.'];
        for (const chunk of chunks) {
          if (cancelRef.current) break;
          setLiveChunk(nodeId, (prev: string) => (prev || '') + chunk);
          await new Promise(r => setTimeout(r, 200));
        }
        setLiveChunk(nodeId, null);
      }

      if (willFail) {
        statuses[nodeId] = 'error';
        setNodeStatuses({ ...statuses });
        setNodeStatus(nodeId, 'error');
        addLog({ id: nanoid(), timestamp: new Date(), level: 'ERROR', nodeName: d.label, message: `Connection timeout after 5000ms — ${d.config?.url || 'endpoint'}` });
        results[nodeId] = { nodeId, status: 'error', duration, error: 'Connection timeout after 5000ms' };
        timelineSteps.push({ nodeId, nodeName: d.label, status: 'error', duration, icon: d.icon || '❌' });
      } else {
        statuses[nodeId] = 'success';
        setNodeStatuses({ ...statuses });
        setNodeStatus(nodeId, 'success');
        addLog({ id: nanoid(), timestamp: new Date(), level: 'INFO', nodeName: d.label, message: `Completed in ${duration}ms` });
        results[nodeId] = { nodeId, status: 'success', duration, output: { result: `Output from ${d.label}` } };
        timelineSteps.push({ nodeId, nodeName: d.label, status: 'success', duration, icon: d.icon || '✅' });

        await new Promise(r => setTimeout(r, 300));
        if (!cancelRef.current) {
          statuses[nodeId] = 'idle';
          setNodeStatuses({ ...statuses });
          setNodeStatus(nodeId, 'idle');
        }
      }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    const errorCount = timelineSteps.filter(s => s.status === 'error').length;

    addLog({ id: nanoid(), timestamp: new Date(), level: 'INFO', nodeName: 'System', message: `Workflow finished in ${totalDuration}s · ${errorCount} error(s)` });

    setExecutionResults(results);
    setTimeline(timelineSteps);
    setIsRunning(false);
    setIsStreaming(false);
    setRunsRemaining(prev => Math.max(0, (prev ?? 100) - 1));

    if (!cancelRef.current) {
      if (errorCount > 0) {
        addToast({ type: 'error', message: `Workflow completed with ${errorCount} error(s)` });
      } else {
        addToast({ type: 'success', message: `Workflow completed in ${totalDuration}s` });
      }
    }
  }, [canRun, nodes, workspaceId, setIsRunning, setIsStreaming, clearLogs, addLog, setTimeline, setNodeStatus, setExecutionResults, addToast, setLiveChunk, setRunsRemaining, setNodeStatuses]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setIsRunning(false);
    setIsStreaming(false);
    nodes.forEach(n => setNodeStatus(n.id, 'idle'));
    addToast({ type: 'info', message: 'Workflow execution cancelled' });
  }, [nodes, setIsRunning, setIsStreaming, setNodeStatus, addToast]);

  return { run, cancel, canRun };
}
