import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  type Connection,
  type Node,
  type NodeDragHandler,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SynapseNode from './SynapseNode';
import FlowEdge from './FlowEdge';
import NodeContextMenu from './NodeContextMenu';
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useCanvasApiStore } from '@/stores/canvasApiStore';
import { mockNodes, mockEdges, mockExecutionResults } from '@/lib/mockData';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';

const nodeTypes = { synapse: SynapseNode };
const edgeTypes = { flow: FlowEdge };
const defaultEdgeOptions = { type: 'flow' };

// ─── Context menu state ───────────────────────────────────────────────────────
interface CtxMenu { x: number; y: number; nodeId: string; nodeLabel: string; }

// ─── Collaboration cursors ─────────────────────────────────────────────────────
function CollabCursors() {
  const { collaborators } = useCollaborationStore();
  return (
    <>
      {collaborators.filter(c => c.cursor).map(c => (
        <div key={c.id} className="collab-cursor"
          style={{ left: c.cursor!.x, top: c.cursor!.y, transition: 'left 80ms linear, top 80ms linear' }}>
          <svg width="18" height="22" viewBox="0 0 18 22">
            <path d="M0 0 L0 18 L5 14 L9 22 L11 21 L7 13 L14 13 Z"
              fill={c.color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.5} />
          </svg>
          <span className="absolute top-5 left-3.5 px-1.5 py-0.5 rounded text-[10px] font-ui font-semibold text-white whitespace-nowrap shadow-md"
            style={{ background: c.color }}>
            {c.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </>
  );
}

// ─── Running overlay shimmer ───────────────────────────────────────────────────
function RunningOverlay() {
  const isStreaming = useExecutionStore(s => s.isStreaming);
  if (!isStreaming) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(108,99,255,0.04) 0%, transparent 70%)',
        animation: 'gradient-shift 3s ease infinite',
      }} />
  );
}

// ─── Empty canvas hint ─────────────────────────────────────────────────────────
function EmptyHint({ nodeCount }: { nodeCount: number }) {
  if (nodeCount > 0) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
      <div className="flex flex-col items-center gap-3 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-syn-violet/10 border border-syn-violet/20 flex items-center justify-center text-3xl animate-float">
          🤖
        </div>
        <div className="text-[15px] font-display font-semibold text-syn-text-secondary">
          Drop nodes to start building
        </div>
        <div className="text-[12px] font-ui text-syn-text-muted max-w-[200px]">
          Drag from the left panel, or press ⌘K to search and add nodes
        </div>
      </div>
    </div>
  );
}

// ─── Inner canvas ─────────────────────────────────────────────────────────────
function CanvasInner() {
  const {
    selectNode, selectedNodeId,
    setExecutionResults,
    setNodes: storeSetNodes,
    setEdges: storeSetEdges,
    removeNode: storeRemoveNode,
    duplicateNode: storeDuplicateNode,
    disconnectNode: storeDisconnectNode,
    addToast,
  } = useWorkflowStore();
  const { updateCursor } = useCollaborationStore();
  const { register, unregister } = useCanvasApiStore();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(mockNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    mockEdges.map(e => ({ ...e, type: 'flow' }))
  );
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const initialized = useRef(false);
  const lastCursorUpdate = useRef(0);

  // ── One-time init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    useWorkflowStore.setState({
      nodes: mockNodes as Node<NodeData>[],
      edges: mockEdges,
      unsavedChanges: false,
    });
    setExecutionResults(mockExecutionResults);
    selectNode('agent-1');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Canvas API bus ─────────────────────────────────────────────────────────
  useEffect(() => {
    register({
      addNode: (node: Node<NodeData>) => {
        setNodes(nds => {
          const next = [...nds, node];
          storeSetNodes(next as Node<NodeData>[]);
          return next;
        });
      },
      setEdgeAnimating: (edgeId: string, animating: boolean) => {
        setEdges(eds => eds.map(e => e.id === edgeId ? { ...e, animated: animating } : e));
      },
      fitView: () => {
        setTimeout(() => fitView({ duration: 500, padding: 0.15 }), 50);
      },
    });
    return () => unregister();
  }, [register, unregister, setNodes, setEdges, storeSetNodes, fitView]);

  // ── Delete selected node via keyboard ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      if (inInput) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedNodeId) {
        e.preventDefault();
        handleDuplicateNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Node delete ─────────────────────────────────────────────────────────────
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => {
      const next = nds.filter(n => n.id !== nodeId);
      storeSetNodes(next as Node<NodeData>[]);
      return next;
    });
    setEdges(eds => {
      const next = eds.filter(e => e.source !== nodeId && e.target !== nodeId);
      storeSetEdges(next);
      return next;
    });
    storeRemoveNode(nodeId);
    addToast({ type: 'info', message: 'Node deleted' });
    setCtxMenu(null);
  }, [setNodes, setEdges, storeSetNodes, storeSetEdges, storeRemoveNode, addToast]);

  // ── Node duplicate ──────────────────────────────────────────────────────────
  const handleDuplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newId = `${nodeId}-copy-${nanoid(4)}`;
    const newNode: Node<NodeData> = {
      ...node,
      id: newId,
      position: { x: node.position.x + 48, y: node.position.y + 48 },
      selected: false,
      data: { ...(node.data as NodeData) },
    };
    setNodes(nds => {
      const next = [...nds, newNode];
      storeSetNodes(next as Node<NodeData>[]);
      return next;
    });
    storeDuplicateNode(nodeId);
    selectNode(newId);
    addToast({ type: 'success', message: 'Node duplicated' });
    setCtxMenu(null);
  }, [nodes, setNodes, storeSetNodes, storeDuplicateNode, selectNode, addToast]);

  // ── Disconnect edges ────────────────────────────────────────────────────────
  const handleDisconnectNode = useCallback((nodeId: string) => {
    setEdges(eds => {
      const next = eds.filter(e => e.source !== nodeId && e.target !== nodeId);
      storeSetEdges(next);
      return next;
    });
    storeDisconnectNode(nodeId);
    addToast({ type: 'info', message: 'Edges disconnected' });
    setCtxMenu(null);
  }, [setEdges, storeSetEdges, storeDisconnectNode, addToast]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const next = addEdge({ ...connection, type: 'flow' }, eds);
      storeSetEdges(next);
      return next;
    });
  }, [setEdges, storeSetEdges]);

  const onNodeDragStop: NodeDragHandler = useCallback((_event, _node, allNodes) => {
    storeSetNodes(allNodes as Node<NodeData>[]);
  }, [storeSetNodes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    selectNode(node.id);
    setCtxMenu(null);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
    setCtxMenu(null);
  }, [selectNode]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    selectNode(node.id);
    setCtxMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeLabel: (node.data as NodeData).label,
    });
  }, [selectNode]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastCursorUpdate.current < 50) return;
    lastCursorUpdate.current = now;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    updateCursor(e.clientX - rect.left, e.clientY - rect.top);
  }, [updateCursor]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/synapse-node');
    if (!nodeType) return;
    const cfg = NODE_CONFIGS[nodeType];
    if (!cfg) return;
    const reactFlowEl = (e.target as HTMLElement).closest('.react-flow');
    if (!reactFlowEl) return;
    const bounds = reactFlowEl.getBoundingClientRect();
    const newNode: Node<NodeData> = {
      id: `${nodeType}-${nanoid(6)}`,
      type: 'synapse',
      position: { x: e.clientX - bounds.left - 113, y: e.clientY - bounds.top - 40 },
      data: {
        label: cfg.label, category: cfg.category, nodeType: cfg.type,
        status: 'idle', icon: cfg.icon,
        config: { ...cfg.defaultConfig },
        inputs: cfg.inputs, outputs: cfg.outputs,
      },
    };
    setNodes(nds => {
      const next = [...nds, newNode];
      storeSetNodes(next as Node<NodeData>[]);
      return next;
    });
  }, [setNodes, storeSetNodes]);

  const miniMapNodeColor = useCallback((node: Node) => {
    const status = useExecutionStore.getState().nodeStatuses[node.id] || (node.data as any)?.status;
    if (status === 'running') return '#00D4AA';
    if (status === 'error') return '#FF4757';
    if (status === 'success') return '#22c55e';
    const map: Record<string, string> = { ai: '#6C63FF', tool: '#00D4AA', logic: '#FFB800', io: '#FF4757' };
    return map[(node.data as any)?.category] || '#3A3D4A';
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <RunningOverlay />
      <EmptyHint nodeCount={nodes.length} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={onMouseMove}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        selectionMode={SelectionMode.Partial}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        snapToGrid
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
        className="synapse-canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="hsl(220 12% 16%)" />
        <Controls className="!bg-syn-raised !border-syn-border !shadow-lg [&>button]:!bg-syn-raised [&>button]:!border-syn-border [&>button]:!text-syn-text-secondary [&>button:hover]:!bg-syn-hover" />
        <MiniMap
          className="!bg-syn-raised !border !border-syn-border !rounded-lg"
          maskColor="hsla(228, 27%, 4%, 0.85)"
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={0}
        />
      </ReactFlow>

      <CollabCursors />

      {/* Right-click context menu */}
      {ctxMenu && (
        <NodeContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          nodeId={ctxMenu.nodeId}
          nodeLabel={ctxMenu.nodeLabel}
          onDelete={() => handleDeleteNode(ctxMenu.nodeId)}
          onDuplicate={() => handleDuplicateNode(ctxMenu.nodeId)}
          onDisconnect={() => handleDisconnectNode(ctxMenu.nodeId)}
          onCopyId={() => navigator.clipboard.writeText(`node_${ctxMenu.nodeId.slice(0, 6)}`)}
          onInspect={() => selectNode(ctxMenu.nodeId)}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
