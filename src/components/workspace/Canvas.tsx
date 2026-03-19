import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SynapseNode from './SynapseNode';
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { mockNodes, mockEdges, mockExecutionResults } from '@/lib/mockData';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';

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
  const { setNodes: storeSetNodes, setEdges: storeSetEdges, selectNode, setExecutionResults } = useWorkflowStore();
  const { updateCursor } = useCollaborationStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(mockNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mockEdges);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      storeSetNodes(mockNodes);
      storeSetEdges(mockEdges);
      setExecutionResults(mockExecutionResults);
      selectNode('agent-1');
      initialized.current = true;
    }
  }, []);

  useEffect(() => { storeSetNodes(nodes as Node<NodeData>[]); }, [nodes]);
  useEffect(() => { storeSetEdges(edges); }, [edges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge({ ...connection, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => { selectNode(null); }, [selectNode]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
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

      const reactFlowBounds = (e.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: e.clientX - reactFlowBounds.left - 110,
        y: e.clientY - reactFlowBounds.top - 30,
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

      setNodes(nds => [...nds, newNode]);
    },
    [setNodes]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
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
          nodeColor={(node: Node) => {
            const d = node.data as unknown as NodeData;
            const map: Record<string, string> = {
              ai: 'hsl(244 100% 69%)',
              tool: 'hsl(165 100% 42%)',
              logic: 'hsl(43 100% 50%)',
              io: 'hsl(354 100% 64%)',
            };
            return map[d?.category] || '#666';
          }}
        />
      </ReactFlow>
      <CollabCursors />
    </div>
  );
}
