import { useCallback, useEffect, useRef, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SynapseNode from './SynapseNode';
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { mockNodes, mockEdges, mockExecutionResults } from '@/lib/mockData';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';

// Defined at module level so the reference is stable across renders
const nodeTypes = { synapse: SynapseNode };

function CollabCursors() {
  const { collaborators } = useCollaborationStore();
  return (
    <>
      {collaborators.filter(c => c.cursor).map(c => (
        <div
          key={c.id}
          className="collab-cursor"
          style={{ left: c.cursor!.x, top: c.cursor!.y }}
        >
          <svg width="16" height="20" viewBox="0 0 16 20" style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.4))` }}>
            <path d="M0 0 L0 16 L4 12 L8 20 L10 19 L6 11 L12 11 Z" fill={c.color} />
          </svg>
          <span
            className="absolute top-4 left-3 px-1.5 py-0.5 rounded text-[10px] font-ui font-medium text-white whitespace-nowrap"
            style={{ background: c.color }}
          >
            {c.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </>
  );
}

export default function Canvas() {
  // The store is used for config/status lookups only — NOT for driving ReactFlow's node list
  const {
    selectNode,
    setExecutionResults,
    // Pull setNodes/setEdges only for explicit user actions (drop, connect, delete)
    setNodes: storeSetNodes,
    setEdges: storeSetEdges,
  } = useWorkflowStore();
  const { updateCursor } = useCollaborationStore();

  // ReactFlow manages its own internal state — this is the source of truth for the canvas
  const [nodes, setNodes, onNodesChange] = useNodesState(mockNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mockEdges);

  const initialized = useRef(false);

  // One-time initialization: seed the store so Inspector/Debugger know what nodes exist
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Push to store WITHOUT triggering unsavedChanges (use getState to bypass subscriber chain)
    const { setNodes: sn, setEdges: se } = useWorkflowStore.getState();
    // Temporarily override unsavedChanges after seeding
    useWorkflowStore.setState({ nodes: mockNodes as Node<NodeData>[], edges: mockEdges, unsavedChanges: false });
    setExecutionResults(mockExecutionResults);
    selectNode('agent-1');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Explicit user-action handlers (these update the store intentionally) ──

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => {
        const next = addEdge({ ...connection, type: 'smoothstep' }, eds);
        storeSetEdges(next);
        return next;
      });
    },
    [setEdges, storeSetEdges]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, _node, allNodes) => {
      // Only update positions in the store after drag ends (not on every move)
      storeSetNodes(allNodes as Node<NodeData>[]);
    },
    [storeSetNodes]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Throttled cursor update — avoids Zustand churn on every mousemove
  const lastCursorUpdate = useRef(0);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastCursorUpdate.current < 50) return; // 20fps max
    lastCursorUpdate.current = now;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    updateCursor(e.clientX - rect.left, e.clientY - rect.top);
  }, [updateCursor]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/synapse-node');
      if (!nodeType) return;

      const cfg = NODE_CONFIGS[nodeType];
      if (!cfg) return;

      const reactFlowEl = (e.target as HTMLElement).closest('.react-flow');
      if (!reactFlowEl) return;
      const bounds = reactFlowEl.getBoundingClientRect();

      const position = {
        x: e.clientX - bounds.left - 110,
        y: e.clientY - bounds.top - 30,
      };

      const newNode: Node<NodeData> = {
        id: `${nodeType}-${nanoid(6)}`,
        type: 'synapse',
        position,
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
    },
    [setNodes, storeSetNodes]
  );

  const miniMapNodeColor = useCallback((node: Node) => {
    const d = node.data as unknown as NodeData;
    const map: Record<string, string> = {
      ai: 'hsl(244 100% 69%)',
      tool: 'hsl(165 100% 42%)',
      logic: 'hsl(43 100% 50%)',
      io: 'hsl(354 100% 64%)',
    };
    return map[d?.category] || '#666';
  }, []);

  return (
    <div className="w-full h-full relative">
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
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.25}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="synapse-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="hsl(222 15% 13%)"
        />
        <Controls
          className="!bg-syn-raised !border-syn-border !shadow-lg [&>button]:!bg-syn-raised [&>button]:!border-syn-border [&>button]:!text-syn-text-secondary [&>button:hover]:!bg-syn-hover"
        />
        <MiniMap
          className="!bg-syn-raised !border !border-syn-border !rounded-lg"
          maskColor="hsla(228, 27%, 4%, 0.8)"
          nodeColor={miniMapNodeColor}
        />
      </ReactFlow>
      <CollabCursors />
    </div>
  );
}
