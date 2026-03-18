import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from '@/stores/workflowStore';

export const exportJSON = (nodes: Node<NodeData>[], edges: Edge[], name: string): string => {
  return JSON.stringify(
    {
      name,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.data.nodeType,
        label: n.data.label,
        config: n.data.config,
        position: n.position,
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    },
    null,
    2
  );
};

export const exportLangGraph = (nodes: Node<NodeData>[], edges: Edge[], name: string): string => {
  const nodeImports = new Set<string>();
  const nodeDefinitions: string[] = [];

  nodes.forEach(node => {
    const d = node.data as unknown as NodeData;
    const nodeType = d.nodeType;

    // Track imports
    if (nodeType === 'agent') nodeImports.add('from langchain.agents import AgentExecutor, create_openai_tools_agent');
    if (nodeType === 'llm') nodeImports.add('from langchain_openai import ChatOpenAI');
    if (nodeType === 'tool') nodeImports.add('from langchain_core.tools import Tool');

    // Generate node definition
    const varName = `node_${node.id.substring(0, 6)}`;
    if (nodeType === 'llm') {
      nodeDefinitions.push(
        `${varName} = ChatOpenAI(model="${d.config.model || 'gpt-4o'}", temperature=${d.config.temperature || 0.7})`
      );
    } else if (nodeType === 'agent') {
      nodeDefinitions.push(
        `${varName} = Agent(name="${d.label}", config=${JSON.stringify(d.config)})`
      );
    }
  });

  const imports = Array.from(nodeImports).join('\n');
  const definitions = nodeDefinitions.join('\n\n');

  return `"""
${name} - Auto-generated LangChain workflow
"""

${imports}

# Nodes
${definitions}

# Workflow execution
async def run_workflow(input_data):
    # Execute nodes in order
    pass
`;
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareWorkflow = async (workspaceId: string): Promise<string> => {
  const res = await fetch(`/api/workspaces/${workspaceId}/share`, {
    method: 'POST',
  });
  const { shareId } = await res.json();
  const shareUrl = `${window.location.origin}/share/${shareId}`;
  return shareUrl;
};
