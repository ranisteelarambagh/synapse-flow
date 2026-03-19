import { useCallback, useEffect, useRef } from 'react';
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
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useCanvasApiStore } from '@/stores/canvasApiStore';
import { mockNodes, mockEdges, mockExecutionResults } from '@/lib/mockData';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';

// Stable references — defined outside the component so they never change between renders
const nodeTypes = { synapse: SynapseNode };
const edgeTypes = { flow: FlowEdge };
const defaultEdgeOptions = { type: 'flow' };

// ─── Collaboration cursors overlay ────────────────────────────────────────────
function CollabCursors() {
  const { collaborators } = useCollaborationStore();
  return (
    <>
      {collaborators.filter(c => c.cursor).map(c => (
        <div
          key={c.id}
          className="collab-cursor animate-cursor-move"
          style={{
            left: c.cursor!.x,
            top: c.cursor!.y,
            transition: 'left 80ms linear, top 80ms linear',
          }}
        >
          <svg width="18" height="22" viewBox="0 0 18 22">
            <path
              d="M0 0 L0 18 L5 14 L9 22 L11 21 L7 13 L14 13 Z"
              fill={c.color}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth={0.5}
            />
          </svg>
          <span
            className="absolute top-5 left-3.5 px-1.5 py-0.5 rounded text-[10px] font-ui font-semibold text-white whitespace-nowrap shadow-md"
            style={{ background: c.color }}
          >
            {c.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </>
  );
}

// ─── Running background shimmer ────────────────────────────────────────────────
function RunningOverlay() {
  const isStreaming = useExecutionStore(s => s.isStreaming);
  if (!isStreaming) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(108,99,255,0.04) 0%, transparent 70%)',
        animation: 'gradient-shift 3s ease infinite',
      }}
    />
  );
}

// ─── Inner canvas (needs to be inside ReactFlowProvider) ──────────────────────
function CanvasInner() {
  const {
    selectNode,
    setExecutionResults,
    setNodes: storeSetNodes,
    setEdges: storeSetEdges,
  } = useWorkflowStore();
  const { updateCursor } = useCollaborationStore();
  const { register, unregister } = useCanvasApiStore();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(mockNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    mockEdges.map(e => ({ ...e, type: 'flow' }))
  );

  const initialized = useRef(false);
  const lastCursorUpdate = useRef(0);

  // One-time initialization — seed the store, register canvas API
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Seed store directly (bypass unsavedChanges side-effect)
    useWorkflowStore.setState({
      nodes: mockNodes as Node<NodeData>[],
      edges: mockEdges,
      unsavedChanges: false,
    });
    setExecutionResults(mockExecutionResults);
    selectNode('agent-1');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register canvas API so hooks (useVoice, etc.) can imperatively add nodes
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

  // ── Event handlers ───────────────────────────────────────────────────────────

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
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
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
      position: {
        x: e.clientX - bounds.left - 113,
        y: e.clientY - bounds.top - 40,
      },
      data: {
        label: cfg.label,
        category: cfg.category,
        nodeType: cfg.type,
        status: 'idle',
        icon: cfg.icon,
        config: { ...cfg.defaultConfig },
        inputs: cfg.inputs,
        outputs: cfg.outputs,
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
    const map: Record<string, string> = {
      ai: '#6C63FF', tool: '#00D4AA', logic: '#FFB800', io: '#FF4757',
    };
    return map[(node.data as any)?.category] || '#3A3D4A';
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <RunningOverlay />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="hsl(220 12% 16%)"
        />
        <Controls
          className="!bg-syn-raised !border-syn-border !shadow-lg [&>button]:!bg-syn-raised [&>button]:!border-syn-border [&>button]:!text-syn-text-secondary [&>button:hover]:!bg-syn-hover"
        />
        <MiniMap
          className="!bg-syn-raised !border !border-syn-border !rounded-lg"
          maskColor="hsla(228, 27%, 4%, 0.85)"
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={0}
        />
      </ReactFlow>
      <CollabCursors />
    </div>
  );
}

// ─── Exported Canvas (wraps with ReactFlowProvider) ──────────────────────────
export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
