import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SynapseNode from './SynapseNode';
import { useWorkflowStore, type NodeData } from '@/stores/workflowStore';
import { mockNodes, mockEdges, mockExecutionResults } from '@/lib/mockData';
import { NODE_TEMPLATES } from '@/lib/nodeTemplates';

const nodeTypes = { synapse: SynapseNode };

export default function Canvas() {
  const { setNodes: storeSetNodes, setEdges: storeSetEdges, selectNode, setExecutionResults } = useWorkflowStore();
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

  // Sync nodes/edges back to store on change
  useEffect(() => {
    storeSetNodes(nodes as Node<NodeData>[]);
  }, [nodes]);

  useEffect(() => {
    storeSetEdges(edges);
  }, [edges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/synapse-node');
      if (!nodeType) return;

      const template = NODE_TEMPLATES.find((t) => t.nodeType === nodeType);
      if (!template) return;

      const reactFlowBounds = (e.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: e.clientX - reactFlowBounds.left - 110,
        y: e.clientY - reactFlowBounds.top - 30,
      };

      const newNode: Node<NodeData> = {
        id: `${template.nodeType}-${Date.now()}`,
        type: 'synapse',
        position,
        data: {
          label: template.label,
          category: template.category,
          nodeType: template.nodeType,
          status: 'idle',
          icon: template.icon,
          config: { ...template.defaultConfig },
          inputs: template.inputs,
          outputs: template.outputs,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  return (
    <div className="w-full h-full">
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
        nodeTypes={nodeTypes}
        connectionLineType="smoothstep"
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
    </div>
  );
}
